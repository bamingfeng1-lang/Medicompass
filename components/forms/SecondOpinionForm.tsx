"use client";

import { useState, useRef } from "react";
import { CheckCircle2, Upload, X, FileText } from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/lib/brand";
import type { Dictionary } from "@/lib/dictionaries";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ALLOWED = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
];

type Values = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  needType: string;
  destination: string;
  condition: string;
};

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function SecondOpinionForm({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const t = dict.register;
  const c = dict.common;
  const a = dict.apply;
  const f = t.fields;
  const ph = t.placeholders;

  const [values, setValues] = useState<Values>({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    needType: f.needTypeOptions[0],
    destination: "",
    condition: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  const set = (name: keyof Values, v: string) => {
    setValues((s) => ({ ...s, [name]: v }));
    setErrors((e) => ({ ...e, [name]: "" }));
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFileError("");
    const next: File[] = [...files];
    for (const file of Array.from(list)) {
      if (file.size > MAX_FILE_BYTES) {
        setFileError(`${a.fileTooLarge}${file.name}`);
        continue;
      }
      if (!ALLOWED.includes(file.type)) {
        setFileError(`${a.fileTypeError}${file.name}`);
        continue;
      }
      if (!next.some((x) => x.name === file.name && x.size === file.size)) next.push(file);
    }
    setFiles(next);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (i: number) => setFiles((s) => s.filter((_, idx) => idx !== i));

  const validate = () => {
    const e: Record<string, string> = {};
    const req: (keyof Values)[] = ["fullName", "email", "phone", "country", "needType", "condition"];
    for (const k of req) if (!values[k].trim()) e[k] = c.required;
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) e.email = c.invalidEmail;
    if (!agree) e.__agree = c.agreeError;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setStatus("submitting");

    const fd = new FormData();
    fd.append("lang", lang);
    (Object.keys(values) as (keyof Values)[]).forEach((k) => fd.append(k, values[k]));
    files.forEach((file) => fd.append("attachments", file));

    try {
      const res = await fetch("/api/applications", { method: "POST", body: fd });
      if (!res.ok) throw new Error("submit failed");
      setStatus("done");
    } catch {
      setFileError(a.submitError);
      setStatus("idle");
    }
  };

  if (status === "done") {
    return (
      <div className="card mx-auto max-w-lg text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-brand-deep" />
        <h2 className="mt-5 text-2xl font-bold text-brand-950">{c.successTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{c.successDesc}</p>
        <Link href={`/${lang}`} className="btn-primary mt-8">
          {c.backHome}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="fullName" label={f.fullName} required error={errors.fullName}>
          <input id="fullName" className="field-input" placeholder={ph.fullName}
            value={values.fullName} onChange={(e) => set("fullName", e.target.value)} />
        </Field>
        <Field id="email" label={f.email} required error={errors.email}>
          <input id="email" type="email" className="field-input" placeholder={ph.email}
            value={values.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field id="phone" label={f.phone} required error={errors.phone}>
          <input id="phone" type="tel" className="field-input" placeholder={ph.phone}
            value={values.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field id="country" label={f.country} required error={errors.country}>
          <input id="country" className="field-input" placeholder={ph.country}
            value={values.country} onChange={(e) => set("country", e.target.value)} />
        </Field>
        <Field id="needType" label={f.needType} required error={errors.needType}>
          <select id="needType" className="field-input"
            value={values.needType} onChange={(e) => set("needType", e.target.value)}>
            {f.needTypeOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field id="destination" label={f.destination} error={errors.destination}>
          <input id="destination" className="field-input" placeholder={ph.destination}
            value={values.destination} onChange={(e) => set("destination", e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field id="condition" label={f.condition} required error={errors.condition}>
            <textarea id="condition" rows={4} className="field-input resize-none" placeholder={ph.condition}
              value={values.condition} onChange={(e) => set("condition", e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Attachments */}
      <div className="mt-6">
        <label className="field-label">{a.uploadLabel}</label>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/40 px-6 py-8 text-center transition hover:border-brand-deep hover:bg-brand-50"
        >
          <Upload className="h-7 w-7 text-brand-deep" />
          <p className="mt-2 text-sm font-medium text-brand-deep">{a.uploadCta}</p>
          <p className="mt-1 text-xs text-slate-500">{a.uploadHint}</p>
          <input ref={inputRef} type="file" multiple accept={ALLOWED.join(",")}
            className="hidden" onChange={(e) => addFiles(e.target.files)} />
        </div>
        {fileError && <p className="mt-2 text-xs text-red-500">{fileError}</p>}

        {files.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {files.map((file, i) => (
              <li key={`${file.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <FileText className="h-4 w-4 shrink-0 text-brand-deep" />
                <span className="flex-1 truncate text-sm text-slate-700">{file.name}</span>
                <span className="text-xs text-slate-400">{fmtSize(file.size)}</span>
                <button type="button" onClick={() => removeFile(i)}
                  className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-red-500"
                  aria-label={a.remove}>
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-slate-400">{a.uploadEmpty}</p>
        )}
      </div>

      <div className="mt-6">
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={agree}
            onChange={(e) => { setAgree(e.target.checked); setErrors((x) => ({ ...x, __agree: "" })); }}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-deep focus:ring-brand-sky" />
          <span className="text-sm text-slate-600">{t.consent}</span>
        </label>
        {errors.__agree && <p className="mt-1 text-xs text-red-500">{errors.__agree}</p>}
      </div>

      <button type="submit" disabled={status === "submitting"} className="btn-primary mt-8 w-full">
        {status === "submitting" ? c.submitting : c.submit}
      </button>
    </form>
  );
}

function Field({
  id, label, required, error, children,
}: {
  id: string; label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
