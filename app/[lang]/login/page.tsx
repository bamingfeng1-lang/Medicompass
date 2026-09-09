import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { UserLoginForm } from "@/components/auth/UserLoginForm";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).auth.title };
}

export default function LoginPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const a = t.auth;
  const p = (path: string) => `/${lang}${path}`;

  return (
    <Section className="bg-slate-50">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-brand-950">{a.title}</h1>
          <p className="mt-2 text-sm text-slate-600">{a.desc}</p>
        </div>
        <UserLoginForm lang={lang} dict={t} />
        <p className="mt-6 text-center text-sm text-slate-500">
          {a.noAccount}{" "}
          <Link href={p("/register")} className="font-semibold text-brand-deep hover:underline">
            {a.goRegister}
          </Link>
        </p>
      </div>
    </Section>
  );
}
