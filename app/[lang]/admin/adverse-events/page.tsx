import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { isLocale, type Locale } from "@/lib/brand";
import { prisma } from "@/lib/db";

// Admin triage view of patient-submitted safety reports (不良事件上报 /
// pharmacovigilance + AI-safety). Read-only in v1 — status changes are a follow-up.
// Protected by middleware (admin session). `description` arrives already decrypted
// via the Prisma field-encryption extension. Inline bilingual labels.

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Adverse Events · Medicompass Admin" };
}

export default async function AdminAdverseEventsPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const zh = lang === "zh";

  const reports = await prisma.adverseEventReport.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat(zh ? "zh-CN" : "en-US", {
      month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).format(d);

  const kindLabel = (k: string) =>
    k === "ai-error" ? (zh ? "AI 回答问题" : "AI answer")
    : k === "drug-reaction" ? (zh ? "药物反应" : "Drug reaction")
    : (zh ? "不良事件" : "Adverse event");

  const severityLabel = (s: string) =>
    s === "severe" ? (zh ? "严重" : "Severe")
    : s === "moderate" ? (zh ? "中度" : "Moderate")
    : s === "mild" ? (zh ? "轻度" : "Mild")
    : (zh ? "未知" : "Unknown");

  const statusLabel = (s: string) =>
    s === "reviewed" ? (zh ? "已查看" : "Reviewed")
    : s === "closed" ? (zh ? "已关闭" : "Closed")
    : (zh ? "待处理" : "New");

  return (
    <Section className="bg-slate-50">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow border-brand-100 bg-brand-50 text-brand-deep">Medicompass</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-950">
            {zh ? "不良事件上报" : "Adverse Events"}
          </h1>
        </div>
        <LogoutButton lang={lang} label={zh ? "退出" : "Log out"} />
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link href={`/${lang}/admin`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-deep hover:text-brand-deep">
          {zh ? "二诊申请" : "Applications"}
        </Link>
        <Link href={`/${lang}/admin/inquiries`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-deep hover:text-brand-deep">
          {zh ? "服务线索" : "Inquiries"}
        </Link>
        <Link href={`/${lang}/admin/consults`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-deep hover:text-brand-deep">
          {zh ? "图文问诊" : "Consults"}
        </Link>
        <span className="rounded-full bg-brand-gradient px-4 py-2 text-sm font-medium text-white">
          {zh ? "不良事件" : "Adverse Events"}
        </span>
      </div>

      {reports.length === 0 ? (
        <div className="card text-center text-slate-500">{zh ? "暂无上报" : "No reports yet."}</div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-brand-950">
                    {kindLabel(r.kind)}
                    {r.relatedMedication ? ` · ${r.relatedMedication}` : ""}
                  </p>
                  <p className="text-xs text-slate-400">
                    {r.user.name || r.user.email || r.user.id.slice(0, 8)} · {fmt(r.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    r.severity === "severe"
                      ? "border-rose-200 bg-rose-50 text-rose-600"
                      : r.severity === "moderate"
                      ? "border-amber-200 bg-amber-50 text-amber-600"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}>
                    {severityLabel(r.severity)}
                  </span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    r.status === "reviewed"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                      : r.status === "closed"
                      ? "border-slate-200 bg-slate-100 text-slate-500"
                      : "border-brand-100 bg-brand-50 text-brand-deep"
                  }`}>
                    {statusLabel(r.status)}
                  </span>
                </div>
              </div>

              <p className="whitespace-pre-wrap text-sm text-slate-700">{r.description}</p>

              {r.relatedTurnId && (
                <p className="mt-2 text-xs text-slate-400">
                  {zh ? "关联 AI 回答 · " : "Linked AI turn · "}{r.relatedTurnId}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
