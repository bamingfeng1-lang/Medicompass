import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { serverFetch, type RegistrationListItem } from "@/lib/api";
import { RegistrationStatusBadge } from "@/components/RegistrationStatusBadge";

export const dynamic = "force-dynamic";

const STATUSES = ["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED"] as const;

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).adminRegistrations.title };
}

export default async function AdminRegistrationsPage({
  params,
  searchParams,
}: {
  params: { lang: string };
  searchParams?: { tab?: string; status?: string };
}) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const ar = t.adminRegistrations;

  const tab = searchParams?.tab === "doctors" ? "doctors" : "providers";
  const status = searchParams?.status;

  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await serverFetch(`/api/admin/registrations/${tab}${qs}`);
  if (res.status === 401) redirect(`/${lang}/admin/login`);
  const rows: RegistrationListItem[] = res.ok ? await res.json() : [];

  const fmt = (d: string) =>
    new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).format(new Date(d));

  const base = `/${lang}/admin/registrations`;
  const chip = (label: string, href: string, active: boolean) =>
    active ? (
      <span key={label} className="rounded-full bg-brand-gradient px-4 py-2 text-sm font-medium text-white">
        {label}
      </span>
    ) : (
      <Link key={label} href={href}
        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-deep hover:text-brand-deep">
        {label}
      </Link>
    );

  const statusHref = (s?: string) =>
    `${base}?tab=${tab}${s ? `&status=${encodeURIComponent(s)}` : ""}`;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-brand-950">{ar.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{ar.desc}</p>
      </div>

      {/* tab: providers / doctors */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {chip(ar.tabProviders, `${base}?tab=providers`, tab === "providers")}
        {chip(ar.tabDoctors, `${base}?tab=doctors`, tab === "doctors")}
      </div>

      {/* status filter */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-slate-500">{ar.colStatus}:</span>
        {chip(ar.filterAll, statusHref(), !status)}
        {STATUSES.map((s) =>
          chip((t.registrationStatus as Record<string, string>)[s], statusHref(s), status === s),
        )}
      </div>

      {rows.length === 0 ? (
        <div className="card text-center text-slate-500">{ar.empty}</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">{ar.colName}</th>
                  <th className="px-5 py-3 font-medium">{ar.colSubtitle}</th>
                  <th className="px-5 py-3 font-medium">{ar.colCountry}</th>
                  <th className="px-5 py-3 font-medium">{ar.colFiles}</th>
                  <th className="px-5 py-3 font-medium">{ar.colStatus}</th>
                  <th className="px-5 py-3 font-medium">{ar.colTime}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="transition hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-medium text-brand-950">{r.name}</td>
                    <td className="px-5 py-3 text-slate-600">{r.subtitle || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{r.country}</td>
                    <td className="px-5 py-3 text-slate-600">{r.attachmentCount}</td>
                    <td className="px-5 py-3"><RegistrationStatusBadge status={r.status} dict={t} /></td>
                    <td className="px-5 py-3 text-xs text-slate-500">{fmt(r.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`${base}/${tab === "providers" ? "provider" : "doctor"}/${r.id}`}
                        className="font-medium text-brand-deep hover:underline">
                        {ar.view}
                      </Link>
                    </td>
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
