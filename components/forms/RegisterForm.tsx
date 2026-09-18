"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/lib/brand";
import type { Dictionary } from "@/lib/dictionaries";
import { clientApi } from "@/lib/api";
import { FileDropzone, IMAGE_PDF_ACCEPT } from "@/components/FileDropzone";

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
  const up = dict.apply;
  const [values, setValues] = useState<Record<string, string>>(
    initialPhone ? { phone: initialPhone } : {},
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  // Each file-type field holds its own pending file list (multi-select, multi-batch).
  const [files, setFiles] = useState<Record<string, File[]>>({});
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

  const setFieldFiles = (name: string, list: File[]) => {
    setFiles((s) => ({ ...s, [name]: list }));
    setErrors((e) => ({ ...e, [name]: "" }));
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
            for (const file of files[f.name] ?? []) fd.append("licenseFile", file);
          }
        }
        // Optional medical attachments for the patient (second-opinion) path.
        for (const file of files["medical"] ?? []) fd.append("attachments", file);
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
              <FileDropzone
                files={files[f.name] ?? []}
                onChange={(list) => setFieldFiles(f.name, list)}
                accept={f.accept || IMAGE_PDF_ACCEPT}
                labels={{
                  cta: t.licenseChooseFile,
                  hint: undefined,
                  empty: undefined,
                  remove: up.remove,
                  fileTooLarge: up.fileTooLarge,
                  fileTypeError: up.fileTypeError,
                }}
              />
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
          <FileDropzone
            files={files["medical"] ?? []}
            onChange={(list) => setFieldFiles("medical", list)}
            labels={{
              cta: t.medicalChooseFile,
              hint: up.uploadHint,
              empty: up.uploadEmpty,
              remove: up.remove,
              fileTooLarge: up.fileTooLarge,
              fileTypeError: up.fileTypeError,
            }}
          />
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
          <span className="text-sm text-slate-600">
            {(() => {
              const text = t.consent;
              const match = text.match(/^(.*?)《[^》]+》(.*)$/);
              if (match) {
                return (
                  <>
                    {match[1]}
                    <Link href={`/${lang}/disclaimer`} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-deep hover:underline">
                      《{t.disclaimerLink}》
                    </Link>
                    {match[2]}
                  </>
                );
              }
              return text;
            })()}
          </span>
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
