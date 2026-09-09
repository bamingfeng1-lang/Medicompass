import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { LoginForm } from "@/components/admin/LoginForm";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { getCurrentAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).admin.loginTitle };
}

export default async function AdminLoginPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const a = t.admin;

  // Already signed in as admin -> go straight to the applications list.
  const admin = await getCurrentAdmin();
  if (admin) redirect(`/${lang}/admin`);

  return (
    <Section className="bg-slate-50">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-brand-950">{a.loginTitle}</h1>
          <p className="mt-2 text-sm text-slate-600">{a.loginDesc}</p>
        </div>
        <Suspense fallback={null}>
          <LoginForm lang={lang} dict={t} />
        </Suspense>
      </div>
    </Section>
  );
}
