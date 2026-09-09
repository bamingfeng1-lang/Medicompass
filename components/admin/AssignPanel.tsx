"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";
import { clientApi } from "@/lib/api";

type AssigneeItem = {
  id: number;
  name: string;
  subtitle: string | null;
  country: string | null;
};

type AssignType = "provider" | "doctor" | "none";

export function AssignPanel({
  id,
  dict,
  initialType,
  initialId,
  initialName,
}: {
  id: number;
  dict: Dictionary;
  initialType: string | null;
  initialId: number | null;
  initialName: string | null;
}) {
  const a = dict.admin;
  const router = useRouter();

  const [type, setType] = useState<AssignType>(
    initialType === "provider" || initialType === "doctor" ? initialType : "none",
  );
  const [options, setOptions] = useState<AssigneeItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">(initialId ?? "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [current, setCurrent] = useState<{ type: string | null; name: string | null }>({
    type: initialType,
    name: initialName,
  });

  // Load the assignee list whenever the chosen type is provider/doctor.
  useEffect(() => {
    if (type === "none") {
      setOptions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const path = type === "provider" ? "/api/admin/providers" : "/api/admin/doctors";
    fetch(clientApi(path), { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: AssigneeItem[]) => {
        if (!cancelled) setOptions(data);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  const onSave = async () => {
    setSaving(true);
    setMsg(null);
    const body =
      type === "none"
        ? { assignedToType: null, assignedToId: null }
        : { assignedToType: type, assignedToId: selectedId === "" ? null : selectedId };
    try {
      const res = await fetch(clientApi(`/api/admin/applications/${id}/assign`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setMsg({ kind: "err", text: a.assignSaveError });
        setSaving(false);
        return;
      }
      const data = await res.json();
      setCurrent({ type: data.assignedToType, name: data.assignedName });
      setMsg({ kind: "ok", text: a.assignSaved });
      router.refresh();
    } catch {
      setMsg({ kind: "err", text: a.assignSaveError });
    } finally {
      setSaving(false);
    }
  };

  const typeLabel = (v: string | null) =>
    v === "provider" ? a.assignProvider : v === "doctor" ? a.assignDoctor : a.assignUnassigned;

  const saveDisabled = saving || (type !== "none" && selectedId === "");

  return (
    <div>
      <h2 className="text-lg font-semibold text-brand-950">{a.assignPanel}</h2>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <span>{a.assignCurrent}:</span>
        <span className="font-medium text-brand-deep">
          {current.type ? `${typeLabel(current.type)} · ${current.name ?? ""}` : a.assignUnassigned}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["provider", "doctor", "none"] as AssignType[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              setType(v);
              setSelectedId("");
              setMsg(null);
            }}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              type === v
                ? "border-brand-deep bg-brand-50 text-brand-deep"
                : "border-slate-200 bg-white text-slate-600 hover:border-brand-deep hover:text-brand-deep"
            }`}
          >
            {v === "provider" ? a.assignProvider : v === "doctor" ? a.assignDoctor : a.assignNone}
          </button>
        ))}
      </div>

      {type !== "none" && (
        <div className="mt-4">
          <label htmlFor="assignee" className="field-label">{a.assignee}</label>
          <select
            id="assignee"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value === "" ? "" : Number(e.target.value))}
            className="field-input max-w-md"
            disabled={loading}
          >
            <option value="">{a.assignPlaceholder}</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
                {o.subtitle ? ` · ${o.subtitle}` : ""}
                {o.country ? ` · ${o.country}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onSave} disabled={saveDisabled} className="btn-primary">
          <UserCheck className="h-4 w-4" />
          {saving ? a.assignSaving : a.assignSave}
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
