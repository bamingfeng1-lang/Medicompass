// Deterministic red-flag (emergency) symptom detection.
//
// This is a SAFETY NET that does NOT depend on the LLM: if a user's message
// contains a high-risk symptom, the caller surfaces an emergency prompt (and the
// iOS app a one-tap emergency dial) regardless of what the model chooses to say.
// It mirrors the on-device list in the app (Features/Assistant/RedFlags.swift) so
// both layers detect independently. Covers EN + 中文 phrasings.
//
// Intentionally high-recall / low-precision: an occasional false positive shows a
// dismissible "seek urgent care" banner, which is the safe failure mode.

const RED_FLAG_TERMS: string[] = [
  // Cardiac / chest
  "chest pain", "chest tightness", "crushing chest", "pressure in my chest", "tightness in my chest",
  "胸痛", "胸口痛", "胸闷", "胸口压", "心绞痛", "心口痛",
  // Breathing
  "can't breathe", "cannot breathe", "can not breathe", "difficulty breathing",
  "shortness of breath", "trouble breathing", "gasping for air",
  "呼吸困难", "喘不过气", "无法呼吸", "透不过气", "呼吸急促",
  // Stroke
  "stroke", "face drooping", "slurred speech", "numbness on one side", "sudden weakness",
  "中风", "脑卒中", "半身不遂", "偏瘫", "口齿不清", "面部下垂", "突然无力", "一侧麻木",
  // Bleeding / trauma
  "heavy bleeding", "coughing blood", "vomiting blood", "won't stop bleeding", "severe bleeding",
  "大出血", "咳血", "咯血", "吐血", "便血", "血流不止",
  // Consciousness
  "unconscious", "passed out", "fainted", "unresponsive", "seizure", "convulsion",
  "昏迷", "晕倒", "昏厥", "失去意识", "抽搐", "癫痫发作",
  // Suicide / self-harm
  "suicide", "kill myself", "end my life", "self harm", "self-harm", "hurt myself",
  "自杀", "轻生", "不想活了", "结束生命", "自残",
  // Anaphylaxis / severe allergy
  "anaphylaxis", "throat closing", "severe allergic reaction",
  "过敏性休克", "喉咙肿", "喉头水肿", "严重过敏",
  // Overdose / poisoning
  "overdose", "poisoning", "poisoned",
  "服药过量", "药物过量", "中毒",
];

export type RedFlagResult = { matched: boolean; terms: string[] };

/** Scan free text for any hardcoded emergency symptom. Case-insensitive. */
export function detectRedFlag(text: string): RedFlagResult {
  const hay = (text || "").toLowerCase();
  const terms = RED_FLAG_TERMS.filter((t) => hay.includes(t.toLowerCase()));
  return { matched: terms.length > 0, terms };
}
