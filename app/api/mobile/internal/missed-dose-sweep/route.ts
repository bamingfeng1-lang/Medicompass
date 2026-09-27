import { sweepMissedDoses } from "@/lib/missedDose";

// POST /api/mobile/internal/missed-dose-sweep
// Detects overdue medication doses and dispatches caregiver/patient pushes.
// Protected by a shared secret (header `x-internal-secret` must equal
// INTERNAL_SWEEP_SECRET) so an external scheduler (cron / deploy platform) can
// trigger it — there is no in-repo scheduler. Optional JSON body:
//   { graceMinutes?: number }   (default 30)
//
// Go-live prerequisites (flagged, not blockers for local dev):
//   • Set INTERNAL_SWEEP_SECRET and wire a scheduler to hit this every N minutes.
//   • Configure APNs (see lib/push.ts) for real delivery; until then the sweep
//     detects + logs misses and iOS handles reminders via local notifications.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.INTERNAL_SWEEP_SECRET;
  if (!secret) {
    return Response.json({ error: "sweep_not_configured" }, { status: 503 });
  }
  if (req.headers.get("x-internal-secret") !== secret) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  let graceMinutes: number | undefined;
  try {
    const body = (await req.json()) as { graceMinutes?: number };
    if (typeof body.graceMinutes === "number" && body.graceMinutes >= 0) {
      graceMinutes = body.graceMinutes;
    }
  } catch {
    // No/invalid body — use defaults.
  }

  const { missed, delivered } = await sweepMissedDoses({ graceMinutes });
  return Response.json({ detected: missed.length, delivered, missed });
}
