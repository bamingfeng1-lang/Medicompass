import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { RegisterForm, RegisterHeader, type Field } from "@/components/forms/RegisterForm";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).register.patientTitle };
}

export default function PatientRegister({
  params,
  searchParams,
}: {
  params: { lang: string };
  searchParams?: { phone?: string };
}) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const f = t.register.fields;
  const ph = t.register.placeholders;

  const fields: Field[] = [
    { name: "fullName", label: f.fullName, type: "text", placeholder: ph.fullName, required: true, half: true },
    { name: "email", label: f.email, type: "email", placeholder: ph.email, required: true, half: true },
    { name: "phone", label: f.phone, type: "tel", placeholder: ph.phone, required: true, half: true },
  ];

  const initialPhone = searchParams?.phone ? decodeURIComponent(searchParams.phone) : undefined;

  return (
    <Section className="bg-slate-50 !pt-10 sm:!pt-14">
      <div className="mx-auto max-w-2xl">
        <RegisterHeader
          lang={lang}
          backLabel={t.nav.register}
          title={t.register.patientTitle}
          desc={t.register.patientDesc}
        />
        <RegisterForm role="patient" fields={fields} lang={lang} dict={t} initialPhone={initialPhone} />
      </div>
    </Section>
  );
}
