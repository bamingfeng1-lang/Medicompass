import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { getCurrentUser, getAssignedApplication, CLIENT_API_BASE } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { AttachmentGallery } from "@/components/AttachmentGallery";
import { ProviderWorkbench } from "@/components/ProviderWorkbench";
import { DoctorWorkbench } from "@/components/DoctorWorkbench";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).task.listTitle };
}

export default async function AssignedApplicationDetailPage({
  params,
}: {
  params: { lang: string; id: string };
}) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const tk = t.task;
  const f = t.register.fields;
  const p = (path: string) => `/${lang}${path}`;

  const user = await getCurrentUser();
  if (!user) redirect(p("/login"));
  if (!user.roles.includes("provider") && !user.roles.includes("doctor")) redirect(p(""));

  const app = await getAssignedApplication(params.id);
  if (!app) notFound();

  const fmt = (d: string) =>
    new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", {
      dateStyle: "medium", timeStyle: "short",
    }).format(new Date(d));

  const isEnquiry = !!app.serviceSlug;

  const rows: [string, string][] = [
    [f.fullName, app.fullName],
    [f.email, app.email || "—"],
    [f.phone, app.phone],
    [f.country, app.country || "—"],
    [f.needType, app.needType],
    ...(app.serviceName ? [[tk.colService, app.serviceName] as [string, string]] : []),
    [f.destination, app.destination || "—"],
    [tk.colTime, fmt(app.createdAt)],
  ];

  return (
    <div className="max-w-3xl">
        <Link
          href={p("/account/assigned")}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-deep"
        >
          <ArrowLeft className="h-4 w-4" />
          {tk.backList}
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-950">{app.needType}</h1>
        <div className="mt-3">
          <StatusBadge status={app.status} dict={t} />
        </div>

        {user.roles.includes("provider") && (
          <div className="mt-6">
            <ProviderWorkbench app={app} dict={t} />
          </div>
        )}
        {user.roles.includes("doctor") && (
          <div className="mt-6">
            <DoctorWorkbench app={app} dict={t} />
          </div>
        )}

        {/* Contact info */}
        <div className="card mt-8">
          <h2 className="text-lg font-semibold text-brand-950">{tk.contactInfo}</h2>
          <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {rows.map(([k, v]) => (
              <div key={k} className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-slate-400">{k}</dt>
                <dd className="mt-0.5 text-sm text-slate-700">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Condition (second-opinion) */}
        {app.condition && (
          <div className="card mt-6">
            <h2 className="text-lg font-semibold text-brand-950">{tk.conditionInfo}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {app.condition}
            </p>
          </div>
        )}

        {/* Message (enquiry) */}
        {app.message && (
          <div className="card mt-6">
            <h2 className="text-lg font-semibold text-brand-950">{tk.message}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {app.message}
            </p>
          </div>
        )}

        {/* Attachments — second-opinion only */}
        {!isEnquiry && (
          <div className="card mt-6">
            <h2 className="text-lg font-semibold text-brand-950">{tk.attachments}</h2>
            {app.attachments.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">{tk.noAttachments}</p>
            ) : (
              <AttachmentGallery
                attachments={app.attachments}
                urlPrefix={`${CLIENT_API_BASE}/api/auth/attachments`}
                downloadLabel={tk.download}
              />
            )}
          </div>
        )}
    </div>
  );
}
