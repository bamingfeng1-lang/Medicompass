# Data Protection Impact Assessment (DPIA)
# 数据保护影响评估（DPIA）

> **Draft — for legal review.** This document was authored from the MediCompass
> codebase to reflect the *actual* data flows and controls in the shipped product.
> It is a working engineering artifact and must be reviewed and finalized by
> qualified legal / data-protection counsel before it is relied upon.
> 本文档依据 MediCompass 代码库实际的数据流与技术控制编写，供法务/数据保护顾问审阅定稿，尚未生效。

- **Product:** MediCompass — post-diagnosis care management (诊后管理) iOS app + Next.js backend
- **Assessment date:** 2026-09-28
- **DPIA owner:** _[to be assigned]_
- **Regulatory frame:** GDPR Art. 35 (DPIA), with cross-references to Art. 30 (see `ROPA.md`); PIPL cross-border provisions for CN users; HIPAA-aligned safeguards.

---

## 1. Purpose & necessity

MediCompass helps patients manage care after a diagnosis: medication and follow-up
reminders, health-record aggregation, visit/report storage, custom metric tracking, an
AI health assistant, AI-generated diet/exercise plans, doctor text/image consults, and
proactive family care. Processing health data is intrinsic to these purposes — the app
cannot deliver reminders, trends, or clinically-relevant AI guidance without it. Data
minimization is applied per feature: each endpoint reads only the profile scope required,
and no advertising / profiling-for-marketing processing occurs.

## 2. Categories of personal data

| Category | Examples | Sensitivity |
|---|---|---|
| Identity & contact | name, email, avatar, Apple user ID | Personal |
| Vitals & metrics | blood pressure, glucose, weight, custom metric readings/history | **Health (special category)** |
| Medications | drug names, dosages, schedules, dose logs | **Health** |
| Visit records | 就诊记录 / 体检报告, uploaded report files (incl. encrypted PDFs) | **Health** |
| Health record | 门诊/住院 history, health status, BMI, wellness plans | **Health** |
| AI chat | assistant conversation turns, confidence flags | **Health** (free text may reveal conditions) |
| Consents | consent version, cross-border grant, timestamps | Personal |
| Adverse-event reports | free-text safety reports, drug reactions, AI-answer reports | **Health** |
| Audit | profile-edit history (ProfileAudit) | Personal |

## 3. Data subjects

- **Patients** — the primary account holder (email-OTP or Sign in with Apple).
- **Login-less managed profiles** — family members (e.g. elderly parents, children) for
  whom a caregiver manages care without a separate login (family accounts).
- **Caregivers** — account holders acting on a managed profile via `X-Profile-Id`,
  subject to the profile's sharing settings.

## 4. Processing flows

```
iOS app (SwiftUI)  ──HTTPS + JWT Bearer──▶  Next.js backend (Prisma / SQLite)
                                                  │
                                                  ├─ field-level AES-256-GCM at rest (PHI)
                                                  │
       AI chat / AI plans  ──────────────────────┘──▶  overseas AI provider (LLM)
```

- Transport is HTTPS; mobile requests carry a stateless JWT bearer token, plus an
  optional `X-Profile-Id` header for caregiver-on-managed-profile access.
- The AI assistant and AI diet/exercise plans send the relevant health context to an
  **overseas AI provider** for inference — this is the principal cross-border transfer.
- Doctor consults route text/image messages between patient and reviewing clinician,
  stored server-side.

## 5. Lawful basis & consent

- **First-launch consent gate** blocks app use until the user accepts the Privacy Policy
  and User Agreement (versioned; `consentVersion` bump forces re-acceptance).
- **Sensitive / cross-border consent** is separate and revocable: the "Cross-border data
  transfer" toggle (Me → Data & Privacy) is the explicit authorization to send data to the
  overseas AI provider. Turning it off disables the AI assistant and AI plans rather than
  silently degrading.
- Adverse-event reporting is **not** consent-gated — a safety channel must never be
  blocked (see §8).

## 6. Cross-border transfer

The overseas AI provider is the primary international recipient. Risk: health free-text and
context leave the user's jurisdiction for inference. Mitigations: explicit, revocable
cross-border consent; scope limited to what a given AI feature needs; feature disabled when
consent is withheld. **Residual:** provider-side retention/processing is governed by the
provider's terms — a data-processing agreement and transfer safeguards (SCCs / equivalent)
must be confirmed by legal. _[open]_

## 7. Storage, security & retention

- **Encryption at rest:** transparent field-level AES-256-GCM (`enc:v1:` prefix) via a
  Prisma client extension, applied to PHI free-text/sensitive fields (medications, visit
  data, chat, wellness plans, adverse-event descriptions, profile audit). Legacy plaintext
  is read transparently during migration.
- **Auth:** stateless JWT bearer; email-OTP and Sign in with Apple.
- **Rate limiting:** per-IP throttling on sensitive endpoints.
- **Notifications** are desensitized (no PHI in push payloads).
- **Retention & rights:** users can **export** (GDPR data export — full JSON incl.
  decrypted content) and **delete** (cascade delete of the account and all related rows) at
  any time from Me → Data & Privacy.

## 8. Risk register → mitigations

| Risk | Shipped control |
|---|---|
| AI gives dangerous advice in an emergency | Deterministic on-device **red-flag interception** → emergency-dial banner, before any network call |
| AI answer is uncertain / wrong | **Low-confidence advisory** (amber) + hardcoded **per-answer disclaimer** on every AI reply |
| Harmful drug combination | **Drug-interaction screening** |
| Patient harmed and no reporting channel | **Adverse-event reporting** (this release) — not tier- or consent-gated |
| Misrepresenting clinician credentials | **Doctor-credential honesty** — consult replies carry the doctor's real name/title/dept/license |
| PHI exposed at rest | Field-level AES-256-GCM |
| Cross-border exposure | Explicit revocable consent; feature-off when withheld |

## 9. Residual risks (explicitly flagged)

- **Single-process rate limiting** does not survive horizontal scaling — needs a shared
  store before multi-instance deployment.
- **Key-on-host encryption boundary:** encryption keys live with the application host;
  compromise of the host is not mitigated by field encryption alone.
- **Unfinished legal-track items** (red-flag process sign-off, verify-signing, sensitive-consent
  legal review) are tracked in the compliance remediation record and remain open.

## 10. Conclusion

Processing is necessary and proportionate to the stated care-management purposes, with
layered technical safeguards. Sign-off is contingent on closing the open items in §6/§9 and
legal review of this draft.
