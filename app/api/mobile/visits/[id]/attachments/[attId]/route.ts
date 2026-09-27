import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";

// GET    /api/mobile/visits/[id]/attachments/[attId] — stream the attachment
//        bytes (inline) after verifying the caller owns the parent visit.
// DELETE /api/mobile/visits/[id]/attachments/[attId] — remove one attachment.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Resolve the attachment only if it belongs to a visit owned by the caller.
async function ownedAttachment(req: Request, visitId: string, attId: string) {
  const prof = await resolveProfile(req);
  if (!prof.ok) return { user: null, response: prof.response };
  const user = prof.profile;
  const att = await prisma.mobileVisitAttachment.findFirst({
    where: { id: attId, visitId, visit: { userId: user.id } },
  });
  return { user, att, response: null };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; attId: string } },
): Promise<Response> {
  const { user, att, response } = await ownedAttachment(req, params.id, params.attId);
  if (!user) return response;
  if (!att) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let data: Buffer;
  try {
    data = await fs.readFile(att.storedPath);
  } catch {
    return NextResponse.json({ error: "file_missing" }, { status: 410 });
  }

  const disposition = req.nextUrl.searchParams.get("download") === "1" ? "attachment" : "inline";
  const asciiName = att.originalName.replace(/[^\x20-\x7e]/g, "_");
  const encodedName = encodeURIComponent(att.originalName);

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": att.mimeType || "application/octet-stream",
      "Content-Length": String(data.length),
      "Content-Disposition": `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
    },
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; attId: string } },
): Promise<Response> {
  const { user, att, response } = await ownedAttachment(req, params.id, params.attId);
  if (!user) return response;
  if (!att) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.mobileVisitAttachment.delete({ where: { id: att.id } });
  // Best-effort disk cleanup; a leftover file is harmless.
  void fs.unlink(att.storedPath).catch(() => {});
  return Response.json({ ok: true });
}
