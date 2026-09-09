"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Send, Upload, FileText } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";
import type { MyApplicationDetail } from "@/lib/api";
import {
  acceptApplication,
  rejectApplication,
  structureApplication,
  uploadFinalReport,
  translateApplication,
} from "@/lib/api";

const MAX_PDF_BYTES = 50 * 1024 * 1024;

export function ProviderWorkbench({
  app,
  dict,
}: {
  app: MyApplicationDetail;
  dict: Dictionary;
}) {
  const wb = dict.providerWorkbench ?? ({} as Record<string, string>);
  const router = useRouter();

  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [s, setS] = useState({
    medicalSummary: app.medicalSummary ?? "",
    labResults: app.labResults ?? "",
    currentTreatment: app.currentTreatment ?? "",
    question1: app.question1 ?? "",
    question2: app.question2 ?? "",
    question3: app.question3 ?? "",
  });
  const [tr, setTr] = useState({
    translatedAnswer1: app.translatedAnswer1 ?? "",
    translatedAnswer2: app.translatedAnswer2 ?? "",
    translatedAnswer3: app.translatedAnswer3 ?? "",
  });

  const refresh = () => router.refresh();

  const onAccept = async () => {
    setBusy(true); setMsg(null);
    const ok = await acceptApplication(app.id);
    setBusy(false);
    setMsg(ok ? { kind: "ok", text: wb.accepted } : { kind: "err", text: wb.opError });
    if (ok) refresh();
  };

  const onReject = async () => {
    if (!rejectReason.trim()) { setMsg({ kind: "err", text: wb.reasonRequired }); return; }
    setBusy(true); setMsg(null);
    const ok = await rejectApplication(app.id, rejectReason.trim());
    setBusy(false);
    setMsg(ok ? { kind: "ok", text: wb.rejected } : { kind: "err", text: wb.opError });
    if (ok) { setConfirmReject(false); setRejectReason(""); refresh(); }
  };

  const onStructure = async () => {
    const required = [s.medicalSummary, s.labResults, s.currentTreatment, s.question1, s.question2, s.question3];
    if (required.some((x) => !x.trim())) { setMsg({ kind: "err", text: wb.structureRequired }); return; }
    setBusy(true); setMsg(null);
    const ok = await structureApplication(app.id, s);
    setBusy(false);
    setMsg(ok ? { kind: "ok", text: wb.structureSubmitted } : { kind: "err", text: wb.opError });
    if (ok) refresh();
  };

  const onUploadReport = async (f: File | null) => {
    if (!f) return;
    if (f.type !== "application/pdf" || f.size > MAX_PDF_BYTES) {
      setMsg({ kind: "err", text: wb.reportInvalid }); return;
    }
    setBusy(true); setMsg(null);
    const ok = await uploadFinalReport(app.id, f);
    setBusy(false);
    setMsg(ok ? { kind: "ok", text: wb.reportUploaded } : { kind: "err", text: wb.opError });
    if (ok) refresh();
  };

  const onTranslate = async () => {
    if (!app.finalBilingualReportUrl) { setMsg({ kind: "err", text: wb.reportMissing }); return; }
    const required = [tr.translatedAnswer1, tr.translatedAnswer2, tr.translatedAnswer3];
    if (required.some((x) => !x.trim())) { setMsg({ kind: "err", text: wb.translateRequired }); return; }
    setBusy(true); setMsg(null);
    const ok = await translateApplication(app.id, tr);
    setBusy(false);
    setMsg(ok ? { kind: "ok", text: wb.translateSubmitted } : { kind: "err", text: wb.opError });
    if (ok) refresh();
  };

  const textarea = "field-input w-full resize-none";
  const readonlyCls = (editable: boolean) => (editable ? textarea : textarea + " bg-slate-50 text-slate-500");
  const accepted = !!app.acceptedAt;

  if (app.status !== "PROVIDER_PROCESSING" && app.status !== "PROVIDER_TRANSLATING") {
    // The provider is no longer the active handler (case handed to the doctor /
    // admin), but they should still be able to review what they submitted.
    const hasStructure = !!(
      app.medicalSummary || app.labResults || app.currentTreatment ||
      app.question1 || app.question2 || app.question3
    );
    if (!hasStructure) {
      return (
        <div className="card">
          <h2 className="text-lg font-semibold text-brand-950">{wb.lockedTitle}</h2>
          <p className="mt-2 text-sm text-slate-500">{wb.lockedHint}</p>
        </div>
      );
    }
    const recap: [string, string | null | undefined][] = [
      [wb.medicalSummary, app.medicalSummary],
      [wb.labResults, app.labResults],
      [wb.currentTreatment, app.currentTreatment],
      [wb.question1, app.question1],
      [wb.question2, app.question2],
      [wb.question3, app.question3],
    ];
    const answers: [string, string | null | undefined][] = [
      [`${wb.doctorAnswer} 1`, app.doctorAnswer1],
      [`${wb.doctorAnswer} 2`, app.doctorAnswer2],
      [`${wb.doctorAnswer} 3`, app.doctorAnswer3],
    ];
    const hasAnswers = answers.some(([, v]) => v);
    return (
      <div className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-brand-950">{wb.lockedTitle}</h2>
          <p className="mt-2 text-sm text-slate-500">{wb.lockedHint}</p>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold text-brand-950">{wb.structureTitle}</h2>
          <div className="mt-4 space-y-4">
            {recap.map(([label, value]) => (
              <div key={label}>
                <label className="field-label">{label}</label>
                <textarea rows={label === wb.medicalSummary || label === wb.labResults || label === wb.currentTreatment ? 4 : 2}
                  readOnly className={readonlyCls(false)} value={value ?? ""} />
              </div>
            ))}
          </div>
        </div>
        {hasAnswers && (
          <div className="card">
            <h2 className="text-lg font-semibold text-brand-950">{wb.doctorAnswer}</h2>
            <div className="mt-4 space-y-4">
              {answers.map(([label, value]) => (
                value ? (
                  <div key={label}>
                    <label className="field-label">{label}</label>
                    <textarea rows={3} readOnly className={readonlyCls(false)} value={value} />
                  </div>
                ) : null
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (app.status === "PROVIDER_PROCESSING") {
    const editable = accepted;
    return (
      <div className="space-y-6">
        {!accepted ? (
          <div className="card">
            <h2 className="text-lg font-semibold text-brand-950">{wb.acceptTitle}</h2>
            <p className="mt-2 text-sm text-slate-500">{wb.acceptHint}</p>
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={onAccept} disabled={busy}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700">
                <Check className="h-4 w-4" /> {busy ? wb.processing : wb.accept}
              </button>
              <button type="button" onClick={() => setConfirmReject(true)}
                className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50">
                <X className="h-4 w-4" /> {wb.reject}
              </button>
            </div>
            {confirmReject && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <label className="field-label">{wb.rejectReasonLabel}</label>
                <textarea rows={3} className="field-input w-full resize-none" value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)} placeholder={wb.rejectReasonPh} />
                <div className="mt-3 flex gap-3">
                  <button type="button" onClick={onReject} disabled={busy}
                    className="inline-flex items-center gap-2 rounded-full bg-red-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-600">
                    <X className="h-4 w-4" /> {busy ? wb.processing : wb.confirmReject}
                  </button>
                  <button type="button" onClick={() => setConfirmReject(false)}
                    className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                    {wb.cancel}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="card">
          <h2 className="text-lg font-semibold text-brand-950">{wb.structureTitle}</h2>
          <p className="mt-2 text-sm text-slate-500">{wb.structureHint}</p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="field-label">{wb.medicalSummary}</label>
              <textarea rows={4} className={readonlyCls(editable)} value={s.medicalSummary}
                onChange={(e) => setS((x) => ({ ...x, medicalSummary: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">{wb.labResults}</label>
              <textarea rows={4} className={readonlyCls(editable)} value={s.labResults}
                onChange={(e) => setS((x) => ({ ...x, labResults: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">{wb.currentTreatment}</label>
              <textarea rows={4} className={readonlyCls(editable)} value={s.currentTreatment}
                onChange={(e) => setS((x) => ({ ...x, currentTreatment: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">{wb.question1}</label>
              <textarea rows={2} className={readonlyCls(editable)} value={s.question1}
                onChange={(e) => setS((x) => ({ ...x, question1: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">{wb.question2}</label>
              <textarea rows={2} className={readonlyCls(editable)} value={s.question2}
                onChange={(e) => setS((x) => ({ ...x, question2: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">{wb.question3}</label>
              <textarea rows={2} className={readonlyCls(editable)} value={s.question3}
                onChange={(e) => setS((x) => ({ ...x, question3: e.target.value }))} />
            </div>
          </div>
          {editable && (
            <button type="button" onClick={onStructure} disabled={busy}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700">
              <Send className="h-4 w-4" /> {busy ? wb.processing : wb.submitAdmin}
            </button>
          )}
        </div>

        {msg && (
          <p className={`text-sm ${msg.kind === "ok" ? "text-emerald-600" : "text-red-500"}`}>{msg.text}</p>
        )}
      </div>
    );
  }

  // PROVIDER_TRANSLATING
  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold text-brand-950">{wb.translateTitle}</h2>
        <p className="mt-2 text-sm text-slate-500">{wb.translateHint}</p>
        {([1, 2, 3] as const).map((n) => (
          <div key={n} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label">{`${wb.doctorAnswer} ${n}`}</label>
              <textarea rows={3} readOnly className={readonlyCls(false)}
                value={n === 1 ? app.doctorAnswer1 ?? "" : n === 2 ? app.doctorAnswer2 ?? "" : app.doctorAnswer3 ?? ""} />
            </div>
            <div>
              <label className="field-label">{`${wb.translatedAnswer} ${n}`}</label>
              <textarea rows={3} className={readonlyCls(true)}
                value={n === 1 ? tr.translatedAnswer1 : n === 2 ? tr.translatedAnswer2 : tr.translatedAnswer3}
                onChange={(e) => setTr((x) => ({ ...x, [`translatedAnswer${n}`]: e.target.value }))} />
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-brand-950">{wb.reportTitle}</h2>
        <p className="mt-2 text-sm text-slate-500">{wb.reportHint}</p>
        <div className="mt-4">
          {app.finalBilingualReportUrl ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <FileText className="h-4 w-4 shrink-0 text-brand-deep" />
              <a href={`/api/auth/applications/${app.id}/final-report`} target="_blank" rel="noopener noreferrer"
                className="flex-1 truncate text-sm text-slate-700 hover:text-brand-deep hover:underline">
                {wb.reportFile}
              </a>
              <a href={`/api/auth/applications/${app.id}/final-report?download=1`}
                className="text-xs font-medium text-brand-deep hover:underline">{wb.download}</a>
            </div>
          ) : (
            <div>
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
                onChange={(e) => onUploadReport(e.target.files?.[0] ?? null)} />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}
                className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-brand-deep hover:text-brand-deep">
                <Upload className="h-4 w-4" /> {busy ? wb.processing : wb.uploadReport}
              </button>
            </div>
          )}
        </div>
        {app.finalBilingualReportUrl && (
          <button type="button" onClick={onTranslate} disabled={busy}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700">
            <Send className="h-4 w-4" /> {busy ? wb.processing : wb.submitQC}
          </button>
        )}
        {msg && (
          <p className={`mt-3 text-sm ${msg.kind === "ok" ? "text-emerald-600" : "text-red-500"}`}>{msg.text}</p>
        )}
      </div>
    </div>
  );
}
