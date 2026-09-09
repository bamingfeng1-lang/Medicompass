import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { serverFetch } from "@/lib/api";

export const dynamic = "force-dynamic";

type InquiryListItem = {
  id: number;
  serviceSlug: string;
  serviceName: string;
  fullName: string;
  phone: string;
  email: string | null;
  message: string | null;
  lang: string;
  status: string;
  createdAt: string;
};

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).services.admin.listTitle };
}

export default async function AdminInquiriesPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const si = t.services.admin;

  const res = await serverFetch("/api/admin/inquiries");
  if (res.status === 401) redirect(`/${lang}/admin/login`);
  const inquiries: InquiryListItem[] = res.ok ? await res.json() : [];

  const fmt = (d: string) =>
    new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).format(new Date(d));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-brand-950">{si.listTitle}</h1>
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
    </div>
  );
}
