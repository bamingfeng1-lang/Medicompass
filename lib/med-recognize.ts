import Anthropic from "@anthropic-ai/sdk";

// Stateless AI recognition of a medication box / label photo. Reads ONE image
// and returns a draft the client uses to prefill the add-medication form.
// Persists nothing; never throws — on any failure it returns an empty draft so
// the user can just fill the form in manually.

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const SUPPORTED_IMG = new Set(["image/png", "image/jpeg", "image/webp"]);
const MEAL_TIMINGS = ["before", "after", "with", "bedtime", ""];

type ImageInput = { data: Buffer; mime: string; name: string };

export type MedDraft = {
  nameZh: string;
  nameEn: string;
  dosage: string; // e.g. "500 mg" / "1 片"
  unit: string; // 片/粒/ml/袋
  unitsPerDose: number; // units per single dose, >=0
  timesPerDay: number; // daily frequency, >=0
  mealTiming: string; // before|after|with|bedtime|""
  quantity: number; // total units in the package if printed, else 0
};

type ImageBlock = {
  type: "image";
  source: { type: "base64"; media_type: "image/png" | "image/jpeg" | "image/webp"; data: string };
};
type TextBlock = { type: "text"; text: string };

const EMPTY: MedDraft = {
  nameZh: "", nameEn: "", dosage: "", unit: "",
  unitsPerDose: 1, timesPerDay: 0, mealTiming: "", quantity: 0,
};

function systemPrompt(zh: boolean): string {
  return zh
    ? `你是 Medicompass 健康助手，负责从一张药品包装盒 / 说明书 / 标签照片中读取用药信息。
仅依据图片可见内容，不臆测；读不到的字段留空字符串 "" 或 0。
只输出一个 JSON 对象，不要任何解释或代码块标记，形如：
{"nameZh":"","nameEn":"","dosage":"","unit":"","unitsPerDose":1,"timesPerDay":0,"mealTiming":"","quantity":0}
说明：
- nameZh/nameEn：药品中/英文名（能读到哪个填哪个）。
- dosage：单次剂量文本，如 "500 mg"、"1 片"。
- unit：计量单位，如 片/粒/ml/袋。
- unitsPerDose：每次服用的数量（数字），读不到给 1。
- timesPerDay：每天服用次数（数字），读不到给 0。
- mealTiming：用餐时机，仅限 before(饭前) | after(饭后) | with(随餐) | bedtime(睡前) | ""(未知)。
- quantity：整盒/整瓶总数量（数字），读不到给 0。`
    : `You are the Medicompass health assistant. Read medication info from one photo of a drug box / leaflet / label.
Use ONLY what is visible; do not guess. Leave unknown fields as "" or 0.
Output ONLY a JSON object, no prose and no code fences, like:
{"nameZh":"","nameEn":"","dosage":"","unit":"","unitsPerDose":1,"timesPerDay":0,"mealTiming":"","quantity":0}
Notes:
- nameZh/nameEn: Chinese / English drug name (fill whichever is legible).
- dosage: single-dose text, e.g. "500 mg", "1 tablet".
- unit: counting unit, e.g. tablet/capsule/ml/sachet.
- unitsPerDose: number of units per dose (number); use 1 if unknown.
- timesPerDay: doses per day (number); use 0 if unknown.
- mealTiming: one of before | after | with | bedtime | "" (unknown).
- quantity: total units in the whole package (number); 0 if unknown.`;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}
function meal(v: unknown): string {
  return typeof v === "string" && MEAL_TIMINGS.includes(v) ? v : "";
}

/**
 * Recognizes medication fields from one image. Never throws — returns an empty
 * draft on any parsing / API / config failure.
 */
export async function recognizeMedication(image: ImageInput, locale: string): Promise<MedDraft> {
  const zh = (locale || "").startsWith("zh");
  if (!SUPPORTED_IMG.has(image.mime)) return { ...EMPTY };
  if (!process.env.ANTHROPIC_API_KEY) return { ...EMPTY };

  try {
    const blocks: (TextBlock | ImageBlock)[] = [
      {
        type: "text",
        text: zh ? "请读取这张药品照片的用药信息。" : "Read the medication info from this photo.",
      },
      {
        type: "image",
        source: {
          type: "base64",
          media_type: image.mime as "image/png" | "image/jpeg" | "image/webp",
          data: image.data.toString("base64"),
        },
      },
    ];

    const client = new Anthropic({ baseURL: process.env.ANTHROPIC_BASE_URL || undefined });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: systemPrompt(zh),
      messages: [{ role: "user", content: blocks }],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { ...EMPTY };
    const g = JSON.parse(match[0]) as Record<string, unknown>;
    return {
      nameZh: str(g.nameZh),
      nameEn: str(g.nameEn),
      dosage: str(g.dosage),
      unit: str(g.unit),
      unitsPerDose: num(g.unitsPerDose, 1),
      timesPerDay: num(g.timesPerDay, 0),
      mealTiming: meal(g.mealTiming),
      quantity: Math.trunc(num(g.quantity, 0)),
    };
  } catch {
    return { ...EMPTY };
  }
}
