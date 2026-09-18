from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# Session cookie name — mirrors the original Next.js implementation.
SESSION_COOKIE = "mc_admin_session"
# Separate cookie for regular user (patient/provider/doctor) sessions.
USER_SESSION_COOKIE = "mc_user_session"
MAX_AGE_SECONDS = 60 * 60 * 8  # 8 hours
ALGORITHM = "HS256"

# bcrypt — compatible with hashes produced by bcryptjs in the original app.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain: str, password_hash: str) -> bool:
    try:
        return pwd_context.verify(plain, password_hash)
    except ValueError:
        return False


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def _secret_key() -> str:
    secret = settings.AUTH_SECRET
    if not secret or len(secret) < 16:
        raise RuntimeError("AUTH_SECRET is missing or too short (set it in .env).")
    return secret


def sign_session(sub: str, username: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "username": username,
        "iat": now,
        "exp": now + timedelta(seconds=MAX_AGE_SECONDS),
    }
    return jwt.encode(payload, _secret_key(), algorithm=ALGORITHM)


def verify_session(token: Optional[str]) -> Optional[dict]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, _secret_key(), algorithms=[ALGORITHM])
    except JWTError:
        return None
    if not payload.get("sub"):
        return None
    return {"sub": payload["sub"], "username": str(payload.get("username", ""))}


def sign_user_session(sub: str, phone: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "phone": phone,
        "typ": "user",
        "iat": now,
        "exp": now + timedelta(seconds=MAX_AGE_SECONDS),
    }
    return jwt.encode(payload, _secret_key(), algorithm=ALGORITHM)


def verify_user_session(token: Optional[str]) -> Optional[dict]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, _secret_key(), algorithms=[ALGORITHM])
    except JWTError:
        return None
    if not payload.get("sub") or payload.get("typ") != "user":
        return None
    return {"sub": payload["sub"], "phone": str(payload.get("phone", ""))}
