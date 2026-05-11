"""add firestore_migration_log table

Revision ID: 0004_add_firestore_migration_log
Revises: 0003_create_history_and_activity
Create Date: 2026-05-10

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0004_add_firestore_migration_log"
down_revision: Union[str, None] = "0003_create_history_and_activity"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "firestore_migration_log",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("firestore_doc_id", sa.String(), nullable=False),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "postgres_application_id",
            UUID(as_uuid=True),
            sa.ForeignKey("applications.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "migrated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(
        "ix_firestore_migration_log_user_id",
        "firestore_migration_log",
        ["user_id"],
    )
    op.create_unique_constraint(
        "uq_firestore_migration_log_doc_user",
        "firestore_migration_log",
        ["firestore_doc_id", "user_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_firestore_migration_log_doc_user",
        "firestore_migration_log",
        type_="unique",
    )
    op.drop_index(
        "ix_firestore_migration_log_user_id",
        table_name="firestore_migration_log",
    )
    op.drop_table("firestore_migration_log")
