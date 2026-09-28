import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";

// GET /api/mobile/visits/jobs/[id]/files/[fid] — stream a job photo's bytes
// (inline) after verifying the caller owns the parent job. Used to render
// thumbnails on the review screen the bell opens.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; fid: string } },
): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  const file = await prisma.mobileVisitJobFile.findFirst({
    where: { id: params.fid, jobId: params.id, job: { userId: user.id } },
  });
  if (!file) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let data: Buffer;
  try {
    data = await fs.readFile(file.storedPath);
  } catch {
    return NextResponse.json({ error: "file_missing" }, { status: 410 });
  }

  const asciiName = file.originalName.replace(/[^\x20-\x7e]/g, "_");
  const encodedName = encodeURIComponent(file.originalName);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": file.mimeType || "application/octet-stream",
      "Content-Length": String(data.length),
      "Content-Disposition": `inline; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
    },
  });
}
