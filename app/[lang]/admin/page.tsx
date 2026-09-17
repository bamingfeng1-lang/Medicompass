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
<<<<<<< HEAD
=======
  applicationNo: string | null;
>>>>>>> f18247c (增加CART)
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
<<<<<<< HEAD
  searchParams?: { needType?: string };
=======
  searchParams?: { serviceCategory?: string; search?: string; status?: string };
>>>>>>> f18247c (增加CART)
}) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const a = t.admin;
  const sb = t.sidebar;
<<<<<<< HEAD
  const needOptions = t.register.fields.needTypeOptions;
  const activeNeed = searchParams?.needType;

  const qs = activeNeed ? `?needType=${encodeURIComponent(activeNeed)}` : "";
=======
  const activeCategory = searchParams?.serviceCategory;
  const activeSearch = searchParams?.search;
  const activeStatus = searchParams?.status;

  const qsParts: string[] = [];
  if (activeCategory) qsParts.push(`serviceCategory=${encodeURIComponent(activeCategory)}`);
  if (activeSearch) qsParts.push(`search=${encodeURIComponent(activeSearch)}`);
  if (activeStatus) qsParts.push(`status=${encodeURIComponent(activeStatus)}`);
  const qs = qsParts.length ? `?${qsParts.join("&")}` : "";
>>>>>>> f18247c (增加CART)
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

<<<<<<< HEAD
      {/* need_type filter */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-slate-500">{a.filterLabel}:</span>
        {chip(a.filterAll, `/${lang}/admin`, !activeNeed)}
        {needOptions.map((o) =>
          chip(o, `/${lang}/admin?needType=${encodeURIComponent(o)}`, activeNeed === o),
        )}
      </div>

=======
      {/* Service category filter */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-slate-500">{lang === "zh" ? "服务类别:" : "Service Category:"}</span>
        {chip(lang === "zh" ? "全部" : "All", `/${lang}/admin`, !activeCategory)}
        {[
          { key: "国际二诊服务", en: "Second Opinion Service", zh: "国际二诊服务" },
          { key: "私人医生", en: "Private Doctor", zh: "私人医生" },
          { key: "基础医疗", en: "Basic Medical", zh: "基础医疗" },
          { key: "跨境国际医疗", en: "Cross-border Medical", zh: "跨境国际医疗" },
          { key: "长寿医学", en: "Longevity Medical", zh: "长寿医学" },
        ].map((cat) =>
          chip(
            lang === "zh" ? cat.zh : cat.en,
            `/${lang}/admin?serviceCategory=${encodeURIComponent(cat.key)}`,
            activeCategory === cat.key,
          ),
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <form action={`/${lang}/admin`} method="get" className="flex items-center gap-3">
          {activeCategory && <input type="hidden" name="serviceCategory" value={activeCategory} />}
          <input
            name="search"
            defaultValue={activeSearch || ""}
            placeholder={lang === "zh" ? "搜索客户名称、申请编号..." : "Search customer name, application no..."}
            className="field-input w-96"
          />
          <button type="submit" className="btn-primary">
            {lang === "zh" ? "搜索" : "Search"}
          </button>
          {(activeSearch || activeCategory) && (
            <Link href={`/${lang}/admin`}
              className="text-sm text-slate-500 hover:text-brand-deep">
              {lang === "zh" ? "清除所有筛选" : "Clear all filters"}
            </Link>
          )}
        </form>
      </div>

>>>>>>> f18247c (增加CART)
      {apps.length === 0 ? (
        <div className="card text-center text-slate-500">{a.listEmpty}</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">{a.colName}</th>
<<<<<<< HEAD
                  <th className="px-5 py-3 font-medium">{a.colNeed}</th>
                  <th className="px-5 py-3 font-medium">{a.colService}</th>
                  <th className="px-5 py-3 font-medium">{a.colCountry}</th>
                  <th className="px-5 py-3 font-medium">{a.colFiles}</th>
=======
                  <th className="px-5 py-3 font-medium">{lang === "zh" ? "申请编号" : "App No."}</th>
                  <th className="px-5 py-3 font-medium">{a.colNeed}</th>
                  <th className="px-5 py-3 font-medium">{a.colCountry}</th>
>>>>>>> f18247c (增加CART)
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
<<<<<<< HEAD
                    <td className="px-5 py-3 text-slate-600">{app.needType}</td>
                    <td className="px-5 py-3 text-slate-600">{app.serviceName || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{app.country || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{app.attachmentCount}</td>
=======
                    <td className="px-5 py-3">
                      <span className="font-mono text-sm text-brand-deep">
                        {app.applicationNo || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{app.needType}</td>
                    <td className="px-5 py-3 text-slate-600">{app.country || "—"}</td>
>>>>>>> f18247c (增加CART)
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
