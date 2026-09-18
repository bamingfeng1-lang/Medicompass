"""Patient number generator.

Format: PT + YYMMDD + NNN
  - PT: fixed prefix (Patient)
  - YYMMDD: registration date (e.g. 260914 for 2026-09-14)
  - NNN: 3-digit daily sequence (001, 002, ...)

Example: PT260914001
"""

from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.registration import RegistrationPatient


def generate_patient_no(db: Session) -> str:
    """Generate a unique patient number for today.

    Format: PT{YYMMDD}{NNN}
    - YYMMDD: today's date
    - NNN: next sequence number for today (001-based)
    """
    now = datetime.now()
    date_part = now.strftime("%y%m%d")  # e.g. "260914"
    prefix = f"PT{date_part}"

    # Find how many patients were registered today with this prefix
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start.replace(hour=23, minute=59, second=59, microsecond=999999)

    count = (
        db.query(func.count(RegistrationPatient.id))
        .filter(
            RegistrationPatient.patient_no.like(f"{prefix}%"),
            RegistrationPatient.created_at >= today_start,
            RegistrationPatient.created_at <= today_end,
        )
        .scalar()
    ) or 0

    sequence = count + 1
    return f"{prefix}{sequence:03d}"


def generate_application_no(db: Session, service_category: str | None) -> str:
    """Generate an application number based on service category + date + sequence.

    Format: {ABBREV}-{YYYYMMDD}-{NNN}
    - ABBREV: service category abbreviation (e.g., SO for Second Opinion, CAR-T for CAR-T)
    - YYYYMMDD: application date (e.g., 20260916)
    - NNN: 3-digit daily sequence for this service category (001, 002, ...)

    Examples:
    - SO-20260916-001 (Second Opinion)
    - CAR-T-20260916-001 (CAR-T)
    - PD-20260916-001 (Private Doctor)

    If service_category is None or empty, returns empty string.
    """
    if not service_category:
        return ""

    from app.models.application import Application

    # Service category abbreviation mapping
    abbrev_map = {
        "国际二诊服务": "SO",
        "Second Opinion Service": "SO",
        "CAR-T": "CAR-T",
        "私人医生": "PD",
        "Private Doctor": "PD",
        "基础医疗": "BM",
        "Basic Medical": "BM",
        "跨境国际医疗": "CM",
        "Cross-border Medical": "CM",
        "长寿医学": "LM",
        "Longevity Medical": "LM",
    }

    abbrev = abbrev_map.get(service_category, "XX")
    now = datetime.now()
    date_part = now.strftime("%Y%m%d")  # e.g., "20260916"
    prefix = f"{abbrev}-{date_part}"

    # Count existing applications for today with this prefix
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start.replace(hour=23, minute=59, second=59, microsecond=999999)

    count = (
        db.query(func.count(Application.id))
        .filter(
            Application.application_no.like(f"{prefix}-%"),
            Application.created_at >= today_start,
            Application.created_at <= today_end,
        )
        .scalar()
    ) or 0

    sequence = count + 1
    return f"{prefix}-{sequence:03d}"
