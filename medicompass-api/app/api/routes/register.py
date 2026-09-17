import re

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

<<<<<<< HEAD
=======
from app.core.patient_no import generate_patient_no
>>>>>>> f18247c (增加CART)
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
<<<<<<< HEAD
from app.services.email import send_application_confirmation_email
from app.services.storage import (
    MAX_FILE_BYTES,
    is_allowed,
    save_upload,
=======
from app.services.email import send_email
from app.services.storage import (
    MAX_FILE_BYTES,
    is_allowed,
>>>>>>> f18247c (增加CART)
    save_upload_for_registration,
)

router = APIRouter(prefix="/api/register", tags=["register"])

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
MIN_PASSWORD_LEN = 8

<<<<<<< HEAD
=======
# 新用户注册通知邮箱
NOTIFICATION_EMAIL = "customerservice@medicomai.com"


def _send_registration_notification(name: str, phone: str, email: str, role: str) -> None:
    """发送新用户注册通知邮件到客服邮箱"""
    try:
        # 角色中文映射
        role_map = {
            "patient": "客户",
            "provider": "供应商",
            "doctor": "医生",
        }
        role_cn = role_map.get(role, role)
        
        subject = f"新用户注册通知 - {role_cn}"
        body_text = f"""您好，

有一位新用户已完成注册，详情如下：

姓名：{name}
手机号：{phone}
邮箱：{email}
角色：{role_cn}

请及时关注并处理后续事宜。

此致
Medicompass 系统
"""
        
        send_email(
            name="客服团队",
            to_email=NOTIFICATION_EMAIL,
            subject=subject,
            body_text=body_text,
        )
    except Exception as e:
        # 邮件发送失败不影响注册流程，只记录错误
        print(f"Failed to send registration notification: {e}")

>>>>>>> f18247c (增加CART)

def _missing(field: str):
    return JSONResponse({"error": "missing_field", "field": field}, status_code=400)


def _create_user(db: Session, phone: str, password: str):
    """Create a user account for the phone; returns (user, error_response).

    Phone is the unique login identifier. This period we do NOT support adding
    a new role to an existing phone — an existing phone is rejected.
<<<<<<< HEAD
=======

    Note: this only creates the account. It does NOT associate any existing
    Application records — that is the responsibility of the client-only
    _link_application helper, so provider/doctor sign-up never touches them.
>>>>>>> f18247c (增加CART)
    """
    if len(password) < MIN_PASSWORD_LEN:
        return None, JSONResponse({"error": "weak_password"}, status_code=400)
    exists = db.query(User.id).filter(User.phone == phone).first()
    if exists:
        return None, JSONResponse({"error": "phone_exists"}, status_code=409)
    user = User(phone=phone, password_hash=hash_password(password))
    db.add(user)
    db.flush()  # assign user.id without committing yet

<<<<<<< HEAD
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
=======
    return user, None


def _link_application(db: Session, user_id: int, phone: str, email: str) -> None:
    """Silently claim anonymous Application records submitted earlier.

    Only client sign-up calls this. It back-fills user_id on Application rows
    that are currently unowned (user_id IS NULL) AND whose phone AND email both
    match the new account — the strictest matching rule. Only user_id is written;
    the records' other fields and the user's profile are never modified.
    """
    # 查找新注册用户的 patient 记录
    patient = db.query(RegistrationPatient).filter(
        RegistrationPatient.user_id == user_id,
        RegistrationPatient.phone == phone,
    ).first()

    if patient:
        # 同时更新 user_id 和 patient_id
        db.query(Application).filter(
            Application.user_id.is_(None),
            Application.phone == phone,
            Application.email == email,
        ).update({
            Application.user_id: user_id,
            Application.patient_id: patient.id,
        })
    else:
        # 如果没有 patient 记录，只更新 user_id
        db.query(Application).filter(
            Application.user_id.is_(None),
            Application.phone == phone,
            Application.email == email,
        ).update({Application.user_id: user_id})


def _resolve_patient_by_phone(db: Session, phone: str, full_name: str = "", lang: str = "zh"):
    """Look up or create a patient record by phone number.

    Returns the RegistrationPatient instance. If no patient exists with this
    phone, creates a new one with a generated patient_no.
    """
    from app.models.registration import RegistrationPatient
    from app.core.patient_no import generate_patient_no

    patient = db.query(RegistrationPatient).filter(
        RegistrationPatient.phone == phone
    ).first()

    if patient is None:
        patient = RegistrationPatient(
            patient_no=generate_patient_no(db),
            full_name=full_name or phone,
            email="",
            phone=phone,
            country=None,
            need_type=None,
            destination=None,
            condition=None,
            lang=lang,
        )
        db.add(patient)
        db.flush()  # assign patient.id without committing yet

    return patient


async def _read_license_files(files: list[UploadFile] | None):
    """Read + validate one or more optional license uploads.

    Returns (prepared_list, error). prepared_list contains a dict per valid
    file (filename/content/mime); error is a JSONResponse on validation failure.
    """
    prepared: list[dict] = []
    for file in files or []:
        if file is None or not file.filename:
            continue
        content = await file.read()
        if len(content) == 0:
            continue
        if len(content) > MAX_FILE_BYTES:
            return None, JSONResponse(
                {"error": "file_too_large", "name": file.filename}, status_code=400
            )
        mime = file.content_type or "application/octet-stream"
        if not is_allowed(mime, len(content)):
            return None, JSONResponse(
                {"error": "file_type_not_allowed", "name": file.filename}, status_code=400
            )
        prepared.append({"filename": file.filename, "content": content, "mime": mime})
    return prepared, None
>>>>>>> f18247c (增加CART)


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
<<<<<<< HEAD
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
=======
    lang: str = Form("zh"),
    db: Session = Depends(get_db),
):
    """Pure client sign-up: name/email/phone/password only.

    No application record is created here. After the account exists, any
    unowned Application rows submitted earlier that share BOTH this phone and
    email are silently claimed (user_id back-filled) — see _link_application.
    """
    name = full_name.strip()
    email_v = email.strip()
    phone_v = phone.strip()
    if not name:
        return _missing("full_name")
    if not email_v:
        return _missing("email")
    if not phone_v:
        return _missing("phone")
    if not password:
        return _missing("password")
    if not EMAIL_RE.match(email_v):
        return JSONResponse({"error": "invalid_email"}, status_code=400)

    user, err = _create_user(db, phone_v, password)
    if err is not None:
        return err

    # Client-only association: claim unowned applications matching phone+email.
    _link_application(db, user.id, phone_v, email_v)

    row = RegistrationPatient(
        user_id=user.id,
        patient_no=generate_patient_no(db),
        full_name=name,
        email=email_v,
        phone=phone_v,
        country=None,
        need_type=None,
        destination=None,
        condition=None,
        lang=(lang or "zh").strip() or "zh",
    )
    db.add(row)

    db.commit()

    db.refresh(row)
    
    # 发送新用户注册通知邮件
    _send_registration_notification(name, phone_v, email_v, "patient")
    
>>>>>>> f18247c (增加CART)
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
<<<<<<< HEAD
    license_file: UploadFile = File(None, alias="licenseFile"),
=======
    license_files: list[UploadFile] = File(default=[], alias="licenseFile"),
>>>>>>> f18247c (增加CART)
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

<<<<<<< HEAD
    prepared, file_err = await _read_license_file(license_file)
=======
    prepared, file_err = await _read_license_files(license_files)
>>>>>>> f18247c (增加CART)
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

<<<<<<< HEAD
    if prepared is not None:
        _save_license_attachment(db, "provider", row.id, prepared)
        db.commit()

=======
    if prepared:
        for item in prepared:
            _save_license_attachment(db, "provider", row.id, item)
        db.commit()

    # 发送新用户注册通知邮件
    _send_registration_notification(data["org_name"], data["phone"], data["email"], "provider")

>>>>>>> f18247c (增加CART)
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
<<<<<<< HEAD
    license_file: UploadFile = File(None, alias="licenseFile"),
=======
    license_files: list[UploadFile] = File(default=[], alias="licenseFile"),
>>>>>>> f18247c (增加CART)
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

<<<<<<< HEAD
    prepared, file_err = await _read_license_file(license_file)
=======
    prepared, file_err = await _read_license_files(license_files)
>>>>>>> f18247c (增加CART)
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

<<<<<<< HEAD
    if prepared is not None:
        _save_license_attachment(db, "doctor", row.id, prepared)
        db.commit()

=======
    if prepared:
        for item in prepared:
            _save_license_attachment(db, "doctor", row.id, item)
        db.commit()

    # 发送新用户注册通知邮件
    _send_registration_notification(data["full_name"], data["phone"], data["email"], "doctor")

>>>>>>> f18247c (增加CART)
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

<<<<<<< HEAD
    row = RegistrationPatient(
        user_id=user.id,
=======
    # Client path: claim unowned applications matching BOTH phone and email.
    _link_application(db, user.id, phone, email or "")

    row = RegistrationPatient(
        user_id=user.id,
        patient_no=generate_patient_no(db),
>>>>>>> f18247c (增加CART)
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
<<<<<<< HEAD
=======
    
    # 发送新用户注册通知邮件
    _send_registration_notification(row.full_name, phone, email or "", "patient")
    
>>>>>>> f18247c (增加CART)
    return RegistrationCreated(id=row.id)

