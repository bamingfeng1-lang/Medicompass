import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { shapeMetricItem } from "@/lib/metricItems";

// DELETE /api/mobile/metric-items/[id]/readings/[rid] — remove one history reading
// (owner is verified via the parent item). Returns the reshaped parent item.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; rid: string } },
): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  const reading = await prisma.mobileMetricReading.findFirst({
    where: { id: params.rid, itemId: params.id, item: { userId: user.id } },
  });
  if (!reading) return Response.json({ error: "not_found" }, { status: 404 });

  await prisma.mobileMetricReading.delete({ where: { id: reading.id } });

  const updated = await prisma.mobileMetricItem.findUnique({
    where: { id: params.id },
    include: { readings: true },
  });
  return Response.json({ item: updated ? shapeMetricItem(updated) : null });
}
