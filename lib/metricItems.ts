/// Shared helpers for the 关注指标 (custom metric item) routes. Kept out of the
/// route files because Next.js App Router route modules may only export HTTP
/// handlers + config (extra exports break the generated route types).

type ReadingRow = { id: string; value: number; note: string; measuredAt: Date };

type MetricItemRow = {
  id: string;
  name: string;
  unit: string;
  targetLow: number | null;
  targetHigh: number | null;
  nextCheckAt: Date | null;
  source: string;
  ignored: boolean;
  readings: ReadingRow[];
};

/** True when `value` falls outside the (optional) target range. */
export function isAbnormal(value: number | null, low: number | null, high: number | null): boolean {
  if (value == null) return false;
  if (low != null && value < low) return true;
  if (high != null && value > high) return true;
  return false;
}

/** Coerce a value to a finite number, or null. */
export function num(v: unknown): number | null {
  return Number.isFinite(Number(v)) ? Number(v) : null;
}

/** Coerce a value to a valid Date, or null. */
export function parseDate(v: unknown): Date | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function shapeReading(r: ReadingRow) {
  return { id: r.id, value: r.value, note: r.note, measuredAt: r.measuredAt };
}

/** Wire shape for a metric item (readings newest-first, derived latest + abnormal). */
export function shapeMetricItem(m: MetricItemRow) {
  const readings = [...m.readings].sort((a, b) => b.measuredAt.getTime() - a.measuredAt.getTime());
  const latest = readings.length > 0 ? readings[0].value : null;
  return {
    id: m.id,
    name: m.name,
    unit: m.unit,
    targetLow: m.targetLow,
    targetHigh: m.targetHigh,
    nextCheckAt: m.nextCheckAt,
    source: m.source,
    ignored: m.ignored,
    readings: readings.map(shapeReading),
    latest,
    isAbnormal: isAbnormal(latest, m.targetLow, m.targetHigh),
  };
}

export type { MetricItemRow, ReadingRow };
