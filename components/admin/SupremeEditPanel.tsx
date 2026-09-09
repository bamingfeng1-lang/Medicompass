"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Upload, Send } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";
import { clientApi } from "@/lib/api";

type Detailed = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  country: string | null;
  needType: string;
  destination: string | null;
  condition: string | null;
  message: string | null;
  medicalSummary: string | null;
  labResults: string | null;
  currentTreatment: string | null;
  question1: string | null;
  question2: string | null;
  question3: string | null;
  doctorAnswer1: string | null;
  doctorAnswer2: string | null;
  doctorAnswer3: string | null;
  translatedAnswer1: string | null;
  translatedAnswer2: string | null;
  translatedAnswer3: string | null;
};

const MAX_FILE_BYTES = 15 * 1024 * 1024;

export function SupremeEditPanel({
  app,
  dict,
}: {
  app: Detailed;
  dict: Dictionary;
}) {
  const a = dict.admin;
  const f = dict.register.fields;
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [v, setV] = useState<Record<string, string>>({
    fullName: app.fullName ?? "",
    email: app.email ?? "",
    phone: app.phone ?? "",
    country: app.country ?? "",
    needType: app.needType ?? "",
    destination: app.destination ?? "",
    condition: app.condition ?? "",
    message: app.message ?? "",
    medicalSummary: app.medicalSummary ?? "",
    labResults: app.labResults ?? "",
    currentTreatment: app.currentTreatment ?? "",
    question1: app.question1 ?? "",
    question2: app.question2 ?? "",
    question3: app.question3 ?? "",
    doctorAnswer1: app.doctorAnswer1 ?? "",
    doctorAnswer2: app.doctorAnswer2 ?? "",
    doctorAnswer3: app.doctorAnswer3 ?? "",
    translatedAnswer1: app.translatedAnswer1 ?? "",
    translatedAnswer2: app.translatedAnswer2 ?? "",
    translatedAnswer3: app.translatedAnswer3 ?? "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const set = (k: string, val: string) => setV((s) => ({ ...s, [k]: val }));

  const pick = (list: FileList | null) => {
    if (!list) return;
    const next: File[] = [];
    for (const file of Array.from(list)) {
      if (file.size > MAX_FILE_BYTES) {
        setMsg({ kind: "err", text: a.supremeFileTooBig });
        return;
      }
      next.push(file);
    }
    setFiles((prev) => [...prev, ...next]);
    setMsg(null);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(clientApi(`/api/admin/applications/${app.id}/info`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: v.fullName, email: v.email, phone: v.phone, country: v.country,
          needType: v.needType, destination: v.destination, condition: v.condition, message: v.message,
          medicalSummary: v.medicalSummary, labResults: v.labResults, currentTreatment: v.currentTreatment,
          question1: v.question1, question2: v.question2, question3: v.question3,
          doctorAnswer1: v.doctorAnswer1, doctorAnswer2: v.doctorAnswer2, doctorAnswer3: v.doctorAnswer3,
          translatedAnswer1: v.translatedAnswer1, translatedAnswer2: v.translatedAnswer2, translatedAnswer3: v.translatedAnswer3,
        }),
      });
      if (!res.ok) {
        setMsg({ kind: "err", text: a.supremeSaveError });
        setBusy(false);
        return;
      }
      setMsg({ kind: "ok", text: a.supremeSaved });
      router.refresh();
    } catch {
      setMsg({ kind: "err", text: a.supremeSaveError });
      setBusy(false);
    }
  };

  const onUpload = async () => {
    if (busy || files.length === 0) return;
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      const res = await fetch(clientApi(`/api/admin/applications/${app.id}/attachments`), {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) {
        setMsg({ kind: "err", text: a.supremeUploadError });
        setBusy(false);
        return;
      }
      setFiles([]);
      setMsg({ kind: "ok", text: a.supremeUploaded });
      router.refresh();
    } catch {
      setMsg({ kind: "err", text: a.supremeUploadError });
      setBusy(false);
    }
  };

  const fieldCls = "field-input w-full";

  return (
    <div className="card mt-6">
      <h2 className="text-lg font-semibold text-brand-950">{a.supremeTitle}</h2>
      <p className="mt-2 text-sm text-slate-500">{a.supremeHint}</p>

      <form onSubmit={onSave} className="mt-5 space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ["fullName", f.fullName],
            ["email", f.email],
            ["phone", f.phone],
            ["country", f.country],
            ["needType", f.needType],
            ["destination", f.destination],
          ] as [string, string][]).map(([k, label]) => (
            <div key={k}>
              <label className="field-label">{label}</label>
              <input className={fieldCls} value={v[k]} onChange={(e) => set(k, e.target.value)} />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="field-label">{a.supremeCondition}</label>
            <textarea className={fieldCls} rows={3} value={v.condition} onChange={(e) => set("condition", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">{a.supremeMessage}</label>
            <textarea className={fieldCls} rows={3} value={v.message} onChange={(e) => set("message", e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ["medicalSummary", a.supremeMedicalSummary],
            ["labResults", a.supremeLabResults],
            ["currentTreatment", a.supremeCurrentTreatment],
            ["question1", a.supremeQ1],
            ["question2", a.supremeQ2],
            ["question3", a.supremeQ3],
          ] as [string, string][]).map(([k, label]) => (
            <div key={k}>
              <label className="field-label">{label}</label>
              <textarea className={fieldCls} rows={3} value={v[k]} onChange={(e) => set(k, e.target.value)} />
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ["doctorAnswer1", a.supremeDocA1],
            ["doctorAnswer2", a.supremeDocA2],
            ["doctorAnswer3", a.supremeDocA3],
          ] as [string, string][]).map(([k, label]) => (
            <div key={k}>
              <label className="field-label">{label}</label>
              <textarea className={fieldCls} rows={3} value={v[k]} onChange={(e) => set(k, e.target.value)} />
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ["translatedAnswer1", a.supremeTrA1],
            ["translatedAnswer2", a.supremeTrA2],
            ["translatedAnswer3", a.supremeTrA3],
          ] as [string, string][]).map(([k, label]) => (
            <div key={k}>
              <label className="field-label">{label}</label>
              <textarea className={fieldCls} rows={3} value={v[k]} onChange={(e) => set(k, e.target.value)} />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-brand-deep px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90">
            <Save className="h-4 w-4" />
            {busy ? a.supremeSaving : a.supremeSave}
          </button>
          <button type="button" onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-brand-deep hover:text-brand-deep">
            <Upload className="h-4 w-4" />
            {a.supremeChooseFiles}
          </button>
          <input ref={fileRef} type="file" multiple className="hidden" accept="application/pdf,image/*"
            onChange={(e) => pick(e.target.files)} />
          {files.length > 0 && (
            <button type="button" onClick={onUpload} disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700">
              <Send className="h-4 w-4" />
              {a.supremeUpload}
            </button>
          )}
        </div>

        {files.length > 0 && (
          <ul className="space-y-1">
            {files.map((file, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600">
                <span className="truncate">{file.name}</span>
                <button type="button" onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="ml-3 text-xs font-medium text-red-500 hover:underline">×</button>
              </li>
            ))}
          </ul>
        )}

        {msg && (
          <p className={`text-sm ${msg.kind === "ok" ? "text-emerald-600" : "text-red-500"}`}>{msg.text}</p>
        )}
      </form>
    </div>
  );
}
