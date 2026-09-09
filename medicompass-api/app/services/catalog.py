"""Service catalog — slug → localized name map.

Mirrors lib/services/catalog.ts on the frontend. The backend only needs the
localized `name` per slug to store `service_name` on an inquiry (matching the
original Next.js behavior where the name was derived server-side from the slug).
"""

# slug -> {"zh": ..., "en": ...}
SERVICES: dict[str, dict[str, str]] = {
    "text-consultation": {"zh": "图文问诊", "en": "Text Consultation"},
    "video-consultation": {"zh": "视频问诊", "en": "Video Consultation"},
    "critical-illness-fast-track": {"zh": "重疾绿通", "en": "Critical Illness Fast Track"},
    "hospitalization": {"zh": "住院安排", "en": "Hospitalization Support"},
    "in-hospital-companion": {"zh": "院内陪诊", "en": "In-Hospital Companion"},
    "in-hospital-care": {"zh": "院内陪护", "en": "In-Hospital Care"},
    "home-care": {"zh": "院外护理", "en": "Home Care"},
    "branded-drug-discount": {"zh": "原研药折扣", "en": "Branded Drug Discount"},
    "mdt": {"zh": "MDT 会诊", "en": "MDT Consultation"},
    "international-second-opinion": {"zh": "国际二诊", "en": "International Second Opinion"},
    "overseas-treatment": {"zh": "海外就医安排", "en": "Overseas Treatment"},
    "global-direct-billing": {"zh": "全球直付", "en": "Global Direct Billing"},
    "overseas-drug-sourcing": {"zh": "海外找药", "en": "Overseas Drug Sourcing"},
    "private-doctor": {"zh": "私人医生", "en": "Private Doctor"},
    "health-checkup": {"zh": "体检方案定制及报告解读", "en": "Health Checkup & Report Reading"},
    "overseas-domestic-landing": {
        "zh": "海外诊疗国内落地",
        "en": "Overseas Care, Domestic Follow-through",
    },
    "functional-medicine": {"zh": "功能医学深度评估", "en": "Functional Medicine Assessment"},
    "anti-aging-plan": {"zh": "个性化抗衰年度方案定制", "en": "Personalized Annual Longevity Plan"},
    "medical-nutrients": {"zh": "医疗级营养素", "en": "Medical-Grade Nutrients"},
    "iv-nutrition": {"zh": "静脉营养疗程", "en": "IV Nutrition Therapy"},
    "medical-package": {"zh": "医疗套餐", "en": "Medical Package"},
}


def get_service_name(slug: str, lang: str) -> str | None:
    """Return the localized service name for a slug, or None if unknown."""
    entry = SERVICES.get(slug)
    if entry is None:
        return None
    return entry["en"] if lang == "en" else entry["zh"]
