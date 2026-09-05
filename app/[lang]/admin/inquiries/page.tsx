import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).services.admin.listTitle };
}

export default async function AdminInquiriesPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const a = t.admin;
  const si = t.services.admin;

  const inquiries = await prisma.inquiry.findMany({ orderBy: { createdAt: "desc" } });

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).format(d);

  return (
    <Section className="bg-slate-50">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow border-brand-100 bg-brand-50 text-brand-deep">{a.brand}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-950">{si.listTitle}</h1>
        </div>
        <LogoutButton lang={lang} label={a.logout} />
      </div>

      {/* section switcher */}
      <div className="mb-8 flex gap-2">
        <Link href={`/${lang}/admin`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-deep hover:text-brand-deep">
          {si.navApplications}
        </Link>
        <span className="rounded-full bg-brand-gradient px-4 py-2 text-sm font-medium text-white">
          {si.navInquiries}
        </span>
      </div>

      {inquiries.length === 0 ? (
        <div className="card text-center text-slate-500">{si.listEmpty}</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">{si.colName}</th>
                  <th className="px-5 py-3 font-medium">{si.colPhone}</th>
                  <th className="px-5 py-3 font-medium">{si.colService}</th>
                  <th className="px-5 py-3 font-medium">{si.colMessage}</th>
                  <th className="px-5 py-3 font-medium">{si.colTime}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inquiries.map((q) => (
                  <tr key={q.id} className="align-top transition hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <p className="font-medium text-brand-950">{q.fullName}</p>
                      {q.email && <p className="text-xs text-slate-400">{q.email}</p>}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{q.phone}</td>
                    <td className="px-5 py-3 text-slate-600">{q.serviceName}</td>
                    <td className="max-w-xs px-5 py-3 text-slate-600">{q.message || si.noMessage}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{fmt(q.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Section>
  );
}
