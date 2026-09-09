from app.schemas.common import CamelModel


class UserLoginRequest(CamelModel):
    phone: str
    password: str


class UserLoginResponse(CamelModel):
    ok: bool
    user_id: int
    phone: str
    display_name: str
    roles: list[str]


class MeResponse(CamelModel):
    user_id: int
    phone: str
    display_name: str
    roles: list[str]


class ChangePasswordPayload(CamelModel):
    old_password: str
    new_password: str


class PatientProfile(CamelModel):
    user_id: int
    full_name: str
    email: str
    phone: str
    country: str
    need_type: str
    destination: str | None
    condition: str

