/// Shared medication helpers used by the medications routes. Kept out of the
/// route files themselves because Next.js App Router route modules may only
/// export HTTP handlers + config (extra exports break the generated route types).

const MEAL_TIMINGS = ["before", "after", "with", "bedtime"];

/** Coerce a meal-timing value to the structured whitelist ("" = anytime). */
export function normalizeMealTiming(v: unknown): string {
  return typeof v === "string" && MEAL_TIMINGS.includes(v) ? v : "";
}

/** Parse the JSON-encoded `times` column into a string[]. */
export function parseTimes(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

type MedRow = {
  id: string; nameEn: string; nameZh: string; dosage: string;
  timingEn: string; timingZh: string; times: string; stockDays: number;
  quantity: number; unit: string; unitsPerDose: number; courseDays: number;
  mealTiming: string; barcode: string;
};

/** Wire shape for a medication row (parses `times`, passes new fields through). */
export function shapeMedication(m: MedRow) {
  return {
    id: m.id,
    nameEn: m.nameEn,
    nameZh: m.nameZh,
    dosage: m.dosage,
    timingEn: m.timingEn,
    timingZh: m.timingZh,
    times: parseTimes(m.times),
    stockDays: m.stockDays,
    quantity: m.quantity,
    unit: m.unit,
    unitsPerDose: m.unitsPerDose,
    courseDays: m.courseDays,
    mealTiming: m.mealTiming,
    barcode: m.barcode,
  };
}

export type { MedRow };
