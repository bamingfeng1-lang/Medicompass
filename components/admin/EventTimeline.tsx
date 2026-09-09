import { Clock, ArrowRight, UserCheck, FileText } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";
import { StatusBadge } from "@/components/StatusBadge";

type AppEvent = {
  id: number;
  eventType: string;
  actorType: string;
  actorName: string;
  payload: Record<string, unknown> | null;
  note: string | null;
  createdAt: string;
};

export function EventTimeline({
  events,
  dict,
  lang,
}: {
  events: AppEvent[];
  dict: Dictionary;
  lang: string;
}) {
  const a = dict.admin;
  const fmt = (d: string) =>
    new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(d));

  if (events.length === 0) {
    return <p className="mt-3 text-sm text-slate-400">{a.eventEmpty}</p>;
  }

  // Newest first for display.
  const ordered = [...events].sort(
    (x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime(),
  );

  const icon = (type: string) =>
    type === "ASSIGNED" ? (
      <UserCheck className="h-4 w-4" />
    ) : type === "NOTE_ADDED" ? (
      <FileText className="h-4 w-4" />
    ) : (
      <Clock className="h-4 w-4" />
    );

  const title = (type: string, payload: Record<string, unknown> | null) => {
    if (type === "STATUS_CHANGED") return a.eventStatusChanged;
    if (type === "ASSIGNED") {
      return payload && payload.type ? a.eventAssigned : a.eventUnassigned;
    }
    if (type === "NOTE_ADDED") return a.eventNoteAdded;
    return type;
  };

  return (
    <ol className="mt-4 space-y-4">
      {ordered.map((e) => {
        const p = e.payload ?? {};
        return (
          <li key={e.id} className="relative flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-deep">
              {icon(e.eventType)}
            </div>
            <div className="flex-1 border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-brand-950">
                  {title(e.eventType, e.payload)}
                </span>

                {e.eventType === "STATUS_CHANGED" && !!p.to && (
                  <span className="inline-flex items-center gap-1.5">
                    {p.from ? <StatusBadge status={String(p.from)} dict={dict} /> : null}
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    <StatusBadge status={String(p.to)} dict={dict} />
                  </span>
                )}

                {e.eventType === "ASSIGNED" && !!p.type && (
                  <span className="text-sm text-slate-600">
                    {(p.type === "provider" ? a.assignProvider : a.assignDoctor) +
                      (p.name ? ` · ${String(p.name)}` : "")}
                  </span>
                )}
              </div>

              {e.note && <p className="mt-1 text-sm text-slate-600">{e.note}</p>}

              <p className="mt-1 text-xs text-slate-400">
                {e.actorName || e.actorType} · {fmt(e.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
