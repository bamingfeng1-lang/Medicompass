import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { ServiceInquiryForm } from "@/components/forms/ServiceInquiryForm";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/api";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).services.enquire.title };
}

export default async function ServiceEnquirePage({
  params,
  searchParams,
}: {
  params: { lang: string };
  searchParams?: { need?: string };
}) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const k = t.services;
  const p = (path: string) => `/${lang}${path}`;

  const needOptions = t.register.fields.needTypeOptions;
  const need = searchParams?.need ? decodeURIComponent(searchParams.need) : undefined;
  const defaultNeedType = need && needOptions.includes(need) ? need : undefined;

  const user = await getCurrentUser();
  const profile = user ? await getCurrentUserProfile() : null;
  const initialValues =
    profile ? { fullName: profile.fullName, phone: profile.phone, email: profile.email } : undefined;

  return (
    <Section className="bg-slate-50">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10">
          <Link
            href={p("/")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-deep"
          >
            <ArrowLeft className="h-4 w-4" />
            {k.enquire.back}
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">
            {k.enquire.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">{k.enquire.desc}</p>
        </div>
        <ServiceInquiryForm
          lang={lang}
          dict={t}
          serviceSlug="appointment"
          showNeedType
          defaultNeedType={defaultNeedType}
          initialValues={initialValues}
          hideAgree={!!user}
          isLoggedIn={!!user}
        />
      </div>
    </Section>
  );
}
