import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { SummaryPanel } from "@/components/admin/SummaryPanel";
import { StatusPanel } from "@/components/admin/StatusPanel";
import { AssignPanel } from "@/components/admin/AssignPanel";
import { EventTimeline } from "@/components/admin/EventTimeline";
import { AttachmentGallery } from "@/components/AttachmentGallery";
import { FinalReviewPanel } from "@/components/admin/FinalReviewPanel";
import { SupremeEditPanel } from "@/components/admin/SupremeEditPanel";
import { SendEmailPanel } from "@/components/admin/SendEmailPanel";
import {
  CommunicationLogPanel,
  type CommunicationLogItem,
} from "@/components/admin/CommunicationLogPanel";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { serverFetch, CLIENT_API_BASE } from "@/lib/api";

export const dynamic = "force-dynamic";

type AttachmentOut = {
  id: number;
  originalName: string;
  mimeType: string;
  size: number;
  kind: string;
  createdAt: string;
};

type AppEvent = {
  id: number;
  eventType: string;
  actorType: string;
  actorName: string;
  payload: Record<string, unknown> | null;
  note: string | null;
  createdAt: string;
};

type ApplicationDetail = {
  id: number;
  applicationNo: string | null;
  fullName: string;
  email: string;
  phone: string;
  country: string | null;
  needType: string;
  serviceCategory: string | null;
  serviceSlug: string | null;
  serviceName: string | null;
  destination: string | null;
  condition: string | null;
  message: string | null;
  lang: string;
  status: string;
  assignedToType: string | null;
  assignedToId: number | null;
  assignedName: string | null;
  assignedDoctorName: string | null;
  assignedProviderName: string | null;
  acceptedAt: string | null;
  rejectReason: string | null;
  medicalSummary: string | null;
  labResults: string | null;
  currentTreatment: string | null;
  question1: string | null;
  question2: string | null;
  question3: string | null;
  doctorAnswer1: string | null;
  doctorAnswer2: string | null;
  doctorAnswer3: string | null;
  translatedAnswer1: string | null;
  translatedAnswer2: string | null;
  translatedAnswer3: string | null;
  finalBilingualReportUrl: string | null;
  // CAR-T specific fields
  hospital: string | null;
  expertDoctor: string | null;
  arrivalDatetime: string | null;
  flightNumber: string | null;
  consultationDatetime: string | null;
  aiSummary: string | null;
  aiSummaryStatus: string;
  aiSummaryError: string | null;
  createdAt: string;
  attachments: AttachmentOut[];
  events: AppEvent[];
};

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).admin.detailTitle };
}

export default async function AdminDetailPage({
  params,
}: {
  params: { lang: string; id: string };
}) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const a = t.admin;
  const f = t.register.fields;

  const res = await serverFetch(`/api/admin/applications/${params.id}`);
  if (res.status === 401) redirect(`/${lang}/admin/login`);
  if (res.status === 404) notFound();
  if (!res.ok) {
    console.error(`Admin application detail API failed: ${res.status} ${res.statusText}`);
    throw new Error(`Failed to load application details`);
  }
  const app: ApplicationDetail = await res.json();

  const commRes = await serverFetch(
    `/api/admin/applications/${params.id}/communications`,
  );
  const communications: CommunicationLogItem[] = commRes.ok
    ? await commRes.json()
    : [];

  const fmt = (d: string) =>
    new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", {
      dateStyle: "medium", timeStyle: "short",
    }).format(new Date(d));

  const isEnquiry = !!app.serviceSlug;
  const si = t.services.admin;

  const rows: [string, string][] = [
    [f.fullName, app.fullName],
    [f.email, app.email || "—"],
    [f.phone, app.phone],
    [f.country, app.country || "—"],
    [f.serviceCategory, app.serviceCategory || "—"],
    [f.needType, app.needType],
    ...(app.serviceName ? [[si.colService, app.serviceName] as [string, string]] : []),
    [f.destination, app.destination || "—"],
    [a.colTime, fmt(app.createdAt)],
  ];

  return (
    <div className="max-w-3xl">
        <Link href={`/${lang}/admin`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-deep">
          <ArrowLeft className="h-4 w-4" />
          {a.backList}
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-950">{app.fullName}</h1>

        {/* Workflow status */}
        <div className="card mt-8">
          <StatusPanel id={app.id} dict={t} initialStatus={app.status} />
        </div>

        {/* Send custom email to the client */}
        <div className="card mt-6">
          <SendEmailPanel id={app.id} dict={t} />
        </div>

        {/* Assignment */}
        <div className="card mt-6">
          <AssignPanel
            id={app.id}
            dict={t}
            initialType={app.assignedToType}
            initialId={app.assignedToId}
            initialName={app.assignedName}
          />
        </div>

        {/* Final QC (admin) */}
        {!isEnquiry && (
          <div className="card mt-6">
            <FinalReviewPanel
              id={app.id}
              dict={t}
              status={app.status}
              reportUrl={app.finalBilingualReportUrl}
            />
          </div>
        )}

        {/* Supreme edit (admin can do everything) */}
        <SupremeEditPanel app={app} dict={t} lang={lang} />

        {/* Contact info */}
        <div className="card mt-8">
          <h2 className="text-lg font-semibold text-brand-950">{a.contactInfo}</h2>
          <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {rows.map(([k, v]) => (
              <div key={k} className="flex flex-col">
                <dt className="text-xs uppercase tracking-wide text-slate-400">{k}</dt>
                <dd className="mt-0.5 text-sm text-slate-700">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Communication history (email / phone / meeting / other) */}
        <div className="card mt-6">
          <CommunicationLogPanel
            id={app.id}
            dict={t}
            initialLogs={communications}
            lang={lang}
          />
        </div>

        {/* Condition (second-opinion) */}
        {app.condition && (
          <div className="card mt-6">
            <h2 className="text-lg font-semibold text-brand-950">{a.conditionInfo}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{app.condition}</p>
          </div>
        )}

        {/* Message (enquiry) */}
        {app.message && (
          <div className="card mt-6">
            <h2 className="text-lg font-semibold text-brand-950">{si.colMessage}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{app.message}</p>
          </div>
        )}

        {/* Attachments + AI summary — second-opinion only */}
        {!isEnquiry && (
          <>
            <div className="card mt-6">
              <h2 className="text-lg font-semibold text-brand-950">{a.attachments}</h2>
              {app.attachments.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">{a.noAttachments}</p>
              ) : (
                <div className="mt-4 space-y-6">
                  {/* Client uploaded attachments (kind=source) */}
                  {(() => {
                    const clientAttachments = app.attachments.filter(att => att.kind === "source");
                    if (clientAttachments.length === 0) return null;
                    return (
                      <div>
                        <h3 className="mb-3 text-sm font-medium text-slate-700">{a.clientAttachments}</h3>
                        <AttachmentGallery
                          attachments={clientAttachments}
                          urlPrefix={`${CLIENT_API_BASE}/api/admin/attachments`}
                          downloadLabel={a.download}
                        />
                      </div>
                    );
                  })()}

                  {/* Other attachments (final_report, email_attachment, etc.) */}
                  {(() => {
                    const otherAttachments = app.attachments.filter(att => att.kind !== "source");
                    if (otherAttachments.length === 0) return null;
                    return (
                      <div>
                        <h3 className="mb-3 text-sm font-medium text-slate-700">{a.otherAttachments}</h3>
                        <AttachmentGallery
                          attachments={otherAttachments}
                          urlPrefix={`${CLIENT_API_BASE}/api/admin/attachments`}
                          downloadLabel={a.download}
                        />
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="card mt-6">
              <SummaryPanel
                id={app.id}
                dict={t}
                initialSummary={app.aiSummary}
                initialStatus={app.aiSummaryStatus}
                initialError={app.aiSummaryError}
              />
            </div>
          </>
        )}

        {/* Processing products (structured summary, questions, answers, translation) */}
        {!isEnquiry && (
          <div className="card mt-6">
            <h2 className="text-lg font-semibold text-brand-950">{a.processingProducts}</h2>
            <div className="mt-4 space-y-4">
              {([
                ["Patient History", app.medicalSummary],
                ["Lab & Test Results", app.labResults],
                ["Current Treatment", app.currentTreatment],
                ["Question 1", app.question1],
                ["Question 2", app.question2],
                ["Question 3", app.question3],
              ] as const).map(([lbl, val]) =>
                val ? (
                  <div key={lbl}>
                    <label className="field-label">{lbl}</label>
                    <p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{val}</p>
                  </div>
                ) : null,
              )}
              {([
                ["Doctor Answer 1", app.doctorAnswer1],
                ["Doctor Answer 2", app.doctorAnswer2],
                ["Doctor Answer 3", app.doctorAnswer3],
              ] as [string, string | null][]).map(([lbl, val]) =>
                val ? (
                  <div key={lbl}>
                    <label className="field-label">{lbl}</label>
                    <p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{val}</p>
                  </div>
                ) : null,
              )}
              {([
                ["Translated Answer 1", app.translatedAnswer1],
                ["Translated Answer 2", app.translatedAnswer2],
                ["Translated Answer 3", app.translatedAnswer3],
              ] as [string, string | null][]).map(([lbl, val]) =>
                val ? (
                  <div key={lbl}>
                    <label className="field-label">{lbl}</label>
                    <p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{val}</p>
                  </div>
                ) : null,
              )}
              {app.rejectReason && (
                <div>
                  <label className="field-label">{a.rejectReasonLabel}</label>
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{app.rejectReason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Workflow history timeline */}
        <div className="card mt-6">
          <h2 className="text-lg font-semibold text-brand-950">{a.eventTimeline}</h2>
          <EventTimeline events={app.events} dict={t} lang={lang} />
        </div>
    </div>
  );
}
