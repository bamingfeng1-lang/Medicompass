from pathlib import Path
from urllib.parse import quote

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, Query, Request, UploadFile
from fastapi.responses import JSONResponse, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    MAX_AGE_SECONDS,
    SESSION_COOKIE,
    hash_password,
    sign_session,
    verify_password,
)
from app.db.session import get_db
from app.deps import get_current_admin
from app.models.admin import Admin
from app.models.application import Application, ApplicationEvent, Attachment
from app.models.communication import CommunicationLog
from app.models.registration import (
    RegistrationDoctor,
    RegistrationPatient,
    RegistrationProvider,
)
from app.models.status import APPLICATION_STATUS_SET, REGISTRATION_STATUS_SET
from app.schemas.admin import LoginRequest, LoginResponse, OkResponse
from app.schemas.auth import ChangePasswordPayload
from app.schemas.communication import (
    CommunicationCreate,
    CommunicationLogOut,
    SendEmailPayload,
    SendEmailResult,
)
from app.schemas.application import (
    ApplicationDetail,
    ApplicationEventOut,
    ApplicationListItem,
    AssigneeItem,
    AssignPayload,
    AttachmentOut,
    FinalizePayload,
    PaginatedApplications,
    StatusResult,
    StatusUpdate,
    SummarizeResult,
    SupremeUpdatePayload,
)
from app.schemas.registration import (
    DoctorProfile,
    ProviderProfile,
    RegistrationAttachmentOut,
    RegistrationListItem,
    RegistrationReview,
)
from app.services.ai import summarize_application
from app.services.email import normalize_emails, send_custom_email
from app.services.storage import MAX_FILE_BYTES, is_allowed, save_upload
from datetime import datetime
import re

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _add_event(
    db: Session,
    application_id: int,
    event_type: str,
    actor_name: str,
    payload: dict | None = None,
    note: str | None = None,
) -> None:
    """Append a workflow event. Caller is responsible for committing."""
    db.add(
        ApplicationEvent(
            application_id=application_id,
            event_type=event_type,
            actor_type="admin",
            actor_name=actor_name or "",
            payload=payload,
            note=note,
        )
    )


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


def _build_detail(db: Session, app: Application) -> ApplicationDetail:
    doctor_name = None
    if app.assigned_doctor_id:
        d = db.get(RegistrationDoctor, app.assigned_doctor_id)
        doctor_name = d.full_name if d else None
    provider_name = None
    if app.assigned_provider_id:
        p = db.get(RegistrationProvider, app.assigned_provider_id)
        provider_name = p.org_name if p else None

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
        full_name=app.full_name,
        email=app.email,
        phone=app.phone,
        country=app.country,
        need_type=app.need_type,
        service_category=app.service_category,
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
        assigned_doctor_name=doctor_name,
        assigned_provider_id=app.assigned_provider_id,
        assigned_provider_name=provider_name,
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
        # CAR-T specific fields
        hospital=app.hospital,
        expert_doctor=app.expert_doctor,
        arrival_datetime=app.arrival_datetime,
        flight_number=app.flight_number,
        consultation_datetime=app.consultation_datetime,
        ai_summary=app.ai_summary,
        ai_summary_status=app.ai_summary_status,
        ai_summary_error=app.ai_summary_error,
        created_at=app.created_at,
        attachments=[AttachmentOut.model_validate(a) for a in app.attachments],
        events=[ApplicationEventOut.model_validate(e) for e in app.events],
    )



def _set_session_cookie(resp: Response, token: str) -> None:
    resp.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        max_age=MAX_AGE_SECONDS,
        httponly=True,
        samesite="lax",
        secure=settings.COOKIE_SECURE,
        path="/",
    )


# ── auth ─────────────────────────────────────────────────────────────
@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    username = (payload.username or "").strip()
    password = payload.password or ""
    if not username or not password:
        return JSONResponse({"error": "missing_credentials"}, status_code=400)

    admin = db.query(Admin).filter(Admin.username == username).first()
    if admin is None or not verify_password(password, admin.password_hash):
        return JSONResponse({"error": "invalid_credentials"}, status_code=401)

    token = sign_session(str(admin.id), admin.username)
    resp = JSONResponse(LoginResponse(ok=True, username=admin.username).model_dump(by_alias=True))
    _set_session_cookie(resp, token)
    return resp


@router.post("/logout")
def logout():
    resp = JSONResponse(OkResponse(ok=True).model_dump(by_alias=True))
    resp.delete_cookie(SESSION_COOKIE, path="/")
    return resp


@router.get("/me")
def admin_me(admin: Admin = Depends(get_current_admin)):
    """Return the currently authenticated admin (401 if not logged in)."""
    return JSONResponse({"username": admin.username})


@router.post("/change-password")
def admin_change_password(
    payload: ChangePasswordPayload,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Change the logged-in admin's password."""
    old = payload.old_password or ""
    new = payload.new_password or ""
    if not old or not new:
        return JSONResponse({"error": "missing_fields"}, status_code=400)
    if not verify_password(old, admin.password_hash):
        return JSONResponse({"error": "old_password_wrong"}, status_code=403)
    if len(new) < 8:
        return JSONResponse({"error": "weak_password"}, status_code=400)
    if new == old:
        return JSONResponse({"error": "same_password"}, status_code=400)
    admin.password_hash = hash_password(new)
    db.commit()
    return JSONResponse({"ok": True})


# ── applications ─────────────────────────────────────────────────────
@router.get("/applications", response_model=PaginatedApplications)
def list_applications(
    service_category: str | None = Query(default=None, alias="serviceCategory"),
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    from sqlalchemy import or_

    count_subq = (
        select(Attachment.application_id, func.count(Attachment.id).label("cnt"))
        .group_by(Attachment.application_id)
        .subquery()
    )
    stmt = (
        select(Application, func.coalesce(count_subq.c.cnt, 0))
        .outerjoin(count_subq, count_subq.c.application_id == Application.id)
        .order_by(Application.created_at.desc())
    )
    if service_category:
        stmt = stmt.where(Application.service_category == service_category)
    if status:
        stmt = stmt.where(Application.status == status)
    if search:
        search_term = f"%{search}%"
        stmt = stmt.where(
            or_(
                Application.full_name.like(search_term),
                Application.application_no.like(search_term),
            )
        )
    
    # Count total records
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar() or 0
    
    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size
    
    # Apply pagination
    offset = (page - 1) * page_size
    stmt = stmt.offset(offset).limit(page_size)
    
    rows = db.execute(stmt).all()
    items = [
        ApplicationListItem(
            id=app.id,
            application_no=app.application_no,
            full_name=app.full_name,
            email=app.email,
            need_type=app.need_type,
            service_category=app.service_category,
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
    
    return PaginatedApplications(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/applications/{application_id}", response_model=ApplicationDetail)
def get_application(
    application_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    app = db.get(Application, application_id)
    if app is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    return _build_detail(db, app)


@router.post("/applications/{application_id}/summarize", response_model=SummarizeResult)
def summarize(
    application_id: int,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    app = db.get(Application, application_id)
    if app is None:
        return JSONResponse({"error": "not_found"}, status_code=404)

    # Run AI summarization in background to avoid blocking the request
    # Frontend can poll the application detail to check the status
    app.ai_summary_status = "pending"
    app.ai_summary_error = None
    db.commit()
    
    background.add_task(summarize_application, application_id)
    
    return SummarizeResult(
        ai_summary=app.ai_summary,
        ai_summary_status=app.ai_summary_status,
        ai_summary_error=app.ai_summary_error,
    )


@router.patch("/applications/{application_id}/status", response_model=StatusResult)
def update_status(
    application_id: int,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Set the workflow status of an application (admin, free jump to any stage)."""
    new_status = (payload.status or "").strip()
    if new_status not in APPLICATION_STATUS_SET:
        return JSONResponse({"error": "invalid_status"}, status_code=400)
    app = db.get(Application, application_id)
    if app is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    old_status = app.status
    if new_status != old_status:
        app.status = new_status
        _add_event(
            db,
            application_id,
            "STATUS_CHANGED",
            admin.username,
            payload={"from": old_status, "to": new_status},
        )
    db.commit()
    db.refresh(app)
    return StatusResult(id=app.id, status=app.status)


# ── supreme edit (admin can do everything) ─────────────────────────────
_EDITABLE_FIELDS = [
    "full_name",
    "email",
    "phone",
    "country",
    "service_category",
    "need_type",
    "destination",
    "condition",
    "message",
    "medical_summary",
    "lab_results",
    "current_treatment",
    "question1",
    "question2",
    "question3",
    "doctor_answer1",
    "doctor_answer2",
    "doctor_answer3",
    "translated_answer1",
    "translated_answer2",
    "translated_answer3",
    # CAR-T specific fields
    "hospital",
    "expert_doctor",
    "arrival_datetime",
    "flight_number",
    "consultation_datetime",
]

_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


@router.patch("/applications/{application_id}/info", response_model=ApplicationDetail)
def update_application_info(
    application_id: int,
    payload: SupremeUpdatePayload,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Admin edits any application field (supreme capability)."""
    app = db.get(Application, application_id)
    if app is None:
        return JSONResponse({"error": "not_found"}, status_code=404)

    data = payload.model_dump(exclude_unset=True)
    changed: list[str] = []
    for field in _EDITABLE_FIELDS:
        if field in data:
            val = data[field]
            if field == "email" and val and not _EMAIL_RE.match(val.strip()):
                return JSONResponse({"error": "invalid_email"}, status_code=400)
            setattr(app, field, val.strip() if isinstance(val, str) else val)
            changed.append(field)
    if not changed:
        return JSONResponse({"error": "no_fields"}, status_code=400)

    # Editing the source content invalidates the AI summary.
    if any(f in changed for f in ("medical_summary", "lab_results", "condition", "full_name")):
        app.ai_summary = None
        app.ai_summary_status = "pending"
        app.ai_summary_error = None

    db.add(
        ApplicationEvent(
            application_id=app.id,
            event_type="INFO_UPDATED",
            actor_type="admin",
            actor_name=admin.username,
            payload={"fields": changed},
        )
    )
    db.commit()
    db.refresh(app)
    return _build_detail(db, app)


@router.post("/applications/{application_id}/attachments", response_model=ApplicationDetail)
async def add_application_attachment(
    application_id: int,
    files: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Admin uploads additional source attachments to an application."""
    app = db.get(Application, application_id)
    if app is None:
        return JSONResponse({"error": "not_found"}, status_code=404)

    added = 0
    for f in files or []:
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

    if added == 0:
        return JSONResponse({"error": "no_files"}, status_code=400)

    db.add(
        ApplicationEvent(
            application_id=app.id,
            event_type="ATTACHMENT_UPLOADED",
            actor_type="admin",
            actor_name=admin.username,
            payload={"files_added": added},
        )
    )
    db.commit()
    db.refresh(app)
    return _build_detail(db, app)


# ── assignment ───────────────────────────────────────────────────────
@router.get("/providers", response_model=list[AssigneeItem])
def list_providers(
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    rows = db.query(RegistrationProvider).order_by(RegistrationProvider.created_at.desc()).all()
    return [
        AssigneeItem(id=r.id, name=r.org_name, subtitle=r.contact_person, country=r.country)
        for r in rows
    ]


@router.get("/doctors", response_model=list[AssigneeItem])
def list_doctors(
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    rows = db.query(RegistrationDoctor).order_by(RegistrationDoctor.created_at.desc()).all()
    return [
        AssigneeItem(id=r.id, name=r.full_name, subtitle=r.specialty, country=r.country)
        for r in rows
    ]


@router.patch("/applications/{application_id}/assign", response_model=ApplicationDetail)
def assign_application(
    application_id: int,
    payload: AssignPayload,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Assign an application to a provider or doctor (one assignee at a time).

    Passing an empty assignedToType clears the assignment. When assigning while
    the application is still PENDING_REVIEW, it is advanced to PENDING_ASSIGN.
    """
    assign_type = (payload.assigned_to_type or "").strip() or None
    assign_id = payload.assigned_to_id

    app = db.get(Application, application_id)
    if app is None:
        return JSONResponse({"error": "not_found"}, status_code=404)

    if assign_type is None:
        # Clear assignment.
        app.assigned_to_type = None
        app.assigned_to_id = None
        _add_event(db, application_id, "ASSIGNED", admin.username, payload={"type": None})
        db.commit()
        db.refresh(app)
        return _build_detail(db, app)

    if assign_type not in ("provider", "doctor"):
        return JSONResponse({"error": "invalid_assignee_type"}, status_code=400)
    if not assign_id:
        return JSONResponse({"error": "missing_assignee_id"}, status_code=400)

    if assign_type == "provider":
        target = db.get(RegistrationProvider, assign_id)
        name = target.org_name if target else None
    else:
        target = db.get(RegistrationDoctor, assign_id)
        name = target.full_name if target else None
    if target is None:
        return JSONResponse({"error": "assignee_not_found"}, status_code=404)

    app.assigned_to_type = assign_type
    app.assigned_to_id = assign_id
    if assign_type == "doctor":
        app.assigned_doctor_id = assign_id
    elif assign_type == "provider":
        # Fixed owner of the case; the provider keeps access through the whole flow.
        app.assigned_provider_id = assign_id
    _add_event(
        db,
        application_id,
        "ASSIGNED",
        admin.username,
        payload={"type": assign_type, "id": assign_id, "name": name},
    )

    # Auto-advance PENDING_REVIEW -> PENDING_ASSIGN on first assignment.
    if app.status == "PENDING_REVIEW":
        _add_event(
            db,
            application_id,
            "STATUS_CHANGED",
            admin.username,
            payload={"from": "PENDING_REVIEW", "to": "PENDING_ASSIGN"},
        )
        app.status = "PENDING_ASSIGN"
    # Assigning a doctor after the provider has structured the case advances
    # PENDING_DOCTOR_ASSIGN -> DOCTOR_PROCESSING.
    elif app.status == "PENDING_DOCTOR_ASSIGN" and assign_type == "doctor":
        _add_event(
            db,
            application_id,
            "STATUS_CHANGED",
            admin.username,
            payload={"from": "PENDING_DOCTOR_ASSIGN", "to": "DOCTOR_PROCESSING"},
        )
        app.status = "DOCTOR_PROCESSING"

    # Assigning a provider hands the case to the provider workbench:
    # advance PENDING_REVIEW/PENDING_ASSIGN -> PROVIDER_PROCESSING.
    if assign_type == "provider" and app.status in ("PENDING_REVIEW", "PENDING_ASSIGN"):
        _add_event(
            db,
            application_id,
            "STATUS_CHANGED",
            admin.username,
            payload={"from": app.status, "to": "PROVIDER_PROCESSING"},
        )
        app.status = "PROVIDER_PROCESSING"

    db.commit()
    db.refresh(app)
    return _build_detail(db, app)


@router.post("/applications/{application_id}/finalize", response_model=ApplicationDetail)
def finalize_application(
    application_id: int,
    payload: FinalizePayload,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Admin final QC: approve -> COMPLETED, or reject -> PROVIDER_TRANSLATING."""
    app = db.get(Application, application_id)
    if app is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    if app.status != "ADMIN_QC":
        return JSONResponse({"error": "not_admin_qc"}, status_code=409)
    action = (payload.action or "").strip()
    if action == "approve":
        _add_event(
            db, application_id, "STATUS_CHANGED", admin.username,
            payload={"from": "ADMIN_QC", "to": "COMPLETED"},
        )
        _add_event(db, application_id, "FINALIZED", admin.username)
        app.status = "COMPLETED"
    elif action == "reject":
        note = (payload.note or "").strip()
        if not note:
            return JSONResponse({"error": "note_required"}, status_code=400)
        _add_event(
            db, application_id, "STATUS_CHANGED", admin.username,
            payload={"from": "ADMIN_QC", "to": "PROVIDER_TRANSLATING"},
        )
        _add_event(db, application_id, "FINALIZE_REJECTED", admin.username, note=note)
        app.status = "PROVIDER_TRANSLATING"
    else:
        return JSONResponse({"error": "invalid_action"}, status_code=400)
    db.commit()
    db.refresh(app)
    return _build_detail(db, app)


@router.get("/applications/{application_id}/final-report")
def get_final_report_admin(
    application_id: int,
    request: Request,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    app = db.get(Application, application_id)
    if app is None or not app.final_bilingual_report_url:
        return JSONResponse({"error": "not_found"}, status_code=404)
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


# ── custom email & communication log ─────────────────────────────────
_COMM_CHANNELS = {"email", "phone", "meeting", "other"}


def _client_emails(db: Session, app: Application) -> list[str]:
    """Recipient inboxes for an application.

    Set = application.email ∪ (the email of the user's latest patient
    registration, when the application is linked to a user account).
    Trimmed, lowercased and de-duplicated.
    """
    candidates: list[str | None] = [app.email]
    if app.user_id:
        patient = (
            db.query(RegistrationPatient)
            .filter(RegistrationPatient.user_id == app.user_id)
            .order_by(RegistrationPatient.created_at.desc())
            .first()
        )
        if patient is not None:
            candidates.append(patient.email)
    return normalize_emails(candidates)


@router.post("/applications/{application_id}/send-email", response_model=SendEmailResult)
async def send_application_email(
    application_id: int,
    subject: str = Form(""),
    content: str = Form(""),
    attachments: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Send an admin-composed custom email to the application's client inbox(es).

    Recipients are de-duplicated (application.email + the linked user's latest
    patient-profile email); identical addresses receive only one email. The
    body is rendered into the blank brand template. Every send attempt is
    recorded in communication_log + the event timeline, including when the
    mail service is disabled or the send fails.

    Uploaded attachments are sent with the email and also saved as application
    attachments (kind='email_attachment') for future reference.
    """
    app = db.get(Application, application_id)
    if app is None:
        return JSONResponse({"error": "not_found"}, status_code=404)

    subject = subject.strip()
    content = content.strip()
    if not subject or not content:
        return JSONResponse({"error": "missing_fields"}, status_code=400)

    recipients = _client_emails(db, app)
    if not recipients:
        return JSONResponse({"error": "no_recipients"}, status_code=400)

    # Read and validate uploaded files
    email_attachments: list[tuple[str, bytes, str]] = []
    saved_attachments: list[dict] = []
    for f in attachments or []:
        file_content = await f.read()
        if len(file_content) == 0:
            continue
        if len(file_content) > MAX_FILE_BYTES:
            return JSONResponse({"error": "file_too_large", "name": f.filename}, status_code=400)
        mime = f.content_type or "application/octet-stream"
        if not is_allowed(mime, len(file_content)):
            return JSONResponse(
                {"error": "file_type_not_allowed", "name": f.filename}, status_code=400
            )
        email_attachments.append((f.filename or "file", file_content, mime))
        # Save file for attachment record
        saved = save_upload(app.id, f.filename or "file", file_content, mime)
        saved_attachments.append(saved)

    result = send_custom_email(
        name=app.full_name,
        to_emails=recipients,
        subject=subject,
        body_text=content,
        attachments=email_attachments if email_attachments else None,
    )

    if result.message == "email_disabled":
        email_status = "disabled"
    elif result.ok:
        email_status = "sent"
    else:
        email_status = "failed"

    # Save uploaded files as application attachments (kind='email_attachment')
    for saved in saved_attachments:
        db.add(
            Attachment(
                application_id=app.id,
                original_name=saved["original_name"],
                stored_path=saved["stored_path"],
                mime_type=saved["mime_type"],
                size=saved["size"],
                kind="email_attachment",
            )
        )

    db.add(
        CommunicationLog(
            application_id=app.id,
            channel="email",
            direction="outbound",
            subject=subject[:255],
            content=content,
            recipients=", ".join(recipients)[:512],
            email_status=email_status,
            actor_name=admin.username,
        )
    )
    _add_event(
        db,
        app.id,
        "EMAIL_SENT",
        admin.username,
        payload={
            "subject": subject[:255],
            "recipients": recipients,
            "status": email_status,
            "attachment_count": len(saved_attachments),
        },
    )
    db.commit()

    return SendEmailResult(
        ok=result.ok,
        email_status=email_status,
        recipients=recipients,
    )


@router.get(
    "/applications/{application_id}/communications",
    response_model=list[CommunicationLogOut],
)
def list_communications(
    application_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    """List the communication history for an application (newest first)."""
    app = db.get(Application, application_id)
    if app is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    rows = (
        db.query(CommunicationLog)
        .filter(CommunicationLog.application_id == application_id)
        .order_by(CommunicationLog.created_at.desc(), CommunicationLog.id.desc())
        .all()
    )
    return [CommunicationLogOut.model_validate(r) for r in rows]


@router.post(
    "/applications/{application_id}/communications",
    response_model=CommunicationLogOut,
)
def add_communication(
    application_id: int,
    payload: CommunicationCreate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Manually log a phone / meeting / other-channel communication."""
    app = db.get(Application, application_id)
    if app is None:
        return JSONResponse({"error": "not_found"}, status_code=404)

    channel = (payload.channel or "").strip()
    if channel not in _COMM_CHANNELS:
        return JSONResponse({"error": "invalid_channel"}, status_code=400)
    subject = (payload.subject or "").strip() or None
    content = (payload.content or "").strip() or None
    if not subject and not content:
        return JSONResponse({"error": "missing_fields"}, status_code=400)

    log = CommunicationLog(
        application_id=app.id,
        channel=channel,
        direction="outbound",
        subject=subject[:255] if subject else None,
        content=content,
        recipients=None,
        email_status=None,
        actor_name=admin.username,
    )
    db.add(log)
    _add_event(
        db,
        app.id,
        "COMM_LOGGED",
        admin.username,
        payload={"channel": channel, "subject": subject},
    )
    db.commit()
    db.refresh(log)
    return CommunicationLogOut.model_validate(log)


# ── attachments ──────────────────────────────────────────────────────
@router.get("/attachments/{attachment_id}")
def get_attachment(
    attachment_id: int,
    request: Request,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    att = db.get(Attachment, attachment_id)
    if att is None:
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


# ── registration review (provider / doctor) ──────────────────────────
def _reg_attachments_admin(db: Session, reg_type: str, reg_id: int):
    rows = (
        db.query(Attachment)
        .filter(Attachment.registration_type == reg_type, Attachment.registration_id == reg_id)
        .order_by(Attachment.created_at)
        .all()
    )
    return [RegistrationAttachmentOut.model_validate(a) for a in rows]


@router.get("/registrations/providers", response_model=list[RegistrationListItem])
def list_providers_admin(
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    q = db.query(RegistrationProvider)
    if status_filter:
        q = q.filter(RegistrationProvider.status == status_filter)
    rows = q.order_by(RegistrationProvider.created_at.desc()).all()
    return [
        RegistrationListItem(
            id=r.id,
            name=r.org_name,
            subtitle=r.contact_person,
            country=r.country,
            status=r.status,
            attachment_count=db.query(func.count(Attachment.id))
            .filter(Attachment.registration_type == "provider", Attachment.registration_id == r.id)
            .scalar()
            or 0,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.get("/registrations/doctors", response_model=list[RegistrationListItem])
def list_doctors_admin(
    status_filter: str | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    q = db.query(RegistrationDoctor)
    if status_filter:
        q = q.filter(RegistrationDoctor.status == status_filter)
    rows = q.order_by(RegistrationDoctor.created_at.desc()).all()
    return [
        RegistrationListItem(
            id=r.id,
            name=r.full_name,
            subtitle=r.specialty,
            country=r.country,
            status=r.status,
            attachment_count=db.query(func.count(Attachment.id))
            .filter(Attachment.registration_type == "doctor", Attachment.registration_id == r.id)
            .scalar()
            or 0,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.get("/registrations/provider/{reg_id}", response_model=ProviderProfile)
def get_provider_admin(
    reg_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    r = db.get(RegistrationProvider, reg_id)
    if r is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    return ProviderProfile(
        id=r.id,
        org_name=r.org_name,
        org_type=r.org_type,
        country=r.country,
        contact_person=r.contact_person,
        phone=r.phone,
        email=r.email,
        cooperation=r.cooperation,
        status=r.status,
        review_note=r.review_note,
        editable=False,
        attachments=_reg_attachments_admin(db, "provider", r.id),
    )


@router.get("/registrations/doctor/{reg_id}", response_model=DoctorProfile)
def get_doctor_admin(
    reg_id: int,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    r = db.get(RegistrationDoctor, reg_id)
    if r is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    return DoctorProfile(
        id=r.id,
        full_name=r.full_name,
        specialty=r.specialty,
        hospital=r.hospital,
        country=r.country,
        title=r.title,
        years=r.years,
        languages=r.languages,
        remote=r.remote,
        email=r.email,
        phone=r.phone,
        status=r.status,
        review_note=r.review_note,
        editable=False,
        attachments=_reg_attachments_admin(db, "doctor", r.id),
    )


def _apply_review(row, payload: RegistrationReview, admin: Admin):
    """Apply an approve/reject decision. Returns error response or None."""
    if row.status != "PENDING_REVIEW":
        return JSONResponse({"error": "not_pending"}, status_code=409)
    action = (payload.action or "").strip()
    if action == "approve":
        row.status = "APPROVED"
    elif action == "reject":
        row.status = "REJECTED"
    else:
        return JSONResponse({"error": "invalid_action"}, status_code=400)
    row.review_note = (payload.note or "").strip() or None
    row.reviewed_at = datetime.now()
    row.reviewed_by = admin.id
    return None


@router.post("/registrations/provider/{reg_id}/review", response_model=ProviderProfile)
def review_provider(
    reg_id: int,
    payload: RegistrationReview,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    r = db.get(RegistrationProvider, reg_id)
    if r is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    err = _apply_review(r, payload, admin)
    if err is not None:
        return err
    db.commit()
    db.refresh(r)
    return get_provider_admin(reg_id, db, admin)


@router.post("/registrations/doctor/{reg_id}/review", response_model=DoctorProfile)
def review_doctor(
    reg_id: int,
    payload: RegistrationReview,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    r = db.get(RegistrationDoctor, reg_id)
    if r is None:
        return JSONResponse({"error": "not_found"}, status_code=404)
    err = _apply_review(r, payload, admin)
    if err is not None:
        return err
    db.commit()
    db.refresh(r)
    return get_doctor_admin(reg_id, db, admin)


@router.get("/registrations/attachments/{attachment_id}")
def get_reg_attachment_admin(
    attachment_id: int,
    request: Request,
    db: Session = Depends(get_db),
    _: Admin = Depends(get_current_admin),
):
    att = db.get(Attachment, attachment_id)
    if att is None or not att.registration_type:
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
