import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FileText, Download } from "lucide-react";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { getCurrentUser, getMyApplication, CLIENT_API_BASE } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { AttachmentGallery } from "@/components/AttachmentGallery";
import { SupplementForm } from "@/components/SupplementForm";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).account.listTitle };
}

export default async function MyApplicationDetailPage({
  params,
}: {
  params: { lang: string; id: string };
}) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const ac = t.account;
  const f = t.register.fields;
  const p = (path: string) => `/${lang}${path}`;

  const user = await getCurrentUser();
  if (!user) redirect(p("/login"));

  const app = await getMyApplication(params.id);
  if (!app) notFound();

  const fmt = (d: string) =>
    new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", {
      dateStyle: "medium", timeStyle: "short",
    }).format(new Date(d));

  const isEnquiry = !!app.serviceSlug;

  const rows: [string, string][] = [
    [lang === "zh" ? "申请编号" : "Application No.", app.applicationNo || "—"],
    [f.fullName, app.fullName],
    [f.email, app.email || "—"],
    [f.phone, app.phone],
    [f.country, app.country || "—"],
    [f.needType, app.needType],
    ...(app.serviceName ? [[ac.colService, app.serviceName] as [string, string]] : []),
    [f.destination, app.destination || "—"],
    [ac.colTime, fmt(app.createdAt)],
  ];

  return (
    <div className="max-w-3xl">
        <Link href={p("/account/applications")}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-deep">
          <ArrowLeft className="h-4 w-4" />
          {ac.backList}
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-950">{app.applicationNo || app.needType}</h1>
        <div className="mt-3">
          <StatusBadge status={app.status} dict={t} />
        </div>

        {/* Supplement form — only while awaiting supplement */}
        {!isEnquiry && app.status === "PENDING_SUPPLEMENT" && (
          <SupplementForm app={app} dict={t} />
        )}

        {/* Application info */}
        <div className="card mt-8">
          <h2 className="text-lg font-semibold text-brand-950">{ac.applicationInfo}</h2>
          <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {rows.map(([k, v]) => (
              <div key={k} className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-slate-400">{k}</dt>
                <dd className="mt-0.5 text-sm text-slate-700">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* CAR-T specific info */}
        {(app.hospital || app.expertDoctor || app.arrivalDatetime || app.flightNumber || app.consultationDatetime) && (
          <div className="card mt-6">
            <h2 className="text-lg font-semibold text-brand-950">{lang === "zh" ? "CAR-T 治疗信息" : "CAR-T Treatment Info"}</h2>
            <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {app.hospital && (
                <div className="flex flex-col">
                  <dt className="text-xs uppercase tracking-wide text-slate-400">{lang === "zh" ? "医院" : "Hospital"}</dt>
                  <dd className="mt-0.5 text-sm text-slate-700">{app.hospital}</dd>
                </div>
              )}
              {app.expertDoctor && (
                <div className="flex flex-col">
                  <dt className="text-xs uppercase tracking-wide text-slate-400">{lang === "zh" ? "专家医生" : "Expert Doctor"}</dt>
                  <dd className="mt-0.5 text-sm text-slate-700">{app.expertDoctor}</dd>
                </div>
              )}
              {app.arrivalDatetime && (
                <div className="flex flex-col">
                  <dt className="text-xs uppercase tracking-wide text-slate-400">{lang === "zh" ? "来华日期时间" : "Arrival Date/Time"}</dt>
                  <dd className="mt-0.5 text-sm text-slate-700">{fmt(app.arrivalDatetime)}</dd>
                </div>
              )}
              {app.flightNumber && (
                <div className="flex flex-col">
                  <dt className="text-xs uppercase tracking-wide text-slate-400">{lang === "zh" ? "航班号" : "Flight Number"}</dt>
                  <dd className="mt-0.5 text-sm text-slate-700">{app.flightNumber}</dd>
                </div>
              )}
              {app.consultationDatetime && (
                <div className="flex flex-col">
                  <dt className="text-xs uppercase tracking-wide text-slate-400">{lang === "zh" ? "看诊日期时间" : "Consultation Date/Time"}</dt>
                  <dd className="mt-0.5 text-sm text-slate-700">{fmt(app.consultationDatetime)}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Condition (second-opinion) */}
        {app.condition && (
          <div className="card mt-6">
            <h2 className="text-lg font-semibold text-brand-950">{ac.conditionInfo}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{app.condition}</p>
          </div>
        )}

        {/* Message (enquiry) */}
        {app.message && (
          <div className="card mt-6">
            <h2 className="text-lg font-semibold text-brand-950">{ac.message}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{app.message}</p>
          </div>
        )}

        {/* Attachments — second-opinion only (client uploaded) */}
        {!isEnquiry && (
          <div className="card mt-6">
            <h2 className="text-lg font-semibold text-brand-950">{ac.attachments}</h2>
            {(() => {
              const clientAttachments = app.attachments.filter(att => att.kind === "source");
              if (clientAttachments.length === 0) {
                return <p className="mt-3 text-sm text-slate-400">{ac.noAttachments}</p>;
              }
              return (
                <AttachmentGallery
                  attachments={clientAttachments}
                  urlPrefix={`${CLIENT_API_BASE}/api/auth/attachments`}
                  downloadLabel={ac.download}
                />
              );
            })()}
          </div>
        )}

        {/* Other attachments (email attachments, final reports, etc.) */}
        {!isEnquiry && (() => {
          const otherAttachments = app.attachments.filter(att => att.kind !== "source");
          if (otherAttachments.length === 0) return null;
          return (
            <div className="card mt-6">
              <h2 className="text-lg font-semibold text-brand-950">{ac.otherAttachments}</h2>
              <AttachmentGallery
                attachments={otherAttachments}
                urlPrefix={`${CLIENT_API_BASE}/api/auth/attachments`}
                downloadLabel={ac.download}
              />
            </div>
          );
        })()}

        {/* Final report — only after delivered */}
        {!isEnquiry && app.status === "COMPLETED" && app.finalBilingualReportUrl && (
          <div className="card mt-6">
            <h2 className="text-lg font-semibold text-brand-950">{ac.finalReport}</h2>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <FileText className="h-4 w-4 shrink-0 text-brand-deep" />
              <a href={`${CLIENT_API_BASE}/api/auth/applications/${app.id}/final-report`} target="_blank" rel="noopener noreferrer"
                className="flex-1 truncate text-sm text-slate-700 hover:text-brand-deep hover:underline">
                {ac.finalReportFile}
              </a>
              <a href={`${CLIENT_API_BASE}/api/auth/applications/${app.id}/final-report?download=1`}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-deep transition hover:bg-brand-50">
                <Download className="h-3.5 w-3.5" />
                {ac.download}
              </a>
            </div>
          </div>
        )}
    </div>
  );
}
