import re

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import get_db
from app.models.application import Application, Attachment
from app.models.registration import (
    RegistrationDoctor,
    RegistrationPatient,
    RegistrationProvider,
)
from app.models.user import User
from app.schemas.registration import (
    QuickPatientRegistration,
    RegistrationCreated,
)
from app.services.email import send_application_confirmation_email
from app.services.storage import (
    MAX_FILE_BYTES,
    is_allowed,
    save_upload,
    save_upload_for_registration,
)

router = APIRouter(prefix="/api/register", tags=["register"])

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
MIN_PASSWORD_LEN = 8


def _missing(field: str):
    return JSONResponse({"error": "missing_field", "field": field}, status_code=400)


def _create_user(db: Session, phone: str, password: str):
    """Create a user account for the phone; returns (user, error_response).

    Phone is the unique login identifier. This period we do NOT support adding
    a new role to an existing phone — an existing phone is rejected.
    """
    if len(password) < MIN_PASSWORD_LEN:
        return None, JSONResponse({"error": "weak_password"}, status_code=400)
    exists = db.query(User.id).filter(User.phone == phone).first()
    if exists:
        return None, JSONResponse({"error": "phone_exists"}, status_code=409)
    user = User(phone=phone, password_hash=hash_password(password))
    db.add(user)
    db.flush()  # assign user.id without committing yet

    # Silent association: claim any anonymous application/enquiry submitted
    # earlier with the same phone number. Only the user_id is back-filled —
    # the records' other fields and the user's profile are never modified.
    db.query(Application).filter(
        Application.user_id.is_(None), Application.phone == phone
    ).update({Application.user_id: user.id})

    return user, None


async def _read_license_file(file: UploadFile | None):
    """Read + validate an optional license upload. Returns (prepared, error).

    prepared is None when no file was provided; otherwise a dict with
    filename/content/mime. error is a JSONResponse on validation failure.
    """
    if file is None or not file.filename:
        return None, None
    content = await file.read()
    if len(content) == 0:
        return None, None
    if len(content) > MAX_FILE_BYTES:
        return None, JSONResponse({"error": "file_too_large", "name": file.filename}, status_code=400)
    mime = file.content_type or "application/octet-stream"
    if not is_allowed(mime, len(content)):
        return None, JSONResponse(
            {"error": "file_type_not_allowed", "name": file.filename}, status_code=400
        )
    return {"filename": file.filename, "content": content, "mime": mime}, None


def _save_license_attachment(db: Session, reg_type: str, reg_id: int, prepared: dict) -> None:
    saved = save_upload_for_registration(
        reg_type, reg_id, prepared["filename"], prepared["content"], prepared["mime"]
    )
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


@router.post("/patient", status_code=201, response_model=RegistrationCreated)
async def register_patient(
    full_name: str = Form("", alias="fullName"),
    email: str = Form(""),
    phone: str = Form(""),
    password: str = Form(""),
    country: str = Form(""),
    need_type: str = Form("", alias="needType"),
    destination: str = Form(""),
    condition: str = Form(""),
    lang: str = Form("zh"),
    attachments: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
):
    data = {
        "full_name": full_name.strip(),
        "email": email.strip(),
        "phone": phone.strip(),
        "country": country.strip(),
        "need_type": need_type.strip(),
        "condition": condition.strip(),
    }
    for key, val in data.items():
        if not val:
            return _missing(key)
    if not password:
        return _missing("password")
    if not EMAIL_RE.match(data["email"]):
        return JSONResponse({"error": "invalid_email"}, status_code=400)

    # Validate + hold the optional medical attachments before creating anything.
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

    user, err = _create_user(db, data["phone"], password)
    if err is not None:
        return err

    row = RegistrationPatient(
        **data,
        user_id=user.id,
        destination=destination.strip() or None,
        lang=lang.strip() or "zh",
    )
    db.add(row)

    # Also create an application record from the same registration data, so the
    # new customer immediately has a record under "My Applications". The
    # registration form already collects everything an application needs.
    application = Application(
        user_id=user.id,
        full_name=data["full_name"],
        email=data["email"],
        phone=data["phone"],
        country=data["country"],
        need_type=data["need_type"],
        destination=destination.strip() or None,
        condition=data["condition"],
        lang=lang.strip() or "zh",
    )
    db.add(application)
    db.flush()  # assign application.id

    # Save any uploaded medical attachments against the application.
    for item in prepared:
        saved = save_upload(application.id, item["filename"], item["content"], item["mime"])
        db.add(
            Attachment(
                application_id=application.id,
                original_name=saved["original_name"],
                stored_path=saved["stored_path"],
                mime_type=saved["mime_type"],
                size=saved["size"],
                kind="source",
            )
        )

    db.commit()

    # Send the client a confirmation email (safe no-op if mailing is disabled).
    send_application_confirmation_email(
        name=application.full_name,
        to_email=application.email,
        need_type=application.need_type,
    )

    db.refresh(row)
    return RegistrationCreated(id=row.id)


@router.post("/provider", status_code=201, response_model=RegistrationCreated)
async def register_provider(
    org_name: str = Form("", alias="orgName"),
    org_type: str = Form("", alias="orgType"),
    country: str = Form(""),
    contact_person: str = Form("", alias="contactPerson"),
    phone: str = Form(""),
    password: str = Form(""),
    email: str = Form(""),
    cooperation: str = Form(""),
    lang: str = Form("zh"),
    license_file: UploadFile = File(None, alias="licenseFile"),
    db: Session = Depends(get_db),
):
    data = {
        "org_name": org_name.strip(),
        "org_type": org_type.strip(),
        "country": country.strip(),
        "contact_person": contact_person.strip(),
        "phone": phone.strip(),
        "email": email.strip(),
        "cooperation": cooperation.strip(),
    }
    for key, val in data.items():
        if not val:
            return _missing(key)
    if not password:
        return _missing("password")
    if not EMAIL_RE.match(data["email"]):
        return JSONResponse({"error": "invalid_email"}, status_code=400)

    prepared, file_err = await _read_license_file(license_file)
    if file_err is not None:
        return file_err

    user, err = _create_user(db, data["phone"], password)
    if err is not None:
        return err

    row = RegistrationProvider(
        **data,
        user_id=user.id,
        license=None,
        lang=(lang or "zh").strip() or "zh",
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    if prepared is not None:
        _save_license_attachment(db, "provider", row.id, prepared)
        db.commit()

    return RegistrationCreated(id=row.id)


@router.post("/doctor", status_code=201, response_model=RegistrationCreated)
async def register_doctor(
    full_name: str = Form("", alias="fullName"),
    specialty: str = Form(""),
    hospital: str = Form(""),
    country: str = Form(""),
    title: str = Form(""),
    years: str = Form(""),
    languages: str = Form(""),
    remote: str = Form(""),
    email: str = Form(""),
    phone: str = Form(""),
    password: str = Form(""),
    lang: str = Form("zh"),
    license_file: UploadFile = File(None, alias="licenseFile"),
    db: Session = Depends(get_db),
):
    data = {
        "full_name": full_name.strip(),
        "specialty": specialty.strip(),
        "hospital": hospital.strip(),
        "country": country.strip(),
        "title": title.strip(),
        "languages": languages.strip(),
        "remote": remote.strip(),
        "email": email.strip(),
        "phone": phone.strip(),
    }
    for key, val in data.items():
        if not val:
            return _missing(key)
    if not password:
        return _missing("password")
    if not EMAIL_RE.match(data["email"]):
        return JSONResponse({"error": "invalid_email"}, status_code=400)

    prepared, file_err = await _read_license_file(license_file)
    if file_err is not None:
        return file_err

    user, err = _create_user(db, data["phone"], password)
    if err is not None:
        return err

    row = RegistrationDoctor(
        **data,
        user_id=user.id,
        years=(years or "").strip() or None,
        license=None,
        lang=(lang or "zh").strip() or "zh",
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    if prepared is not None:
        _save_license_attachment(db, "doctor", row.id, prepared)
        db.commit()

    return RegistrationCreated(id=row.id)


@router.post("/quick", status_code=201, response_model=RegistrationCreated)
def register_quick(payload: QuickPatientRegistration, db: Session = Depends(get_db)):
    """Quick registration from an enquiry/application flow.

    Only phone + password are required (phone pre-filled from the enquiry).
    Creates a user account and a minimal patient profile using whatever the
    enquiry already collected (name/email/needType); country/condition stay
    empty. Anonymous records with the same phone are silently linked (via
    _create_user).
    """
    phone = (payload.phone or "").strip()
    if not phone:
        return _missing("phone")
    if not payload.password:
        return _missing("password")

    email = (payload.email or "").strip()
    if email and not EMAIL_RE.match(email):
        return JSONResponse({"error": "invalid_email"}, status_code=400)

    user, err = _create_user(db, phone, payload.password)
    if err is not None:
        return err

    row = RegistrationPatient(
        user_id=user.id,
        full_name=(payload.full_name or "").strip() or phone,
        email=email or "",
        phone=phone,
        country=None,
        need_type=(payload.need_type or "").strip() or None,
        destination=None,
        condition=None,
        lang=(payload.lang or "zh").strip() or "zh",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return RegistrationCreated(id=row.id)

