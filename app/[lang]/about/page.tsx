import { notFound } from "next/navigation";
import { Compass, Target, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/Reveal";
import { LogoMark } from "@/components/Logo";
import { BRAND, isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).nav.about };
}

export default function AboutPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const a = t.about;

  return (
    <>
      <section className="relative overflow-hidden bg-grid-faint [background-size:32px_32px]">
        <div className="absolute inset-0 bg-brand-radial" />
        <div className="container-page relative py-20 text-center sm:py-28">
          <div className="animate-fade-up">
            <Eyebrow>{a.badge}</Eyebrow>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-brand-950 sm:text-5xl">
              {a.title}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              {a.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <Section className="bg-white">
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="card h-full border-brand-100 bg-brand-50/50">
              <Compass className="h-10 w-10 text-brand-deep" />
              <h2 className="mt-5 text-xl font-bold text-brand-950">{a.visionTitle}</h2>
              <p className="mt-3 text-lg leading-relaxed text-slate-700">{a.vision}</p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="card h-full border-brand-100 bg-brand-50/50">
              <Target className="h-10 w-10 text-brand-deep" />
              <h2 className="mt-5 text-xl font-bold text-brand-950">{a.missionTitle}</h2>
              <p className="mt-3 text-lg leading-relaxed text-slate-700">{a.mission}</p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Values */}
      <Section className="bg-slate-50">
        <SectionHeading title={a.valuesTitle} center />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {a.values.map((v, i) => (
            <Reveal key={v.title} delay={i * 80}>
              <div className="card h-full text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-lg font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-base font-semibold text-brand-950">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{v.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* HQ */}
      <Section className="bg-white">
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-[2.5rem] bg-brand-950 px-8 py-14 text-center text-white sm:px-16">
          <LogoMark className="h-14 w-14" />
          <div className="flex items-center gap-2 text-sm font-medium text-brand-sky">
            <MapPin className="h-4 w-4" />
            {a.hqTitle}
          </div>
          <p className="text-3xl font-bold">{a.hqValue}</p>
          <a
            href={`https://${BRAND.url}`}
            className="text-sm text-slate-300 transition hover:text-white"
          >
            {BRAND.url}
          </a>
        </Reveal>
      </Section>
    </>
  );
}
