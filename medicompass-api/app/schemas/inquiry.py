from pydantic import Field

from app.schemas.common import CamelModel


class InquiryCreate(CamelModel):
    service_slug: str
    full_name: str
    phone: str
    email: str | None = Field(default=None)
    message: str | None = Field(default=None)
    need_type: str | None = Field(default=None)
    lang: str = "zh"


class InquiryCreated(CamelModel):
    id: int
