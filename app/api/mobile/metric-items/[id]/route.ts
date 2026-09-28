import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { shapeMetricItem, num, parseDate } from "@/lib/metricItems";

// PATCH  /api/mobile/metric-items/[id] — edit an item's plan fields.
//   body: partial { name, unit, targetLow, targetHigh, nextCheckAt, source }
//   (targetLow/targetHigh/nextCheckAt accept null to clear.)
// DELETE /api/mobile/metric-items/[id] — remove it (cascades readings).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ownedItem(userId: string, id: string) {
  return prisma.mobileMetricItem.findFirst({ where: { id, userId } });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;
  if (!(await ownedItem(user.id, params.id))) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.unit === "string") data.unit = body.unit.trim();
  if ("targetLow" in body) data.targetLow = num(body.targetLow);
  if ("targetHigh" in body) data.targetHigh = num(body.targetHigh);
  if ("nextCheckAt" in body) data.nextCheckAt = parseDate(body.nextCheckAt);
  if (typeof body.source === "string" && ["manual", "report", "visit"].includes(body.source)) {
    data.source = body.source;
  }
  if (typeof body.ignored === "boolean") data.ignored = body.ignored;

  await prisma.mobileMetricItem.update({ where: { id: params.id }, data });
  const item = await prisma.mobileMetricItem.findUnique({
    where: { id: params.id },
    include: { readings: true },
  });
  return Response.json({ item: item ? shapeMetricItem(item) : null });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  const res = await prisma.mobileMetricItem.deleteMany({ where: { id: params.id, userId: user.id } });
  if (res.count === 0) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ ok: true });
}
