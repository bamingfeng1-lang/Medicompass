import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { ServiceInquiryForm } from "@/components/forms/ServiceInquiryForm";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/api";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).packages.hero.cta };
}

export default async function PackageEnquirePage({
  params,
  searchParams,
}: {
  params: { lang: string };
  searchParams?: { need?: string };
}) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const k = t.packages;

  const needOptions = t.register.fields.needTypeOptions;
  const need = searchParams?.need ? decodeURIComponent(searchParams.need) : undefined;
  const defaultNeedType = need && needOptions.includes(need) ? need : undefined;
  // 套餐咨询页面排除"国际二诊"选项（该选项属于独立的二次诊疗服务）
  const excludeNeedTypes = [needOptions[0]];

  const user = await getCurrentUser();
  const profile = user ? await getCurrentUserProfile() : null;
  const initialValues =
    profile ? { fullName: profile.fullName, phone: profile.phone, email: profile.email } : undefined;

  return (
    <Section className="bg-slate-50 !py-10 sm:!py-14">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">
            {k.hero.cta}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">{k.hero.subtitle}</p>
        </div>
        <ServiceInquiryForm
          lang={lang}
          dict={t}
          serviceSlug="medical-package"
          showNeedType
          defaultNeedType={defaultNeedType}
          initialValues={initialValues}
          hideAgree={!!user}
          isLoggedIn={!!user}
          excludeNeedTypes={excludeNeedTypes}
        />
      </div>
    </Section>
  );
}
