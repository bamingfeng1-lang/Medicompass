import { notFound } from "next/navigation";
import { CheckCircle2, Users } from "lucide-react";
import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/Reveal";
import { ServiceIcon } from "@/components/services/ServiceIcon";
import { ServiceInquiryForm } from "@/components/forms/ServiceInquiryForm";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { getService, SERVICE_CATEGORIES } from "@/lib/services/catalog";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/api";

// Promoted to a top-level section, alongside Packages / Second Opinion.
// Content is reused from the service catalog entry.
const SLUG = "overseas-domestic-landing";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  const svc = getService(SLUG);
  if (!svc) return {};
  const copy = lang === "en" ? svc.en : svc.zh;
  return { title: copy.name, description: copy.summary };
}

export const dynamic = "force-dynamic";

export default async function OverseasDomesticPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const svc = getService(SLUG);
  if (!svc) notFound();

  const t = getDictionary(lang);
  const s = t.services;
  const copy = lang === "en" ? svc.en : svc.zh;
  const category = SERVICE_CATEGORIES.find((c) => c.key === svc.category);
  const eyebrow = category ? (lang === "en" ? category.en : category.zh) : s.hero.badge;

  // Prefill the "contact us" form with the logged-in patient's name/phone/email.
  const user = await getCurrentUser();
  const profile = user ? await getCurrentUserProfile() : null;
  const initialValues =
    profile ? { fullName: profile.fullName, phone: profile.phone, email: profile.email } : undefined;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div className="absolute inset-0 bg-grid-faint opacity-20 [background-size:32px_32px]" />
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand-deep/40 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-brand-sky/30 blur-3xl" />
        <div className="container-page relative py-20 sm:py-28">
          <div className="max-w-3xl animate-fade-up">
            <span className="eyebrow border-white/20 bg-white/10 text-brand-sky">{eyebrow}</span>
            <div className="mt-6 flex items-start gap-5">
              <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-brand-sky sm:flex">
                <ServiceIcon name={svc.icon} className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                  {copy.name}
                </h1>
                <p className="mt-4 text-lg leading-relaxed text-slate-300">{copy.tagline}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <Section className="bg-white">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.85fr] lg:items-start">
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

          <div className="lg:sticky lg:top-24">
            <ServiceInquiryForm
              lang={lang}
              dict={t}
              serviceSlug={svc.slug}
              initialValues={initialValues}
              hideAgree={!!user}
              isLoggedIn={!!user}
            />
          </div>
        </div>
      </Section>
    </>
  );
}
