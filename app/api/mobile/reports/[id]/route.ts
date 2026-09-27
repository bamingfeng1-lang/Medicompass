import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";

// GET /api/mobile/reports/[id] — single report (for polling AI status).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;
  const r = await prisma.mobileReport.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!r) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({
    report: {
      id: r.id,
      originalName: r.originalName,
      mimeType: r.mimeType,
      size: r.size,
      category: r.category,
      aiInterpretation: r.aiInterpretation,
      aiStatus: r.aiStatus,
      reviewed: r.reviewed,
      createdAt: r.createdAt,
    },
  });
}
