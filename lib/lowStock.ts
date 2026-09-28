import { prisma } from "@/lib/db";
import { pushToUser, type PushPayload } from "@/lib/push";
import { recipientsFor } from "@/lib/missedDose";

// Low-stock detection (药品不足提前5天提醒). For each medication with a tracked
// quantity, computes days-left from the daily consumption rate and flags any
// that will run out within LOW_STOCK_DAYS. Alerts fan out to the patient plus
// their caregivers (same recipients as missed-dose). Stateless — safe to run on
// any schedule; it marks nothing, so repeated runs re-detect until refilled.
//
// Days-left contract (kept identical on iOS):
//   dailyUse = unitsPerDose × times.length
//   daysLeft = (quantity>0 && dailyUse>0) ? floor(quantity/dailyUse) : stockDays
// Legacy meds with quantity==0 fall back to the manual stockDays and are NOT
// swept here (we only scan quantity>0), so they can't false-alarm.

export const LOW_STOCK_DAYS = 5;

export type LowStockMed = {
  userId: string;
  medicationId: string;
  nameEn: string;
  nameZh: string;
  daysLeft: number;
  quantity: number;
};

function parseTimes(raw: string): string[] {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function daysLeftFor(m: {
  quantity: number; unitsPerDose: number; times: string; stockDays: number;
}): number {
  const dailyUse = (m.unitsPerDose || 0) * parseTimes(m.times).length;
  if (m.quantity > 0 && dailyUse > 0) return Math.floor(m.quantity / dailyUse);
  return m.stockDays;
}

export async function detectLowStock(opts?: { threshold?: number }): Promise<LowStockMed[]> {
  const threshold = opts?.threshold ?? LOW_STOCK_DAYS;
  const meds = await prisma.mobileMedication.findMany({ where: { quantity: { gt: 0 } } });

  const low: LowStockMed[] = [];
  for (const med of meds) {
    const dailyUse = (med.unitsPerDose || 0) * parseTimes(med.times).length;
    if (dailyUse <= 0) continue; // no schedule → can't project a run-out date
    const daysLeft = Math.floor(med.quantity / dailyUse);
    if (daysLeft > threshold) continue;
    low.push({
      userId: med.userId,
      medicationId: med.id,
      nameEn: med.nameEn,
      nameZh: med.nameZh,
      daysLeft,
      quantity: med.quantity,
    });
  }
  return low;
}

/**
 * Detect low-stock medications and dispatch a desensitized push to each patient
 * + their caregivers. Returns detections and how many device deliveries
 * succeeded (0 when APNs is unconfigured — detections are still returned).
 */
export async function sweepLowStock(opts?: { threshold?: number }): Promise<{
  low: LowStockMed[];
  delivered: number;
}> {
  const low = await detectLowStock(opts);
  let delivered = 0;

  for (const m of low) {
    // Desensitized: the lock-screen body names no drug. The medication id rides
    // in `data` (not displayed) so the app can deep-link after unlock.
    const payload: PushPayload = {
      title: "备药提醒 · Refill reminder",
      body: `有药品即将用完，请及时补充 · A medication is running low — time to refill`,
      data: {
        kind: "lowStock",
        userId: m.userId,
        medicationId: m.medicationId,
        daysLeft: String(m.daysLeft),
      },
    };
    const recipients = await recipientsFor(m.userId);
    for (const rid of recipients) {
      delivered += await pushToUser(rid, payload);
    }
  }

  return { low, delivered };
}
