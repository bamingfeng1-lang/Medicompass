import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { shapeMetricItem, num, parseDate } from "@/lib/metricItems";

// POST /api/mobile/metric-items/[id]/readings — add a value to the item's history.
//   body: { value (required), measuredAt?, note? }
// Returns the reshaped parent item (with updated history + latest/abnormal).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  const item = await prisma.mobileMetricItem.findFirst({ where: { id: params.id, userId: user.id } });
  if (!item) return Response.json({ error: "not_found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const value = num(body.value);
  if (value == null) return Response.json({ error: "missing_value" }, { status: 400 });

  await prisma.mobileMetricReading.create({
    data: {
      itemId: item.id,
      value,
      note: typeof body.note === "string" ? body.note.trim() : "",
      measuredAt: parseDate(body.measuredAt) ?? new Date(),
    },
  });

  const updated = await prisma.mobileMetricItem.findUnique({
    where: { id: item.id },
    include: { readings: true },
  });
  return Response.json({ item: updated ? shapeMetricItem(updated) : null }, { status: 201 });
}
