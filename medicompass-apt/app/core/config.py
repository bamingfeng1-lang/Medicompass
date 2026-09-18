from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment / .env file."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    DATABASE_URL: str = "mysql+pymysql://root:password@127.0.0.1:3306/medicompass?charset=utf8mb4"

    # Auth
    AUTH_SECRET: str = ""
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "changeme"

    # Anthropic
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_BASE_URL: str = ""
    ANTHROPIC_MODEL: str = ""

    # CORS / cookie
    FRONTEND_ORIGIN: str = "http://localhost:3001"
    COOKIE_SECURE: bool = False

    # SMTP (email). Leave EMAIL_ENABLED=false to keep email disabled; the
    # send_email() helper becomes a no-op that warns rather than raising.
    EMAIL_ENABLED: bool = False
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    SMTP_FROM_NAME: str = "Medicompass"
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
