import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/Reveal";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  const t = getDictionary(lang);
  return { title: t.carT.hero.title };
}

export default function CarTPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const s = t.carT;
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
            <Link
              href={p("/second-opinion/apply?category=" + encodeURIComponent(lang === "zh" ? "CAR-T" : "CAR-T"))}
              className="btn mt-9 bg-white text-brand-deep hover:bg-brand-50"
            >
              {s.hero.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* WHAT + AUDIENCE */}
      <Section className="bg-white">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <Reveal>
            <SectionHeading eyebrow={s.whatEyebrow} title={s.whatTitle} desc={s.whatDesc} />
          </Reveal>
          <Reveal delay={120}>
            <div className="rounded-3xl border border-brand-100 bg-brand-50/60 p-8">
              <h3 className="text-lg font-semibold text-brand-950">{s.audienceTitle}</h3>
              <ul className="mt-5 space-y-4">
                {s.audience.map((a) => (
                  <li key={a} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-deep" />
                    <span className="text-sm leading-relaxed text-slate-700">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* PROCESS TIMELINE */}
      <Section className="bg-slate-50">
        <SectionHeading eyebrow={s.processEyebrow} title={s.processTitle} desc={s.processNote} center />
        <div className="relative mt-16 overflow-x-auto pb-4">
          {/* connecting line (desktop) */}
          <div className="absolute left-0 top-7 hidden h-0.5 w-full bg-brand-100 lg:block" />
          <div className="grid min-w-[1000px] grid-cols-7 gap-6">
            {s.process.map((step, i) => (
              <Reveal key={step.step} delay={i * 80}>
                <div className="relative">
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-lg font-bold text-white shadow-soft">
                    {step.step}
                  </div>
                  <h3 className="mt-5 text-sm font-semibold text-brand-950">{step.name}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{step.desc}</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-brand-deep shadow-card">
                    <Clock className="h-3 w-3" />
                    {step.time}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* WHY CHOOSE */}
      <Section className="bg-white">
        <SectionHeading eyebrow={s.whyEyebrow} title={s.whyTitle} center />
        <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2">
          {s.why.map((item, i) => (
            <Reveal key={item.title} delay={i * 100}>
              <div className="card h-full">
                <h3 className="text-lg font-semibold text-brand-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section className="bg-slate-50">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-950">{s.ctaTitle}</h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">{s.ctaDesc}</p>
          <Link
            href={p("/second-opinion/apply?category=" + encodeURIComponent(lang === "zh" ? "CAR-T" : "CAR-T"))}
            className="btn-primary mt-9 inline-flex"
          >
            {s.hero.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Section>
    </>
  );
}
