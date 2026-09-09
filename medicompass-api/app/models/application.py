from datetime import datetime

from sqlalchemy import (
    BigInteger,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.mysql import DATETIME, MEDIUMTEXT
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Application(Base):
    __tablename__ = "application"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("user.id", ondelete="SET NULL"), nullable=True
    )
    full_name: Mapped[str] = mapped_column(String(191), nullable=False)
    email: Mapped[str] = mapped_column(String(191), nullable=False)
    phone: Mapped[str] = mapped_column(String(64), nullable=False)
    country: Mapped[str | None] = mapped_column(String(128), nullable=True)
    need_type: Mapped[str] = mapped_column(String(64), nullable=False)
    service_slug: Mapped[str | None] = mapped_column(String(128), nullable=True)
    service_name: Mapped[str | None] = mapped_column(String(191), nullable=True)
    destination: Mapped[str | None] = mapped_column(String(191), nullable=True)
    condition: Mapped[str | None] = mapped_column(Text, nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    lang: Mapped[str] = mapped_column(String(8), nullable=False, default="zh")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="PENDING_REVIEW")
    assigned_to_type: Mapped[str | None] = mapped_column(String(16), nullable=True)
    assigned_to_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    ai_summary: Mapped[str | None] = mapped_column(MEDIUMTEXT, nullable=True)
    ai_summary_status: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")
    ai_summary_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    accepted_at: Mapped[datetime | None] = mapped_column(DATETIME(fsp=3), nullable=True)
    reject_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    medical_summary: Mapped[str | None] = mapped_column(MEDIUMTEXT, nullable=True)
    lab_results: Mapped[str | None] = mapped_column(MEDIUMTEXT, nullable=True)
    current_treatment: Mapped[str | None] = mapped_column(MEDIUMTEXT, nullable=True)
    question1: Mapped[str | None] = mapped_column(Text, nullable=True)
    question2: Mapped[str | None] = mapped_column(Text, nullable=True)
    question3: Mapped[str | None] = mapped_column(Text, nullable=True)
    doctor_answer1: Mapped[str | None] = mapped_column(Text, nullable=True)
    doctor_answer2: Mapped[str | None] = mapped_column(Text, nullable=True)
    doctor_answer3: Mapped[str | None] = mapped_column(Text, nullable=True)
    translated_answer1: Mapped[str | None] = mapped_column(Text, nullable=True)
    translated_answer2: Mapped[str | None] = mapped_column(Text, nullable=True)
    translated_answer3: Mapped[str | None] = mapped_column(Text, nullable=True)
    final_bilingual_report_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    assigned_doctor_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    assigned_provider_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DATETIME(fsp=3), nullable=False, server_default=text("CURRENT_TIMESTAMP(3)")
    )

    attachments: Mapped[list["Attachment"]] = relationship(
        back_populates="application",
        cascade="all, delete-orphan",
        order_by="Attachment.created_at",
    )
    events: Mapped[list["ApplicationEvent"]] = relationship(
        back_populates="application",
        cascade="all, delete-orphan",
        order_by="ApplicationEvent.created_at",
    )


class ApplicationEvent(Base):
    __tablename__ = "application_event"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    application_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("application.id", ondelete="CASCADE"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(32), nullable=False)
    actor_type: Mapped[str] = mapped_column(String(16), nullable=False, default="admin")
    actor_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    actor_name: Mapped[str] = mapped_column(String(191), nullable=False, default="")
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DATETIME(fsp=3), nullable=False, server_default=text("CURRENT_TIMESTAMP(3)")
    )

    application: Mapped["Application"] = relationship(back_populates="events")


class Attachment(Base):
    __tablename__ = "attachment"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    application_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("application.id", ondelete="CASCADE"), nullable=True
    )
    registration_type: Mapped[str | None] = mapped_column(String(16), nullable=True)
    registration_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    kind: Mapped[str] = mapped_column(String(16), nullable=False, default="source")
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_path: Mapped[str] = mapped_column(String(512), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(128), nullable=False)
    size: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DATETIME(fsp=3), nullable=False, server_default=text("CURRENT_TIMESTAMP(3)")
    )

    application: Mapped["Application"] = relationship(back_populates="attachments")
