// Deterministic AI-answer confidence assessment.
//
// A SAFETY NET independent of the LLM: rather than trusting the model to report
// its own confidence (which over-confident models do poorly), we deterministically
// flag answers that should NOT be relied on — either because the QUESTION asks for
// something an AI must not decide (a diagnosis, a prognosis, a medication change),
// or because the ANSWER itself signals uncertainty.
//
// A low-confidence verdict drives a stronger "consult a doctor" advisory in the app
// and is written to an audit log (AiConfidenceLog) for later quality review — a
// hedge against AI over-confidence silently misleading a patient.
//
// Reasons are generic CODES (no PHI / no free text), safe to persist unencrypted.
// Intentionally high-recall / low-precision: an extra "see a doctor" nudge is a safe
// failure mode. Covers EN + 中文 phrasings.

// Questions that request a clinical decision an AI must not be relied on to make.
const HIGH_STAKES_INTENT: string[] = [
  // Diagnosis / prognosis (EN)
  "do i have", "what disease", "what's wrong with me", "whats wrong with me",
  "diagnose", "is it cancer", "is this cancer", "is it malignant", "is it benign",
  "am i dying", "how long do i have", "is this serious", "is it serious",
  "will i die", "could it be cancer", "is it a tumor", "is it a tumour",
  // Medication decisions (EN)
  "should i stop taking", "should i take", "can i stop taking", "can i stop my",
  "how much should i take", "increase my dose", "decrease my dose", "double my dose",
  "change my medication", "switch my medication", "stop my medication",
  "is it safe to take", "can i take these together", "can i mix",
  // 诊断 / 预后（中文）
  "我得了什么病", "我是不是得了", "我得了", "什么病", "是不是癌", "是癌症吗",
  "癌症吗", "确诊", "诊断我", "帮我诊断", "会不会是癌", "是不是肿瘤", "恶性还是良性",
  "良性还是恶性", "严重吗", "严不严重", "要紧吗", "会死吗", "会不会死", "能活多久",
  "还能活", "有生命危险吗",
  // 用药决策（中文）
  "要不要停药", "能停药吗", "可以停药", "该不该吃", "该吃多少", "吃多少", "加量",
  "减量", "加大剂量", "减小剂量", "换药", "停药", "能不能一起吃", "可以一起吃",
  "能同时吃", "这些药能一起", "剂量是多少",
];

// Uncertainty markers in the ANSWER — any one is enough (these are deliberate
// hedges, not the incidental "可能/usually" that pepper normal helpful replies).
const ANSWER_UNCERTAINTY: string[] = [
  // EN
  "i'm not sure", "i am not sure", "not certain", "cannot be certain",
  "can't be certain", "hard to say", "difficult to say", "difficult to determine",
  "unable to determine", "can't tell", "cannot tell", "i cannot diagnose",
  "i can't diagnose", "without an examination", "without a proper exam",
  "seek medical attention", "see a doctor", "consult a doctor", "consult your doctor",
  "seek urgent care", "go to the emergency",
  // 中文
  "无法确定", "不能确定", "难以判断", "无法判断", "说不准", "无法给出",
  "无法诊断", "不能诊断", "需要进一步检查", "需要面诊", "建议就医", "尽快就医",
  "立即就医", "请就医", "咨询医生", "咨询专业医生", "咨询专科医生", "面诊",
];

export type ConfidenceResult = { lowConfidence: boolean; reasons: string[] };

/**
 * Assess an assistant answer against its triggering question. `reasons` are
 * generic codes: "high_stakes_intent", "answer_uncertain".
 */
export function assessConfidence(question: string, answer: string): ConfidenceResult {
  const q = (question || "").toLowerCase();
  const a = (answer || "").toLowerCase();
  const reasons: string[] = [];

  if (HIGH_STAKES_INTENT.some((t) => q.includes(t.toLowerCase()))) {
    reasons.push("high_stakes_intent");
  }
  if (ANSWER_UNCERTAINTY.some((t) => a.includes(t.toLowerCase()))) {
    reasons.push("answer_uncertain");
  }

  return { lowConfidence: reasons.length > 0, reasons };
}
