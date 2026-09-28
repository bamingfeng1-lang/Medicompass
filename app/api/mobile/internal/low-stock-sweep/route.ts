import { sweepLowStock } from "@/lib/lowStock";

// POST /api/mobile/internal/low-stock-sweep
// Detects medications running low (≤5 days of stock left) and dispatches
// caregiver/patient refill pushes. Protected by the same shared secret as the
// missed-dose sweep (header `x-internal-secret` == INTERNAL_SWEEP_SECRET) so an
// external scheduler can trigger it. Optional JSON body: { threshold?: number }.
//
// Go-live prerequisites (flagged, not blockers for local dev):
//   • Set INTERNAL_SWEEP_SECRET and wire a scheduler to hit this daily.
//   • Configure APNs (see lib/push.ts) for real delivery; until then the sweep
//     detects + logs lows and iOS handles it via local StockReminders.

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

  let threshold: number | undefined;
  try {
    const body = (await req.json()) as { threshold?: number };
    if (typeof body.threshold === "number" && body.threshold >= 0) {
      threshold = body.threshold;
    }
  } catch {
    // No/invalid body — use defaults.
  }

  const { low, delivered } = await sweepLowStock({ threshold });
  return Response.json({ detected: low.length, delivered, low });
}
