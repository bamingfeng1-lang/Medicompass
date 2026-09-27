import type { Metadata } from "next";
import { LegalDoc, type LegalSection } from "@/components/LegalDoc";

export const metadata: Metadata = {
  title: "用户协议 User Agreement",
  description:
    "Medicompass 迈缔康 用户协议 / User Agreement — the terms governing your use of the service.",
};

const UPDATED = "2026-09-27";

/**
 * Skeleton section outline for the user agreement (terms of service). Bodies are
 * placeholder summaries of what each clause must cover; legal replaces them with
 * the formal, reviewed text. The medical-disclaimer, doctor-review, and payment
 * clauses reflect the app's actual model (AI assistant + optional doctor review,
 * tiered subscriptions via the App Store).
 */
const SECTIONS: LegalSection[] = [
  {
    headingZh: "协议的接受",
    headingEn: "Acceptance of Terms",
    bodyZh: [
      "注册或使用迈缔康（Medicompass）即表示你已阅读、理解并同意本协议及《隐私政策》。",
      "若你不同意本协议，请勿使用本服务。",
    ],
    bodyEn: [
      "By registering for or using Medicompass, you confirm that you have read, understood, and agreed to this Agreement and the Privacy Policy.",
      "If you do not agree, please do not use the service.",
    ],
  },
  {
    headingZh: "服务说明",
    headingEn: "Description of Service",
    bodyZh: [
      "本服务提供诊后健康管理、AI 健康助手、报告解读、图文问诊转介与家庭健康管理等功能。",
      "部分功能为付费订阅，具体权益以 App 内展示为准。",
    ],
    bodyEn: [
      "The service provides post-diagnosis health management, an AI health assistant, report interpretation, doctor-consult referral, and family health management.",
      "Some features require a paid subscription; the applicable entitlements are those shown in the app.",
    ],
  },
  {
    headingZh: "非医疗建议声明",
    headingEn: "Not Medical Advice",
    bodyZh: [
      "本服务及其 AI 助手提供的内容仅供健康信息参考，不构成医疗诊断、治疗方案或专业医疗建议。",
      "任何健康决策应咨询具备资质的执业医生。出现紧急症状请立即拨打当地急救电话。",
      "医生审核（如提供）由第三方执业医生完成，其意见不代表本平台立场。",
    ],
    bodyEn: [
      "The service and its AI assistant provide health information for reference only and do not constitute medical diagnosis, treatment, or professional medical advice.",
      "Consult a qualified licensed physician for any health decision. In an emergency, call your local emergency number immediately.",
      "Doctor review, where offered, is performed by third-party licensed physicians; their opinions do not represent the platform.",
    ],
  },
  {
    headingZh: "账户与家庭成员",
    headingEn: "Accounts and Family Members",
    bodyZh: [
      "你应对账户凭据的保密及账户下的活动负责。",
      "创建家庭或被照护者档案的用户，应确保已获得相关个人的合法授权。",
    ],
    bodyEn: [
      "You are responsible for keeping your credentials confidential and for activity under your account.",
      "Users who create family or managed profiles must ensure they have the legal authority of the persons involved.",
    ],
  },
  {
    headingZh: "用户行为规范",
    headingEn: "User Conduct",
    bodyZh: [
      "你不得上传虚假、侵权或违法内容，不得滥用、干扰或试图破坏本服务。",
      "你对自行上传的资料的合法性与准确性负责。",
    ],
    bodyEn: [
      "You must not upload false, infringing, or unlawful content, or abuse, disrupt, or attempt to compromise the service.",
      "You are responsible for the legality and accuracy of the materials you upload.",
    ],
  },
  {
    headingZh: "订阅、付费与退款",
    headingEn: "Subscriptions, Payment, and Refunds",
    bodyZh: [
      "付费订阅通过 Apple App Store 进行，计费、续订与退款适用 Apple 的相关条款。",
      "订阅将按周期自动续订，除非你在当前周期结束前取消。",
    ],
    bodyEn: [
      "Paid subscriptions are processed through the Apple App Store; billing, renewal, and refunds are subject to Apple's terms.",
      "Subscriptions auto-renew each period unless you cancel before the current period ends.",
    ],
  },
  {
    headingZh: "知识产权",
    headingEn: "Intellectual Property",
    bodyZh: [
      "本服务的软件、商标与内容归本平台或其许可方所有。",
      "你保留自行上传内容的权利，并授予本平台为提供服务所必需的处理许可。",
    ],
    bodyEn: [
      "The software, trademarks, and content of the service belong to the platform or its licensors.",
      "You retain rights to content you upload and grant the platform the license necessary to process it in order to provide the service.",
    ],
  },
  {
    headingZh: "责任限制",
    headingEn: "Limitation of Liability",
    bodyZh: [
      "在法律允许的最大范围内，本平台不对因使用或依赖 AI 或信息类内容而产生的间接或后果性损害承担责任。",
    ],
    bodyEn: [
      "To the maximum extent permitted by law, the platform is not liable for indirect or consequential damages arising from use of, or reliance on, AI or informational content.",
    ],
  },
  {
    headingZh: "协议终止",
    headingEn: "Termination",
    bodyZh: [
      "你可随时停止使用并注销账户；我们可在你违反本协议时暂停或终止服务。",
    ],
    bodyEn: [
      "You may stop using the service and delete your account at any time; we may suspend or terminate the service if you breach this Agreement.",
    ],
  },
  {
    headingZh: "适用法律与协议变更",
    headingEn: "Governing Law and Changes",
    bodyZh: [
      "本协议的适用法律与争议解决以正式发布版本为准。",
      "我们可能更新本协议，重大变更将通过 App 或邮件通知你。",
    ],
    bodyEn: [
      "The governing law and dispute resolution are as stated in the officially published version.",
      "We may update this Agreement; we will notify you of material changes via the app or email.",
    ],
  },
];

export default function UserAgreementPage() {
  return (
    <LegalDoc
      titleZh="用户协议"
      titleEn="User Agreement"
      updated={UPDATED}
      sections={SECTIONS}
    />
  );
}
