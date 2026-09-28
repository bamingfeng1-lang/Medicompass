import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { shapeMetricItem, num, parseDate } from "@/lib/metricItems";

// GET  /api/mobile/metric-items — the user's 关注指标 items (with value history).
// POST /api/mobile/metric-items — create one.
//   body: { name, unit?, targetLow?, targetHigh?, nextCheckAt?, source?,
//           value?, measuredAt?, note? }  (value present → seeds first reading)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCES = ["manual", "report", "visit"];

export async function GET(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  // Default: only non-ignored items. `?ignored=1` returns only the ignored
  // ones (the recovery list); `?includeIgnored=1` returns everything.
  const url = new URL(req.url);
  const onlyIgnored = url.searchParams.get("ignored") === "1";
  const includeIgnored = url.searchParams.get("includeIgnored") === "1";
  const where: { userId: string; ignored?: boolean } = { userId: user.id };
  if (onlyIgnored) where.ignored = true;
  else if (!includeIgnored) where.ignored = false;

  const items = await prisma.mobileMetricItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { readings: true },
  });
  return Response.json({ items: items.map(shapeMetricItem) });
}

export async function POST(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return Response.json({ error: "missing_name" }, { status: 400 });

  const source = typeof body.source === "string" && SOURCES.includes(body.source) ? body.source : "manual";
  const firstValue = num(body.value);

  const item = await prisma.mobileMetricItem.create({
    data: {
      userId: user.id,
      name,
      unit: typeof body.unit === "string" ? body.unit.trim() : "",
      targetLow: num(body.targetLow),
      targetHigh: num(body.targetHigh),
      nextCheckAt: parseDate(body.nextCheckAt),
      source,
      readings: firstValue != null
        ? {
            create: {
              value: firstValue,
              note: typeof body.note === "string" ? body.note.trim() : "",
              measuredAt: parseDate(body.measuredAt) ?? new Date(),
            },
          }
        : undefined,
    },
    include: { readings: true },
  });

  return Response.json({ item: shapeMetricItem(item) }, { status: 201 });
}
