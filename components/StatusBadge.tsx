import { clsx } from "clsx";
import type { Dictionary } from "@/lib/dictionaries";

// Ordered workflow stages; index drives the color ramp.
export const APPLICATION_STATUSES = [
  "PENDING_REVIEW",
  "PENDING_ASSIGN",
  "PENDING_SUPPLEMENT",
  "PROVIDER_PROCESSING",
  "PENDING_DOCTOR_ASSIGN",
  "DOCTOR_PROCESSING",
  "PROVIDER_TRANSLATING",
  "ADMIN_QC",
  "COMPLETED",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const STYLE: Record<string, string> = {
  PENDING_REVIEW: "border-slate-200 bg-slate-50 text-slate-600",
  PENDING_ASSIGN: "border-amber-200 bg-amber-50 text-amber-700",
  PENDING_SUPPLEMENT: "border-rose-200 bg-rose-50 text-rose-700",
  PROVIDER_PROCESSING: "border-sky-200 bg-sky-50 text-sky-700",
  PENDING_DOCTOR_ASSIGN: "border-amber-200 bg-amber-50 text-amber-700",
  DOCTOR_PROCESSING: "border-indigo-200 bg-indigo-50 text-indigo-700",
  PROVIDER_TRANSLATING: "border-violet-200 bg-violet-50 text-violet-700",
  ADMIN_QC: "border-orange-200 bg-orange-50 text-orange-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function statusLabel(dict: Dictionary, status: string): string {
  const map = dict.applicationStatus as Record<string, string>;
  return map[status] ?? status;
}

export function StatusBadge({
  status,
  dict,
  className,
}: {
  status: string;
  dict: Dictionary;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STYLE[status] ?? STYLE.PENDING_REVIEW,
        className,
      )}
    >
      {statusLabel(dict, status)}
    </span>
  );
}
