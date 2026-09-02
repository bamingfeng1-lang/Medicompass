"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ChevronDown, Globe } from "lucide-react";
import { clsx } from "clsx";
import { Logo } from "./Logo";
import type { Locale } from "@/lib/brand";
import type { Dictionary } from "@/lib/dictionaries";

export function Navbar({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [regOpen, setRegOpen] = useState(false);

  const p = (path: string) => `/${lang}${path}`;
  const otherLang: Locale = lang === "zh" ? "en" : "zh";
  const switchHref =
    "/" + otherLang + (pathname.replace(/^\/(zh|en)/, "") || "");

  const links = [
    { href: p(""), label: dict.nav.home },
    { href: p("/packages"), label: dict.nav.packages },
    { href: p("/second-opinion"), label: dict.nav.secondOpinion },
    { href: p("/about"), label: dict.nav.about },
  ];

  const regLinks = [
    { href: p("/register/patient"), label: dict.nav.registerPatient },
    { href: p("/register/provider"), label: dict.nav.registerProvider },
    { href: p("/register/doctor"), label: dict.nav.registerDoctor },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-xl">
      <nav className="container-page flex h-16 items-center justify-between lg:h-20">
        <Link href={p("")} aria-label="Medicompass home">
          <Logo />
        </Link>

        {/* desktop */}
        <div className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href} active={pathname === l.href}>
              {l.label}
            </NavLink>
          ))}

          <div
            className="relative"
            onMouseEnter={() => setRegOpen(true)}
            onMouseLeave={() => setRegOpen(false)}
          >
            <button className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-brand-deep">
              {dict.nav.register}
              <ChevronDown className="h-4 w-4" />
            </button>
            {regOpen && (
              <div className="absolute left-0 top-full w-56 pt-2">
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-soft">
                  {regLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="block rounded-xl px-4 py-2.5 text-sm text-slate-700 transition hover:bg-brand-50 hover:text-brand-deep"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href={switchHref}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-deep hover:text-brand-deep"
          >
            <Globe className="h-4 w-4" />
            {dict.switchTo}
          </Link>
          <Link href={p("/register/patient")} className="btn-primary">
            {dict.nav.cta}
          </Link>
        </div>

        {/* mobile toggle */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white lg:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {[...links, ...regLinks].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-medium text-slate-700 hover:bg-brand-50"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-3">
              <Link
                href={switchHref}
                onClick={() => setMobileOpen(false)}
                className="btn-secondary flex-1"
              >
                <Globe className="h-4 w-4" />
                {dict.switchTo}
              </Link>
              <Link
                href={p("/register/patient")}
                onClick={() => setMobileOpen(false)}
                className="btn-primary flex-1"
              >
                {dict.nav.cta}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "rounded-full px-4 py-2 text-sm font-medium transition",
        active ? "text-brand-deep" : "text-slate-600 hover:text-brand-deep"
      )}
    >
      {children}
    </Link>
  );
}
