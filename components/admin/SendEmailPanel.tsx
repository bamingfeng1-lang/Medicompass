"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Send, X } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";
import { clientApi } from "@/lib/api";
import { FileDropzone, IMAGE_PDF_ACCEPT } from "@/components/FileDropzone";

export function SendEmailPanel({ id, dict }: { id: number; dict: Dictionary }) {
  const em = dict.adminEmail ?? ({} as Record<string, string>);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [sentTo, setSentTo] = useState<string[] | null>(null);

  const onSend = async () => {
    if (!subject.trim() || !content.trim()) {
      setMsg({ kind: "err", text: em.required });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const formData = new FormData();
      formData.append("subject", subject.trim());
      formData.append("content", content.trim());
      for (const file of files) {
        formData.append("attachments", file);
      }

      const res = await fetch(clientApi(`/api/admin/applications/${id}/send-email`), {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMsg({
          kind: "err",
          text:
            data?.error === "no_recipients"
              ? em.noRecipients
              : data?.error === "email_disabled"
                ? em.disabled
                : data?.error === "file_too_large"
                  ? `${em.fileTooLarge}${data?.name || ""}`
                  : data?.error === "file_type_not_allowed"
                    ? `${em.fileTypeError}${data?.name || ""}`
                    : em.opError,
        });
        return;
      }
      if (data?.emailStatus === "disabled") {
        setMsg({ kind: "err", text: em.disabled });
      } else if (data?.emailStatus === "failed") {
        setMsg({ kind: "err", text: em.failed });
      } else {
        setMsg({ kind: "ok", text: em.sent });
        setSentTo(Array.isArray(data?.recipients) ? data.recipients : null);
        setSubject("");
        setContent("");
        setFiles([]);
        setOpen(false);
        router.refresh();
      }
    } catch {
      setMsg({ kind: "err", text: em.opError });
    } finally {
      setBusy(false);
    }
  };

  const dropzoneLabels = {
    cta: em.uploadCta || "点击或拖拽上传附件",
    hint: em.uploadHint || "支持 PDF、图片，单个文件不超过 15MB",
    empty: em.uploadEmpty || "尚未选择附件",
    remove: em.remove || "移除",
    fileTooLarge: em.fileTooLarge || "文件过大：",
    fileTypeError: em.fileTypeError || "文件类型不支持：",
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-brand-950">{em.title}</h2>
        {!open && (
          <button
            type="button"
            onClick={() => { setOpen(true); setMsg(null); }}
            className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Mail className="h-4 w-4" /> {em.button}
          </button>
        )}
      </div>

      {sentTo && !open && (
        <p className="mt-3 text-xs text-slate-500">
          {em.sentTo}: {sentTo.join(", ")}
        </p>
      )}

      {open && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="field-label">{em.subject}</label>
            <input
              type="text"
              className="field-input mt-1 w-full"
              placeholder={em.subjectPh}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={255}
            />
          </div>
          <div>
            <label className="field-label">{em.content}</label>
            <textarea
              rows={8}
              className="field-input mt-1 w-full resize-y"
              placeholder={em.contentPh}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label">{em.attachments || "附件（可选）"}</label>
            <FileDropzone
              files={files}
              onChange={setFiles}
              labels={dropzoneLabels}
              accept={IMAGE_PDF_ACCEPT}
              disabled={busy}
            />
          </div>
          <p className="text-xs text-slate-400">{em.hint}</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onSend}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              <Send className="h-4 w-4" /> {busy ? em.sending : em.send}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <X className="h-4 w-4" /> {em.cancel}
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p className={`mt-3 text-sm ${msg.kind === "ok" ? "text-emerald-600" : "text-red-500"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
