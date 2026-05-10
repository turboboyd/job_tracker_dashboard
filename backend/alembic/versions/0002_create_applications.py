"""create applications table

Revision ID: 0002_create_applications
Revises: 0001_create_users
Create Date: 2026-05-10

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "0002_create_applications"
down_revision: Union[str, None] = "0001_create_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "applications",
        # ── Identity ──────────────────────────────────────────────────────────
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
        sa.Column("archived", sa.Boolean(), nullable=False, server_default="false"),
        # ── Job ───────────────────────────────────────────────────────────────
        sa.Column("company_name", sa.String(), nullable=False),
        sa.Column("role_title", sa.String(), nullable=False),
        sa.Column("location_text", sa.String(), nullable=True),
        sa.Column("vacancy_url", sa.String(), nullable=True),
        sa.Column("source", sa.String(), nullable=True),
        sa.Column("employment_type", sa.String(), nullable=True),
        sa.Column("work_mode", sa.String(), nullable=True),
        sa.Column("salary", JSONB(), nullable=True),
        sa.Column("posted_at", sa.TIMESTAMP(timezone=True), nullable=True),
        # ── Process ───────────────────────────────────────────────────────────
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("stage", sa.String(), nullable=True),
        sa.Column("sub_status", sa.String(), nullable=True),
        sa.Column(
            "last_status_change_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("applied_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("applied_via", sa.String(), nullable=True),
        sa.Column("next_action_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("next_action_text", sa.String(), nullable=True),
        sa.Column("contact_attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_contact_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("last_follow_up_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("follow_up_level", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("needs_follow_up", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("follow_up_due_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "needs_reapply_suggestion", sa.Boolean(), nullable=False, server_default="false"
        ),
        sa.Column("reapply_eligible_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("reapply_reason", sa.String(), nullable=True),
        sa.Column("reminders", JSONB(), nullable=True),
        # ── Notes ─────────────────────────────────────────────────────────────
        sa.Column("current_note", sa.Text(), nullable=True),
        sa.Column("tags", JSONB(), nullable=True),
        # ── Vacancy ───────────────────────────────────────────────────────────
        sa.Column("vacancy_description", sa.Text(), nullable=True),
        sa.Column("role_fingerprint", sa.String(), nullable=True),
        # ── Linkage ───────────────────────────────────────────────────────────
        sa.Column("loop_id", sa.String(), nullable=True),
        sa.Column("has_loop", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("cv_version_id", sa.String(), nullable=True),
        sa.Column("profile_version_id", sa.String(), nullable=True),
        # ── Timestamps ────────────────────────────────────────────────────────
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # Indexes for common query patterns
    op.create_index("ix_applications_user_id", "applications", ["user_id"])
    op.create_index("ix_applications_status", "applications", ["status"])
    op.create_index(
        "ix_applications_user_id_status",
        "applications",
        ["user_id", "status"],
    )
    op.create_index(
        "ix_applications_user_id_archived",
        "applications",
        ["user_id", "archived"],
    )
    op.create_index(
        "ix_applications_next_action_at",
        "applications",
        ["user_id", "next_action_at"],
    )
    op.create_index(
        "ix_applications_follow_up_due_at",
        "applications",
        ["user_id", "needs_follow_up", "follow_up_due_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_applications_follow_up_due_at", table_name="applications")
    op.drop_index("ix_applications_next_action_at", table_name="applications")
    op.drop_index("ix_applications_user_id_archived", table_name="applications")
    op.drop_index("ix_applications_user_id_status", table_name="applications")
    op.drop_index("ix_applications_status", table_name="applications")
    op.drop_index("ix_applications_user_id", table_name="applications")
    op.drop_table("applications")
