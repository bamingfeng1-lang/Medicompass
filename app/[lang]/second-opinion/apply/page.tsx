import Link from "next/link";
import { notFound } from "next/navigation";
<<<<<<< HEAD
import { ArrowLeft } from "lucide-react";
=======
>>>>>>> f18247c (增加CART)
import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SecondOpinionForm } from "@/components/forms/SecondOpinionForm";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
<<<<<<< HEAD
import { getCurrentUser } from "@/lib/api";
=======
import { getCurrentUser, getCurrentUserProfile } from "@/lib/api";
>>>>>>> f18247c (增加CART)

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).apply.title };
}

<<<<<<< HEAD
export default async function ApplyPage({ params }: { params: { lang: string } }) {
=======
export default async function ApplyPage({ params, searchParams }: { params: { lang: string }; searchParams?: { category?: string; need?: string } }) {
>>>>>>> f18247c (增加CART)
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const a = t.apply;
<<<<<<< HEAD
  const user = await getCurrentUser();

  return (
    <Section className="bg-slate-50">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10">
          <Link
            href={`/${lang}/second-opinion`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-deep"
          >
            <ArrowLeft className="h-4 w-4" />
            {a.back}
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">{a.title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">{a.desc}</p>
        </div>
        <SecondOpinionForm lang={lang} dict={t} isLoggedIn={!!user} />
=======
  const p = (path: string) => `/${lang}${path}`;

  const user = await getCurrentUser();
  // 已登录但无 profile 的极端情况由表单下方的提示兜底;
  // 这里不强制 redirect,以便登出态/懒创建失败时仍能提交匿名申请。
  const profile = user ? await getCurrentUserProfile() : null;

  // 从 URL 参数获取服务类别和需求类型
  const category = searchParams?.category || undefined;
  const need = searchParams?.need || undefined;

  return (
    <Section className="bg-slate-50 !py-10 sm:!py-14">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">{t.nav.cta}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
            {user ? (profile ? a.loggedInDesc : a.noProfileDesc) : a.desc}
          </p>
        </div>

        {user && !profile ? (
          <div className="card text-center">
            <p className="text-slate-600">{a.noProfileDesc}</p>
            <Link href={p("/register/patient")} className="btn-primary mt-6 inline-block">
              {t.nav.registerPatient}
            </Link>
          </div>
        ) : (
          <SecondOpinionForm
            lang={lang}
            dict={t}
            hideAgree={!!user}
            isLoggedIn={!!user}
            initialValues={
              profile
                ? {
                    fullName: profile.fullName,
                    email: profile.email,
                    phone: profile.phone,
                    country: profile.country,
                    serviceCategory: category || undefined,
                    needType: need || profile.needType,
                    destination: profile.destination ?? "",
                    condition: profile.condition,
                  }
                : category || need
                ? {
                    serviceCategory: category || "",
                    needType: need || "",
                    fullName: "",
                    email: "",
                    phone: "",
                    country: "",
                    destination: "",
                    condition: "",
                  }
                : undefined
            }
          />
        )}
>>>>>>> f18247c (增加CART)
      </div>
    </Section>
  );
}
