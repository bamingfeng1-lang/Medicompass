"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { Locale } from "@/lib/brand";
import type { Dictionary } from "@/lib/dictionaries";

type Values = {
  fullName: string;
  phone: string;
  email: string;
  message: string;
};

export function ServiceInquiryForm({
  lang,
  dict,
  serviceSlug,
}: {
  lang: Locale;
  dict: Dictionary;
  serviceSlug: string;
}) {
  const q = dict.services.inquiry;

  const [values, setValues] = useState<Values>({
    fullName: "",
    phone: "",
    email: "",
    message: "",
  });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");

  const set = (name: keyof Values, v: string) => {
    setValues((s) => ({ ...s, [name]: v }));
    setErrors((e) => ({ ...e, [name]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!values.fullName.trim()) e.fullName = q.errorRequired;
    if (!values.phone.trim()) e.phone = q.errorRequired;
    else if (!/^[\d+\-\s()]{6,20}$/.test(values.phone.trim())) e.phone = q.errorPhone;
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) e.email = q.errorEmail;
    if (!agree) e.__agree = q.errorConsent;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, serviceSlug, lang }),
      });
      if (!res.ok) throw new Error("submit failed");
      setStatus("done");
    } catch {
      setErrors((e) => ({ ...e, __submit: q.errorSubmit }));
      setStatus("idle");
    }
  };

  if (status === "done") {
    return (
      <div className="card text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-brand-deep" />
        <h3 className="mt-4 text-xl font-bold text-brand-950">{q.successTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{q.successDesc}</p>
        <button
          type="button"
          onClick={() => {
            setValues({ fullName: "", phone: "", email: "", message: "" });
            setAgree(false);
            setStatus("idle");
          }}
          className="btn-secondary mt-6"
        >
          {q.submitAnother}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card">
      <h3 className="text-xl font-bold text-brand-950">{q.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{q.desc}</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field id="fullName" label={q.name} required error={errors.fullName}>
          <input id="fullName" className="field-input" placeholder={q.namePh}
            value={values.fullName} onChange={(e) => set("fullName", e.target.value)} />
        </Field>
        <Field id="phone" label={q.phone} required error={errors.phone}>
          <input id="phone" type="tel" className="field-input" placeholder={q.phonePh}
            value={values.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field id="email" label={q.email} error={errors.email}>
            <input id="email" type="email" className="field-input" placeholder={q.emailPh}
              value={values.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field id="message" label={q.message} error={errors.message}>
            <textarea id="message" rows={3} className="field-input resize-none" placeholder={q.messagePh}
              value={values.message} onChange={(e) => set("message", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="mt-5">
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={agree}
            onChange={(e) => { setAgree(e.target.checked); setErrors((x) => ({ ...x, __agree: "" })); }}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-deep focus:ring-brand-sky" />
          <span className="text-sm text-slate-600">{q.consent}</span>
        </label>
        {errors.__agree && <p className="mt-1 text-xs text-red-500">{errors.__agree}</p>}
      </div>

      {errors.__submit && <p className="mt-3 text-sm text-red-500">{errors.__submit}</p>}

      <button type="submit" disabled={status === "submitting"} className="btn-primary mt-6 w-full">
        {status === "submitting" ? q.submitting : q.submit}
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
