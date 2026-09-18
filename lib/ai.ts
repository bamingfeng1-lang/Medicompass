import { promises as fs } from "fs";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";

// AI summarization of a second-opinion application: patient-entered condition
// text + uploaded attachments (PDFs read as documents, images as vision blocks).

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

const SUPPORTED_DOC = new Set(["application/pdf"]);
const SUPPORTED_IMG = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const SYSTEM = `你是一名严谨的跨境医疗病历分析助理。请阅读客户填写的信息与上传的病历附件，
用简体中文输出结构化归纳，帮助医疗顾问快速把握病情。严格基于材料内容，不臆测、不编造；
材料未提及的用「未提供」。输出使用以下小标题：
一、基本信息与就医诉求
二、主诉与现病史
三、关键检查与检验结果
四、既往史 / 用药 / 过敏
五、当前诊断（如材料中有）
六、需要顾问关注的要点与信息缺口
最后附一行免责声明：「本总结由 AI 依据所提供材料自动生成，仅供内部初步参考，不构成医疗建议或诊断。」`;

type Block =
  | { type: "text"; text: string }
  | {
      type: "document";
      source: { type: "base64"; media_type: "application/pdf"; data: string };
    }
  | {
      type: "image";
      source: {
        type: "base64";
        media_type: "image/png" | "image/jpeg" | "image/webp";
        data: string;
      };
    };

/**
 * Generate (or regenerate) the AI summary for an application. Updates
 * aiSummaryStatus to done/failed. Safe to call fire-and-forget.
 */
export async function summarizeApplication(applicationId: string): Promise<void> {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { attachments: true },
  });
  if (!app) return;

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "缺少 ANTHROPIC_API_KEY，无法生成 AI 总结。请在 .env 中配置后重试。",
      );
    }

    await prisma.application.update({
      where: { id: applicationId },
      data: { aiSummaryStatus: "pending", aiSummaryError: null },
    });

    const blocks: Block[] = [];

    const fieldText = [
      `客户姓名：${app.fullName}`,
      `国家/地区：${app.country}`,
      `需求类型：${app.needType}`,
      app.destination ? `期望目的地：${app.destination}` : null,
      "",
      "客户自述病情：",
      app.condition || "（未填写）",
    ]
      .filter((l) => l !== null)
      .join("\n");

    blocks.push({
      type: "text",
      text: `以下是客户提交的国际二诊申请信息，请据此进行归纳总结。\n\n${fieldText}`,
    });

    const skipped: string[] = [];
    for (const att of app.attachments) {
      try {
        if (SUPPORTED_DOC.has(att.mimeType)) {
          const data = (await fs.readFile(att.storedPath)).toString("base64");
          blocks.push({ type: "text", text: `【附件：${att.originalName}】` });
          blocks.push({
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data },
          });
        } else if (SUPPORTED_IMG.has(att.mimeType)) {
          const data = (await fs.readFile(att.storedPath)).toString("base64");
          blocks.push({ type: "text", text: `【附件（图片）：${att.originalName}】` });
          blocks.push({
            type: "image",
            source: {
              type: "base64",
              media_type: att.mimeType as "image/png" | "image/jpeg" | "image/webp",
              data,
            },
          });
        } else {
          skipped.push(`${att.originalName}（${att.mimeType}）`);
        }
      } catch {
        skipped.push(`${att.originalName}（读取失败）`);
      }
    }

    if (skipped.length) {
      blocks.push({
        type: "text",
        text: `注意：以下附件类型暂不支持自动解析，未纳入分析：${skipped.join("、")}。`,
      });
    }

    const client = new Anthropic({
      baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
    });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      messages: [{ role: "user", content: blocks }],
    });

    const summary = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        aiSummary: summary || "（模型未返回内容）",
        aiSummaryStatus: "done",
        aiSummaryError: null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.application.update({
      where: { id: applicationId },
      data: { aiSummaryStatus: "failed", aiSummaryError: message },
    });
  }
}
