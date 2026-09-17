from datetime import datetime

from sqlalchemy import BigInteger, ForeignKey, String, Text, text
from sqlalchemy.dialects.mysql import DATETIME
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class RegistrationPatient(Base):
    __tablename__ = "registration_patient"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
<<<<<<< HEAD
=======
    patient_no: Mapped[str | None] = mapped_column(String(32), nullable=True, unique=True, comment="客户编号 PT+YYMMDD+NNN")
>>>>>>> f18247c (增加CART)
    user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("user.id", ondelete="SET NULL"), nullable=True
    )
    full_name: Mapped[str] = mapped_column(String(191), nullable=False)
    email: Mapped[str] = mapped_column(String(191), nullable=False)
    phone: Mapped[str] = mapped_column(String(64), nullable=False)
    country: Mapped[str | None] = mapped_column(String(128), nullable=True)
    need_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    destination: Mapped[str | None] = mapped_column(String(191), nullable=True)
    condition: Mapped[str | None] = mapped_column(Text, nullable=True)
    lang: Mapped[str] = mapped_column(String(8), nullable=False, default="zh")
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="new")
    created_at: Mapped[datetime] = mapped_column(
        DATETIME(fsp=3), nullable=False, server_default=text("CURRENT_TIMESTAMP(3)")
    )


class RegistrationProvider(Base):
    __tablename__ = "registration_provider"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("user.id", ondelete="SET NULL"), nullable=True
    )
    org_name: Mapped[str] = mapped_column(String(191), nullable=False)
    org_type: Mapped[str] = mapped_column(String(32), nullable=False)
    country: Mapped[str] = mapped_column(String(128), nullable=False)
    contact_person: Mapped[str] = mapped_column(String(191), nullable=False)
    phone: Mapped[str] = mapped_column(String(64), nullable=False)
    email: Mapped[str] = mapped_column(String(191), nullable=False)
    license: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cooperation: Mapped[str] = mapped_column(Text, nullable=False)
    lang: Mapped[str] = mapped_column(String(8), nullable=False, default="zh")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="DRAFT")
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DATETIME(fsp=3), nullable=True)
    reviewed_by: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DATETIME(fsp=3), nullable=False, server_default=text("CURRENT_TIMESTAMP(3)")
    )


class RegistrationDoctor(Base):
    __tablename__ = "registration_doctor"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("user.id", ondelete="SET NULL"), nullable=True
    )
    full_name: Mapped[str] = mapped_column(String(191), nullable=False)
    specialty: Mapped[str] = mapped_column(String(128), nullable=False)
    hospital: Mapped[str] = mapped_column(String(191), nullable=False)
    country: Mapped[str] = mapped_column(String(128), nullable=False)
    title: Mapped[str] = mapped_column(String(32), nullable=False)
    years: Mapped[str | None] = mapped_column(String(16), nullable=True)
    languages: Mapped[str] = mapped_column(String(191), nullable=False)
    remote: Mapped[str] = mapped_column(String(16), nullable=False)
    email: Mapped[str] = mapped_column(String(191), nullable=False)
    phone: Mapped[str] = mapped_column(String(64), nullable=False)
    license: Mapped[str | None] = mapped_column(String(255), nullable=True)
    lang: Mapped[str] = mapped_column(String(8), nullable=False, default="zh")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="DRAFT")
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DATETIME(fsp=3), nullable=True)
    reviewed_by: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DATETIME(fsp=3), nullable=False, server_default=text("CURRENT_TIMESTAMP(3)")
    )
