import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { serverFetch } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

type ApplicationListItem = {
  id: number;
  fullName: string;
  email: string;
  needType: string;
  serviceName: string | null;
  country: string | null;
  message: string | null;
  attachmentCount: number;
  aiSummaryStatus: string;
  status: string;
  createdAt: string;
};

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).admin.listTitle };
}

function AiBadge({ status, dict }: { status: string; dict: ReturnType<typeof getDictionary> }) {
  const a = dict.admin;
  const map: Record<string, { label: string; cls: string }> = {
    done: { label: a.aiDone, cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    pending: { label: a.aiPending, cls: "bg-amber-50 text-amber-600 border-amber-200" },
    failed: { label: a.aiFailed, cls: "bg-red-50 text-red-600 border-red-200" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

export default async function AdminListPage({
  params,
  searchParams,
}: {
  params: { lang: string };
  searchParams?: { needType?: string };
}) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const a = t.admin;
  const sb = t.sidebar;
  const needOptions = t.register.fields.needTypeOptions;
  const activeNeed = searchParams?.needType;

  const qs = activeNeed ? `?needType=${encodeURIComponent(activeNeed)}` : "";
  const res = await serverFetch(`/api/admin/applications${qs}`);
  if (res.status === 401) redirect(`/${lang}/admin/login`);
  const apps: ApplicationListItem[] = res.ok ? await res.json() : [];

  const fmt = (d: string) =>
    new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).format(new Date(d));

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-brand-950">{sb.adminApplications}</h1>
      </div>

      {/* need_type filter */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-slate-500">{a.filterLabel}:</span>
        {chip(a.filterAll, `/${lang}/admin`, !activeNeed)}
        {needOptions.map((o) =>
          chip(o, `/${lang}/admin?needType=${encodeURIComponent(o)}`, activeNeed === o),
        )}
      </div>

      {apps.length === 0 ? (
        <div className="card text-center text-slate-500">{a.listEmpty}</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">{a.colName}</th>
                  <th className="px-5 py-3 font-medium">{a.colNeed}</th>
                  <th className="px-5 py-3 font-medium">{a.colService}</th>
                  <th className="px-5 py-3 font-medium">{a.colCountry}</th>
                  <th className="px-5 py-3 font-medium">{a.colFiles}</th>
                  <th className="px-5 py-3 font-medium">{a.colAi}</th>
                  <th className="px-5 py-3 font-medium">{a.colStatus}</th>
                  <th className="px-5 py-3 font-medium">{a.colTime}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apps.map((app) => (
                  <tr key={app.id} className="transition hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <p className="font-medium text-brand-950">{app.fullName}</p>
                      <p className="text-xs text-slate-400">{app.email}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{app.needType}</td>
                    <td className="px-5 py-3 text-slate-600">{app.serviceName || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{app.country || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{app.attachmentCount}</td>
                    <td className="px-5 py-3"><AiBadge status={app.aiSummaryStatus} dict={t} /></td>
                    <td className="px-5 py-3"><StatusBadge status={app.status} dict={t} /></td>
                    <td className="px-5 py-3 text-xs text-slate-500">{fmt(app.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/${lang}/admin/applications/${app.id}`}
                        className="font-medium text-brand-deep hover:underline">
                        {a.view}
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
