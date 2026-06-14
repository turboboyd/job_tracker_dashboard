import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class VacancyMatch(Base):
    __tablename__ = "vacancy_matches"

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
    source_url: Mapped[str] = mapped_column(String, nullable=False)
    source: Mapped[str | None] = mapped_column(String, nullable=True)
    external_id: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    company_name: Mapped[str | None] = mapped_column(String, nullable=True)
    role_title: Mapped[str | None] = mapped_column(String, nullable=True)
    location_text: Mapped[str | None] = mapped_column(String, nullable=True)
    vacancy_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_metadata: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict, server_default="{}")
    confidence: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict, server_default="{}")
    warnings: Mapped[list] = mapped_column(JSONB, nullable=False, default=list, server_default="[]")
    status: Mapped[str] = mapped_column(String, nullable=False, default="new", server_default="new", index=True)
    application_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    # When the user first opened/viewed this specific match (card click,
    # "Подробнее", or following the source link). Null until viewed. Drives the
    # per-match "Просмотрено" badge and the "Новые" (unseen) tab.
    seen_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # Original posting timestamp from the source (when known), used for a stable
    # server-side freshness sort. Null for older rows; callers fall back to
    # created_at via COALESCE(posted_at, created_at).
    posted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # Persisted match score (0–100) from the scoring core (scoring.py), written
    # on every persist path so lists can ORDER BY score server-side. NULL means
    # "not yet scored" (rows created before migration 0023); such rows sort
    # after scored ones under score DESC NULLS LAST. ``score_version`` records
    # the formula version (SCORE_VERSION) that produced the value;
    # ``score_details`` holds the component breakdown + coded reasons/penalties.
    score: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    score_version: Mapped[int | None] = mapped_column(Integer, nullable=True)
    score_details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

    def __repr__(self) -> str:
        return f"<VacancyMatch id={self.id} loop_id={self.loop_id!r} status={self.status!r}>"
