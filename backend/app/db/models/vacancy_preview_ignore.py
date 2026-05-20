import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class VacancyPreviewIgnore(Base):
    __tablename__ = "vacancy_preview_ignores"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "loop_id",
            "source_id",
            "source_url",
            name="uq_vacancy_preview_ignores_source_url",
        ),
        UniqueConstraint(
            "user_id",
            "loop_id",
            "source_id",
            "external_id",
            name="uq_vacancy_preview_ignores_external_id",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    loop_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    source_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    external_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    source_url: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    company: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

    def __repr__(self) -> str:
        return (
            f"<VacancyPreviewIgnore id={self.id} "
            f"loop_id={self.loop_id!r} source_id={self.source_id!r}>"
        )
