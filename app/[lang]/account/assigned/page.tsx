import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { getCurrentUser, getAssignedApplications } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).task.listTitle };
}

export default async function AssignedApplicationsPage({
  params,
}: {
  params: { lang: string };
}) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const tk = t.task;
  const p = (path: string) => `/${lang}${path}`;

  const user = await getCurrentUser();
  if (!user) redirect(p("/login"));
  if (!user.roles.includes("provider") && !user.roles.includes("doctor")) redirect(p(""));

  const apps = await getAssignedApplications();

  const fmt = (d: string) =>
    new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).format(new Date(d));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-brand-950">{tk.listTitle}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{tk.listDesc}</p>
      </div>

      {apps.length === 0 ? (
        <div className="card text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-500">{tk.listEmpty}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">{tk.colNeed}</th>
                  <th className="px-5 py-3 font-medium">{tk.colService}</th>
                  <th className="px-5 py-3 font-medium">{tk.colCustomer}</th>
                  <th className="px-5 py-3 font-medium">{tk.colCountry}</th>
                  <th className="px-5 py-3 font-medium">{tk.colStatus}</th>
                  <th className="px-5 py-3 font-medium">{tk.colTime}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apps.map((app) => (
                  <tr key={app.id} className="transition hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-medium text-brand-950">{app.needType}</td>
                    <td className="px-5 py-3 text-slate-600">{app.serviceName || app.message || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{app.fullName}</td>
                    <td className="px-5 py-3 text-slate-600">{app.country || "—"}</td>
                    <td className="px-5 py-3"><StatusBadge status={app.status} dict={t} /></td>
                    <td className="px-5 py-3 text-xs text-slate-500">{fmt(app.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={p(`/account/assigned/${app.id}`)}
                        className="font-medium text-brand-deep hover:underline"
                      >
                        {tk.view}
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
