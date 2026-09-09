"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";
import { clientApi } from "@/lib/api";

export function ChangePasswordForm({ dict }: { dict: Dictionary }) {
  const a = dict.account;
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!oldPw || !newPw || !confirmPw) {
      setMsg({ kind: "err", text: a.pwMissing });
      return;
    }
    if (newPw.length < 8) {
      setMsg({ kind: "err", text: a.pwWeak });
      return;
    }
    if (newPw !== confirmPw) {
      setMsg({ kind: "err", text: a.pwMismatch });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(clientApi("/api/auth/change-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      if (!res.ok) {
        let code = "";
        try {
          code = (await res.json())?.error ?? "";
        } catch {
          /* ignore */
        }
        const text =
          code === "old_password_wrong"
            ? a.pwOldWrong
            : code === "weak_password"
              ? a.pwWeak
              : code === "same_password"
                ? a.pwSame
                : a.pwError;
        setMsg({ kind: "err", text });
        setBusy(false);
        return;
      }
      setOldPw("");
      setNewPw("");
      setConfirmPw("");
      setMsg({ kind: "ok", text: a.pwChanged });
    } catch {
      setMsg({ kind: "err", text: a.pwError });
    } finally {
      setBusy(false);
    }
  };

  const fieldCls = "field-input w-full";

  return (
    <div className="max-w-md">
      <p className="mb-2 text-sm text-slate-500">{a.pwHint}</p>
      <form onSubmit={onSubmit} className="card space-y-4" noValidate>
        <div>
          <label className="field-label">{a.pwOld}</label>
          <input type="password" className={fieldCls} value={oldPw}
            onChange={(e) => setOldPw(e.target.value)} autoComplete="current-password" />
        </div>
        <div>
          <label className="field-label">{a.pwNew}</label>
          <input type="password" className={fieldCls} value={newPw}
            onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" />
        </div>
        <div>
          <label className="field-label">{a.pwConfirm}</label>
          <input type="password" className={fieldCls} value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" />
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full">
          <KeyRound className="h-4 w-4" />
          {busy ? a.pwSubmitting : a.pwSubmit}
        </button>
        {msg && (
          <p className={`text-sm ${msg.kind === "ok" ? "text-emerald-600" : "text-red-500"}`}>{msg.text}</p>
        )}
      </form>
    </div>
  );
}
