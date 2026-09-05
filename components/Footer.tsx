import Link from "next/link";
import { MapPin, Globe, Mail } from "lucide-react";
import { Logo } from "./Logo";
import { BRAND, type Locale } from "@/lib/brand";
import type { Dictionary } from "@/lib/dictionaries";

export function Footer({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const p = (path: string) => `/${lang}${path}`;

  return (
    <footer className="border-t border-slate-100 bg-brand-950 text-slate-300">
      <div className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo invert />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-400">
              {dict.footer.tagline}
            </p>
          </div>

          <FooterCol title={dict.footer.quickLinks}>
            <FooterLink href={p("")}>{dict.nav.home}</FooterLink>
            <FooterLink href={p("/second-opinion")}>{dict.nav.secondOpinion}</FooterLink>
            <FooterLink href={p("/services")}>{dict.nav.services}</FooterLink>
            <FooterLink href={p("/overseas-domestic")}>{dict.nav.overseasDomestic}</FooterLink>
            <FooterLink href={p("/about")}>{dict.nav.about}</FooterLink>
          </FooterCol>

          <FooterCol title={dict.footer.services}>
            <FooterLink href={p("/register/patient")}>{dict.nav.registerPatient}</FooterLink>
            <FooterLink href={p("/register/provider")}>{dict.nav.registerProvider}</FooterLink>
            <FooterLink href={p("/register/doctor")}>{dict.nav.registerDoctor}</FooterLink>
          </FooterCol>

          <FooterCol title={dict.footer.contact}>
            <li className="flex items-start gap-2.5 text-sm text-slate-400">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-sky" />
              <span>
                {dict.footer.hq}: {BRAND.hq[lang]}
              </span>
            </li>
            <li className="flex items-start gap-2.5 text-sm text-slate-400">
              <Globe className="mt-0.5 h-4 w-4 shrink-0 text-brand-sky" />
              <a href={`https://${BRAND.url}`} className="hover:text-white">
                {BRAND.url}
              </a>
            </li>
            <li className="flex items-start gap-2.5 text-sm text-slate-400">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-sky" />
              <a href={`mailto:hello@${BRAND.url}`} className="hover:text-white">
                hello@{BRAND.url}
              </a>
            </li>
          </FooterCol>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 text-xs text-slate-500 sm:flex-row">
          <span>
            © {new Date().getFullYear()} {BRAND.nameEn} ({BRAND.nameZh}). {dict.footer.rights}.
          </span>
          <span>{dict.footer.langNote}</span>
        </div>
        <div className="mt-4 text-center sm:text-right">
          <Link href={p("/admin")} className="text-xs text-slate-600 transition hover:text-slate-300">
            {dict.admin.brand}
          </Link>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-semibold text-white">{title}</h4>
      <ul className="space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-slate-400 transition hover:text-white">
        {children}
      </Link>
    </li>
  );
}
