import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { isLocale, type Locale } from "@/lib/brand";

export function generateMetadata({ params }: { params: { lang: string } }): Metadata {
  const lang = isLocale(params.lang) ? params.lang : "zh";
  return { title: lang === "zh" ? "免责申明 - Medicompass" : "Disclaimer - Medicompass" };
}

export default function DisclaimerPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  const items = lang === "zh"
    ? [
        "本报价单中所有服务项目及价格仅供参考，最终以双方签署的正式服务协议为准。",
        "本机构作为医疗服务中介，不提供任何医疗诊断或治疗服务，不对医院医疗质量及治疗效果承担责任。",
        "医疗费用由医院按其标准直接向患者收取，与本机构服务费无关。",
        "美元价格为按参考汇率折算的参考值，实际结算金额以付款当日汇率为准，汇率波动不构成价格调整依据。",
        "因患者自身原因导致服务无法继续的，已收费用按退款政策执行。",
        "因不可抗力（自然灾害、疫情、政策变化等）导致服务无法进行的，双方协商解决。",
        "本机构承诺保护患者隐私，所有病历资料仅在服务范围内使用，未经授权不向第三方泄露。",
      ]
    : [
        "All items and prices herein are for reference only; the signed service agreement prevails.",
        "As a medical service intermediary, this agency does not provide medical diagnosis or treatment and is not liable for hospital quality or treatment outcomes.",
        "Medical fees are charged directly by the hospital per their standards and are unrelated to this agency's service fees.",
        "USD prices are reference conversions; actual settlement at exchange rate on payment date. Rate fluctuations do not constitute grounds for price adjustment.",
        "If service cannot continue due to patient's own reasons, refund policy applies.",
        "Force majeure (natural disasters, epidemics, policy changes): resolved through mutual consultation.",
        "This agency commits to patient privacy; all medical records used solely within service scope, no unauthorized third-party disclosure.",
      ];

  return (
    <Section className="bg-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">
          {lang === "zh" ? "免责申明" : "Disclaimer"}
        </h1>
        <ul className="mt-8 space-y-4">
          {items.map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-deep" />
              <p className="text-sm leading-relaxed text-slate-700">{item}</p>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-center text-xs text-slate-400">
          © 2026 Medicompass. All rights reserved.
        </p>
      </div>
    </Section>
  );
}
