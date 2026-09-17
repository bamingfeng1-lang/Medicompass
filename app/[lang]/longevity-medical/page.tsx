import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/Reveal";
import { ArrowRight } from "lucide-react";
import { ServiceIcon } from "@/components/services/ServiceIcon";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { servicesByCategory } from "@/lib/services/catalog";

const CATEGORY_KEY = "longevity";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  const t = getDictionary(lang);
  return { title: t.nav.longevityMedical };
}

export default function LongevityMedicalPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const p = (path: string) => `/${lang}${path}`;
  const list = servicesByCategory(CATEGORY_KEY);

  return (
    <>
      <section className="relative overflow-hidden bg-brand-950 text-white">
        <div className="absolute inset-0 bg-grid-faint opacity-20 [background-size:32px_32px]" />
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand-deep/40 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-brand-sky/30 blur-3xl" />
        <div className="container-page relative py-20 sm:py-28">
          <div className="max-w-3xl animate-fade-up">
            <span className="eyebrow border-white/20 bg-white/10 text-brand-sky">{t.nav.longevityMedical}</span>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {lang === "zh" ? "长寿医学" : "Longevity Medical"}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              {lang === "zh"
                ? "融合前沿长寿医学科技，从精准检测、细胞 rejuvenation 到个性化健康管理，助您延缓衰老、提升生命质量。"
                : "Integrating cutting-edge longevity science — from precision testing and cellular rejuvenation to personalized health management."}
            </p>
            <Link
              href={p("/second-opinion/apply?category=" + encodeURIComponent(lang === "zh" ? "长寿医学" : "Longevity Medical"))}
              className="btn mt-9 bg-white text-brand-deep hover:bg-brand-50"
            >
              {lang === "zh" ? "立即申请长寿医学" : "Apply for Longevity Medical"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Section className="bg-white">
        <SectionHeading
          title={lang === "zh" ? "长寿医学" : "Longevity Medical"}
          desc={lang === "zh"
            ? "融合前沿长寿医学科技，从精准检测、细胞 rejuvenation 到个性化健康管理，助您延缓衰老、提升生命质量。"
            : "Integrating cutting-edge longevity science — from precision testing and cellular rejuvenation to personalized health management."}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((svc, i) => {
            const copy = lang === "en" ? svc.en : svc.zh;
            const href = svc.external ? p(svc.external) : p(`/services/${svc.slug}`);
            const applyHref = p(`/second-opinion/apply?category=${encodeURIComponent(lang === "zh" ? "长寿医学" : "Longevity Medical")}&need=${encodeURIComponent(copy.name)}`);
            return (
              <Reveal key={svc.slug} delay={i * 60}>
                <div className="card group flex h-full flex-col transition hover:-translate-y-1 hover:shadow-soft">
                  <Link href={href} className="flex-1">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-deep transition group-hover:bg-brand-gradient group-hover:text-white">
                      <ServiceIcon name={svc.icon} className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-brand-950">{copy.name}</h3>
                    <p className="mt-1 text-xs font-medium text-brand-deep">{copy.tagline}</p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{copy.summary}</p>
                  </Link>
                  <Link href={applyHref} className="btn mt-5 text-brand-deep">
                    {lang === "zh" ? "了解详情" : "Learn More"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Section>
    </>
  );
}