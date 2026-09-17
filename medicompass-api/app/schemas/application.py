from datetime import datetime

from app.schemas.common import CamelModel


class AttachmentOut(CamelModel):
    id: int
    original_name: str
    mime_type: str
    size: int
<<<<<<< HEAD
=======
    kind: str
>>>>>>> f18247c (增加CART)
    created_at: datetime


class ApplicationListItem(CamelModel):
    id: int
<<<<<<< HEAD
=======
    application_no: str | None
>>>>>>> f18247c (增加CART)
    full_name: str
    email: str
    need_type: str
    service_name: str | None
    country: str | None
    message: str | None
    attachment_count: int
    ai_summary_status: str
    status: str
    created_at: datetime


class ApplicationEventOut(CamelModel):
    id: int
    event_type: str
    actor_type: str
    actor_name: str
    payload: dict | None
    note: str | None
    created_at: datetime


class ApplicationDetail(CamelModel):
    id: int
    user_id: int | None
<<<<<<< HEAD
=======
    patient_id: int | None
    patient_no: str | None
    application_no: str | None
>>>>>>> f18247c (增加CART)
    full_name: str
    email: str
    phone: str
    country: str | None
    need_type: str
<<<<<<< HEAD
=======
    service_category: str | None
>>>>>>> f18247c (增加CART)
    service_slug: str | None
    service_name: str | None
    destination: str | None
    condition: str | None
    message: str | None
    lang: str
    status: str
    assigned_to_type: str | None
    assigned_to_id: int | None
    assigned_name: str | None
    assigned_doctor_id: int | None
    assigned_doctor_name: str | None
    assigned_provider_id: int | None
    assigned_provider_name: str | None
    accepted_at: datetime | None
    reject_reason: str | None
    medical_summary: str | None
    lab_results: str | None
    current_treatment: str | None
    question1: str | None
    question2: str | None
    question3: str | None
    doctor_answer1: str | None
    doctor_answer2: str | None
    doctor_answer3: str | None
    translated_answer1: str | None
    translated_answer2: str | None
    translated_answer3: str | None
    final_bilingual_report_url: str | None
<<<<<<< HEAD
=======
    # CAR-T specific fields
    hospital: str | None
    expert_doctor: str | None
    arrival_datetime: datetime | None
    flight_number: str | None
    consultation_datetime: datetime | None
>>>>>>> f18247c (增加CART)
    ai_summary: str | None
    ai_summary_status: str
    ai_summary_error: str | None
    created_at: datetime
    attachments: list[AttachmentOut]
    events: list[ApplicationEventOut]


class ApplicationCreated(CamelModel):
    id: int


class SummarizeResult(CamelModel):
    ai_summary: str | None
    ai_summary_status: str
    ai_summary_error: str | None


class StatusUpdate(CamelModel):
    status: str


class StatusResult(CamelModel):
    id: int
    status: str


class AssignPayload(CamelModel):
    assigned_to_type: str | None = None
    assigned_to_id: int | None = None


class AssigneeItem(CamelModel):
    id: int
    name: str
    subtitle: str | None = None
    country: str | None = None


class RejectPayload(CamelModel):
    reason: str


class StructurePayload(CamelModel):
    medical_summary: str
    lab_results: str
    current_treatment: str
    question1: str
    question2: str
    question3: str


class TranslatePayload(CamelModel):
    translated_answer1: str
    translated_answer2: str
    translated_answer3: str


class OpinionPayload(CamelModel):
    answer1: str
    answer2: str
    answer3: str


class FinalizePayload(CamelModel):
    action: str  # approve | reject
    note: str | None = None


class SupremeUpdatePayload(CamelModel):
    """Admin (supreme) edit — any subset of application fields."""
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    country: str | None = None
<<<<<<< HEAD
=======
    service_category: str | None = None
>>>>>>> f18247c (增加CART)
    need_type: str | None = None
    destination: str | None = None
    condition: str | None = None
    message: str | None = None
    medical_summary: str | None = None
    lab_results: str | None = None
    current_treatment: str | None = None
    question1: str | None = None
    question2: str | None = None
    question3: str | None = None
    doctor_answer1: str | None = None
    doctor_answer2: str | None = None
    doctor_answer3: str | None = None
    translated_answer1: str | None = None
    translated_answer2: str | None = None
    translated_answer3: str | None = None
<<<<<<< HEAD
=======
    # CAR-T specific fields
    hospital: str | None = None
    expert_doctor: str | None = None
    arrival_datetime: datetime | None = None
    flight_number: str | None = None
    consultation_datetime: datetime | None = None
>>>>>>> f18247c (增加CART)
