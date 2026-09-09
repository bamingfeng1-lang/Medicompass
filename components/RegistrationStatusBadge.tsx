import { clsx } from "clsx";
import type { Dictionary } from "@/lib/dictionaries";

const STYLE: Record<string, string> = {
  DRAFT: "border-slate-200 bg-slate-50 text-slate-600",
  PENDING_REVIEW: "border-amber-200 bg-amber-50 text-amber-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-600",
};

export function RegistrationStatusBadge({
  status,
  dict,
  className,
}: {
  status: string;
  dict: Dictionary;
  className?: string;
}) {
  const map = dict.registrationStatus as Record<string, string>;
  return (
    <span
      className={clsx(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STYLE[status] ?? STYLE.DRAFT,
        className,
      )}
    >
      {map[status] ?? status}
    </span>
  );
}
