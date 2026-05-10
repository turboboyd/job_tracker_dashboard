import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Application(Base):
    __tablename__ = "applications"

    # ── Identity ──────────────────────────────────────────────────────────────
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
    archived: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )

    # ── Job ───────────────────────────────────────────────────────────────────
    company_name: Mapped[str] = mapped_column(String, nullable=False)
    role_title: Mapped[str] = mapped_column(String, nullable=False)
    location_text: Mapped[str | None] = mapped_column(String, nullable=True)
    vacancy_url: Mapped[str | None] = mapped_column(String, nullable=True)
    source: Mapped[str | None] = mapped_column(String, nullable=True)
    employment_type: Mapped[str | None] = mapped_column(String, nullable=True)
    work_mode: Mapped[str | None] = mapped_column(String, nullable=True)
    salary: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    posted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # ── Process ───────────────────────────────────────────────────────────────
    status: Mapped[str] = mapped_column(String, nullable=False, index=True)
    stage: Mapped[str | None] = mapped_column(String, nullable=True)
    sub_status: Mapped[str | None] = mapped_column(String, nullable=True)
    last_status_change_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    applied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    applied_via: Mapped[str | None] = mapped_column(String, nullable=True)
    next_action_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    next_action_text: Mapped[str | None] = mapped_column(String, nullable=True)
    contact_attempts: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    last_contact_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_follow_up_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    follow_up_level: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    needs_follow_up: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    follow_up_due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    needs_reapply_suggestion: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    reapply_eligible_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reapply_reason: Mapped[str | None] = mapped_column(String, nullable=True)
    reminders: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # ── Notes ─────────────────────────────────────────────────────────────────
    current_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # ── Vacancy ───────────────────────────────────────────────────────────────
    vacancy_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    role_fingerprint: Mapped[str | None] = mapped_column(String, nullable=True)

    # ── Linkage ───────────────────────────────────────────────────────────────
    loop_id: Mapped[str | None] = mapped_column(String, nullable=True)
    has_loop: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    cv_version_id: Mapped[str | None] = mapped_column(String, nullable=True)
    profile_version_id: Mapped[str | None] = mapped_column(String, nullable=True)

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

    def __repr__(self) -> str:
        return (
            f"<Application id={self.id} "
            f"company={self.company_name!r} status={self.status!r}>"
        )
