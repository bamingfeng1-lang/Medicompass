import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ProfileEditForm } from "@/components/forms/ProfileEditForm";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { getCurrentUser, getMyProviderProfile, getMyDoctorProfile } from "@/lib/api";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).nav.myProfile };
}

export default async function MyProfilePage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const pf = t.profile;
  const p = (path: string) => `/${lang}${path}`;

  const user = await getCurrentUser();
  if (!user) redirect(p("/login"));

  const isProvider = user.roles.includes("provider");
  const isDoctor = user.roles.includes("doctor");

  const provider = isProvider ? await getMyProviderProfile() : null;
  const doctor = !provider && isDoctor ? await getMyDoctorProfile() : null;

  const role: "provider" | "doctor" | null = provider ? "provider" : doctor ? "doctor" : null;
  const initial = provider ?? doctor;
  const title = role === "provider" ? pf.providerTitle : pf.doctorTitle;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <p className="eyebrow border-brand-100 bg-brand-50 text-brand-deep">{t.nav.myProfile}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-950">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{pf.desc}</p>
      </div>

      {role && initial ? (
        <ProfileEditForm role={role} dict={t} initial={initial} />
      ) : (
        <div className="card text-center text-slate-500">{pf.notFound}</div>
      )}
    </div>
  );
}
