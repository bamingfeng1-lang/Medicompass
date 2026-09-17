"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Users, MessageCircle, Mail, Plus, X } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";
import { clientApi } from "@/lib/api";

export type CommunicationLogItem = {
  id: number;
  applicationId: number;
  channel: string;
  direction: string;
  subject: string | null;
  content: string | null;
  recipients: string | null;
  emailStatus: string | null;
  actorName: string;
  createdAt: string;
};

const CHANNELS = ["email", "phone", "meeting", "other"] as const;

export function CommunicationLogPanel({
  id,
  dict,
  initialLogs,
  lang,
}: {
  id: number;
  dict: Dictionary;
  initialLogs: CommunicationLogItem[];
  lang: string;
}) {
  const cm = dict.adminComm ?? ({} as Record<string, string>);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<string>("phone");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const fmt = (d: string) =>
    new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(d));

  const channelLabel = (ch: string) =>
    (cm as Record<string, string>)[`channel_${ch}`] ?? ch;
  const statusLabel = (st: string) =>
    (cm as Record<string, string>)[`status_${st}`] ?? st;

  const channelIcon = (ch: string) => {
    const cls = "h-4 w-4";
    if (ch === "email") return <Mail className={cls} />;
    if (ch === "phone") return <Phone className={cls} />;
    if (ch === "meeting") return <Users className={cls} />;
    return <MessageCircle className={cls} />;
  };

  const onSave = async () => {
    if (!subject.trim() && !content.trim()) {
      setMsg({ kind: "err", text: cm.required });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(clientApi(`/api/admin/applications/${id}/communications`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          channel,
          subject: subject.trim() || undefined,
          content: content.trim() || undefined,
        }),
      });
      if (!res.ok) {
        setMsg({ kind: "err", text: cm.opError });
        return;
      }
      setMsg({ kind: "ok", text: cm.saved });
      setSubject("");
      setContent("");
      setOpen(false);
      router.refresh();
    } catch {
      setMsg({ kind: "err", text: cm.opError });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-brand-950">{cm.title}</h2>
        {!open && (
          <button
            type="button"
            onClick={() => { setOpen(true); setMsg(null); }}
            className="inline-flex items-center gap-2 rounded-full border border-brand-deep bg-white px-5 py-2.5 text-sm font-medium text-brand-deep transition hover:bg-brand-50"
          >
            <Plus className="h-4 w-4" /> {cm.button}
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <label className="field-label">{cm.channel}</label>
            <select
              className="field-input mt-1 w-full"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              {CHANNELS.map((ch) => (
                <option key={ch} value={ch}>{channelLabel(ch)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">{cm.subject}</label>
            <input
              type="text"
              className="field-input mt-1 w-full"
              placeholder={cm.subjectPh}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={255}
            />
          </div>
          <div>
            <label className="field-label">{cm.content}</label>
            <textarea
              rows={4}
              className="field-input mt-1 w-full resize-y"
              placeholder={cm.contentPh}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onSave}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy ? cm.saving : cm.save}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <X className="h-4 w-4" /> {cm.cancel}
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p className={`mt-3 text-sm ${msg.kind === "ok" ? "text-emerald-600" : "text-red-500"}`}>
          {msg.text}
        </p>
      )}

      {initialLogs.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">{cm.empty}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {initialLogs.map((log) => (
            <li key={log.id} className="flex gap-3 border-b border-slate-100 pb-4 last:border-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-deep">
                {channelIcon(log.channel)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {channelLabel(log.channel)}
                  </span>
                  {log.subject && (
                    <span className="text-sm font-medium text-brand-950">{log.subject}</span>
                  )}
                  {log.emailStatus && (
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                        log.emailStatus === "sent"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                          : log.emailStatus === "disabled"
                            ? "border-amber-200 bg-amber-50 text-amber-600"
                            : "border-red-200 bg-red-50 text-red-600"
                      }`}
                    >
                      {statusLabel(log.emailStatus)}
                    </span>
                  )}
                </div>
                {log.content && (
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {log.content}
                  </p>
                )}
                {log.recipients && (
                  <p className="mt-1 text-xs text-slate-500">
                    {cm.recipients}: {log.recipients}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  {log.actorName} · {fmt(log.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
