import Anthropic from "@anthropic-ai/sdk";

// Daily-briefing endpoint for the iOS dashboard. Takes a short summary string of
// today's Apple Health metrics and returns one concise briefing paragraph.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

export async function POST(req: Request): Promise<Response> {
  let body: { summary?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const locale = typeof body.locale === "string" ? body.locale : "en";
  const zh = locale.startsWith("zh");
  const summary = typeof body.summary === "string" ? body.summary : "";

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Missing ANTHROPIC_API_KEY on the server." }, { status: 503 });
  }

  const system = zh
    ? `你是 Medicompass 健康助手。根据用户当日 Apple 健康指标，用 1-2 句中文生成一段温暖、鼓励、可执行的每日简报。不要罗列全部指标，聚焦最值得关注的一点并给出今日建议。若发现明显异常或持续偏离常见范围的指标，请明确提醒用户及时就医或咨询医生。不构成医疗诊断。`
    : `You are the Medicompass health assistant. From today's Apple Health metrics, write a warm, encouraging, actionable daily briefing in 1-2 sentences. Do not list every metric; focus on the most relevant point and give one suggestion for today. If a metric looks clearly abnormal or persistently out of the usual range, explicitly advise the user to see a doctor or seek care. Not a medical diagnosis.`;

  const userText = zh
    ? `今日指标：${summary || "（暂无数据）"}`
    : `Today's metrics: ${summary || "(no data)"}`;

  try {
    const client = new Anthropic({ baseURL: process.env.ANTHROPIC_BASE_URL || undefined });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      system,
      messages: [{ role: "user", content: userText }],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return Response.json({ text });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
