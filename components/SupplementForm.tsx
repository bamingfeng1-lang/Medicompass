"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";
import type { MyApplicationDetail } from "@/lib/api";
import { clientApi } from "@/lib/api";
import { FileDropzone } from "@/components/FileDropzone";

export function SupplementForm({
  app,
  dict,
}: {
  app: MyApplicationDetail;
  dict: Dictionary;
}) {
  const ac = dict.account;
  const f = dict.register.fields;
  const a = dict.apply;
  const router = useRouter();

  const [fullName, setFullName] = useState(app.fullName ?? "");
  const [email, setEmail] = useState(app.email ?? "");
  const [phone, setPhone] = useState(app.phone ?? "");
  const [country, setCountry] = useState(app.country ?? "");
  const [condition, setCondition] = useState(app.condition ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setMsg({ kind: "err", text: dict.common.required });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("fullName", fullName.trim());
      fd.append("email", email.trim());
      fd.append("phone", phone.trim());
      fd.append("country", country.trim());
      fd.append("condition", condition.trim());
      for (const f of files) fd.append("attachments", f);
      const res = await fetch(clientApi(`/api/auth/applications/${app.id}/supplement`), {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) {
        setMsg({ kind: "err", text: dict.common.submitError });
        setBusy(false);
        return;
      }
      setMsg({ kind: "ok", text: ac.supplementSubmitted });
      router.refresh();
    } catch {
      setMsg({ kind: "err", text: dict.common.submitError });
      setBusy(false);
    }
  };

  const fieldCls = "field-input w-full";

  return (
    <div className="card mt-6">
      <h2 className="text-lg font-semibold text-brand-950">{ac.supplementTitle}</h2>
      <p className="mt-2 text-sm text-slate-500">{ac.supplementHint}</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label">{f.fullName}</label>
            <input className={fieldCls} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="field-label">{f.email}</label>
            <input type="email" className={fieldCls} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="field-label">{f.phone}</label>
            <input type="tel" className={fieldCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="field-label">{f.country}</label>
            <input className={fieldCls} value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="field-label">{f.condition}</label>
          <textarea className={fieldCls} rows={4} value={condition} onChange={(e) => setCondition(e.target.value)} />
        </div>

        <div>
          <label className="field-label">{ac.supplementFileLabel}</label>
          <FileDropzone
            files={files}
            onChange={setFiles}
            labels={{
              cta: a.uploadCta,
              hint: a.uploadHint,
              empty: a.uploadEmpty,
              remove: a.remove,
              fileTooLarge: a.fileTooLarge,
              fileTypeError: a.fileTypeError,
            }}
          />
        </div>

        <button type="submit" disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700">
          <Send className="h-4 w-4" />
          {busy ? ac.supplementSubmitting : ac.supplementSubmit}
        </button>

        {msg && (
          <p className={`text-sm ${msg.kind === "ok" ? "text-emerald-600" : "text-red-500"}`}>{msg.text}</p>
        )}
      </form>
    </div>
  );
}
