import re

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_optional_user
from app.models.application import Application, Attachment
from app.models.user import User
from app.schemas.application import ApplicationCreated
from app.services.ai import summarize_application
from app.services.catalog import get_service_name
from app.services.email import send_application_confirmation_email
from app.services.storage import MAX_FILE_BYTES, is_allowed, save_upload
from app.api.routes.register import _resolve_patient_by_phone
from app.core.patient_no import generate_application_no

router = APIRouter(prefix="/api/applications", tags=["applications"])

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


@router.post("", status_code=201, response_model=ApplicationCreated)
async def create_application(
    background: BackgroundTasks,
    full_name: str = Form("", alias="fullName"),
    email: str = Form(""),
    phone: str = Form(""),
    country: str = Form(""),
    service_category: str = Form("", alias="serviceCategory"),
    need_type: str = Form("", alias="needType"),
    destination: str = Form(""),
    condition: str = Form(""),
    lang: str = Form("zh"),
    attachments: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    """Submit a second-opinion application (no service_slug) with attachments.

    This endpoint is the "strong-validation" path: full_name/email/phone/country/
    need_type/condition are all required, and AI summarization is triggered.
    Service/package enquiries go through /api/inquiries (weak validation).
    """
    values = {
        "fullName": full_name.strip(),
        "email": email.strip(),
        "phone": phone.strip(),
        "country": country.strip(),
        "needType": need_type.strip(),
        "condition": condition.strip(),
    }
    for key, val in values.items():
        if not val:
            return JSONResponse({"error": "missing_field", "field": key}, status_code=400)

    if not EMAIL_RE.match(values["email"]):
        return JSONResponse({"error": "invalid_email"}, status_code=400)

    # Read + validate files before creating anything.
    prepared: list[dict] = []
    for f in attachments or []:
        content = await f.read()
        if len(content) == 0:
            continue
        if len(content) > MAX_FILE_BYTES:
            return JSONResponse({"error": "file_too_large", "name": f.filename}, status_code=400)
        mime = f.content_type or "application/octet-stream"
        if not is_allowed(mime, len(content)):
            return JSONResponse(
                {"error": "file_type_not_allowed", "name": f.filename}, status_code=400
            )
        prepared.append({"filename": f.filename or "file", "content": content, "mime": mime})

    # 如果用户未登录，尝试通过手机号查找已存在的 user 并关联
    user_id = user.id if user else None
    patient_id = None

    if not user_id and values["phone"]:
        # 未登录用户：通过手机号查找或创建 patient
        patient = _resolve_patient_by_phone(db, values["phone"], values["fullName"], lang.strip() or "zh")
        patient_id = patient.id
        # 如果 patient 有关联的 user，也关联上
        if patient.user_id:
            user_id = patient.user_id
    elif user_id:
        # 已登录用户：通过手机号查找 patient
        from app.models.registration import RegistrationPatient
        patient = db.query(RegistrationPatient).filter(
            RegistrationPatient.user_id == user_id,
            RegistrationPatient.phone == values["phone"],
        ).first()
        if patient:
            patient_id = patient.id

    application = Application(
        user_id=user_id,
        patient_id=patient_id,
        application_no=generate_application_no(db, service_category.strip() or None),
        full_name=values["fullName"],
        email=values["email"],
        phone=values["phone"],
        country=values["country"],
        service_category=service_category.strip() or None,
        need_type=values["needType"],
        destination=destination.strip() or None,
        condition=values["condition"],
        lang=lang.strip() or "zh",
        ai_summary_status="pending",
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    for item in prepared:
        saved = save_upload(application.id, item["filename"], item["content"], item["mime"])
        db.add(
            Attachment(
                application_id=application.id,
                original_name=saved["original_name"],
                stored_path=saved["stored_path"],
                mime_type=saved["mime_type"],
                size=saved["size"],
            )
        )
    if prepared:
        db.commit()

    # Fire-and-forget AI summarization; the admin UI can retry if it fails.
    background.add_task(summarize_application, application.id)

    # Send the client a confirmation email (safe no-op if mailing is disabled).
    email_result = send_application_confirmation_email(
        name=application.full_name,
        to_email=application.email,
        need_type=application.need_type,
    )

    return ApplicationCreated(id=application.id)
