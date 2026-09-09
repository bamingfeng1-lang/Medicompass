"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";
import { clientApi } from "@/lib/api";
import { RegistrationStatusBadge } from "@/components/RegistrationStatusBadge";

export function ReviewPanel({
  type,
  id,
  dict,
  initialStatus,
  initialNote,
}: {
  type: "provider" | "doctor";
  id: number;
  dict: Dictionary;
  initialStatus: string;
  initialNote: string | null;
}) {
  const ar = dict.adminRegistrations;
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState(initialNote ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const pending = status === "PENDING_REVIEW";

  const review = async (action: "approve" | "reject") => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(clientApi(`/api/admin/registrations/${type}/${id}/review`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, note }),
      });
      if (!res.ok) {
        setMsg({ kind: "err", text: ar.reviewError });
      } else {
        const data = await res.json();
        setStatus(data.status);
        setNote(data.reviewNote ?? "");
        setMsg({ kind: "ok", text: ar.reviewed });
        router.refresh();
      }
    } catch {
      setMsg({ kind: "err", text: ar.reviewError });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-brand-950">{ar.reviewPanel}</h2>
        <RegistrationStatusBadge status={status} dict={dict} />
      </div>

      {status === "REJECTED" && note && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {ar.reviewNote}: {note}
        </p>
      )}

      {pending ? (
        <>
          <textarea
            rows={3}
            className="field-input mt-4 resize-none"
            placeholder={ar.reviewNotePlaceholder}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => review("approve")} disabled={busy} className="btn-primary">
              <Check className="h-4 w-4" />
              {busy ? ar.reviewing : ar.approve}
            </button>
            <button
              type="button"
              onClick={() => review("reject")}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50"
            >
              <X className="h-4 w-4" />
              {busy ? ar.reviewing : ar.reject}
            </button>
            {msg && (
              <span className={`text-sm ${msg.kind === "ok" ? "text-emerald-600" : "text-red-500"}`}>
                {msg.text}
              </span>
            )}
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-slate-400">{ar.onlyPending}</p>
      )}
    </div>
  );
}
