import re

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_optional_user
from app.models.application import Application
from app.models.user import User
from app.schemas.inquiry import InquiryCreate, InquiryCreated
from app.services.catalog import get_service_name

router = APIRouter(prefix="/api/inquiries", tags=["inquiries"])

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


@router.post("", status_code=201, response_model=InquiryCreated)
def create_inquiry(
    payload: InquiryCreate,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    """Submit a service / package enquiry (weak-validation path).

    Written into the unified `application` table with a service_slug set (so it
    is distinguished from a full second-opinion application). condition/country
    are not required and no AI summarization is triggered. If authenticated, the
    record is linked to the user via user_id; the user's profile is never changed.
    """
    service_slug = (payload.service_slug or "").strip()
    full_name = (payload.full_name or "").strip()
    phone = (payload.phone or "").strip()
    email = (payload.email or "").strip()
    message = (payload.message or "").strip()
    need_type = (payload.need_type or "").strip()
    lang = (payload.lang or "zh").strip() or "zh"

    if not full_name:
        return JSONResponse({"error": "missing_field", "field": "fullName"}, status_code=400)
    if not phone:
        return JSONResponse({"error": "missing_field", "field": "phone"}, status_code=400)

    service_name = get_service_name(service_slug, lang)
    if service_name is None:
        return JSONResponse({"error": "unknown_service"}, status_code=400)

    if email and not EMAIL_RE.match(email):
        return JSONResponse({"error": "invalid_email"}, status_code=400)

    application = Application(
        user_id=user.id if user else None,
        full_name=full_name,
        email=email or "",
        phone=phone,
        country=None,
        need_type=need_type or service_name,
        service_slug=service_slug,
        service_name=service_name,
        destination=None,
        condition=None,
        message=message or None,
        lang=lang,
        status="new",
        ai_summary_status="pending",
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    return InquiryCreated(id=application.id)
