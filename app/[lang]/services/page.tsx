import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/Reveal";
import { ServiceIcon } from "@/components/services/ServiceIcon";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { SERVICE_CATEGORIES, servicesByCategory } from "@/lib/services/catalog";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).services.hero.title };
}

export default function ServicesHubPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const s = t.services;
  const p = (path: string) => `/${lang}${path}`;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div className="absolute inset-0 bg-grid-faint opacity-20 [background-size:32px_32px]" />
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand-deep/40 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-brand-sky/30 blur-3xl" />
        <div className="container-page relative py-20 sm:py-28">
          <div className="max-w-3xl animate-fade-up">
            <span className="eyebrow border-white/20 bg-white/10 text-brand-sky">{s.hero.badge}</span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {s.hero.title}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">{s.hero.subtitle}</p>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      {SERVICE_CATEGORIES.map((cat, ci) => {
        const list = servicesByCategory(cat.key);
        return (
          <Section key={cat.key} className={ci % 2 === 0 ? "bg-white" : "bg-slate-50"}>
            <SectionHeading
              eyebrow={`${String(ci + 1).padStart(2, "0")}`}
              title={lang === "en" ? cat.en : cat.zh}
              desc={lang === "en" ? cat.enDesc : cat.zhDesc}
            />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((svc, i) => {
                const copy = lang === "en" ? svc.en : svc.zh;
                const href = svc.external ? p(svc.external) : p(`/services/${svc.slug}`);
                return (
                  <Reveal key={svc.slug} delay={i * 60}>
                    <Link href={href} className="card group flex h-full flex-col transition hover:-translate-y-1 hover:shadow-soft">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-deep transition group-hover:bg-brand-gradient group-hover:text-white">
                        <ServiceIcon name={svc.icon} className="h-6 w-6" />
                      </div>
                      <h3 className="mt-5 text-lg font-semibold text-brand-950">{copy.name}</h3>
                      <p className="mt-1 text-xs font-medium text-brand-deep">{copy.tagline}</p>
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{copy.summary}</p>
                      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-deep">
                        {svc.external ? s.hubExploreCta : s.hubCta}
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </Section>
        );
      })}
    </>
  );
}
