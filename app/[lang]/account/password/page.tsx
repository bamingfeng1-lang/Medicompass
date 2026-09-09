import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { getCurrentUser } from "@/lib/api";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).account.pwTitle };
}

export default async function ChangePasswordPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const a = t.account;
  const p = (path: string) => `/${lang}${path}`;

  const user = await getCurrentUser();
  if (!user) redirect(p("/login"));

  return (
    <div className="max-w-3xl">
      <Link
        href={p("/account/profile")}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-deep"
      >
        <ArrowLeft className="h-4 w-4" />
        {a.pwBack}
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-950">{a.pwTitle}</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{a.pwDesc}</p>
      <div className="mt-6">
        <ChangePasswordForm dict={t} />
      </div>
    </div>
  );
}
