import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, Users } from "lucide-react";
import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/Reveal";
import { ServiceIcon } from "@/components/services/ServiceIcon";
import { ServiceInquiryForm } from "@/components/forms/ServiceInquiryForm";
import { isLocale, LOCALES, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { SERVICES, SERVICE_CATEGORIES, getService } from "@/lib/services/catalog";

export function generateStaticParams() {
  const params: { lang: string; slug: string }[] = [];
  for (const lang of LOCALES) {
    for (const svc of SERVICES) {
      if (!svc.external) params.push({ lang, slug: svc.slug });
    }
  }
  return params;
}

export function generateMetadata({
  params,
}: {
  params: { lang: string; slug: string };
}): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  const svc = getService(params.slug);
  if (!svc) return {};
  const copy = lang === "en" ? svc.en : svc.zh;
  return { title: copy.name, description: copy.summary };
}

export default function ServiceDetailPage({
  params,
}: {
  params: { lang: string; slug: string };
}) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const svc = getService(params.slug);
  if (!svc) notFound();
  // External services (国际二诊) live on their own dedicated page.
  if (svc.external) redirect(`/${lang}${svc.external}`);

  const t = getDictionary(lang);
  const s = t.services;
  const copy = lang === "en" ? svc.en : svc.zh;
  const category = SERVICE_CATEGORIES.find((c) => c.key === svc.category);
  const categoryName = category ? (lang === "zh" ? category.zh : category.en) : "";
  const p = (path: string) => `/${lang}${path}`;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div className="absolute inset-0 bg-grid-faint opacity-20 [background-size:32px_32px]" />
        <div className="absolute -right-10 top-0 h-64 w-64 rounded-full bg-brand-deep/40 blur-3xl" />
        <div className="container-page relative py-16 sm:py-20">
          <div className="mt-6 flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-brand-sky">
              <ServiceIcon name={svc.icon} className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{copy.name}</h1>
              <p className="mt-2 text-lg text-slate-300">{copy.tagline}</p>
              <Link
                href={p(`/second-opinion/apply?category=${encodeURIComponent(categoryName)}&need=${encodeURIComponent(copy.name)}`)}
                className="btn mt-6 bg-white text-brand-deep hover:bg-brand-50"
              >
                {lang === "zh" ? "立即申请" : "Apply Now"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <Section className="bg-white">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.85fr] lg:items-start">
          {/* left: overview + highlights + audience */}
          <div className="space-y-12">
            <Reveal>
              <h2 className="text-xl font-bold text-brand-950">{s.detailOverview}</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-700">{copy.overview}</p>
            </Reveal>

            <Reveal>
              <h2 className="text-xl font-bold text-brand-950">{s.detailHighlights}</h2>
              <ul className="mt-5 space-y-3">
                {copy.highlights.map((h) => (
                  <li key={h} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-deep" />
                    <span className="text-sm leading-relaxed text-slate-700">{h}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal>
              <div className="rounded-3xl border border-brand-100 bg-brand-50/60 p-8">
                <div className="flex items-center gap-2.5">
                  <Users className="h-5 w-5 text-brand-deep" />
                  <h2 className="text-lg font-semibold text-brand-950">{s.detailAudience}</h2>
                </div>
                <ul className="mt-5 space-y-3">
                  {copy.audience.map((a) => (
                    <li key={a} className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-sky" />
                      <span className="text-sm leading-relaxed text-slate-700">{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          {/* right: inquiry form (sticky on desktop) */}
          <div className="lg:sticky lg:top-24">
            <ServiceInquiryForm lang={lang} dict={t} serviceSlug={svc.slug} />
          </div>
        </div>
      </Section>
    </>
  );
}
