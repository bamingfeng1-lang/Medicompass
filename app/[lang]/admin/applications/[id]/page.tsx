import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Download } from "lucide-react";
import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SummaryPanel } from "@/components/admin/SummaryPanel";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).admin.detailTitle };
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
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

  const app = await prisma.application.findUnique({
    where: { id: params.id },
    include: { attachments: { orderBy: { createdAt: "asc" } } },
  });
  if (!app) notFound();

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", {
      dateStyle: "medium", timeStyle: "short",
    }).format(d);

  const rows: [string, string][] = [
    [f.fullName, app.fullName],
    [f.email, app.email],
    [f.phone, app.phone],
    [f.country, app.country],
    [f.needType, app.needType],
    [f.destination, app.destination || "—"],
    [a.colTime, fmt(app.createdAt)],
  ];

  return (
    <Section className="bg-slate-50">
      <div className="mx-auto max-w-3xl">
        <Link href={`/${lang}/admin`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-deep">
          <ArrowLeft className="h-4 w-4" />
          {a.backList}
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-950">{app.fullName}</h1>

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

        {/* Condition */}
        <div className="card mt-6">
          <h2 className="text-lg font-semibold text-brand-950">{a.conditionInfo}</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{app.condition}</p>
        </div>

        {/* Attachments */}
        <div className="card mt-6">
          <h2 className="text-lg font-semibold text-brand-950">{a.attachments}</h2>
          {app.attachments.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">{a.noAttachments}</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {app.attachments.map((att) => (
                <li key={att.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <FileText className="h-4 w-4 shrink-0 text-brand-deep" />
                  <a href={`/api/admin/attachments/${att.id}`} target="_blank" rel="noopener noreferrer"
                    className="flex-1 truncate text-sm text-slate-700 hover:text-brand-deep hover:underline">
                    {att.originalName}
                  </a>
                  <span className="text-xs text-slate-400">{fmtSize(att.size)}</span>
                  <a href={`/api/admin/attachments/${att.id}?download=1`}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-deep transition hover:bg-brand-50">
                    <Download className="h-3.5 w-3.5" />
                    {a.download}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* AI Summary */}
        <div className="card mt-6">
          <SummaryPanel
            id={app.id}
            dict={t}
            initialSummary={app.aiSummary}
            initialStatus={app.aiSummaryStatus}
            initialError={app.aiSummaryError}
          />
        </div>
      </div>
    </Section>
  );
}
