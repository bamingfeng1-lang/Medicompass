import io
import re
import zipfile
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

<<<<<<< HEAD
from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
=======
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, Request, UploadFile
>>>>>>> f18247c (增加CART)
from fastapi.responses import JSONResponse, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
<<<<<<< HEAD
=======
from app.core.patient_no import generate_patient_no
>>>>>>> f18247c (增加CART)
from app.core.security import (
    MAX_AGE_SECONDS,
    USER_SESSION_COOKIE,
    hash_password,
    sign_user_session,
    verify_password,
)
from app.db.session import get_db
from app.deps import display_name_for_user, get_current_user, roles_for_user
from app.models.application import Application, ApplicationEvent, Attachment
from app.models.registration import (
    RegistrationDoctor,
    RegistrationPatient,
    RegistrationProvider,
)
from app.models.status import APPLICATION_CLIENT_EDITABLE, REGISTRATION_EDITABLE
from app.models.user import User
from app.schemas.application import (
    ApplicationDetail,
    ApplicationEventOut,
    ApplicationListItem,
    AttachmentOut,
    OpinionPayload,
    RejectPayload,
    StructurePayload,
    TranslatePayload,
)
from app.schemas.auth import (
    ChangePasswordPayload,
    MeResponse,
    PatientProfile,
    UserLoginRequest,
    UserLoginResponse,
)
from app.schemas.registration import (
    DoctorProfile,
    DoctorProfileUpdate,
    ProviderProfile,
    ProviderProfileUpdate,
    RegistrationAttachmentOut,
)
<<<<<<< HEAD
=======
from app.services.ai import summarize_application
>>>>>>> f18247c (增加CART)
from app.services.storage import (
    MAX_FILE_BYTES,
    MAX_FINAL_REPORT_BYTES,
    is_allowed,
    save_final_report,
    save_upload,
    save_upload_for_registration,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _set_user_cookie(resp: Response, token: str) -> None:
    resp.set_cookie(
        key=USER_SESSION_COOKIE,
        value=token,
        max_age=MAX_AGE_SECONDS,
        httponly=True,
        samesite="lax",
        secure=settings.COOKIE_SECURE,
        path="/",
    )


@router.post("/login")
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    phone = (payload.phone or "").strip()
    password = payload.password or ""
    if not phone or not password:
        return JSONResponse({"error": "missing_credentials"}, status_code=400)

    user = db.query(User).filter(User.phone == phone).first()
    if user is None or not verify_password(password, user.password_hash):
        return JSONResponse({"error": "invalid_credentials"}, status_code=401)
    if user.status != "active":
        return JSONResponse({"error": "account_disabled"}, status_code=403)

    token = sign_user_session(str(user.id), user.phone)
    roles = roles_for_user(db, user.id)
    display_name = display_name_for_user(db, user)
    body = UserLoginResponse(
        ok=True,
        user_id=user.id,
        phone=user.phone,
        display_name=display_name,
        roles=roles,
    )
    resp = JSONResponse(body.model_dump(by_alias=True))
    _set_user_cookie(resp, token)
    return resp


@router.post("/logout")
def logout():
    resp = JSONResponse({"ok": True})
    resp.delete_cookie(USER_SESSION_COOKIE, path="/")
    return resp


@router.post("/change-password")
def change_password(
    payload: ChangePasswordPayload,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Change the logged-in user's password (customer / provider / doctor)."""
    old = payload.old_password or ""
    new = payload.new_password or ""
    if not old or not new:
        return JSONResponse({"error": "missing_fields"}, status_code=400)
    if not verify_password(old, user.password_hash):
        return JSONResponse({"error": "old_password_wrong"}, status_code=403)
    if len(new) < 8:
        return JSONResponse({"error": "weak_password"}, status_code=400)
    if new == old:
        return JSONResponse({"error": "same_password"}, status_code=400)

    user.password_hash = hash_password(new)
    db.commit()
    return JSONResponse({"ok": True})


@router.get("/me", response_model=MeResponse)
def me(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    roles = roles_for_user(db, user.id)
    display_name = display_name_for_user(db, user)
    return MeResponse(
        user_id=user.id,
        phone=user.phone,
        display_name=display_name,
        roles=roles,
    )


@router.get("/profile", response_model=PatientProfile)
def my_profile(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return the logged-in user's patient registration profile.

<<<<<<< HEAD
    Used to prefill the second-opinion application form. Returns 404 if the
    user has no patient profile. Does not modify any profile data.
=======
    Used to prefill the second-opinion application form. Every logged-in
    customer is guaranteed to have a patient profile: if none exists yet
    (e.g. legacy accounts, or an account created outside the patient
    sign-up flow), a minimal profile is created on the fly so the user can
    proceed to book a second-opinion consultation immediately.
>>>>>>> f18247c (增加CART)
    """
    patient = (
        db.query(RegistrationPatient)
        .filter(RegistrationPatient.user_id == user.id)
        .order_by(RegistrationPatient.created_at.desc())
        .first()
    )
    if patient is None:
<<<<<<< HEAD
        return JSONResponse({"error": "no_patient_profile"}, status_code=404)
    return PatientProfile(
        user_id=user.id,
        full_name=patient.full_name,
        email=patient.email,
        phone=patient.phone,
        country=patient.country,
        need_type=patient.need_type,
        destination=patient.destination,
        condition=patient.condition,
=======
        # Lazy-create a minimal patient profile so any authenticated user
        # can submit a second-opinion application without re-registering.
        patient = RegistrationPatient(
            user_id=user.id,
            patient_no=generate_patient_no(db),
            full_name=user.phone,
            email="",
            phone=user.phone,
            country=None,
            need_type=None,
            destination=None,
            condition=None,
            lang="zh",
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)
    return PatientProfile(
        user_id=user.id,
        patient_no=patient.patient_no,
        full_name=patient.full_name,
        email=patient.email or "",
        phone=patient.phone,
        country=patient.country or "",
        need_type=patient.need_type or "",
        destination=patient.destination,
        condition=patient.condition or "",
>>>>>>> f18247c (增加CART)
    )


# ── my applications (records owned by the logged-in user) ────────────
@router.get("/applications", response_model=list[ApplicationListItem])
def my_applications(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List the applications/enquiries that belong to the logged-in user."""
<<<<<<< HEAD
=======
    from sqlalchemy import or_

    # Get all patient IDs for this user
    patient_ids = [
        p.id for p in db.query(RegistrationPatient.id).filter(
            RegistrationPatient.user_id == user.id
        ).all()
    ]

>>>>>>> f18247c (增加CART)
    count_subq = (
        select(Attachment.application_id, func.count(Attachment.id).label("cnt"))
        .group_by(Attachment.application_id)
        .subquery()
    )
    stmt = (
        select(Application, func.coalesce(count_subq.c.cnt, 0))
        .outerjoin(count_subq, count_subq.c.application_id == Application.id)
<<<<<<< HEAD
        .where(Application.user_id == user.id)
=======
        .where(
            or_(
                Application.user_id == user.id,
                Application.patient_id.in_(patient_ids) if patient_ids else False,
            )
        )
>>>>>>> f18247c (增加CART)
        .order_by(Application.created_at.desc())
    )
    rows = db.execute(stmt).all()
    return [
        ApplicationListItem(
            id=app.id,
<<<<<<< HEAD
=======
            application_no=app.application_no,
>>>>>>> f18247c (增加CART)
            full_name=app.full_name,
            email=app.email,
            need_type=app.need_type,
            service_name=app.service_name,
            country=app.country,
            message=app.message,
            attachment_count=int(cnt),
            ai_summary_status=app.ai_summary_status,
            status=app.status,
            created_at=app.created_at,
        )
        for app, cnt in rows
    ]




@router.get("/applications/assigned", response_model=list[ApplicationListItem])
def my_assigned_applications(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List applications assigned to the logged-in provider/doctor."""
    role, reg_id = _assigned_identity(db, user)
    if role is None or reg_id is None:
        return []

    count_subq = (
        select(Attachment.application_id, func.count(Attachment.id).label("cnt"))
        .group_by(Attachment.application_id)
        .subquery()
    )
    if role == "provider":
        owner_filter = Application.assigned_provider_id == reg_id
    else:
        owner_filter = Application.assigned_doctor_id == reg_id
    stmt = (
        select(Application, func.coalesce(count_subq.c.cnt, 0))
        .outerjoin(count_subq, count_subq.c.application_id == Application.id)
        .where(owner_filter)
        .order_by(Application.created_at.desc())
    )
    rows = db.execute(stmt).all()
    return [
        ApplicationListItem(
            id=app.id,
<<<<<<< HEAD
=======
            application_no=app.application_no,
>>>>>>> f18247c (增加CART)
            full_name=app.full_name,
            email=app.email,
            need_type=app.need_type,
            service_name=app.service_name,
            country=app.country,
            message=app.message,
            attachment_count=int(cnt),
            ai_summary_status=app.ai_summary_status,
            status=app.status,
            created_at=app.created_at,
        )
        for app, cnt in rows
    ]


@router.get("/applications/assigned/{application_id}", response_model=ApplicationDetail)
def my_assigned_application(
    application_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return an application assigned to the logged-in provider/doctor; 404 otherwise."""
    role, reg_id = _assigned_identity(db, user)
    if role is None or reg_id is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    app = db.get(Application, application_id)
    if app is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    if role == "provider":
        owned = app.assigned_provider_id == reg_id
    else:
        owned = app.assigned_doctor_id == reg_id
    if not owned:
        return JSONResponse({"error": "not_found"}, status_code=404)
    detail = _application_detail(db, app)
    if role == "doctor":
        # Doctors must not see the patient's real name/phone: mask them.
        detail.full_name = _mask_name(detail.full_name)
        detail.phone = _mask_phone(detail.phone)
    return detail


@router.get("/applications/{application_id}", response_model=ApplicationDetail)
def my_application(
    application_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Return one of the logged-in user's applications; 404 if not owned."""
    app = db.get(Application, application_id)
<<<<<<< HEAD
    if app is None or app.user_id != user.id:
=======
    if app is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    # Check ownership: either user_id matches, or patient_id belongs to this user
    owned = app.user_id == user.id
    if not owned and app.patient_id:
        patient = db.get(RegistrationPatient, app.patient_id)
        if patient and patient.user_id == user.id:
            owned = True
    if not owned:
>>>>>>> f18247c (增加CART)
        return JSONResponse({"error": "not_found"}, status_code=404)
    return _application_detail(db, app)


# ── client supplement (PENDING_SUPPLEMENT) ─────────────────────────────
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


@router.post("/applications/{application_id}/supplement", response_model=ApplicationDetail)
async def client_submit_supplement(
    application_id: int,
<<<<<<< HEAD
=======
    background: BackgroundTasks,
>>>>>>> f18247c (增加CART)
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    full_name: str = Form("", alias="fullName"),
    email: str = Form(""),
    phone: str = Form(""),
    country: str = Form(""),
    condition: str = Form(""),
    attachments: list[UploadFile] = File(default=[]),
):
    """Client updates their application info / uploads more attachments.

    Only allowed while the case is in PENDING_SUPPLEMENT. Submitting returns the
    application to PENDING_REVIEW so the admin can re-review and re-run the flow.
    """
    app = db.get(Application, application_id)
<<<<<<< HEAD
    if app is None or app.user_id != user.id:
=======
    if app is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    # Check ownership: either user_id matches, or patient_id belongs to this user
    owned = app.user_id == user.id
    if not owned and app.patient_id:
        patient = db.get(RegistrationPatient, app.patient_id)
        if patient and patient.user_id == user.id:
            owned = True
    if not owned:
>>>>>>> f18247c (增加CART)
        return JSONResponse({"error": "not_found"}, status_code=404)
    if app.status not in APPLICATION_CLIENT_EDITABLE:
        return JSONResponse({"error": "not_editable"}, status_code=409)

    # Update the editable text fields (only if the client provided values).
    updates: dict[str, str] = {
        "full_name": full_name.strip(),
        "email": email.strip(),
        "phone": phone.strip(),
        "country": country.strip(),
        "condition": condition.strip(),
    }
    for attr, val in updates.items():
        if val:
            setattr(app, attr, val)
    if updates["email"] and not EMAIL_RE.match(updates["email"]):
        return JSONResponse({"error": "invalid_email"}, status_code=400)

    # Persist any newly uploaded attachments (source type).
    added = 0
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
        saved = save_upload(app.id, f.filename or "file", content, mime)
        db.add(
            Attachment(
                application_id=app.id,
                original_name=saved["original_name"],
                stored_path=saved["stored_path"],
                mime_type=saved["mime_type"],
                size=saved["size"],
                kind="source",
            )
        )
        added += 1

    # Return to the admin for re-review; reset the AI summary so it regenerates
    # on the updated content.
    app.status = "PENDING_REVIEW"
    app.ai_summary = None
    app.ai_summary_status = "pending"
    app.ai_summary_error = None
    db.add(
        ApplicationEvent(
            application_id=app.id,
            event_type="STATUS_CHANGED",
            actor_type="client",
            actor_name=app.full_name or app.phone or "",
            payload={"from": "PENDING_SUPPLEMENT", "to": "PENDING_REVIEW"},
        )
    )
    db.add(
        ApplicationEvent(
            application_id=app.id,
            event_type="SUPPLEMENT_SUBMITTED",
            actor_type="client",
            actor_name=app.full_name or app.phone or "",
            payload={"files_added": added},
        )
    )
    db.commit()
    db.refresh(app)
<<<<<<< HEAD
=======

    # Re-run AI summarization on the updated content + attachments.
    background.add_task(summarize_application, app.id)

>>>>>>> f18247c (增加CART)
    return _application_detail(db, app)


def _assigned_name(db: Session, assigned_type: str | None, assigned_id: int | None) -> str | None:
    """Resolve the display name of the current assignee, if any."""
    if not assigned_type or not assigned_id:
        return None
    if assigned_type == "provider":
        row = db.get(RegistrationProvider, assigned_id)
        return row.org_name if row else None
    if assigned_type == "doctor":
        row = db.get(RegistrationDoctor, assigned_id)
        return row.full_name if row else None
    return None


def _doctor_name(db: Session, doctor_id: int | None) -> str | None:
    if not doctor_id:
        return None
    row = db.get(RegistrationDoctor, doctor_id)
    return row.full_name if row else None


def _provider_name(db: Session, provider_id: int | None) -> str | None:
    if not provider_id:
        return None
    row = db.get(RegistrationProvider, provider_id)
    return row.org_name if row else None


def _application_detail(db: Session, app: Application) -> ApplicationDetail:
<<<<<<< HEAD
    return ApplicationDetail(
        id=app.id,
        user_id=app.user_id,
=======
    # 获取 patient_no
    patient_no = None
    if app.patient_id:
        from app.models.registration import RegistrationPatient
        patient = db.get(RegistrationPatient, app.patient_id)
        if patient:
            patient_no = patient.patient_no

    return ApplicationDetail(
        id=app.id,
        user_id=app.user_id,
        patient_id=app.patient_id,
        patient_no=patient_no,
        application_no=app.application_no,
>>>>>>> f18247c (增加CART)
        full_name=app.full_name,
        email=app.email,
        phone=app.phone,
        country=app.country,
        need_type=app.need_type,
<<<<<<< HEAD
=======
        service_category=app.service_category,
>>>>>>> f18247c (增加CART)
        service_slug=app.service_slug,
        service_name=app.service_name,
        destination=app.destination,
        condition=app.condition,
        message=app.message,
        lang=app.lang,
        status=app.status,
        assigned_to_type=app.assigned_to_type,
        assigned_to_id=app.assigned_to_id,
        assigned_name=_assigned_name(db, app.assigned_to_type, app.assigned_to_id),
        assigned_doctor_id=app.assigned_doctor_id,
        assigned_doctor_name=_doctor_name(db, app.assigned_doctor_id),
        assigned_provider_id=app.assigned_provider_id,
        assigned_provider_name=_provider_name(db, app.assigned_provider_id),
        accepted_at=app.accepted_at,
        reject_reason=app.reject_reason,
        medical_summary=app.medical_summary,
        lab_results=app.lab_results,
        current_treatment=app.current_treatment,
        question1=app.question1,
        question2=app.question2,
        question3=app.question3,
        doctor_answer1=app.doctor_answer1,
        doctor_answer2=app.doctor_answer2,
        doctor_answer3=app.doctor_answer3,
        translated_answer1=app.translated_answer1,
        translated_answer2=app.translated_answer2,
        translated_answer3=app.translated_answer3,
        final_bilingual_report_url=app.final_bilingual_report_url,
<<<<<<< HEAD
=======
        # CAR-T specific fields
        hospital=app.hospital,
        expert_doctor=app.expert_doctor,
        arrival_datetime=app.arrival_datetime,
        flight_number=app.flight_number,
        consultation_datetime=app.consultation_datetime,
>>>>>>> f18247c (增加CART)
        ai_summary=app.ai_summary,
        ai_summary_status=app.ai_summary_status,
        ai_summary_error=app.ai_summary_error,
        created_at=app.created_at,
        attachments=[AttachmentOut.model_validate(a) for a in app.attachments],
        events=[ApplicationEventOut.model_validate(e) for e in app.events],
    )


def _mask_name(name: str | None) -> str | None:
    """Mask a patient's real name for doctor view (keep first char, star the rest)."""
    if not name:
        return name
    if len(name) <= 1:
        return "*"
    return name[0] + "*" * (len(name) - 1)


def _mask_phone(phone: str | None) -> str | None:
    """Mask a phone number for doctor view: **** + last 4 digits."""
    if not phone:
        return phone
    digits = "".join(ch for ch in phone if ch.isdigit())
    if len(digits) <= 4:
        return "****" + digits
    return "****" + digits[-4:]


def _assigned_identity(db: Session, user: User) -> tuple[str | None, int | None]:
    """Resolve the current user's (role, registration_id) for assignment lookups.

    A user may be both a provider and a doctor; return the first found.
    Returns (None, None) if the user has no provider/doctor registration.
    """
    prov = _my_provider(db, user)
    if prov is not None:
        return ("provider", prov.id)
    doc = _my_doctor(db, user)
    if doc is not None:
        return ("doctor", doc.id)
    return (None, None)


@router.get("/attachments/{attachment_id}")
def my_attachment(
    attachment_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Stream an attachment that belongs to an application the user may access.

    Authorized for the case's client (user_id), the assigned provider, or the
    assigned doctor — mirroring the final-report authorization.
    """
    att = db.get(Attachment, attachment_id)
    if att is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    owner = db.get(Application, att.application_id)
    if owner is None:
        return JSONResponse({"error": "not_found"}, status_code=404)

    prov = _my_provider(db, user)
    doc = _my_doctor(db, user)
    is_client = owner.user_id == user.id
    is_provider = prov is not None and owner.assigned_provider_id == prov.id
    is_doctor = doc is not None and owner.assigned_doctor_id == doc.id
    if not (is_client or is_provider or is_doctor):
        return JSONResponse({"error": "not_found"}, status_code=404)

    path = Path(att.stored_path)
    try:
        data = path.read_bytes()
    except OSError:
        return JSONResponse({"error": "file_missing"}, status_code=410)

    disposition = "attachment" if request.query_params.get("download") == "1" else "inline"
    ascii_name = "".join(c if 0x20 <= ord(c) <= 0x7E else "_" for c in att.original_name)
    encoded_name = quote(att.original_name)

    return Response(
        content=data,
        media_type=att.mime_type or "application/octet-stream",
        headers={
            "Content-Disposition": (
                f"{disposition}; filename=\"{ascii_name}\"; filename*=UTF-8''{encoded_name}"
            )
        },
    )


# ── self-service registration (provider / doctor) ────────────────────
def _reg_attachments(db: Session, reg_type: str, reg_id: int) -> list[RegistrationAttachmentOut]:
    rows = (
        db.query(Attachment)
        .filter(Attachment.registration_type == reg_type, Attachment.registration_id == reg_id)
        .order_by(Attachment.created_at)
        .all()
    )
    return [RegistrationAttachmentOut.model_validate(a) for a in rows]


def _provider_profile(db: Session, row: RegistrationProvider) -> ProviderProfile:
    return ProviderProfile(
        id=row.id,
        org_name=row.org_name,
        org_type=row.org_type,
        country=row.country,
        contact_person=row.contact_person,
        phone=row.phone,
        email=row.email,
        cooperation=row.cooperation,
        status=row.status,
        review_note=row.review_note,
        editable=row.status in REGISTRATION_EDITABLE,
        attachments=_reg_attachments(db, "provider", row.id),
    )


def _doctor_profile(db: Session, row: RegistrationDoctor) -> DoctorProfile:
    return DoctorProfile(
        id=row.id,
        full_name=row.full_name,
        specialty=row.specialty,
        hospital=row.hospital,
        country=row.country,
        title=row.title,
        years=row.years,
        languages=row.languages,
        remote=row.remote,
        email=row.email,
        phone=row.phone,
        status=row.status,
        review_note=row.review_note,
        editable=row.status in REGISTRATION_EDITABLE,
        attachments=_reg_attachments(db, "doctor", row.id),
    )


def _my_provider(db: Session, user: User) -> RegistrationProvider | None:
    return (
        db.query(RegistrationProvider).filter(RegistrationProvider.user_id == user.id).first()
    )


def _my_doctor(db: Session, user: User) -> RegistrationDoctor | None:
    return db.query(RegistrationDoctor).filter(RegistrationDoctor.user_id == user.id).first()


@router.get("/registration/provider", response_model=ProviderProfile)
def get_my_provider(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = _my_provider(db, user)
    if row is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    return _provider_profile(db, row)


@router.get("/registration/doctor", response_model=DoctorProfile)
def get_my_doctor(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = _my_doctor(db, user)
    if row is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    return _doctor_profile(db, row)


@router.patch("/registration/provider", response_model=ProviderProfile)
def update_my_provider(
    payload: ProviderProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = _my_provider(db, user)
    if row is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    if row.status not in REGISTRATION_EDITABLE:
        return JSONResponse({"error": "not_editable"}, status_code=409)
    for field in (
        "org_name",
        "org_type",
        "country",
        "contact_person",
        "phone",
        "email",
        "cooperation",
    ):
        setattr(row, field, (getattr(payload, field) or "").strip())
    db.commit()
    db.refresh(row)
    return _provider_profile(db, row)


@router.patch("/registration/doctor", response_model=DoctorProfile)
def update_my_doctor(
    payload: DoctorProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = _my_doctor(db, user)
    if row is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    if row.status not in REGISTRATION_EDITABLE:
        return JSONResponse({"error": "not_editable"}, status_code=409)
    for field in (
        "full_name",
        "specialty",
        "hospital",
        "country",
        "title",
        "languages",
        "remote",
        "email",
        "phone",
    ):
        setattr(row, field, (getattr(payload, field) or "").strip())
    row.years = (payload.years or "").strip() or None
    db.commit()
    db.refresh(row)
    return _doctor_profile(db, row)


async def _upload_reg_license(db: Session, reg_type: str, reg_id: int, file: UploadFile):
    content = await file.read()
    if len(content) == 0:
        return JSONResponse({"error": "empty_file"}, status_code=400)
    if len(content) > MAX_FILE_BYTES:
        return JSONResponse({"error": "file_too_large"}, status_code=400)
    mime = file.content_type or "application/octet-stream"
    if not is_allowed(mime, len(content)):
        return JSONResponse({"error": "file_type_not_allowed"}, status_code=400)
    saved = save_upload_for_registration(reg_type, reg_id, file.filename or "file", content, mime)
    db.add(
        Attachment(
            registration_type=reg_type,
            registration_id=reg_id,
            original_name=saved["original_name"],
            stored_path=saved["stored_path"],
            mime_type=saved["mime_type"],
            size=saved["size"],
        )
    )
    db.commit()
    return None


@router.post("/registration/provider/license")
async def upload_provider_license(
<<<<<<< HEAD
    license_file: UploadFile = File(..., alias="licenseFile"),
=======
    license_files: list[UploadFile] = File(default=[], alias="licenseFile"),
>>>>>>> f18247c (增加CART)
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = _my_provider(db, user)
    if row is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    if row.status not in REGISTRATION_EDITABLE:
        return JSONResponse({"error": "not_editable"}, status_code=409)
<<<<<<< HEAD
    err = await _upload_reg_license(db, "provider", row.id, license_file)
    return err if err is not None else {"ok": True}
=======
    files = [f for f in license_files if f is not None and f.filename]
    if not files:
        return JSONResponse({"error": "empty_file"}, status_code=400)
    for f in files:
        err = await _upload_reg_license(db, "provider", row.id, f)
        if err is not None:
            return err
    return {"ok": True, "count": len(files)}
>>>>>>> f18247c (增加CART)


@router.post("/registration/doctor/license")
async def upload_doctor_license(
<<<<<<< HEAD
    license_file: UploadFile = File(..., alias="licenseFile"),
=======
    license_files: list[UploadFile] = File(default=[], alias="licenseFile"),
>>>>>>> f18247c (增加CART)
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = _my_doctor(db, user)
    if row is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    if row.status not in REGISTRATION_EDITABLE:
        return JSONResponse({"error": "not_editable"}, status_code=409)
<<<<<<< HEAD
    err = await _upload_reg_license(db, "doctor", row.id, license_file)
    return err if err is not None else {"ok": True}
=======
    files = [f for f in license_files if f is not None and f.filename]
    if not files:
        return JSONResponse({"error": "empty_file"}, status_code=400)
    for f in files:
        err = await _upload_reg_license(db, "doctor", row.id, f)
        if err is not None:
            return err
    return {"ok": True, "count": len(files)}
>>>>>>> f18247c (增加CART)


@router.delete("/registration/{reg_type}/license/{attachment_id}")
def delete_reg_license(
    reg_type: str,
    attachment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if reg_type not in ("provider", "doctor"):
        return JSONResponse({"error": "invalid_type"}, status_code=400)
    row = _my_provider(db, user) if reg_type == "provider" else _my_doctor(db, user)
    if row is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    if row.status not in REGISTRATION_EDITABLE:
        return JSONResponse({"error": "not_editable"}, status_code=409)
    att = db.get(Attachment, attachment_id)
    if att is None or att.registration_type != reg_type or att.registration_id != row.id:
        return JSONResponse({"error": "not_found"}, status_code=404)
    try:
        Path(att.stored_path).unlink(missing_ok=True)
    except OSError:
        pass
    db.delete(att)
    db.commit()
    return {"ok": True}


@router.post("/registration/provider/submit", response_model=ProviderProfile)
def submit_provider(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = _my_provider(db, user)
    if row is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    if row.status not in REGISTRATION_EDITABLE:
        return JSONResponse({"error": "not_editable"}, status_code=409)
    row.status = "PENDING_REVIEW"
    db.commit()
    db.refresh(row)
    return _provider_profile(db, row)


@router.post("/registration/doctor/submit", response_model=DoctorProfile)
def submit_doctor(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = _my_doctor(db, user)
    if row is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    if row.status not in REGISTRATION_EDITABLE:
        return JSONResponse({"error": "not_editable"}, status_code=409)
    row.status = "PENDING_REVIEW"
    db.commit()
    db.refresh(row)
    return _doctor_profile(db, row)


# ── provider workbench (three-stage supplier flow) ───────────────────
def _provider_owned_application(db: Session, user: User, application_id: int):
    prov = _my_provider(db, user)
    if prov is None:
        return None, JSONResponse({"error": "not_provider"}, status_code=403)
    app = db.get(Application, application_id)
    if app is None:
        return None, JSONResponse({"error": "not_found"}, status_code=404)
    # The provider who owns the case is fixed at assignment in assigned_provider_id.
    # assigned_to_id is the CURRENT processor (provider then doctor), so we use
    # assigned_provider_id for provider-side access throughout the whole flow.
    if app.assigned_provider_id != prov.id:
        return None, JSONResponse({"error": "not_found"}, status_code=404)
    return app, None


@router.post("/applications/{application_id}/accept", response_model=ApplicationDetail)
def provider_accept(
    application_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    app, err = _provider_owned_application(db, user, application_id)
    if err is not None:
        return err
    if app.status != "PROVIDER_PROCESSING":
        return JSONResponse({"error": "invalid_status", "action": "accept"}, status_code=409)
    if app.accepted_at is None:
        app.accepted_at = datetime.now()
        db.add(
            ApplicationEvent(
                application_id=app.id,
                event_type="ACCEPTED",
                actor_type="provider",
                actor_name=(_assigned_name(db, app.assigned_to_type, app.assigned_to_id) or "provider"),
            )
        )
    db.commit()
    db.refresh(app)
    return _application_detail(db, app)


@router.post("/applications/{application_id}/reject", response_model=ApplicationDetail)
def provider_reject(
    application_id: int,
    payload: RejectPayload,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    app, err = _provider_owned_application(db, user, application_id)
    if err is not None:
        return err
    if app.status != "PROVIDER_PROCESSING":
        return JSONResponse({"error": "invalid_status", "action": "reject"}, status_code=409)
    reason = (payload.reason or "").strip()
    if not reason:
        return JSONResponse({"error": "reason_required"}, status_code=400)
    app.status = "PENDING_ASSIGN"
    app.reject_reason = reason
    db.add(
        ApplicationEvent(
            application_id=app.id,
            event_type="REJECTED",
            actor_type="provider",
            actor_name=(_assigned_name(db, app.assigned_to_type, app.assigned_to_id) or "provider"),
            note=reason,
            payload={"provider_id": app.assigned_to_id},
        )
    )
    db.commit()
    db.refresh(app)
    return _application_detail(db, app)


@router.post("/applications/{application_id}/structure", response_model=ApplicationDetail)
def provider_structure(
    application_id: int,
    payload: StructurePayload,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    app, err = _provider_owned_application(db, user, application_id)
    if err is not None:
        return err
    if app.status != "PROVIDER_PROCESSING":
        return JSONResponse({"error": "invalid_status", "action": "structure"}, status_code=409)
    if app.accepted_at is None:
        return JSONResponse({"error": "not_accepted"}, status_code=409)
    app.medical_summary = payload.medical_summary.strip()
    app.lab_results = payload.lab_results.strip()
    app.current_treatment = payload.current_treatment.strip()
    app.question1 = payload.question1.strip()
    app.question2 = payload.question2.strip()
    app.question3 = payload.question3.strip()
    app.status = "PENDING_DOCTOR_ASSIGN"
    db.add(
        ApplicationEvent(
            application_id=app.id,
            event_type="STRUCTURE_SUBMITTED",
            actor_type="provider",
            actor_name=(_assigned_name(db, app.assigned_to_type, app.assigned_to_id) or "provider"),
        )
    )
    db.commit()
    db.refresh(app)
    return _application_detail(db, app)


@router.post("/applications/{application_id}/report", response_model=ApplicationDetail)
async def provider_upload_report(
    application_id: int,
    report_file: UploadFile = File(..., alias="reportFile"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    app, err = _provider_owned_application(db, user, application_id)
    if err is not None:
        return err
    if app.status != "PROVIDER_TRANSLATING":
        return JSONResponse({"error": "invalid_status", "action": "report"}, status_code=409)
    content = await report_file.read()
    if len(content) == 0:
        return JSONResponse({"error": "empty_file"}, status_code=400)
    if len(content) > MAX_FINAL_REPORT_BYTES:
        return JSONResponse({"error": "file_too_large"}, status_code=400)
    if (report_file.content_type or "") != "application/pdf":
        return JSONResponse({"error": "file_type_not_allowed"}, status_code=400)

    saved = save_final_report(app.id, report_file.filename or "report.pdf", content)
    db.add(
        Attachment(
            application_id=app.id,
            kind="final_report",
            original_name=saved["original_name"],
            stored_path=saved["stored_path"],
            mime_type="application/pdf",
            size=saved["size"],
        )
    )
    app.final_bilingual_report_url = saved["stored_path"]
    db.commit()
    db.refresh(app)
    return _application_detail(db, app)


@router.post("/applications/{application_id}/translate", response_model=ApplicationDetail)
def provider_translate(
    application_id: int,
    payload: TranslatePayload,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    app, err = _provider_owned_application(db, user, application_id)
    if err is not None:
        return err
    if app.status != "PROVIDER_TRANSLATING":
        return JSONResponse({"error": "invalid_status", "action": "translate"}, status_code=409)
    if not app.final_bilingual_report_url:
        return JSONResponse({"error": "report_missing"}, status_code=409)
    app.translated_answer1 = payload.translated_answer1.strip()
    app.translated_answer2 = payload.translated_answer2.strip()
    app.translated_answer3 = payload.translated_answer3.strip()
    app.status = "ADMIN_QC"
    db.add(
        ApplicationEvent(
            application_id=app.id,
            event_type="TRANSLATE_SUBMITTED",
            actor_type="provider",
            actor_name=(_assigned_name(db, app.assigned_to_type, app.assigned_to_id) or "provider"),
        )
    )
    db.commit()
    db.refresh(app)
    return _application_detail(db, app)


@router.get("/applications/{application_id}/final-report")
def provider_final_report(
    application_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Download the final bilingual report.

    Authorized for the client (only once COMPLETED), the assigned provider,
    or the assigned doctor.
    """
    app = db.get(Application, application_id)
    if app is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    if not app.final_bilingual_report_url:
        return JSONResponse({"error": "not_found"}, status_code=404)

    # Authorization: any of the related parties may access.
    prov = _my_provider(db, user)
    doc = _my_doctor(db, user)
    is_provider = prov is not None and app.assigned_provider_id == prov.id
    is_doctor = doc is not None and app.assigned_doctor_id == doc.id
    is_client = app.user_id == user.id
    if not (is_provider or is_doctor or is_client):
        return JSONResponse({"error": "not_found"}, status_code=404)
    # The client can only fetch the report after it has been delivered.
    if is_client and not is_provider and not is_doctor and app.status != "COMPLETED":
        return JSONResponse({"error": "not_ready"}, status_code=403)

    path = Path(app.final_bilingual_report_url)
    try:
        data = path.read_bytes()
    except OSError:
        return JSONResponse({"error": "file_missing"}, status_code=410)
    disposition = "attachment" if request.query_params.get("download") == "1" else "inline"
    ascii_name = "".join(c if 0x20 <= ord(c) <= 0x7E else "_" for c in path.name)
    encoded_name = quote(path.name)
    return Response(content=data, media_type="application/pdf", headers={
        "Content-Disposition": f"{disposition}; filename=\"{ascii_name}\"; filename*=UTF-8''{encoded_name}"
    })


# ── doctor opinion submit ────────────────────────────────────────────
def _doctor_owned_application(db: Session, user: User, application_id: int):
    doc = _my_doctor(db, user)
    if doc is None:
        return None, JSONResponse({"error": "not_doctor"}, status_code=403)
    app = db.get(Application, application_id)
    if app is None or app.assigned_doctor_id != doc.id:
        return None, JSONResponse({"error": "not_found"}, status_code=404)
    return app, None


@router.post("/applications/{application_id}/opinion", response_model=ApplicationDetail)
def doctor_submit_opinion(
    application_id: int,
    payload: OpinionPayload,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    app, err = _doctor_owned_application(db, user, application_id)
    if err is not None:
        return err
    if app.status != "DOCTOR_PROCESSING":
        return JSONResponse({"error": "invalid_status", "action": "opinion"}, status_code=409)
    a1 = (payload.answer1 or "").strip()
    a2 = (payload.answer2 or "").strip()
    a3 = (payload.answer3 or "").strip()
    if not a1 or not a2 or not a3:
        return JSONResponse({"error": "answers_required"}, status_code=400)
    app.doctor_answer1 = a1
    app.doctor_answer2 = a2
    app.doctor_answer3 = a3
    app.status = "PROVIDER_TRANSLATING"
    db.add(
        ApplicationEvent(
            application_id=app.id,
            event_type="OPINION_SUBMITTED",
            actor_type="doctor",
            actor_name=_doctor_name(db, app.assigned_doctor_id) or "doctor",
        )
    )
    db.commit()
    db.refresh(app)
    return _application_detail(db, app)


@router.get("/applications/{application_id}/attachments/archive")
def doctor_attachments_archive(
    application_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Zip all source attachments of an application the doctor can access."""
    app, err = _doctor_owned_application(db, user, application_id)
    if err is not None:
        return err
    atts = (
        db.query(Attachment)
        .filter(Attachment.application_id == app.id, Attachment.kind == "source")
        .order_by(Attachment.created_at)
        .all()
    )
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for a in atts:
            try:
                zf.write(a.stored_path, arcname=a.original_name)
            except OSError:
                continue
    buf.seek(0)
    filename = f"application-{app.id}-attachments.zip"
    return Response(
        content=buf.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=\"{filename}\""},
    )


@router.get("/registration/attachments/{attachment_id}")
def my_reg_attachment(
    attachment_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Stream a registration license file that belongs to the logged-in user."""
    att = db.get(Attachment, attachment_id)
    if att is None or not att.registration_type:
        return JSONResponse({"error": "not_found"}, status_code=404)
    if att.registration_type == "provider":
        owner = _my_provider(db, user)
    elif att.registration_type == "doctor":
        owner = _my_doctor(db, user)
    else:
        owner = None
    if owner is None or owner.id != att.registration_id:
        return JSONResponse({"error": "not_found"}, status_code=404)

    path = Path(att.stored_path)
    try:
        data = path.read_bytes()
    except OSError:
        return JSONResponse({"error": "file_missing"}, status_code=410)

    disposition = "attachment" if request.query_params.get("download") == "1" else "inline"
    ascii_name = "".join(c if 0x20 <= ord(c) <= 0x7E else "_" for c in att.original_name)
    encoded_name = quote(att.original_name)
    return Response(
        content=data,
        media_type=att.mime_type or "application/octet-stream",
        headers={
            "Content-Disposition": (
                f"{disposition}; filename=\"{ascii_name}\"; filename*=UTF-8''{encoded_name}"
            )
        },
    )

