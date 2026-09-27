"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Doctor reply box for a mobile 图文 consult (admin side). The optional
// clinician signature (name / 职称 / 科室 / 执业证号) is disclosed to the
// patient in-app; it's remembered in localStorage so the replying doctor
// doesn't re-type it every time. Left blank → the app shows the generic
// "医生 / Doctor" label (never a fabricated credential).
const SIG_KEY = "mc.consult.doctorSignature";

type Signature = {
  doctorName: string;
  doctorTitle: string;
  doctorDept: string;
  doctorLicense: string;
};

const EMPTY_SIG: Signature = { doctorName: "", doctorTitle: "", doctorDept: "", doctorLicense: "" };

export function ConsultReply({ consultId, lang }: { consultId: string; lang: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [showSig, setShowSig] = useState(false);
  const [sig, setSig] = useState<Signature>(EMPTY_SIG);
  const zh = lang !== "en";

  // Restore the last-used signature.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIG_KEY);
      if (raw) setSig({ ...EMPTY_SIG, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  const setSigField = (k: keyof Signature, v: string) => {
    const next = { ...sig, [k]: v };
    setSig(next);
    try {
      localStorage.setItem(SIG_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const submit = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/consult/${consultId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t, ...sig }),
      });
      if (res.ok) {
        setText("");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const sigInput = (k: keyof Signature, ph: string) => (
    <input
      value={sig[k]}
      onChange={(e) => setSigField(k, e.target.value)}
      placeholder={ph}
      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-brand-deep focus:outline-none"
    />
  );

  return (
    <div className="mt-3 space-y-2">
      <button
        type="button"
        onClick={() => setShowSig((s) => !s)}
        className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-brand-deep hover:underline"
      >
        {showSig
          ? (zh ? "收起医生署名" : "Hide signature")
          : (zh ? "医生署名（患者可见资质）" : "Clinician signature (shown to patient)")}
      </button>

      {showSig && (
        <div className="grid grid-cols-2 gap-2">
          {sigInput("doctorName", zh ? "姓名" : "Name")}
          {sigInput("doctorTitle", zh ? "职称（如 主任医师）" : "Title (e.g. Attending)")}
          {sigInput("doctorDept", zh ? "科室 / 医院" : "Dept / Hospital")}
          {sigInput("doctorLicense", zh ? "执业证号" : "License no.")}
        </div>
      )}

      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder={zh ? "输入医生回复…" : "Type a doctor reply…"}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-deep focus:outline-none"
        />
        <button
          onClick={submit}
          disabled={busy || !text.trim()}
          className="self-end rounded-lg bg-brand-gradient px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {zh ? "回复" : "Reply"}
        </button>
      </div>
    </div>
  );
}
