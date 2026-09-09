import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { serverFetch, type ProviderProfile, type DoctorProfile } from "@/lib/api";
import { RegistrationStatusBadge } from "@/components/RegistrationStatusBadge";
import { ReviewPanel } from "@/components/admin/ReviewPanel";
import { AttachmentGallery } from "@/components/AttachmentGallery";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).adminRegistrations.detailTitle };
}

export default async function AdminRegistrationDetailPage({
  params,
}: {
  params: { lang: string; type: string; id: string };
}) {
  if (!isLocale(params.lang)) notFound();
  if (params.type !== "provider" && params.type !== "doctor") notFound();
  const lang = params.lang as Locale;
  const type = params.type as "provider" | "doctor";
  const t = getDictionary(lang);
  const ar = t.adminRegistrations;
  const f = t.register.fields;

  const res = await serverFetch(`/api/admin/registrations/${type}/${params.id}`);
  if (res.status === 401) redirect(`/${lang}/admin/login`);
  if (!res.ok) notFound();
  const data = (await res.json()) as ProviderProfile | DoctorProfile;

  const rows: { label: string; value: string }[] =
    type === "provider"
      ? [
          { label: f.orgName, value: (data as ProviderProfile).orgName },
          { label: f.orgType, value: (data as ProviderProfile).orgType },
          { label: f.country, value: data.country },
          { label: f.contactPerson, value: (data as ProviderProfile).contactPerson },
          { label: f.phone, value: data.phone },
          { label: f.email, value: data.email },
          { label: f.cooperation, value: (data as ProviderProfile).cooperation },
        ]
      : [
          { label: f.fullName, value: (data as DoctorProfile).fullName },
          { label: f.specialty, value: (data as DoctorProfile).specialty },
          { label: f.hospital, value: (data as DoctorProfile).hospital },
          { label: f.country, value: data.country },
          { label: f.title, value: (data as DoctorProfile).title },
          { label: f.years, value: (data as DoctorProfile).years ?? "—" },
          { label: f.languages, value: (data as DoctorProfile).languages },
          { label: f.remote, value: (data as DoctorProfile).remote },
          { label: f.email, value: data.email },
          { label: f.phone, value: data.phone },
        ];

  const title = type === "provider" ? (data as ProviderProfile).orgName : (data as DoctorProfile).fullName;

  return (
    <div className="max-w-3xl">
        <Link
          href={`/${lang}/admin/registrations?tab=${type === "provider" ? "providers" : "doctors"}`}
          className="text-sm font-medium text-slate-500 hover:text-brand-deep"
        >
          ← {ar.backList}
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-brand-950">{title}</h1>
          <RegistrationStatusBadge status={data.status} dict={t} />
        </div>

        {/* review panel */}
        <div className="card mt-8">
          <ReviewPanel
            type={type}
            id={data.id}
            dict={t}
            initialStatus={data.status}
            initialNote={data.reviewNote}
          />
        </div>

        {/* fields */}
        <div className="card mt-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            {rows.map((r) => (
              <div key={r.label}>
                <dt className="text-xs uppercase tracking-wide text-slate-400">{r.label}</dt>
                <dd className="mt-1 text-sm text-slate-700">{r.value || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* licenses */}
        <div className="card mt-6">
          <h2 className="text-lg font-semibold text-brand-950">{ar.licenses}</h2>
          {data.attachments.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">{ar.noLicenses}</p>
          ) : (
            <AttachmentGallery
              attachments={data.attachments}
              urlPrefix={`/api/admin/registrations/attachments`}
              downloadLabel={ar.download}
            />
          )}
        </div>
    </div>
  );
}
