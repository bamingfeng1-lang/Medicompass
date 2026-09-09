"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle2, ArrowLeft, Upload, X, FileText } from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/lib/brand";
import type { Dictionary } from "@/lib/dictionaries";
import { clientApi } from "@/lib/api";

const MAX_FILE_BYTES = 15 * 1024 * 1024;

export type Field = {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select" | "file";
  placeholder?: string;
  options?: readonly string[];
  required?: boolean;
  half?: boolean;
  accept?: string;
};

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

type Role = "patient" | "provider" | "doctor";

export function RegisterForm({
  role,
  fields,
  lang,
  dict,
  initialPhone,
}: {
  role: Role;
  fields: Field[];
  lang: Locale;
  dict: Dictionary;
  initialPhone?: string;
}) {
  const t = dict.register;
  const c = dict.common;
  const [values, setValues] = useState<Record<string, string>>(
    initialPhone ? { phone: initialPhone } : {},
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "done") {
      successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [status]);

  const hasFileField = fields.some((f) => f.type === "file");
  // Patient path: show an optional medical-attachment upload only when the
  // selected need type is the second-opinion option (first in the list).
  const isPatientSecondOpinion =
    role === "patient" && values["needType"] === t.fields.needTypeOptions?.[0];
  const patientFileRef = useRef<HTMLInputElement>(null);

  const pickFile = (name: string, fileList: FileList | null) => {
    const file = fileList?.[0] ?? null;
    if (file && file.size > MAX_FILE_BYTES) {
      setErrors((e) => ({ ...e, [name]: t.licenseFileError }));
      return;
    }
    setFiles((s) => ({ ...s, [name]: file }));
    setErrors((e) => ({ ...e, [name]: "" }));
  };

  const clearFile = (name: string) => {
    setFiles((s) => ({ ...s, [name]: null }));
    if (fileInputs.current[name]) fileInputs.current[name]!.value = "";
  };

  const set = (name: string, v: string) => {
    setValues((s) => ({ ...s, [name]: v }));
    setErrors((e) => ({ ...e, [name]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    for (const f of fields) {
      const v = (values[f.name] ?? "").trim();
      if (f.required && !v) e[f.name] = c.required;
      if (f.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
        e[f.name] = c.invalidEmail;
    }
    if (!password) e.password = c.required;
    else if (password.length < 8) e.password = t.passwordTooShort;
    if (confirmPassword !== password) e.confirmPassword = t.passwordMismatch;
    if (!agree) e.__agree = c.agreeError;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    try {
      let res: Response;
      if (hasFileField || role === "patient") {
        const fd = new FormData();
        for (const [k, v] of Object.entries(values)) fd.append(k, v ?? "");
        fd.append("password", password);
        fd.append("lang", lang);
        for (const f of fields) {
          if (f.type === "file") {
            const file = files[f.name];
            if (file) fd.append("licenseFile", file);
          }
        }
        // Optional medical attachment for the patient (second-opinion) path.
        const medical = files["medical"];
        if (medical) fd.append("attachments", medical);
        res = await fetch(clientApi(`/api/register/${role}`), {
          method: "POST",
          credentials: "include",
          body: fd,
        });
      } else {
        res = await fetch(clientApi(`/api/register/${role}`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ...values, password, lang }),
        });
      }
      if (!res.ok) {
        let code = "";
        try {
          code = (await res.json())?.error ?? "";
        } catch {
          /* ignore */
        }
        const msg =
          code === "phone_exists"
            ? t.phoneExists
            : code === "weak_password"
              ? t.passwordTooShort
              : c.submitError;
        setErrors((e) => ({ ...e, __submit: msg }));
        setStatus("idle");
        return;
      }
      setStatus("done");
    } catch {
      setErrors((e) => ({ ...e, __submit: c.submitError }));
      setStatus("idle");
    }
  };

  if (status === "done") {
    return (
      <div ref={successRef} className="card mx-auto max-w-lg scroll-mt-24 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-brand-deep" />
        <h2 className="mt-5 text-2xl font-bold text-brand-950">{c.successTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{c.successDesc}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href={`/${lang}`} className="btn-primary">
            {c.backHome}
          </Link>
          <Link href={`/${lang}/login`} className="btn-secondary">
            {dict.nav.login}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card">
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.name} className={f.half ? "sm:col-span-1" : "sm:col-span-2"}>
            <label htmlFor={f.name} className="field-label">
              {f.label}
              {f.required && <span className="ml-0.5 text-red-500">*</span>}
            </label>
            {f.type === "textarea" ? (
              <textarea
                id={f.name}
                rows={4}
                placeholder={f.placeholder}
                className="field-input resize-none"
                value={values[f.name] ?? ""}
                onChange={(e) => set(f.name, e.target.value)}
              />
            ) : f.type === "select" ? (
              <select
                id={f.name}
                className="field-input"
                value={values[f.name] ?? ""}
                onChange={(e) => set(f.name, e.target.value)}
              >
                <option value="">—</option>
                {f.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : f.type === "file" ? (
              <div>
                <input
                  ref={(el) => {
                    fileInputs.current[f.name] = el;
                  }}
                  id={f.name}
                  type="file"
                  accept={f.accept}
                  className="hidden"
                  onChange={(e) => pickFile(f.name, e.target.files)}
                />
                {files[f.name] ? (
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <FileText className="h-4 w-4 shrink-0 text-brand-deep" />
                    <span className="flex-1 truncate text-sm text-slate-700">
                      {files[f.name]!.name}
                    </span>
                    <span className="text-xs text-slate-400">{fmtSize(files[f.name]!.size)}</span>
                    <button
                      type="button"
                      onClick={() => clearFile(f.name)}
                      className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-red-500"
                      aria-label="remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputs.current[f.name]?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-600 transition hover:border-brand-deep hover:text-brand-deep"
                  >
                    <Upload className="h-4 w-4" />
                    {t.licenseChooseFile}
                  </button>
                )}
              </div>
            ) : (
              <input
                id={f.name}
                type={f.type}
                placeholder={f.placeholder}
                className="field-input"
                value={values[f.name] ?? ""}
                onChange={(e) => set(f.name, e.target.value)}
              />
            )}
            {errors[f.name] && <p className="mt-1 text-xs text-red-500">{errors[f.name]}</p>}
          </div>
        ))}
      </div>

      {/* Optional medical attachment — patient + second-opinion only */}
      {isPatientSecondOpinion && (
        <div className="mt-5">
          <label className="field-label">{t.medicalUploadLabel}</label>
          <input
            ref={patientFileRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(e) => pickFile("medical", e.target.files)}
          />
          {files["medical"] ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <FileText className="h-4 w-4 shrink-0 text-brand-deep" />
              <span className="flex-1 truncate text-sm text-slate-700">
                {files["medical"]!.name}
              </span>
              <span className="text-xs text-slate-400">{fmtSize(files["medical"]!.size)}</span>
              <button
                type="button"
                onClick={() => clearFile("medical")}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-red-500"
                aria-label="remove"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => patientFileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-600 transition hover:border-brand-deep hover:text-brand-deep"
            >
              <Upload className="h-4 w-4" />
              {t.medicalChooseFile}
            </button>
          )}
          <p className="mt-1 text-xs text-slate-400">{t.medicalUploadHint}</p>
        </div>
      )}

      {/* Account credentials — used for login (phone from the fields above) */}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label htmlFor="password" className="field-label">
            {t.password}
            <span className="ml-0.5 text-red-500">*</span>
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder={t.passwordPh}
            className="field-input"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((x) => ({ ...x, password: "" }));
            }}
          />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="confirmPassword" className="field-label">
            {t.confirmPassword}
            <span className="ml-0.5 text-red-500">*</span>
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder={t.confirmPasswordPh}
            className="field-input"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setErrors((x) => ({ ...x, confirmPassword: "" }));
            }}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => {
              setAgree(e.target.checked);
              setErrors((x) => ({ ...x, __agree: "" }));
            }}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-deep focus:ring-brand-sky"
          />
          <span className="text-sm text-slate-600">{t.consent}</span>
        </label>
        {errors.__agree && <p className="mt-1 text-xs text-red-500">{errors.__agree}</p>}
      </div>

      {errors.__submit && <p className="mt-3 text-sm text-red-500">{errors.__submit}</p>}

      <button type="submit" disabled={status === "submitting"} className="btn-primary mt-8 w-full">
        {status === "submitting" ? c.submitting : c.submit}
      </button>
    </form>
  );
}

export function RegisterHeader({
  lang,
  title,
  desc,
  backLabel,
}: {
  lang: Locale;
  title: string;
  desc: string;
  backLabel: string;
}) {
  return (
    <div className="mb-10">
      <Link
        href={`/${lang}/register`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-deep"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">{desc}</p>
    </div>
  );
}
