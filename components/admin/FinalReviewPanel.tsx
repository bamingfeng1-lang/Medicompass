"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, FileText, Download } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";
import { clientApi } from "@/lib/api";

export function FinalReviewPanel({
  id,
  dict,
  status,
  reportUrl,
}: {
  id: number;
  dict: Dictionary;
  status: string;
  reportUrl: string | null;
}) {
  const fz = dict.adminFinalize ?? ({} as Record<string, string>);
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const actionable = status === "ADMIN_QC";

  const act = async (action: "approve" | "reject") => {
    if (action === "reject" && !note.trim()) { setMsg({ kind: "err", text: fz.noteRequired }); return; }
    setBusy(true); setMsg(null);
    try {
      const res = await fetch(clientApi(`/api/admin/applications/${id}/finalize`), {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ action, note: note.trim() || undefined }),
      });
      if (!res.ok) { setMsg({ kind: "err", text: fz.opError }); }
      else { setMsg({ kind: "ok", text: action === "approve" ? fz.approved : fz.rejected }); router.refresh(); }
    } catch { setMsg({ kind: "err", text: fz.opError }); } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-brand-950">{fz.title}</h2>
        <span className={`text-xs ${actionable ? "text-amber-600" : "text-slate-400"}`}>
          {actionable ? fz.pendingHint : fz.notActionable}
        </span>
      </div>

      {reportUrl ? (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <FileText className="h-4 w-4 shrink-0 text-brand-deep" />
          <a href={`/api/admin/applications/${id}/final-report`} target="_blank" rel="noopener noreferrer"
            className="flex-1 truncate text-sm text-slate-700 hover:text-brand-deep hover:underline">
            {fz.reportFile}
          </a>
          <a href={`/api/admin/applications/${id}/final-report?download=1`}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-deep hover:underline">
            <Download className="h-3.5 w-3.5" /> {fz.download}
          </a>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">{fz.noReport}</p>
      )}

      {actionable && (
        <>
          <textarea rows={3} className="field-input mt-4 w-full resize-none" placeholder={fz.notePh}
            value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" onClick={() => act("approve")} disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700">
              <Check className="h-4 w-4" /> {busy ? fz.processing : fz.approve}
            </button>
            <button type="button" onClick={() => act("reject")} disabled={busy}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50">
              <X className="h-4 w-4" /> {busy ? fz.processing : fz.reject}
            </button>
          </div>
        </>
      )}

      {msg && (
        <p className={`mt-3 text-sm ${msg.kind === "ok" ? "text-emerald-600" : "text-red-500"}`}>{msg.text}</p>
      )}
    </div>
  );
}
