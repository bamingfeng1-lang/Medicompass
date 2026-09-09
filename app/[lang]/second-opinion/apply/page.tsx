import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SecondOpinionForm } from "@/components/forms/SecondOpinionForm";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { getCurrentUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).apply.title };
}

export default async function ApplyPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const a = t.apply;
  const user = await getCurrentUser();

  return (
    <Section className="bg-slate-50">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10">
          <Link
            href={`/${lang}/second-opinion`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-deep"
          >
            <ArrowLeft className="h-4 w-4" />
            {a.back}
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">{a.title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">{a.desc}</p>
        </div>
        <SecondOpinionForm lang={lang} dict={t} isLoggedIn={!!user} />
      </div>
    </Section>
  );
}
