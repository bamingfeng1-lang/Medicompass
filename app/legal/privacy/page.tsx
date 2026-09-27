import type { Metadata } from "next";
import { LegalDoc, type LegalSection } from "@/components/LegalDoc";

export const metadata: Metadata = {
  title: "隐私政策 Privacy Policy",
  description:
    "Medicompass 迈缔康 隐私政策 / Privacy Policy — how we collect, use, store and protect your health data.",
};

const UPDATED = "2026-09-27";

/**
 * Skeleton section outline for the privacy policy. The bodies are placeholder
 * summaries describing WHAT each clause must cover; legal replaces them with the
 * formal, reviewed text. The outline is scoped to the app's actual data flows:
 * health PHI (reports, visits, vitals, chat), family/caregiver sharing,
 * cross-border processing, and the AI assistant.
 */
const SECTIONS: LegalSection[] = [
  {
    headingZh: "我们收集的信息",
    headingEn: "Information We Collect",
    bodyZh: [
      "账户信息：邮箱、姓名、登录验证码记录。",
      "健康数据（敏感个人信息）：就诊记录、体检/检验报告、用药、体征数据，以及你授权同步的 Apple 健康数据。",
      "使用信息：AI 问答与图文问诊内容、设备与日志信息。",
    ],
    bodyEn: [
      "Account data: email, name, and login verification-code records.",
      "Health data (sensitive personal information): visit records, lab/checkup reports, medications, vitals, and Apple Health data you choose to sync.",
      "Usage data: AI assistant and doctor-consult content, device and log information.",
    ],
  },
  {
    headingZh: "我们如何使用信息",
    headingEn: "How We Use Information",
    bodyZh: [
      "提供诊后管理、AI 健康助手、报告解读与医生审核等核心功能。",
      "在你同意的范围内，向家庭成员/照护者共享提醒与健康摘要。",
      "保障服务安全、履行法律义务、改进产品（去标识化后）。",
    ],
    bodyEn: [
      "To provide post-diagnosis management, the AI health assistant, report interpretation, and doctor review.",
      "To share alerts and health summaries with family members/caregivers within the scope you authorize.",
      "To secure the service, meet legal obligations, and improve the product (using de-identified data).",
    ],
  },
  {
    headingZh: "AI 辅助的性质与限制",
    headingEn: "Nature and Limits of AI Assistance",
    bodyZh: [
      "AI 助手提供的是健康信息参考，不构成医疗诊断或治疗建议，不能替代执业医生的面诊。",
      "对高风险问题或不确定的回答，我们会提示你咨询医生或线下就诊。",
    ],
    bodyEn: [
      "The AI assistant provides health information for reference only; it is not a medical diagnosis or treatment advice and does not replace an in-person consultation with a licensed physician.",
      "For high-stakes questions or uncertain answers, we prompt you to consult a doctor or seek in-person care.",
    ],
  },
  {
    headingZh: "共享与委托处理",
    headingEn: "Sharing and Processors",
    bodyZh: [
      "我们不出售你的个人信息。",
      "仅在提供服务所必需时，委托受合同约束的第三方处理者（如 AI 模型服务、云与邮件服务）处理数据。",
      "家庭账户内的共享由账户角色与你的授权控制。",
    ],
    bodyEn: [
      "We do not sell your personal information.",
      "We engage contractually bound third-party processors (e.g., AI model, cloud, and email providers) only as necessary to deliver the service.",
      "Sharing within a family account is controlled by account roles and your authorization.",
    ],
  },
  {
    headingZh: "跨境数据传输",
    headingEn: "Cross-Border Data Transfer",
    bodyZh: [
      "作为跨境医旅平台，你的部分数据可能在境外处理。启用跨境相关功能前，我们会取得你的单独同意。",
      "跨境传输将采用适当的法律机制与保护措施（如标准合同条款）。",
    ],
    bodyEn: [
      "As a cross-border medical-travel platform, some of your data may be processed outside your jurisdiction. We obtain your separate consent before enabling cross-border features.",
      "Cross-border transfers rely on appropriate legal mechanisms and safeguards (e.g., standard contractual clauses).",
    ],
  },
  {
    headingZh: "数据存储与安全",
    headingEn: "Storage and Security",
    bodyZh: [
      "我们对敏感字段采用加密存储，并实施访问控制、审计日志等技术与管理措施。",
      "数据保留期限以实现目的所必需为限，法律另有要求的除外。",
    ],
    bodyEn: [
      "We store sensitive fields encrypted and apply technical and organizational measures such as access controls and audit logging.",
      "We retain data only as long as necessary for the stated purposes, unless a longer period is required by law.",
    ],
  },
  {
    headingZh: "你的权利",
    headingEn: "Your Rights",
    bodyZh: [
      "你可访问、更正、导出与删除你的个人信息，并可撤回同意。",
      "App 内提供数据导出与资料修改历史；账户注销将删除或匿名化相关数据。",
    ],
    bodyEn: [
      "You may access, correct, export, and delete your personal information, and withdraw consent.",
      "The app offers data export and an edit-history record; account deletion removes or anonymizes the associated data.",
    ],
  },
  {
    headingZh: "未成年人与被照护者",
    headingEn: "Minors and Managed Profiles",
    bodyZh: [
      "为未成年人或被照护者建立档案的用户，应确保已获得合法授权。",
    ],
    bodyEn: [
      "Users who create profiles for minors or managed dependents must ensure they have the legal authority to do so.",
    ],
  },
  {
    headingZh: "政策更新",
    headingEn: "Changes to This Policy",
    bodyZh: [
      "我们可能更新本政策，重大变更将通过 App 或邮件通知你。",
    ],
    bodyEn: [
      "We may update this policy; we will notify you of material changes via the app or email.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalDoc
      titleZh="隐私政策"
      titleEn="Privacy Policy"
      updated={UPDATED}
      sections={SECTIONS}
    />
  );
}
