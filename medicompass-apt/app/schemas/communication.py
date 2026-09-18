from datetime import datetime

from app.schemas.common import CamelModel


class SendEmailPayload(CamelModel):
    """Admin-composed custom email to a client (subject + plain-text body)."""

    subject: str
    content: str


class CommunicationCreate(CamelModel):
    """Manually log a non-email communication (phone / meeting / other)."""

    channel: str
    subject: str | None = None
    content: str | None = None


class CommunicationLogOut(CamelModel):
    id: int
    application_id: int
    channel: str
    direction: str
    subject: str | None
    content: str | None
    recipients: str | None
    email_status: str | None
    actor_name: str
    created_at: datetime


class SendEmailResult(CamelModel):
    ok: bool
    email_status: str
    recipients: list[str]
