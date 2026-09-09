import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { RegisterHeader } from "@/components/forms/RegisterForm";
import { QuickRegisterForm } from "@/components/forms/QuickRegisterForm";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).register.quickTitle };
}

export default function QuickRegister({
  params,
  searchParams,
}: {
  params: { lang: string };
  searchParams?: { phone?: string; name?: string; email?: string; need?: string };
}) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const r = t.register;

  const dec = (v?: string) => (v ? decodeURIComponent(v) : undefined);
  const phone = dec(searchParams?.phone) ?? "";

  return (
    <Section className="bg-slate-50 !pt-10 sm:!pt-14">
      <div className="mx-auto max-w-md">
        <RegisterHeader
          lang={lang}
          backLabel={t.nav.register}
          title={r.quickTitle}
          desc={r.quickDesc}
        />
        <QuickRegisterForm
          lang={lang}
          dict={t}
          phone={phone}
          fullName={dec(searchParams?.name)}
          email={dec(searchParams?.email)}
          needType={dec(searchParams?.need)}
        />
      </div>
    </Section>
  );
}
