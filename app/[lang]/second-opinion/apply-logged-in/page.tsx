import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SecondOpinionForm } from "@/components/forms/SecondOpinionForm";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/api";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).apply.title };
}

export default async function ApplyLoggedInPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const a = t.apply;
  const p = (path: string) => `/${lang}${path}`;

  const user = await getCurrentUser();
  if (!user) redirect(p("/login"));

  const profile = await getCurrentUserProfile();

  return (
    <Section className="bg-slate-50">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10">
          <Link
            href={p("/second-opinion")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-deep"
          >
            <ArrowLeft className="h-4 w-4" />
            {a.back}
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">{a.title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
            {profile ? a.loggedInDesc : a.noProfileDesc}
          </p>
        </div>

        {profile ? (
          <SecondOpinionForm
            lang={lang}
            dict={t}
            hideAgree
<<<<<<< HEAD
=======
            isLoggedIn
>>>>>>> f18247c (增加CART)
            initialValues={{
              fullName: profile.fullName,
              email: profile.email,
              phone: profile.phone,
              country: profile.country,
              needType: profile.needType,
              destination: profile.destination ?? "",
              condition: profile.condition,
            }}
          />
        ) : (
          <div className="card text-center">
            <p className="text-slate-600">{a.noProfileDesc}</p>
            <Link href={p("/register/patient")} className="btn-primary mt-6 inline-block">
              {t.nav.registerPatient}
            </Link>
          </div>
        )}
      </div>
    </Section>
  );
}
