from app.schemas.common import CamelModel


class LoginRequest(CamelModel):
    username: str
    password: str


class LoginResponse(CamelModel):
    ok: bool
    username: str


class OkResponse(CamelModel):
    ok: bool
