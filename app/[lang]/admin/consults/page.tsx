import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { ConsultReply } from "@/components/admin/ConsultReply";
import { isLocale, type Locale } from "@/lib/brand";
import { prisma } from "@/lib/db";

// Admin view of mobile 图文 (text/image) consults, with a per-thread reply box.
// Protected by middleware (admin session). Kept self-contained with inline
// bilingual labels rather than the site dictionary.

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Consults · Medicompass Admin" };
}

export default async function AdminConsultsPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const zh = lang === "zh";

  const consults = await prisma.consult.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      user: true,
      messages: { orderBy: { createdAt: "asc" }, include: { attachments: true } },
    },
  });

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat(zh ? "zh-CN" : "en-US", {
      month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).format(d);

  const statusLabel = (s: string) =>
    s === "answered" ? (zh ? "已回复" : "Answered")
    : s === "closed" ? (zh ? "已关闭" : "Closed")
    : (zh ? "待回复" : "Awaiting");

  return (
    <Section className="bg-slate-50">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow border-brand-100 bg-brand-50 text-brand-deep">Medicompass</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-950">
            {zh ? "图文问诊" : "Text Consults"}
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
        <span className="rounded-full bg-brand-gradient px-4 py-2 text-sm font-medium text-white">
          {zh ? "图文问诊" : "Consults"}
        </span>
        <Link href={`/${lang}/admin/adverse-events`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-deep hover:text-brand-deep">
          {zh ? "不良事件" : "Adverse Events"}
        </Link>
      </div>

      {consults.length === 0 ? (
        <div className="card text-center text-slate-500">{zh ? "暂无问诊" : "No consults yet."}</div>
      ) : (
        <div className="space-y-5">
          {consults.map((c) => (
            <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-brand-950">{c.topic}</p>
                  <p className="text-xs text-slate-400">
                    {c.user.name || c.user.email || c.user.id.slice(0, 8)} · {fmt(c.updatedAt)}
                  </p>
                </div>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  c.status === "answered"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                    : "border-amber-200 bg-amber-50 text-amber-600"
                }`}>
                  {statusLabel(c.status)}
                </span>
              </div>

              <div className="space-y-2">
                {c.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      m.sender === "doctor"
                        ? "ml-auto bg-brand-50 text-brand-950"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <p className="mb-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                      {m.sender === "doctor" ? (zh ? "医生" : "Doctor") : (zh ? "用户" : "User")}
                    </p>
                    {m.sender === "doctor" && (m.doctorName || m.doctorTitle || m.doctorDept || m.doctorLicense) && (
                      <p className="mb-1 text-[11px] font-medium text-brand-deep">
                        {[m.doctorName, m.doctorTitle, m.doctorDept].filter(Boolean).join(" · ")}
                        {m.doctorLicense ? (zh ? ` · 证号 ${m.doctorLicense}` : ` · Lic. ${m.doctorLicense}`) : ""}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    {m.attachments.length > 0 && (
                      <p className="mt-1 text-xs text-slate-400">
                        📎 {m.attachments.map((a) => a.originalName).join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <ConsultReply consultId={c.id} lang={lang} />
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
