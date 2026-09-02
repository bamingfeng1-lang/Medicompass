import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { RegisterForm, RegisterHeader, type Field } from "@/components/forms/RegisterForm";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: getDictionary(lang).register.doctorTitle };
}

export default function DoctorRegister({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const f = t.register.fields;
  const ph = t.register.placeholders;

  const fields: Field[] = [
    { name: "fullName", label: f.fullName, type: "text", placeholder: ph.fullName, required: true, half: true },
    { name: "specialty", label: f.specialty, type: "text", placeholder: ph.specialty, required: true, half: true },
    { name: "hospital", label: f.hospital, type: "text", placeholder: ph.hospital, required: true, half: true },
    { name: "country", label: f.country, type: "text", placeholder: ph.country, required: true, half: true },
    { name: "title", label: f.title, type: "select", options: f.titleOptions, required: true, half: true },
    { name: "years", label: f.years, type: "text", placeholder: ph.years, half: true },
    { name: "languages", label: f.languages, type: "text", placeholder: ph.languages, required: true, half: true },
    { name: "remote", label: f.remote, type: "select", options: f.remoteOptions, required: true, half: true },
    { name: "email", label: f.email, type: "email", placeholder: ph.email, required: true, half: true },
    { name: "phone", label: f.phone, type: "tel", placeholder: ph.phone, required: true, half: true },
    { name: "license", label: f.license, type: "text" },
  ];

  return (
    <Section className="bg-slate-50">
      <div className="mx-auto max-w-2xl">
        <RegisterHeader
          lang={lang}
          backLabel={t.nav.register}
          title={t.register.doctorTitle}
          desc={t.register.doctorDesc}
        />
        <RegisterForm role="doctor" fields={fields} lang={lang} dict={t} />
      </div>
    </Section>
  );
}
