import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";

// GET  /api/mobile/vitals — the user's self-reported vital readings, grouped by
//                           kind (ascending by time). Target ranges + units are
//                           clinical constants the app supplies client-side.
// POST /api/mobile/vitals — add a reading.
//   body: { kind, value, secondary?, measuredAt? }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = ["bloodGlucose", "bloodPressure", "weight", "heartRate", "temperature"];

function shape(r: {
  id: string; kind: string; value: number; secondary: number | null; measuredAt: Date;
}) {
  return { id: r.id, kind: r.kind, value: r.value, secondary: r.secondary, measuredAt: r.measuredAt };
}

export async function GET(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;
  const readings = await prisma.mobileVitalReading.findMany({
    where: { userId: user.id },
    orderBy: { measuredAt: "asc" },
  });
  return Response.json({ readings: readings.map(shape) });
}

export async function POST(req: Request): Promise<Response> {
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;

  let body: { kind?: string; value?: number; secondary?: number | null; measuredAt?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!KINDS.includes(body.kind ?? "")) {
    return Response.json({ error: "invalid_kind" }, { status: 400 });
  }
  if (!Number.isFinite(body.value)) {
    return Response.json({ error: "invalid_value" }, { status: 400 });
  }
  const measuredAt = body.measuredAt ? new Date(body.measuredAt) : new Date();
  if (Number.isNaN(measuredAt.getTime())) {
    return Response.json({ error: "invalid_date" }, { status: 400 });
  }

  const reading = await prisma.mobileVitalReading.create({
    data: {
      userId: user.id,
      kind: body.kind!,
      value: Number(body.value),
      secondary: Number.isFinite(body.secondary as number) ? Number(body.secondary) : null,
      measuredAt,
    },
  });
  return Response.json({ reading: shape(reading) }, { status: 201 });
}
