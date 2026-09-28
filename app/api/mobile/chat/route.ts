import Anthropic from "@anthropic-ai/sdk";
import { getMobileUser, resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import {
  resolveBillingScope,
  checkAndConsume,
  QuotaError,
  quotaExceeded,
  type BillingScope,
} from "@/lib/entitlements";
import { detectRedFlag } from "@/lib/red-flags";
import { assessConfidence } from "@/lib/ai-confidence";
import { hasActiveConsent, consentRequired } from "@/lib/consent";
import { withMedicalRecords } from "@/lib/medical-records";

// Streaming chat endpoint for the Medicompass iOS app.
// Reuses the same Anthropic setup as lib/ai.ts. Returns Server-Sent Events:
//   data: {"delta":"..."}\n\n   (repeated)
//   data: [DONE]\n\n
//
// When a valid `Authorization: Bearer` token is present, the conversation is
// persisted: the latest user turn and the full assistant reply are written to
// the user's most recent ChatThread (created on demand). Anonymous requests
// still work (nothing is stored) for backward compatibility.
//
// GET returns the authenticated user's latest thread history.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

function systemPrompt(locale: string): string {
  const zh = (locale || "").startsWith("zh");
  if (zh) {
    return `你是 Medicompass（迈缔康）的健康与运动管理 AI 助手，服务欧美用户。
你可以结合用户的 Apple 健康数据（心率、HRV、睡眠、活动、血氧等）、体检报告与生活方式，
提供通俗、可执行的健康、运动与营养建议。语气专业、温暖、简洁。
重要规则：
- 你提供的是健康信息参考，不构成医疗诊断，也不能替代执业医师。
- 遇到高风险信号（如胸痛、呼吸困难、疑似急症）时，建议用户立即就医或联系真人医生。
- 不臆测、不编造；信息不足时主动询问。`;
  }
  return `You are the Medicompass health & fitness AI assistant for US/EU users.
Combine the user's Apple Health data (heart rate, HRV, sleep, activity, blood oxygen),
screening reports and lifestyle to give clear, actionable health, exercise and nutrition guidance.
Be professional, warm and concise.
Important rules:
- You provide general wellness information, not a medical diagnosis, and do not replace a licensed physician.
- For high-risk signs (chest pain, difficulty breathing, suspected emergency), advise the user to seek urgent care or a human doctor.
- Do not fabricate; ask for missing details when needed.`;
}

type InMessage = { role?: string; content?: unknown };

// Appends the caller-supplied Apple Health snapshot to the system prompt, so the
// assistant can actually read and analyze the user's current metrics/activity.
function withHealthContext(base: string, locale: string, healthContext?: string): string {
  const snapshot = (healthContext ?? "").trim();
  if (!snapshot) return base;
  const zh = (locale || "").startsWith("zh");
  const header = zh
    ? "\n\n以下是用户当前的 Apple 健康数据快照，请据此分析：\n"
    : "\n\nHere is the user's current Apple Health snapshot — analyze based on it:\n";
  return base + header + snapshot;
}

// Appends the signed-in user's recent visit records and uploaded reports (with AI
// readings) so the assistant can reference the patient's own medical history.
// Loaded server-side from the DB — these live in the backend, not on-device.
// GET /api/mobile/chat — latest thread history for the active profile.
export async function GET(req: Request): Promise<Response> {
  const caller = await getMobileUser(req);
  if (!caller) return Response.json({ messages: [] });
  const prof = await resolveProfile(req);
  if (!prof.ok) return prof.response;
  const user = prof.profile;
  const thread = await prisma.chatThread.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { turns: { orderBy: { createdAt: "asc" } } },
  });
  const messages = (thread?.turns ?? []).map((t) => ({
    role: t.role,
    content: t.content,
    reviewStatus: t.reviewStatus,
  }));
  return Response.json({ messages });
}

export async function POST(req: Request): Promise<Response> {
  let body: { messages?: InMessage[]; locale?: string; healthContext?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const locale = typeof body.locale === "string" ? body.locale : "en";
  const healthContext = typeof body.healthContext === "string" ? body.healthContext : undefined;

  // Normalize + ensure the conversation starts with a user turn (Anthropic requirement).
  const normalized = (body.messages ?? []).map((m) => ({
    role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: String(m.content ?? ""),
  }));
  while (normalized.length && normalized[0].role !== "user") normalized.shift();

  if (!normalized.length) {
    return Response.json({ error: "No user message provided" }, { status: 400 });
  }

  // Deterministic emergency symptom check on the latest user turn — a safety net
  // independent of the model. Emitted to the client before the reply streams.
  const redFlag = detectRedFlag(normalized[normalized.length - 1].content);

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Missing ANTHROPIC_API_KEY on the server." },
      { status: 503 },
    );
  }

  // Optional persistence: resolve the signed-in caller, then the active profile
  // (a caregiver may chat on behalf of a managed family member). Anonymous
  // requests carry no token and skip persistence/quota entirely.
  const caller = await getMobileUser(req);
  let user = caller;
  if (caller) {
    const prof = await resolveProfile(req);
    if (!prof.ok) return prof.response;
    user = prof.profile;
  }

  // Cross-border transfer consent (PIPL 单独同意): the AI provider is overseas, so
  // a signed-in user's data may not be sent without an active cross-border consent
  // on their account. Anonymous requests carry no identity and are exempt.
  if (caller && !(await hasActiveConsent(caller.id, "crossborder"))) {
    return consentRequired("crossborder");
  }

  // Backend-enforced AI quota (signed-in users only; anonymous is unlimited for
  // backward compat). Consume one turn before doing any work; 402 when over.
  let scope: BillingScope | null = null;
  if (user) {
    scope = await resolveBillingScope(user);
    try {
      await checkAndConsume(scope, "aiChats", 1);
    } catch (err) {
      if (err instanceof QuotaError) return quotaExceeded(err);
      throw err;
    }
  }

  let threadId: string | null = null;
  if (user) {
    const existing = await prisma.chatThread.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    const thread = existing ?? (await prisma.chatThread.create({ data: { userId: user.id } }));
    threadId = thread.id;
    const lastUser = normalized[normalized.length - 1];
    if (lastUser.role === "user") {
      await prisma.chatTurn.create({
        data: { threadId, role: "user", content: lastUser.content, reviewStatus: "none" },
      });
      await prisma.chatThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });
    }
  }

  const client = new Anthropic({ baseURL: process.env.ANTHROPIC_BASE_URL || undefined });
  const encoder = new TextEncoder();

  // Build the system prompt once: base + on-device Apple Health snapshot +
  // (for signed-in users) their visit/report records loaded from the DB.
  let system = withHealthContext(systemPrompt(locale), locale, healthContext);
  if (user) {
    try {
      system = await withMedicalRecords(system, locale, user.id);
    } catch {
      // Non-fatal: fall back to the health-only prompt.
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      let assistantText = "";
      let confidence: { lowConfidence: boolean; reasons: string[] } | null = null;
      const lastQuestion = normalized[normalized.length - 1].content;
      // Surface the emergency flag first, so the app can raise the one-tap
      // emergency-dial banner immediately — even before / regardless of the reply.
      if (redFlag.matched) send({ redFlag: true, terms: redFlag.terms });
      try {
        const anthropicStream = await client.messages.create({
          model: MODEL,
          max_tokens: 1024,
          system,
          messages: normalized,
          stream: true,
        });
        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            assistantText += event.delta.text;
            send({ delta: event.delta.text });
          }
        }
        // Deterministic, LLM-independent confidence check on the finished answer:
        // a low-confidence verdict tells the app to raise a stronger "consult a
        // doctor" advisory, and is logged below for quality review.
        if (assistantText.trim()) {
          confidence = assessConfidence(lastQuestion, assistantText);
          if (confidence.lowConfidence) {
            send({ lowConfidence: true, reasons: confidence.reasons });
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        send({ error: err instanceof Error ? err.message : String(err) });
      } finally {
        controller.close();
        // Persist the assistant reply after streaming completes.
        if (threadId && assistantText.trim()) {
          prisma.chatTurn
            .create({
              data: { threadId, role: "assistant", content: assistantText, reviewStatus: "aiDone" },
            })
            .catch(() => {});
        }
        // Persist the confidence audit log (signed-in only; reasons are PHI-free
        // codes). Never blocks or breaks the stream.
        if (user && confidence) {
          prisma.aiConfidenceLog
            .create({
              data: {
                userId: user.id,
                threadId,
                locale,
                lowConfidence: confidence.lowConfidence,
                reasons: JSON.stringify(confidence.reasons),
              },
            })
            .catch(() => {});
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
