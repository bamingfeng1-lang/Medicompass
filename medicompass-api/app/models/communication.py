from datetime import datetime

from sqlalchemy import BigInteger, ForeignKey, String, Text, text
from sqlalchemy.dialects.mysql import DATETIME
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CommunicationLog(Base):
    """History of admin↔client communications for an application.

    Channels can be email / phone / meeting / other. Email sends done through
    the admin "send email" feature are recorded here automatically; other
    channels can be logged manually by the admin.
    """

    __tablename__ = "communication_log"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    application_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("application.id", ondelete="CASCADE"), nullable=False
    )
    channel: Mapped[str] = mapped_column(String(16), nullable=False, default="email")
    direction: Mapped[str] = mapped_column(String(16), nullable=False, default="outbound")
    subject: Mapped[str | None] = mapped_column(String(255), nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    recipients: Mapped[str | None] = mapped_column(String(512), nullable=True)
    email_status: Mapped[str | None] = mapped_column(String(16), nullable=True)
    actor_name: Mapped[str] = mapped_column(String(191), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(
        DATETIME(fsp=3), nullable=False, server_default=text("CURRENT_TIMESTAMP(3)")
    )
