"use client";

<<<<<<< HEAD
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, FileText, Save, Send } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";
import { clientApi, type ProviderProfile, type DoctorProfile } from "@/lib/api";
import { RegistrationStatusBadge } from "@/components/RegistrationStatusBadge";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
=======
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, FileText, Save, Send, Upload } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";
import { clientApi, type ProviderProfile, type DoctorProfile } from "@/lib/api";
import { RegistrationStatusBadge } from "@/components/RegistrationStatusBadge";
import { FileDropzone } from "@/components/FileDropzone";
>>>>>>> f18247c (增加CART)

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "select";
  options?: readonly string[];
};

export function ProfileEditForm({
  role,
  dict,
  initial,
}: {
  role: "provider" | "doctor";
  dict: Dictionary;
  initial: ProviderProfile | DoctorProfile;
}) {
  const p = dict.profile;
  const f = dict.register.fields;
<<<<<<< HEAD
=======
  const up = dict.apply;
>>>>>>> f18247c (增加CART)
  const router = useRouter();

  const [status, setStatus] = useState(initial.status);
  const [reviewNote, setReviewNote] = useState(initial.reviewNote);
  const [editable, setEditable] = useState(initial.editable);
  const [attachments, setAttachments] = useState(initial.attachments);
<<<<<<< HEAD
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
=======
  const [pending, setPending] = useState<File[]>([]);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
>>>>>>> f18247c (增加CART)

  const initialValues: Record<string, string> =
    role === "provider"
      ? {
          orgName: (initial as ProviderProfile).orgName,
          orgType: (initial as ProviderProfile).orgType,
          country: initial.country,
          contactPerson: (initial as ProviderProfile).contactPerson,
          phone: initial.phone,
          email: initial.email,
          cooperation: (initial as ProviderProfile).cooperation,
        }
      : {
          fullName: (initial as DoctorProfile).fullName,
          specialty: (initial as DoctorProfile).specialty,
          hospital: (initial as DoctorProfile).hospital,
          country: initial.country,
          title: (initial as DoctorProfile).title,
          years: (initial as DoctorProfile).years ?? "",
          languages: (initial as DoctorProfile).languages,
          remote: (initial as DoctorProfile).remote,
          email: initial.email,
          phone: initial.phone,
        };
  const [values, setValues] = useState<Record<string, string>>(initialValues);

  const providerFields: FieldDef[] = [
    { name: "orgName", label: f.orgName },
    { name: "orgType", label: f.orgType, type: "select", options: f.orgTypeOptions },
    { name: "country", label: f.country },
    { name: "contactPerson", label: f.contactPerson },
    { name: "phone", label: f.phone },
    { name: "email", label: f.email },
    { name: "cooperation", label: f.cooperation, type: "textarea" },
  ];
  const doctorFields: FieldDef[] = [
    { name: "fullName", label: f.fullName },
    { name: "specialty", label: f.specialty },
    { name: "hospital", label: f.hospital },
    { name: "country", label: f.country },
    { name: "title", label: f.title, type: "select", options: f.titleOptions },
    { name: "years", label: f.years },
    { name: "languages", label: f.languages },
    { name: "remote", label: f.remote, type: "select", options: f.remoteOptions },
    { name: "email", label: f.email },
    { name: "phone", label: f.phone },
  ];
  const fields = role === "provider" ? providerFields : doctorFields;

  const set = (name: string, v: string) => setValues((s) => ({ ...s, [name]: v }));

  const refetch = async () => {
    const res = await fetch(clientApi(`/api/auth/registration/${role}`), {
      credentials: "include",
    });
    if (!res.ok) return null;
    return (await res.json()) as ProviderProfile | DoctorProfile;
  };

  const onSave = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(clientApi(`/api/auth/registration/${role}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        setMsg({ kind: "err", text: p.saveError });
      } else {
        setMsg({ kind: "ok", text: p.saved });
        router.refresh();
      }
    } catch {
      setMsg({ kind: "err", text: p.saveError });
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(clientApi(`/api/auth/registration/${role}/submit`), {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        setMsg({ kind: "err", text: p.submitError });
      } else {
        const data = await res.json();
        setStatus(data.status);
        setEditable(data.editable);
        setReviewNote(data.reviewNote);
        setMsg({ kind: "ok", text: p.submitted });
        router.refresh();
      }
    } catch {
      setMsg({ kind: "err", text: p.submitError });
    } finally {
      setBusy(false);
    }
  };

<<<<<<< HEAD
  const onUpload = async (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setMsg({ kind: "err", text: p.uploadError });
      return;
    }
=======
  const onUpload = async () => {
    if (busy || pending.length === 0) return;
>>>>>>> f18247c (增加CART)
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
<<<<<<< HEAD
      fd.append("licenseFile", file);
=======
      for (const file of pending) fd.append("licenseFile", file);
>>>>>>> f18247c (增加CART)
      const res = await fetch(clientApi(`/api/auth/registration/${role}/license`), {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) {
        setMsg({ kind: "err", text: p.uploadError });
      } else {
        const detail = await refetch();
        if (detail) setAttachments(detail.attachments);
<<<<<<< HEAD
=======
        setPending([]);
>>>>>>> f18247c (增加CART)
        router.refresh();
      }
    } catch {
      setMsg({ kind: "err", text: p.uploadError });
    } finally {
      setBusy(false);
<<<<<<< HEAD
      if (fileRef.current) fileRef.current.value = "";
=======
>>>>>>> f18247c (增加CART)
    }
  };

  const onRemove = async (attId: number) => {
    setBusy(true);
    try {
      const res = await fetch(clientApi(`/api/auth/registration/${role}/license/${attId}`), {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setAttachments((list) => list.filter((a) => a.id !== attId));
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{p.statusLabel}:</span>
            <RegistrationStatusBadge status={status} dict={dict} />
          </div>
          <p className="text-xs text-slate-400">{editable ? p.editHint : p.lockedHint}</p>
        </div>
        {reviewNote && status === "REJECTED" && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {p.reviewNote}: {reviewNote}
          </p>
        )}
      </div>

      <div className="card">
        <div className="grid gap-5 sm:grid-cols-2">
          {fields.map((fd) => (
            <div
              key={fd.name}
              className={fd.type === "textarea" ? "sm:col-span-2" : "sm:col-span-1"}
            >
              <label htmlFor={fd.name} className="field-label">
                {fd.label}
              </label>
              {fd.type === "textarea" ? (
                <textarea
                  id={fd.name}
                  rows={4}
                  className="field-input resize-none"
                  disabled={!editable}
                  value={values[fd.name] ?? ""}
                  onChange={(e) => set(fd.name, e.target.value)}
                />
              ) : fd.type === "select" ? (
                <select
                  id={fd.name}
                  className="field-input"
                  disabled={!editable}
                  value={values[fd.name] ?? ""}
                  onChange={(e) => set(fd.name, e.target.value)}
                >
                  <option value="">—</option>
                  {fd.options?.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={fd.name}
                  className="field-input"
                  disabled={!editable}
                  value={values[fd.name] ?? ""}
                  onChange={(e) => set(fd.name, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-brand-950">{p.licenses}</h2>
        <p className="mt-1 text-xs text-slate-400">{p.licenseHint}</p>
        {attachments.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">{p.noLicenses}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {attachments.map((att) => (
              <li
                key={att.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
              >
                <FileText className="h-4 w-4 shrink-0 text-brand-deep" />
                <a
                  href={clientApi(`/api/auth/registration/attachments/${att.id}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate text-sm text-slate-700 hover:text-brand-deep hover:underline"
                >
                  {att.originalName}
                </a>
                <span className="text-xs text-slate-400">{fmtSize(att.size)}</span>
                {editable && (
                  <button
                    type="button"
                    onClick={() => onRemove(att.id)}
                    disabled={busy}
                    className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-red-500"
                    aria-label="remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {editable && (
          <div className="mt-4">
<<<<<<< HEAD
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-brand-deep hover:text-brand-deep"
            >
              <Upload className="h-4 w-4" />
              {busy ? p.uploading : p.uploadLicense}
            </button>
=======
            <FileDropzone
              files={pending}
              onChange={setPending}
              disabled={busy}
              labels={{
                cta: p.uploadLicense,
                hint: p.licenseHint,
                empty: p.noLicenses,
                remove: up.remove,
                fileTooLarge: up.fileTooLarge,
                fileTypeError: up.fileTypeError,
              }}
            />
            {pending.length > 0 && (
              <button
                type="button"
                onClick={onUpload}
                disabled={busy}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {busy ? p.uploading : p.uploadLicense} ({pending.length})
              </button>
            )}
>>>>>>> f18247c (增加CART)
          </div>
        )}
      </div>

      {msg && (
        <p className={`text-sm ${msg.kind === "ok" ? "text-emerald-600" : "text-red-500"}`}>
          {msg.text}
        </p>
      )}

      {editable && (
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={onSave} disabled={busy} className="btn-secondary">
            <Save className="h-4 w-4" />
            {busy ? p.saving : p.save}
          </button>
          <button type="button" onClick={onSubmit} disabled={busy} className="btn-primary">
            <Send className="h-4 w-4" />
            {busy ? p.submitting : p.submit}
          </button>
        </div>
      )}
    </div>
  );
}
