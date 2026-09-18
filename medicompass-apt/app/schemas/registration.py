from datetime import datetime

from app.schemas.common import CamelModel


class RegistrationCreated(CamelModel):
    id: int


class QuickPatientRegistration(CamelModel):
    phone: str
    password: str
    full_name: str | None = None
    email: str | None = None
    need_type: str | None = None
    lang: str = "zh"


class PatientRegistration(CamelModel):
    full_name: str
    email: str
    phone: str
    password: str
    country: str
    need_type: str
    destination: str | None = None
    condition: str
    lang: str = "zh"


class ProviderRegistration(CamelModel):
    org_name: str
    org_type: str
    country: str
    contact_person: str
    phone: str
    password: str
    email: str
    license: str | None = None
    cooperation: str
    lang: str = "zh"


class DoctorRegistration(CamelModel):
    full_name: str
    specialty: str
    hospital: str
    country: str
    title: str
    years: str | None = None
    languages: str
    remote: str
    email: str
    phone: str
    password: str
    license: str | None = None
    lang: str = "zh"


class RegistrationAttachmentOut(CamelModel):
    id: int
    original_name: str
    mime_type: str
    size: int
    created_at: "datetime"


class ProviderProfile(CamelModel):
    id: int
    org_name: str
    org_type: str
    country: str
    contact_person: str
    phone: str
    email: str
    cooperation: str
    status: str
    review_note: str | None
    editable: bool
    attachments: list[RegistrationAttachmentOut]


class DoctorProfile(CamelModel):
    id: int
    full_name: str
    specialty: str
    hospital: str
    country: str
    title: str
    years: str | None
    languages: str
    remote: str
    email: str
    phone: str
    status: str
    review_note: str | None
    editable: bool
    attachments: list[RegistrationAttachmentOut]


class ProviderProfileUpdate(CamelModel):
    org_name: str
    org_type: str
    country: str
    contact_person: str
    phone: str
    email: str
    cooperation: str


class DoctorProfileUpdate(CamelModel):
    full_name: str
    specialty: str
    hospital: str
    country: str
    title: str
    years: str | None = None
    languages: str
    remote: str
    email: str
    phone: str


class RegistrationListItem(CamelModel):
    id: int
    name: str
    subtitle: str | None
    country: str
    status: str
    attachment_count: int
    created_at: "datetime"


class RegistrationReview(CamelModel):
    action: str  # approve | reject
    note: str | None = None
