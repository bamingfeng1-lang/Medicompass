import Link from "next/link";
import {
  ShieldCheck,
  Stethoscope,
  Sparkles,
  ArrowRight,
  Check,
  Globe2,
  Languages,
  BadgeCheck,
  HeartHandshake,
  ClipboardCheck,
} from "lucide-react";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/Reveal";
import { LogoMark } from "@/components/Logo";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { getCurrentUser } from "@/lib/api";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const painIcons = [Sparkles, Stethoscope, ShieldCheck];
const whyIcons = [Globe2, Languages, BadgeCheck, HeartHandshake];

export default async function HomePage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const p = (path: string) => `/${lang}${path}`;
  const user = await getCurrentUser();
  const heroTitleClass = lang === "zh" 
    ? "mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-brand-950 sm:text-5xl lg:text-6xl"
    : "mt-6 text-3xl font-bold leading-[1.1] tracking-tight text-brand-950 sm:text-4xl lg:text-5xl";

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-grid-faint [background-size:32px_32px]">
        <div className="absolute inset-0 bg-brand-radial" />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-sky/30 blur-3xl" />
        <div className="container-page relative grid gap-12 py-20 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="animate-fade-up">
            <Eyebrow>{t.home.heroBadge}</Eyebrow>
            <h1 className={heroTitleClass}>
              {t.home.heroTitle}
              <span className="text-gradient">{t.home.heroTitleAccent}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              {t.home.heroSubtitle}
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href={p("/second-opinion")} className="btn-primary">
                {t.home.heroCtaPrimary}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {!user && (
                <Link href={p("/register/provider")} className="btn-secondary">
                  {t.home.heroCtaSecondary}
                </Link>
              )}
            </div>

            <dl className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {t.home.stats.map((s) => (
                <div key={s.label}>
                  <dt className="text-3xl font-bold text-brand-deep">{s.value}</dt>
                  <dd className="mt-1 text-xs text-slate-500">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* hero visual */}
          <div className="relative hidden lg:block">
            <div className="relative mx-auto aspect-square max-w-md">
              <div className="absolute inset-0 animate-float rounded-[2.5rem] bg-brand-gradient opacity-90 shadow-glow" />
              <div className="absolute inset-6 rounded-[2rem] bg-white/95 p-8 shadow-soft backdrop-blur">
                <div className="flex items-center gap-3">
                  <LogoMark className="h-12 w-12" />
                  <div>
                    <p className="text-sm font-semibold text-brand-950">{t.nav.secondOpinion}</p>
                    <p className="text-xs text-slate-500">{t.home.soEyebrow}</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {t.home.soHighlights.map((h) => (
                    <div key={h} className="flex items-start gap-3 rounded-xl bg-brand-50 px-4 py-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-vital" />
                      <span className="text-sm font-medium text-brand-900">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <Section className="bg-white">
        <Reveal className="mx-auto max-w-4xl text-center">
          <Eyebrow>{t.home.missionEyebrow}</Eyebrow>
          <p className="mt-6 text-2xl font-semibold leading-relaxed text-brand-950 sm:text-3xl">
            {t.home.missionTitle}
          </p>
          <p className="mt-4 text-lg text-slate-600">{t.home.missionDesc}</p>
        </Reveal>
      </Section>

      {/* PAIN POINTS */}
      <Section className="bg-slate-50">
        <SectionHeading eyebrow={t.home.painEyebrow} title={t.home.painTitle} center />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {t.home.pains.map((pain, i) => {
            const Icon = painIcons[i];
            return (
              <Reveal key={pain.title} delay={i * 100}>
                <div className="card h-full hover:-translate-y-1 hover:shadow-soft">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-soft">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-brand-950">{pain.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{pain.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section className="bg-white">
        <SectionHeading eyebrow={t.home.howEyebrow} title={t.home.howTitle} center />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.home.how.map((step, i) => (
            <Reveal key={step.step} delay={i * 80}>
              <div className="relative h-full rounded-3xl border border-slate-100 bg-white p-7 shadow-card">
                <span className="text-5xl font-bold text-brand-100">{step.step}</span>
                <h3 className="mt-4 text-lg font-semibold text-brand-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* WHY US */}
      <Section className="bg-slate-50">
        <SectionHeading eyebrow={t.home.whyEyebrow} title={t.home.whyTitle} center />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.home.why.map((item, i) => {
            const Icon = whyIcons[i];
            return (
              <Reveal key={item.title} delay={i * 80}>
                <div className="card h-full">
                  <Icon className="h-9 w-9 text-brand-deep" />
                  <h3 className="mt-5 text-base font-semibold text-brand-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* SECOND OPINION FEATURE */}
      <Section className="bg-white">
        <div className="overflow-hidden rounded-[2.5rem] bg-brand-950 text-white">
          <div className="grid gap-10 p-10 sm:p-14 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="eyebrow border-white/20 bg-white/10 text-brand-sky">
                {t.home.soEyebrow}
              </span>
              <h2 className="mt-5 text-3xl font-bold sm:text-4xl">{t.home.soTitle}</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-300">{t.home.soDesc}</p>
              <Link
                href={p("/second-opinion")}
                className="btn mt-8 bg-white text-brand-deep hover:bg-brand-50"
              >
                {t.home.soCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-3">
              {t.home.soHighlights.map((h) => (
                <div
                  key={h}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient">
                    <Check className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium leading-relaxed">{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="bg-slate-50">
        <Reveal className="relative overflow-hidden rounded-[2.5rem] bg-brand-gradient px-8 py-16 text-center shadow-glow sm:px-16">
          <ClipboardCheck className="mx-auto h-12 w-12 text-white/90" />
          <h2 className="mt-5 text-3xl font-bold text-white sm:text-4xl">{t.home.ctaTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/90">{t.home.ctaDesc}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link href={p("/register/patient")} className="btn bg-white text-brand-deep hover:bg-brand-50">
              {t.register.roles.patient.cta}
            </Link>
            <Link href={p("/register/provider")} className="btn border border-white/40 text-white hover:bg-white/10">
              {t.register.roles.provider.cta}
            </Link>
            <Link href={p("/register/doctor")} className="btn border border-white/40 text-white hover:bg-white/10">
              {t.register.roles.doctor.cta}
            </Link>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
