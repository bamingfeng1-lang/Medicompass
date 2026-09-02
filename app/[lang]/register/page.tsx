import Link from "next/link";
import { notFound } from "next/navigation";
import { User, Building2, Stethoscope, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/Reveal";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).nav.register };
}

const icons = { patient: User, provider: Building2, doctor: Stethoscope };

export default function RegisterHub({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const p = (path: string) => `/${lang}${path}`;

  const roles = [
    { key: "patient", ...t.register.roles.patient, href: p("/register/patient") },
    { key: "provider", ...t.register.roles.provider, href: p("/register/provider") },
    { key: "doctor", ...t.register.roles.doctor, href: p("/register/doctor") },
  ] as const;

  return (
    <Section className="bg-grid-faint [background-size:32px_32px]">
      <SectionHeading eyebrow={t.register.hubBadge} title={t.register.hubTitle} desc={t.register.hubDesc} center />
      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {roles.map((r, i) => {
          const Icon = icons[r.key];
          return (
            <Reveal key={r.key} delay={i * 100}>
              <Link
                href={r.href}
                className="card group flex h-full flex-col hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-soft">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-brand-950">{r.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{r.desc}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-deep">
                  {r.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
