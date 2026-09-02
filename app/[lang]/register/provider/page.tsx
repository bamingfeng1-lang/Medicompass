import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { RegisterForm, RegisterHeader, type Field } from "@/components/forms/RegisterForm";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).register.providerTitle };
}

export default function ProviderRegister({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const f = t.register.fields;
  const ph = t.register.placeholders;

  const fields: Field[] = [
    { name: "orgName", label: f.orgName, type: "text", placeholder: ph.orgName, required: true },
    { name: "orgType", label: f.orgType, type: "select", options: f.orgTypeOptions, required: true, half: true },
    { name: "country", label: f.country, type: "text", placeholder: ph.country, required: true, half: true },
    { name: "contactPerson", label: f.contactPerson, type: "text", placeholder: ph.contactPerson, required: true, half: true },
    { name: "phone", label: f.phone, type: "tel", placeholder: ph.phone, required: true, half: true },
    { name: "email", label: f.email, type: "email", placeholder: ph.email, required: true, half: true },
    { name: "license", label: f.license, type: "text", half: true },
    { name: "cooperation", label: f.cooperation, type: "textarea", placeholder: ph.cooperation, required: true },
  ];

  return (
    <Section className="bg-slate-50">
      <div className="mx-auto max-w-2xl">
        <RegisterHeader
          lang={lang}
          backLabel={t.nav.register}
          title={t.register.providerTitle}
          desc={t.register.providerDesc}
        />
        <RegisterForm role="provider" fields={fields} lang={lang} dict={t} />
      </div>
    </Section>
  );
}
