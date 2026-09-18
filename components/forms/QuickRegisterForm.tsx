"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, UserPlus } from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/lib/brand";
import type { Dictionary } from "@/lib/dictionaries";
import { clientApi } from "@/lib/api";

export function QuickRegisterForm({
  lang,
  dict,
  phone,
  fullName,
  email,
  needType,
}: {
  lang: Locale;
  dict: Dictionary;
  phone: string;
  fullName?: string;
  email?: string;
  needType?: string;
}) {
  const t = dict.register;
  const c = dict.common;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "done") {
      successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [status]);

  const validate = () => {
    const e: Record<string, string> = {};
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
      const res = await fetch(clientApi("/api/register/quick"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone, password, fullName, email, needType, lang }),
      });
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
      <div ref={successRef} className="card scroll-mt-24 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-brand-deep" />
        <h3 className="mt-4 text-xl font-bold text-brand-950">{t.quickSuccessTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.quickSuccessDesc}</p>
        <Link
          href={`/${lang}/login?phone=${encodeURIComponent(phone)}`}
          className="btn-primary mt-6"
        >
          {dict.nav.login}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card">
      <div className="space-y-5">
        <div>
          <label htmlFor="qphone" className="field-label">{t.fields.phone}</label>
          <input id="qphone" type="tel" className="field-input bg-slate-50 text-slate-500"
            value={phone} readOnly />
        </div>
        <div>
          <label htmlFor="qpassword" className="field-label">
            {t.password}
            <span className="ml-0.5 text-red-500">*</span>
          </label>
          <input id="qpassword" type="password" autoComplete="new-password"
            className="field-input" placeholder={t.passwordPh}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((x) => ({ ...x, password: "" })); }} />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
        </div>
        <div>
          <label htmlFor="qconfirm" className="field-label">
            {t.confirmPassword}
            <span className="ml-0.5 text-red-500">*</span>
          </label>
          <input id="qconfirm" type="password" autoComplete="new-password"
            className="field-input" placeholder={t.confirmPasswordPh}
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setErrors((x) => ({ ...x, confirmPassword: "" })); }} />
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={agree}
            onChange={(e) => { setAgree(e.target.checked); setErrors((x) => ({ ...x, __agree: "" })); }}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-deep focus:ring-brand-sky" />
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
        {errors.__agree && <p className="text-xs text-red-500">{errors.__agree}</p>}
        {errors.__submit && <p className="text-sm text-red-500">{errors.__submit}</p>}

        <button type="submit" disabled={status === "submitting"} className="btn-primary w-full">
          <UserPlus className="h-4 w-4" />
          {status === "submitting" ? c.submitting : t.quickSubmit}
        </button>
      </div>
    </form>
  );
}
