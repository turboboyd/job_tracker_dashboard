"""create application_history and activity_events tables

Revision ID: 0003_create_history_and_activity
Revises: 0002_create_applications
Create Date: 2026-05-10

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "0003_create_history_and_activity"
down_revision: Union[str, None] = "0002_create_applications"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── application_history ───────────────────────────────────────────────────
    op.create_table(
        "application_history",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "application_id",
            UUID(as_uuid=True),
            sa.ForeignKey("applications.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("actor", sa.String(), nullable=False, server_default="user"),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("from_status", sa.String(), nullable=True),
        sa.Column("to_status", sa.String(), nullable=True),
        sa.Column("field_path", sa.String(), nullable=True),
        sa.Column("old_value", JSONB(), nullable=True),
        sa.Column("new_value", JSONB(), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("feedback_type", sa.String(), nullable=True),
        sa.Column("sentiment", sa.String(), nullable=True),
        sa.Column("rejection_reason_code", sa.String(), nullable=True),
        sa.Column("correlation_id", sa.String(), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(
        "ix_application_history_app_created",
        "application_history",
        ["application_id", sa.text("created_at DESC")],
    )
    op.create_index(
        "ix_application_history_user_created",
        "application_history",
        ["user_id", sa.text("created_at DESC")],
    )
    op.create_index(
        "ix_application_history_correlation_id",
        "application_history",
        ["correlation_id"],
        postgresql_where=sa.text("correlation_id IS NOT NULL"),
    )

    # ── activity_events ───────────────────────────────────────────────────────
    op.create_table(
        "activity_events",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "application_id",
            UUID(as_uuid=True),
            sa.ForeignKey("applications.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("kind", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("payload", JSONB(), nullable=False, server_default="{}"),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(
        "ix_activity_events_user_created",
        "activity_events",
        ["user_id", sa.text("created_at DESC")],
    )
    op.create_index(
        "ix_activity_events_user_kind_created",
        "activity_events",
        ["user_id", "kind", sa.text("created_at DESC")],
    )


def downgrade() -> None:
    op.drop_index("ix_activity_events_user_kind_created", table_name="activity_events")
    op.drop_index("ix_activity_events_user_created", table_name="activity_events")
    op.drop_table("activity_events")

    op.drop_index("ix_application_history_correlation_id", table_name="application_history")
    op.drop_index("ix_application_history_user_created", table_name="application_history")
    op.drop_index("ix_application_history_app_created", table_name="application_history")
    op.drop_table("application_history")
