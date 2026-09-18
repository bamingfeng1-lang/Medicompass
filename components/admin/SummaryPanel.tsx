"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";
import { clientApi } from "@/lib/api";

type Props = {
  id: number | string;
  dict: Dictionary;
  initialSummary: string | null;
  initialStatus: string;
  initialError: string | null;
};

export function SummaryPanel({ id, dict, initialSummary, initialStatus, initialError }: Props) {
  const a = dict.admin;
  const router = useRouter();
  const [summary, setSummary] = useState(initialSummary);
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState(initialError);
  const [running, setRunning] = useState(false);

  const generate = async () => {
    setRunning(true);
    try {
      const res = await fetch(clientApi(`/api/admin/applications/${id}/summarize`), {
        method: "POST",
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Failed to start AI summarization");
      }
      
      const data = await res.json();
      setStatus(data.aiSummaryStatus ?? "pending");
      
      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const detailRes = await fetch(clientApi(`/api/admin/applications/${id}`), {
            credentials: "include",
          });
          if (detailRes.ok) {
            const detail = await detailRes.json();
            const newStatus = detail.aiSummaryStatus;
            
            if (newStatus === "done" || newStatus === "failed") {
              clearInterval(pollInterval);
              setSummary(detail.aiSummary ?? null);
              setStatus(newStatus);
              setError(detail.aiSummaryError ?? null);
              setRunning(false);
              router.refresh();
            }
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 3000); // Poll every 3 seconds
      
      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (running) {
          setRunning(false);
          setStatus("failed");
          setError("AI 总结超时，请稍后重试");
        }
      }, 300000);
      
    } catch {
      setStatus("failed");
      setError(a.aiFailed);
      setRunning(false);
    }
  };

  const hasSummary = status === "done" && summary;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-brand-950">
          <Sparkles className="h-5 w-5 text-brand-deep" />
          {a.aiSummary}
        </h2>
        <button onClick={generate} disabled={running} className="btn-primary px-4 py-2 text-sm">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {hasSummary ? a.regenerate : a.generate}
        </button>
      </div>

      <div className="mt-4">
        {running || status === "pending" ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {a.generating}
          </p>
        ) : hasSummary ? (
          <div className="whitespace-pre-wrap rounded-2xl border border-brand-100 bg-brand-50/50 p-5 text-sm leading-relaxed text-slate-700">
            {summary}
          </div>
        ) : status === "failed" ? (
          <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error || a.aiFailed}</span>
          </div>
        ) : (
          <p className="text-sm text-slate-400">{a.aiEmpty}</p>
        )}
      </div>
    </div>
  );
}
