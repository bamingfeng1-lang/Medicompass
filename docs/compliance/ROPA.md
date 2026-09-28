# Records of Processing Activities (ROPA)
# 处理活动记录（ROPA）

> **Draft — for legal review.** Authored from the MediCompass codebase to reflect the
> *actual* processing activities. Must be reviewed and finalized by qualified
> legal / data-protection counsel before it is relied upon.
> 本文档依据 MediCompass 代码库实际处理活动编写，供法务/数据保护顾问审阅定稿，尚未生效。

- **Controller:** MediCompass — _[legal entity to be inserted]_
- **Record date:** 2026-09-28
- **Regulatory frame:** GDPR Art. 30; see `DPIA.md` for the Art. 35 assessment.

Common security measures (apply to all activities unless noted): HTTPS in transit; stateless
JWT bearer auth (email-OTP / Sign in with Apple); field-level AES-256-GCM encryption at rest
for PHI; per-IP rate limiting; desensitized push notifications; profile-scoped access with
optional caregiver `X-Profile-Id`; audit of profile edits.

---

## A1 — Authentication & account management
- **Purpose:** register/sign in; manage account and family/managed profiles.
- **Data categories:** name, email, avatar, Apple user ID, consent records.
- **Data subjects:** patients, caregivers, managed profiles.
- **Recipients:** internal only; Apple (Sign in with Apple); QQ SMTP (email-OTP delivery).
- **International transfers:** none beyond email delivery infrastructure.
- **Retention:** life of account; deleted on account deletion (cascade).

## A2 — Health-record & metrics storage
- **Purpose:** aggregate 门诊/住院 history, vitals, medications, custom metrics, visit
  records / report files; deliver reminders and trends.
- **Data categories:** vitals, medications & dose logs, metric readings/history, visit
  records and uploaded (incl. encrypted-PDF) reports, health status, BMI, wellness plans.
- **Data subjects:** patients, managed profiles.
- **Recipients:** internal only.
- **International transfers:** none (storage layer).
- **Retention:** until user deletes the item or the account; export available on demand.

## A3 — AI health assistant (chat)
- **Purpose:** answer patient health questions with contextual guidance.
- **Data categories:** chat free text, relevant health context, confidence flags.
- **Data subjects:** patients (and managed profiles via caregiver).
- **Recipients:** **overseas AI provider (LLM)** for inference.
- **International transfers:** yes — gated on explicit, revocable cross-border consent.
- **Safeguards:** consent gate; red-flag interception; low-confidence advisory; per-answer
  disclaimer. **DPA / transfer safeguards with provider: _[open — legal]_**
- **Retention:** conversation history retained for the user until deletion.

## A4 — AI diet / exercise plans (WellnessPlan)
- **Purpose:** generate personalized diet/exercise plans from the health record.
- **Data categories:** health record inputs, generated plan content.
- **Data subjects:** patients, managed profiles.
- **Recipients:** **overseas AI provider (LLM)**.
- **International transfers:** yes — gated on cross-border consent (as A3).
- **Retention:** until regenerated or deleted.

## A5 — Doctor text/image consults
- **Purpose:** patient ⇄ clinician text/image consultation and review.
- **Data categories:** consult messages, attachments, clinician identity (name, title,
  department, license) for credential honesty.
- **Data subjects:** patients, reviewing clinicians.
- **Recipients:** the assigned clinician (internal/contracted).
- **International transfers:** none by default.
- **Retention:** for the life of the consult thread / account.

## A6 — Proactive care & notifications
- **Purpose:** medication/follow-up reminders; optional caregiver health alerts.
- **Data categories:** schedule metadata, alert opt-in, device push tokens.
- **Data subjects:** patients, managed profiles, caregivers.
- **Recipients:** APNs (Apple Push Notification service) — desensitized payloads only.
- **International transfers:** via APNs infrastructure; no PHI in payload.
- **Retention:** device tokens until unregistered; alerts transient.

## A7 — Adverse-event / safety reporting
- **Purpose:** let patients report a suspected adverse event, drug reaction, or a
  wrong/harmful AI answer (pharmacovigilance + AI safety).
- **Data categories:** free-text description (encrypted), kind, severity, optional drug
  name, optional linked AI-turn reference, locale.
- **Data subjects:** patients, managed profiles (caregiver may file).
- **Recipients:** internal care/triage team (admin console).
- **International transfers:** none.
- **Note:** deliberately **not** tier- or consent-gated.
- **Retention:** for the life of the account / until triage closure per policy.

## A8 — Data export & deletion (data-subject rights)
- **Purpose:** fulfill GDPR access/portability and erasure rights.
- **Data categories:** all of the above (export = full JSON incl. decrypted content;
  deletion = cascade removal).
- **Data subjects:** patients.
- **Recipients:** the requesting user only.
- **International transfers:** none.
- **Retention:** N/A (export is user-held; deletion is immediate cascade).
