import { prisma } from "@/lib/db";

// 资料修改历史 / profile-edit audit trail. Computes a field-level diff of the
// medical profile and appends an immutable ProfileAudit row. The `changes` JSON
// is field-encrypted at rest (lib/crypto-field.ts) because it can echo PHI.

/** The medical-profile fields we track for history. Order = display order. */
export const AUDITED_FIELDS = [
  "name",
  "gender",
  "birthDate",
  "bloodType",
  "allergies",
  "medicalHistory",
  "nickname",
  "heightCm",
  "weightKg",
  "country",
  "city",
  "alcohol",
  "smoking",
  "hasChildren",
  "menstrualCycleDays",
  "lastPeriodDate",
] as const;

export type AuditedField = (typeof AUDITED_FIELDS)[number];

export type FieldChange = { field: AuditedField; from: string | null; to: string | null };

/** Normalize a stored/incoming value to a stable string for comparison. */
function norm(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString().slice(0, 10);
  const s = String(v).trim();
  return s.length ? s : null;
}

/** Field-level diff between the current row and the next values. Only fields in
 *  `next` are considered (undefined = untouched, not cleared). */
export function diffProfile(
  current: Partial<Record<AuditedField, unknown>>,
  next: Partial<Record<AuditedField, unknown>>,
): FieldChange[] {
  const out: FieldChange[] = [];
  for (const field of AUDITED_FIELDS) {
    if (!(field in next)) continue;
    const from = norm(current[field]);
    const to = norm(next[field]);
    if (from !== to) out.push({ field, from, to });
  }
  return out;
}

/** Append an audit row. No-op when there is nothing to record. */
export async function recordProfileEdit(opts: {
  subjectId: string;
  actorId: string;
  actorName: string | null;
  action: "create" | "update";
  changes: FieldChange[];
}): Promise<void> {
  if (!opts.changes.length) return;
  try {
    await prisma.profileAudit.create({
      data: {
        userId: opts.subjectId,
        actorId: opts.actorId,
        actorName: opts.actorName,
        action: opts.action,
        changes: JSON.stringify(opts.changes),
      },
    });
  } catch {
    // Auditing must never break the primary edit; swallow persistence errors.
  }
}
