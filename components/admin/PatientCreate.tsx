"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 医生建档 form (admin): create a patient profile with a medication plan +
// follow-up tasks, then surface the one-time invite code to hand to the patient.

type Med = { nameZh: string; nameEn: string; dosage: string; timingZh: string; timingEn: string; times: string };
type Task = { kind: string; titleZh: string; titleEn: string; due: string; locationZh: string };

const emptyMed: Med = { nameZh: "", nameEn: "", dosage: "", timingZh: "", timingEn: "", times: "" };
const emptyTask: Task = { kind: "revisit", titleZh: "", titleEn: "", due: "", locationZh: "" };

export function PatientCreate({ lang }: { lang: string }) {
  const router = useRouter();
  const zh = lang !== "en";
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [history, setHistory] = useState("");
  const [meds, setMeds] = useState<Med[]>([{ ...emptyMed }]);
  const [tasks, setTasks] = useState<Task[]>([{ ...emptyTask }]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ code: string; name: string } | null>(null);
  const [error, setError] = useState("");

  const setMed = (i: number, patch: Partial<Med>) =>
    setMeds((xs) => xs.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const setTask = (i: number, patch: Partial<Task>) =>
    setTasks((xs) => xs.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        gender: gender || undefined,
        birthDate: birthDate || undefined,
        medicalHistory: history || undefined,
        medications: meds
          .filter((m) => m.nameZh.trim() || m.nameEn.trim())
          .map((m) => ({
            nameZh: m.nameZh, nameEn: m.nameEn, dosage: m.dosage,
            timingZh: m.timingZh, timingEn: m.timingEn,
            times: m.times.split(",").map((s) => s.trim()).filter(Boolean),
          })),
        careTasks: tasks
          .filter((t) => (t.titleZh.trim() || t.titleEn.trim()) && t.due)
          .map((t) => ({
            kind: t.kind, titleZh: t.titleZh, titleEn: t.titleEn,
            due: new Date(t.due).toISOString(), locationZh: t.locationZh || undefined,
          })),
      };
      const res = await fetch("/api/admin/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "error");
        return;
      }
      setResult({ code: data.code, name: data.patient.name });
      setName(""); setGender(""); setBirthDate(""); setHistory("");
      setMeds([{ ...emptyMed }]); setTasks([{ ...emptyTask }]);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-deep focus:outline-none";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <h2 className="mb-4 text-lg font-semibold text-brand-950">{zh ? "新建患者档案" : "New patient profile"}</h2>

      {result && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="font-medium">{zh ? `已为 ${result.name} 建档` : `Profile created for ${result.name}`}</p>
          <p className="mt-1">{zh ? "邀请码（交给患者，30 天内有效）：" : "Invite code (give to the patient, valid 30 days):"}</p>
          <p className="mt-1 select-all font-mono text-2xl tracking-widest text-emerald-900">{result.code}</p>
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <input className={input} placeholder={zh ? "姓名 *" : "Name *"} value={name} onChange={(e) => setName(e.target.value)} />
        <select className={input} value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">{zh ? "性别（可选）" : "Gender (optional)"}</option>
          <option value="male">{zh ? "男" : "Male"}</option>
          <option value="female">{zh ? "女" : "Female"}</option>
          <option value="other">{zh ? "其他" : "Other"}</option>
        </select>
        <input className={input} type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        <input className={input} placeholder={zh ? "既往病史（可选）" : "Medical history (optional)"} value={history} onChange={(e) => setHistory(e.target.value)} />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">{zh ? "用药提醒" : "Medications"}</h3>
          <button type="button" onClick={() => setMeds((xs) => [...xs, { ...emptyMed }])} className="text-xs font-medium text-brand-deep">+ {zh ? "添加" : "Add"}</button>
        </div>
        <div className="space-y-2">
          {meds.map((m, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-5">
              <input className={input} placeholder={zh ? "药名(中)" : "Name (zh)"} value={m.nameZh} onChange={(e) => setMed(i, { nameZh: e.target.value })} />
              <input className={input} placeholder={zh ? "药名(英)" : "Name (en)"} value={m.nameEn} onChange={(e) => setMed(i, { nameEn: e.target.value })} />
              <input className={input} placeholder={zh ? "剂量 500mg" : "Dose 500mg"} value={m.dosage} onChange={(e) => setMed(i, { dosage: e.target.value })} />
              <input className={input} placeholder={zh ? "服法 餐后" : "Timing"} value={m.timingZh} onChange={(e) => setMed(i, { timingZh: e.target.value, timingEn: e.target.value })} />
              <input className={input} placeholder="08:00,20:00" value={m.times} onChange={(e) => setMed(i, { times: e.target.value })} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">{zh ? "复诊 / 随访" : "Follow-up tasks"}</h3>
          <button type="button" onClick={() => setTasks((xs) => [...xs, { ...emptyTask }])} className="text-xs font-medium text-brand-deep">+ {zh ? "添加" : "Add"}</button>
        </div>
        <div className="space-y-2">
          {tasks.map((t, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-4">
              <select className={input} value={t.kind} onChange={(e) => setTask(i, { kind: e.target.value })}>
                <option value="revisit">{zh ? "复诊" : "Revisit"}</option>
                <option value="recheck">{zh ? "复查" : "Recheck"}</option>
                <option value="followUp">{zh ? "随访" : "Follow-up"}</option>
                <option value="rehab">{zh ? "康复" : "Rehab"}</option>
              </select>
              <input className={input} placeholder={zh ? "标题(中)" : "Title (zh)"} value={t.titleZh} onChange={(e) => setTask(i, { titleZh: e.target.value })} />
              <input className={input} placeholder={zh ? "地点(可选)" : "Location"} value={t.locationZh} onChange={(e) => setTask(i, { locationZh: e.target.value })} />
              <input className={input} type="datetime-local" value={t.due} onChange={(e) => setTask(i, { due: e.target.value })} />
            </div>
          ))}
        </div>
      </div>

      <button onClick={submit} disabled={busy || !name.trim()} className="mt-5 rounded-lg bg-brand-gradient px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
        {busy ? (zh ? "创建中…" : "Creating…") : (zh ? "建档并生成邀请码" : "Create & generate code")}
      </button>
    </div>
  );
}
