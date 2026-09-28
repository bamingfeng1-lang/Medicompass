import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { getMobileUser, unauthorized } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { saveUpload, isAllowed } from "@/lib/storage";

// GET    /api/mobile/me/avatar — stream the caller's avatar image bytes (inline).
// POST   /api/mobile/me/avatar — multipart upload (field "file"); replaces any
//        existing avatar and bumps avatarUpdatedAt (client cache-buster).
// DELETE /api/mobile/me/avatar — remove the avatar.
//
// Self-only (getMobileUser, not resolveProfile): the avatar is the caller's own.
// Reuses the local-disk storage helper (lib/storage.ts), same as visit
// attachments — not suitable for serverless FS; swap for object storage there.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const user = await getMobileUser(req);
  if (!user) return unauthorized();
  if (!user.avatarPath) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let data: Buffer;
  try {
    data = await fs.readFile(user.avatarPath);
  } catch {
    return NextResponse.json({ error: "file_missing" }, { status: 410 });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(data.length),
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

export async function POST(req: Request): Promise<Response> {
  const user = await getMobileUser(req);
  if (!user) return unauthorized();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || !isAllowed(file)) {
    return NextResponse.json({ error: "invalid_file" }, { status: 400 });
  }

  const saved = await saveUpload(`avatar-${user.id}`, file);
  const previous = user.avatarPath;

  const updated = await prisma.mobileUser.update({
    where: { id: user.id },
    data: { avatarPath: saved.storedPath, avatarUpdatedAt: new Date() },
  });

  // Best-effort cleanup of the replaced file; a leftover is harmless.
  if (previous && previous !== saved.storedPath) {
    void fs.unlink(previous).catch(() => {});
  }

  return Response.json({ hasAvatar: true, avatarUpdatedAt: updated.avatarUpdatedAt });
}

export async function DELETE(req: Request): Promise<Response> {
  const user = await getMobileUser(req);
  if (!user) return unauthorized();

  const previous = user.avatarPath;
  await prisma.mobileUser.update({
    where: { id: user.id },
    data: { avatarPath: null, avatarUpdatedAt: null },
  });
  if (previous) void fs.unlink(previous).catch(() => {});

  return Response.json({ hasAvatar: false });
}
