"use client";

import { useState } from "react";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/lib/brand";
import type { Dictionary } from "@/lib/dictionaries";

export type Field = {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select";
  placeholder?: string;
  options?: readonly string[];
  required?: boolean;
  half?: boolean;
};

type Role = "patient" | "provider" | "doctor";

export function RegisterForm({
  role,
  fields,
  lang,
  dict,
}: {
  role: Role;
  fields: Field[];
  lang: Locale;
  dict: Dictionary;
}) {
  const t = dict.register;
  const c = dict.common;
  const [values, setValues] = useState<Record<string, string>>({});
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");

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
    if (!agree) e.__agree = c.agreeError;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    // MVP: persist locally. TODO: replace with POST /api/register
    const payload = { role, lang, values, submittedAt: new Date().toISOString() };
    try {
      const key = "medicompass_registrations";
      const prev = JSON.parse(localStorage.getItem(key) || "[]");
      prev.push(payload);
      localStorage.setItem(key, JSON.stringify(prev));
    } catch {
      /* ignore storage errors */
    }
    setTimeout(() => setStatus("done"), 600);
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
