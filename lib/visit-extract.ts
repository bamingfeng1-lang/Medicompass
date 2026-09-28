import Anthropic from "@anthropic-ai/sdk";

// Stateless AI extraction of 就诊记录 (visit records) from a batch of report
// photos. Reads ALL images in one vision call and returns draft visit groups
// clustered by date + patient + hospital. Persists nothing — the caller route
// returns the drafts to the client, which lets the user review/edit and then
// creates the visits via the normal POST /api/mobile/visits path.

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

const SUPPORTED_IMG = new Set(["image/png", "image/jpeg", "image/webp"]);
const SUPPORTED_DOC = new Set(["application/pdf"]);
const VISIT_TYPES = ["outpatient", "emergency", "inpatient", "checkup", "other"];

type ImageInput = { data: Buffer; mime: string; name: string };

/** A structured lab/test result read off a report — surfaced later as a 关注指标. */
export type LabResult = {
  name: string;
  value: number;
  unit: string;
  refLow: number | null;
  refHigh: number | null;
};

export type VisitGroupDraft = {
  visitDate: string; // "YYYY-MM-DD" or "" when unknown
  patientName: string;
  hospital: string;
  department: string;
  doctor: string;
  visitType: string; // whitelisted
  diagnosis: string;
  summary: string;
  labResults: LabResult[]; // structured numeric results (esp. abnormal ones)
  imageIndexes: number[]; // 0-based, into the input file order
};

type ImageBlock = {
  type: "image";
  source: { type: "base64"; media_type: "image/png" | "image/jpeg" | "image/webp"; data: string };
};
type DocumentBlock = {
  type: "document";
  source: { type: "base64"; media_type: "application/pdf"; data: string };
};
type TextBlock = { type: "text"; text: string };

function systemPrompt(zh: boolean): string {
  return zh
    ? `你是 Medicompass 健康助手，负责把一批就诊/体检/检验单据照片整理成结构化的「就诊记录」。
用户会按顺序提供多张图片（编号从 0 开始）。请把属于【同一次就诊】的图片归为一组——判断依据是「就诊日期 + 就诊人姓名 + 医院」三者一致。不同日期、不同就诊人或不同医院应拆成不同组。
仅依据图片可见内容，不臆测；无法判断的字段留空字符串 ""。
只输出一个 JSON 数组，不要任何解释或代码块标记。数组每个元素形如：
{"visitDate":"YYYY-MM-DD","patientName":"","hospital":"","department":"","doctor":"","visitType":"outpatient","diagnosis":"","summary":"","labResults":[{"name":"","value":0,"unit":"","refLow":null,"refHigh":null}],"imageIndexes":[0]}
说明：
- visitType 取值仅限：outpatient(门诊) | emergency(急诊) | inpatient(住院) | checkup(体检) | other(其他)；体检报告用 checkup，无法判断用 outpatient。
- diagnosis：该次就诊的诊断（如有）。
- summary：对该次就诊关键信息的中文归纳（1-3 句，如主要异常指标、结论、医嘱要点）。
- labResults：从检验/体检单上清晰印刷的化验指标里抽取，**优先异常项**（数值超出参考范围，或旁边带 ↑/↓/H/L/高/低 等标记的）。每项：name=指标名称，value=数值（纯数字），unit=单位，refLow=参考范围下限（无则 null），refHigh=参考范围上限（无则 null）。只放能明确读出数值的项；读不清或非数字就不要放；没有检验指标时用 []。
- imageIndexes：属于该组的图片编号数组（0 起）；每张图片必须且只能归入一组。`
    : `You are the Medicompass health assistant. Organize a batch of visit/checkup/lab document photos into structured visit records.
The user provides multiple images in order (0-based index). Group images belonging to the SAME visit together — judged by matching visit date + patient name + hospital. Different date, patient, or hospital means a separate group.
Use ONLY what is visible; do not guess. Leave any unknown field as an empty string "".
Output ONLY a JSON array, with no prose and no code fences. Each element looks like:
{"visitDate":"YYYY-MM-DD","patientName":"","hospital":"","department":"","doctor":"","visitType":"outpatient","diagnosis":"","summary":"","labResults":[{"name":"","value":0,"unit":"","refLow":null,"refHigh":null}],"imageIndexes":[0]}
Notes:
- visitType must be one of: outpatient | emergency | inpatient | checkup | other; use checkup for physical-exam reports, outpatient when unsure.
- diagnosis: the visit's diagnosis if present.
- summary: a concise English summary of the visit's key information (1-3 sentences: main abnormal values, conclusions, advice).
- labResults: structured numeric lab/test results clearly printed on the report, **prioritizing abnormal ones** (value outside the reference range, or flagged with ↑/↓/H/L/high/low nearby). Each: name, value (plain number), unit, refLow (reference-range low, null if absent), refHigh (reference-range high, null if absent). Only include results whose value you can read clearly; skip anything illegible or non-numeric; use [] when there are none.
- imageIndexes: the 0-based indexes belonging to this group; every image must be assigned to exactly one group.`;
}

function clampType(v: unknown): string {
  return typeof v === "string" && VISIT_TYPES.includes(v) ? v : "outpatient";
}
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function numOrNull(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Parse & validate a group's labResults; keeps only clearly-numeric named results. */
function parseLabResults(v: unknown): LabResult[] {
  if (!Array.isArray(v)) return [];
  const out: LabResult[] = [];
  for (const raw of v) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const name = str(r.name).trim();
    const value = numOrNull(r.value);
    if (!name || value == null) continue;
    out.push({ name, value, unit: str(r.unit).trim(), refLow: numOrNull(r.refLow), refHigh: numOrNull(r.refHigh) });
    if (out.length >= 20) break;
  }
  return out;
}

/**
 * Extracts draft visit groups from the given images. Never throws for parsing
 * issues — on any failure it falls back to a single group containing all
 * images so the client can still let the user fill it in manually.
 */
export async function extractVisits(images: ImageInput[], locale: string): Promise<VisitGroupDraft[]> {
  const zh = (locale || "").startsWith("zh");
  const usable = images
    .map((img, i) => ({ img, i }))
    .filter((x) => SUPPORTED_IMG.has(x.img.mime) || SUPPORTED_DOC.has(x.img.mime));

  const allIndexes = images.map((_, i) => i);
  const fallback: VisitGroupDraft[] = [
    { visitDate: "", patientName: "", hospital: "", department: "", doctor: "",
      visitType: "outpatient", diagnosis: "", summary: "", labResults: [], imageIndexes: allIndexes },
  ];

  if (usable.length === 0) return fallback;
  if (!process.env.ANTHROPIC_API_KEY) return fallback;

  try {
    const blocks: (TextBlock | ImageBlock | DocumentBlock)[] = [
      {
        type: "text",
        text: zh
          ? `共 ${usable.length} 份资料（图片或 PDF），编号如下。请据此整理就诊记录。`
          : `There are ${usable.length} documents (images or PDFs) with the indexes below. Organize them into visit records.`,
      },
    ];
    for (const { img, i } of usable) {
      blocks.push({ type: "text", text: zh ? `【资料 ${i}】` : `[Document ${i}]` });
      if (SUPPORTED_DOC.has(img.mime)) {
        blocks.push({
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: img.data.toString("base64"),
          },
        });
      } else {
        blocks.push({
          type: "image",
          source: {
            type: "base64",
            media_type: img.mime as "image/png" | "image/jpeg" | "image/webp",
            data: img.data.toString("base64"),
          },
        });
      }
    }

    const client = new Anthropic({ baseURL: process.env.ANTHROPIC_BASE_URL || undefined });
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: systemPrompt(zh),
      messages: [{ role: "user", content: blocks }],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return fallback;
    const parsed = JSON.parse(match[0]) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return fallback;

    const valid = new Set(allIndexes);
    const assigned = new Set<number>();
    const groups: VisitGroupDraft[] = [];
    for (const raw of parsed) {
      if (!raw || typeof raw !== "object") continue;
      const g = raw as Record<string, unknown>;
      const idxs = Array.isArray(g.imageIndexes)
        ? (g.imageIndexes as unknown[])
            .map((n) => Number(n))
            .filter((n) => Number.isInteger(n) && valid.has(n) && !assigned.has(n))
        : [];
      for (const n of idxs) assigned.add(n);
      groups.push({
        visitDate: str(g.visitDate),
        patientName: str(g.patientName),
        hospital: str(g.hospital),
        department: str(g.department),
        doctor: str(g.doctor),
        visitType: clampType(g.visitType),
        diagnosis: str(g.diagnosis),
        summary: str(g.summary),
        labResults: parseLabResults(g.labResults),
        imageIndexes: idxs,
      });
    }

    if (groups.length === 0) return fallback;

    // Never lose an image: any unassigned indexes go to the last group.
    const leftover = allIndexes.filter((n) => !assigned.has(n));
    if (leftover.length > 0) {
      groups[groups.length - 1].imageIndexes.push(...leftover);
    }
    // Drop empty groups (no images) to avoid creating attachment-less records.
    const nonEmpty = groups.filter((g) => g.imageIndexes.length > 0);
    return nonEmpty.length > 0 ? nonEmpty : fallback;
  } catch {
    return fallback;
  }
}
