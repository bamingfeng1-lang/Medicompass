import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/Reveal";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  const t = getDictionary(lang);
  return { title: t.packages.hero.title };
}

export default function PackagesPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const k = t.packages;
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
            <span className="eyebrow border-white/20 bg-white/10 text-brand-sky">{k.hero.badge}</span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {k.hero.title}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">{k.hero.subtitle}</p>
            <Link
              href={p("/register/patient")}
              className="btn mt-9 bg-white text-brand-deep hover:bg-brand-50"
            >
              {k.hero.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* PACKAGE GRID */}
      <Section className="bg-white">
        <SectionHeading eyebrow={k.eyebrow} title={k.listTitle} center />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {k.items.map((item, i) => (
            <Reveal key={item.name} delay={i * 80}>
              <div className="card flex h-full flex-col hover:-translate-y-1 hover:shadow-soft">
                <span className="inline-flex w-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-deep">
                  {item.tag}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-brand-950">{item.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
                <ul className="mt-5 space-y-2.5">
                  {item.features.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-vital" />
                      <span className="text-sm text-slate-700">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                  <span className="text-sm font-semibold text-brand-deep">{item.price}</span>
                  <Link
                    href={p("/register/patient")}
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand-deep hover:gap-2 transition-all"
                  >
                    {k.hero.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mx-auto mt-12 max-w-2xl text-center text-xs italic text-slate-400">{k.note}</p>
      </Section>
    </>
  );
}
