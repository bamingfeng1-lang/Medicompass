"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Download } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";
import type { MyApplicationDetail } from "@/lib/api";
import { submitOpinion, attachmentsArchiveUrl } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";

export function DoctorWorkbench({
  app,
  dict,
}: {
  app: MyApplicationDetail;
  dict: Dictionary;
}) {
  const db = dict.doctorWorkbench ?? ({} as Record<string, string>);
  const router = useRouter();

  const [a1, setA1] = useState(app.doctorAnswer1 ?? "");
  const [a2, setA2] = useState(app.doctorAnswer2 ?? "");
  const [a3, setA3] = useState(app.doctorAnswer3 ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const submitted = app.status !== "DOCTOR_PROCESSING";
  const allFilled = a1.trim() && a2.trim() && a3.trim();

  const onSubmit = async () => {
    if (!allFilled) { setMsg({ kind: "err", text: db.required }); return; }
    setBusy(true); setMsg(null);
    const ok = await submitOpinion(app.id, { answer1: a1, answer2: a2, answer3: a3 });
    setBusy(false);
    setMsg(ok ? { kind: "ok", text: db.submitted } : { kind: "err", text: db.opError });
    if (ok) router.refresh();
  };

  const readonlyCls = "field-input w-full resize-none bg-slate-50 text-slate-500";

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{db.patient}:</span>
            <span className="font-medium text-brand-950">{app.fullName}</span>
          </div>
          <StatusBadge status={app.status} dict={dict} />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div>
            <span className="text-xs uppercase tracking-wide text-slate-400">{db.patientPhone}</span>
            <p className="mt-0.5 text-sm text-slate-700">{app.phone}</p>
          </div>
        </div>
      </div>

      {/* Medical summary (read-only) */}
      <div className="card">
        <h2 className="text-lg font-semibold text-brand-950">{db.summaryTitle}</h2>
        {[["Patient History", app.medicalSummary ?? ""], ["Lab & Test Results", app.labResults ?? ""], ["Current Treatment", app.currentTreatment ?? ""]].map(([lbl, val]) => (
          <div key={lbl} className="mt-4">
            <label className="field-label">{lbl}</label>
            <textarea rows={3} readOnly className={readonlyCls} value={val} />
          </div>
        ))}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <a href={attachmentsArchiveUrl(app.id)} className="inline-flex items-center gap-2 text-sm font-medium text-brand-deep hover:underline">
            <Download className="h-4 w-4" /> {db.downloadAll}
          </a>
        </div>
      </div>

      {/* Questions + answers */}
      <div className="card">
        <h2 className="text-lg font-semibold text-brand-950">{db.answerTitle}</h2>
        <p className="mt-2 text-sm text-slate-500">{db.answerHint}</p>
        {[
          ["Question 1", app.question1 ?? "", a1, setA1],
          ["Question 2", app.question2 ?? "", a2, setA2],
          ["Question 3", app.question3 ?? "", a3, setA3],
        ].map(([lbl, q, val, setv]) => (
          <div key={String(lbl)} className="mt-4">
            <label className="field-label">{String(lbl)}</label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">{String(q)}</div>
            <textarea rows={4} className={submitted ? readonlyCls : "field-input w-full resize-none"}
              disabled={submitted} value={String(val)}
              onChange={(e) => (setv as (v: string) => void)(e.target.value)} placeholder={db.answerPh} />
          </div>
        ))}
        {!submitted && (
          <button type="button" onClick={onSubmit} disabled={busy || !allFilled}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50">
            <Send className="h-4 w-4" /> {busy ? db.processing : db.submit}
          </button>
        )}
        {msg && (
          <p className={`mt-3 text-sm ${msg.kind === "ok" ? "text-emerald-600" : "text-red-500"}`}>{msg.text}</p>
        )}
      </div>
    </div>
  );
}
