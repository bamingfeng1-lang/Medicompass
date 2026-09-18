from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import (
    SESSION_COOKIE,
    USER_SESSION_COOKIE,
    verify_session,
    verify_user_session,
)
from app.db.session import get_db
from app.models.admin import Admin
from app.models.registration import (
    RegistrationDoctor,
    RegistrationPatient,
    RegistrationProvider,
)
from app.models.user import User


def get_current_admin(request: Request, db: Session = Depends(get_db)) -> Admin:
    """Require a valid admin session cookie; raise 401 otherwise."""
    token = request.cookies.get(SESSION_COOKIE)
    payload = verify_session(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="unauthorized")

    admin = db.get(Admin, int(payload["sub"])) if payload["sub"].isdigit() else None
    if admin is None:
        # Fall back to username lookup for robustness.
        admin = db.query(Admin).filter(Admin.username == payload["username"]).first()
    if admin is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="unauthorized")
    return admin


def roles_for_user(db: Session, user_id: int) -> list[str]:
    """Compute a user's role set from which registration_* tables reference them."""
    roles: list[str] = []
    if db.query(RegistrationPatient.id).filter(RegistrationPatient.user_id == user_id).first():
        roles.append("patient")
    if db.query(RegistrationProvider.id).filter(RegistrationProvider.user_id == user_id).first():
        roles.append("provider")
    if db.query(RegistrationDoctor.id).filter(RegistrationDoctor.user_id == user_id).first():
        roles.append("doctor")
    return roles


def display_name_for_user(db: Session, user: User) -> str:
    """Best-effort display name from the user's registration profile.

    patient/doctor -> full_name; provider -> org_name. Falls back to phone.
    """
    patient = (
        db.query(RegistrationPatient.full_name)
        .filter(RegistrationPatient.user_id == user.id)
        .first()
    )
    if patient and patient[0]:
        return patient[0]
    doctor = (
        db.query(RegistrationDoctor.full_name)
        .filter(RegistrationDoctor.user_id == user.id)
        .first()
    )
    if doctor and doctor[0]:
        return doctor[0]
    provider = (
        db.query(RegistrationProvider.org_name)
        .filter(RegistrationProvider.user_id == user.id)
        .first()
    )
    if provider and provider[0]:
        return provider[0]
    return user.phone


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Require a valid user session cookie; raise 401 otherwise."""
    token = request.cookies.get(USER_SESSION_COOKIE)
    payload = verify_user_session(token)
    if payload is None or not str(payload["sub"]).isdigit():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="unauthorized")
    user = db.get(User, int(payload["sub"]))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="unauthorized")
    return user


def get_optional_user(request: Request, db: Session = Depends(get_db)) -> User | None:
    """Resolve the logged-in user from the cookie, or None if not logged in."""
    token = request.cookies.get(USER_SESSION_COOKIE)
    payload = verify_user_session(token)
    if payload is None or not str(payload["sub"]).isdigit():
        return None
    return db.get(User, int(payload["sub"]))
