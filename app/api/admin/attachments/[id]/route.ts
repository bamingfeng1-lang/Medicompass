import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

// Admin-only (guarded by middleware): stream an attachment from disk.
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const att = await prisma.attachment.findUnique({ where: { id: params.id } });
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
