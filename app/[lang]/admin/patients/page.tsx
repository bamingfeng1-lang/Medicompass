import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { PatientCreate } from "@/components/admin/PatientCreate";
import { isLocale, type Locale } from "@/lib/brand";
import { prisma } from "@/lib/db";

// 医生建档 (场景A): create patient profiles pre-loaded with a plan and hand out
// a one-time invite code. Protected by middleware (admin session cookie).

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return { title: "Patients · Medicompass Admin" };
}

export default async function AdminPatientsPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const zh = lang === "zh";

  const invites = await prisma.patientInvite.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      mobileUser: {
        select: {
          id: true, name: true, email: true, appleUserId: true,
          _count: { select: { medications: true, careTasks: true } },
        },
      },
    },
  });

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat(zh ? "zh-CN" : "en-US", {
      month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).format(d);

  const navPill = "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-deep hover:text-brand-deep";

  return (
    <Section className="bg-slate-50">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow border-brand-100 bg-brand-50 text-brand-deep">Medicompass</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-950">
            {zh ? "患者建档" : "Patients"}
          </h1>
        </div>
        <LogoutButton lang={lang} label={zh ? "退出" : "Log out"} />
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link href={`/${lang}/admin`} className={navPill}>{zh ? "二诊申请" : "Applications"}</Link>
        <Link href={`/${lang}/admin/inquiries`} className={navPill}>{zh ? "服务线索" : "Inquiries"}</Link>
        <Link href={`/${lang}/admin/consults`} className={navPill}>{zh ? "图文问诊" : "Consults"}</Link>
        <Link href={`/${lang}/admin/adverse-events`} className={navPill}>{zh ? "不良事件" : "Adverse Events"}</Link>
        <span className="rounded-full bg-brand-gradient px-4 py-2 text-sm font-medium text-white">{zh ? "患者建档" : "Patients"}</span>
      </div>

      <div className="mb-8">
        <PatientCreate lang={lang} />
      </div>

      <h2 className="mb-3 text-lg font-semibold text-brand-950">{zh ? "近期建档" : "Recent profiles"}</h2>
      {invites.length === 0 ? (
        <div className="card text-center text-slate-500">{zh ? "暂无档案" : "No profiles yet."}</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">{zh ? "姓名" : "Name"}</th>
                <th className="px-5 py-3 font-medium">{zh ? "用药 / 随访" : "Meds / Tasks"}</th>
                <th className="px-5 py-3 font-medium">{zh ? "状态" : "Status"}</th>
                <th className="px-5 py-3 font-medium">{zh ? "创建" : "Created"}</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => {
                const claimed = !!(inv.mobileUser.email || inv.mobileUser.appleUserId) || !!inv.redeemedAt;
                return (
                  <tr key={inv.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3 font-medium text-brand-950">{inv.mobileUser.name || inv.mobileUser.id.slice(0, 8)}</td>
                    <td className="px-5 py-3 text-slate-600">{inv.mobileUser._count.medications} / {inv.mobileUser._count.careTasks}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${claimed ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-amber-200 bg-amber-50 text-amber-600"}`}>
                        {claimed ? (zh ? "已领取" : "Claimed") : (zh ? "待领取" : "Pending")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400">{fmt(inv.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
