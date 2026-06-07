import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DiscoveryPreviewCache(Base):
    __tablename__ = "discovery_preview_cache"

    # Keep these in sync with alembic 0015. The named unique constraint is what
    # the warming upsert targets (ON CONFLICT ON CONSTRAINT uq_discovery_preview_cache_key);
    # without it here, a create_all-built schema (tests, quick-start) silently
    # lacks the constraint and the upsert fails at runtime.
    __table_args__ = (
        UniqueConstraint(
            "loop_id",
            "source_id",
            "search_scope",
            "page",
            name="uq_discovery_preview_cache_key",
        ),
        Index(
            "ix_discovery_preview_cache_loop_expires",
            "loop_id",
            "expires_at",
        ),
        Index(
            "ix_discovery_preview_cache_source_id",
            "source_id",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    loop_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("loops.id", ondelete="CASCADE"),
        nullable=False,
    )
    source_id: Mapped[str] = mapped_column(String(64), nullable=False)
    search_scope: Mapped[str] = mapped_column(
        String(32), nullable=False, default="normal", server_default="normal"
    )
    page: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
    items_json: Mapped[list] = mapped_column(
        JSONB, nullable=False, default=list, server_default="[]"
    )
    warnings_json: Mapped[list] = mapped_column(
        JSONB, nullable=False, default=list, server_default="[]"
    )
    has_more: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("false")
    )
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

    def __repr__(self) -> str:
        return (
            f"<DiscoveryPreviewCache"
            f" loop_id={self.loop_id}"
            f" source_id={self.source_id!r}"
            f" page={self.page}>"
        )
