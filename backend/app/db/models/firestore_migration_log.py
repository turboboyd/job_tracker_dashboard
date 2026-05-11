import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class FirestoreMigrationLog(Base):
    """Tracks which Firestore application documents have been migrated to PostgreSQL.

    Unique constraint on (firestore_doc_id, user_id) makes the migration
    idempotent — running the script twice skips already-imported documents.
    postgres_application_id is nullable so the log record survives if the
    PG application row is later deleted.
    """

    __tablename__ = "firestore_migration_log"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    firestore_doc_id: Mapped[str] = mapped_column(String, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    postgres_application_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="SET NULL"),
        nullable=True,
    )
    migrated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )

    __table_args__ = (
        UniqueConstraint(
            "firestore_doc_id",
            "user_id",
            name="uq_firestore_migration_log_doc_user",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<FirestoreMigrationLog"
            f" firestore_doc_id={self.firestore_doc_id!r}"
            f" pg_app_id={self.postgres_application_id!r}>"
        )
