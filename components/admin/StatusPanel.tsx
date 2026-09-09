"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";
import { clientApi } from "@/lib/api";
import { APPLICATION_STATUSES, StatusBadge } from "@/components/StatusBadge";

export function StatusPanel({
  id,
  dict,
  initialStatus,
}: {
  id: number;
  dict: Dictionary;
  initialStatus: string;
}) {
  const a = dict.admin;
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [selected, setSelected] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const onSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(clientApi(`/api/admin/applications/${id}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: selected }),
      });
      if (!res.ok) {
        setMsg({ kind: "err", text: a.statusSaveError });
        setSaving(false);
        return;
      }
      const data = await res.json();
      setStatus(data.status);
      setSelected(data.status);
      setMsg({ kind: "ok", text: a.statusSaved });
      router.refresh();
    } catch {
      setMsg({ kind: "err", text: a.statusSaveError });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-brand-950">{a.statusPanelTitle}</h2>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-500">{a.statusCurrent}:</span>
        <StatusBadge status={status} dict={dict} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="field-input max-w-xs"
        >
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {(dict.applicationStatus as Record<string, string>)[s] ?? s}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || selected === status}
          className="btn-primary"
        >
          <Save className="h-4 w-4" />
          {saving ? a.statusSaving : a.statusSave}
        </button>
        {msg && (
          <span className={`text-sm ${msg.kind === "ok" ? "text-emerald-600" : "text-red-500"}`}>
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
