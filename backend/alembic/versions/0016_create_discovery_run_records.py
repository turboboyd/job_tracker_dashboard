"""create discovery_run_records

Revision ID: 0016_discovery_run_records
Revises: 0015_discovery_preview_cache
Create Date: 2026-05-25

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0016_discovery_run_records"
down_revision: Union[str, None] = "0015_discovery_preview_cache"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "discovery_run_records",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("loop_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("run_id", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column(
            "sources",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column("items_found", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("items_new", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("duration_ms", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_text", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["loop_id"], ["loops.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_discovery_run_records_user_id",
        "discovery_run_records",
        ["user_id"],
    )
    op.create_index(
        "ix_discovery_run_records_loop_id",
        "discovery_run_records",
        ["loop_id"],
    )
    op.create_index(
        "ix_discovery_run_records_loop_finished_at",
        "discovery_run_records",
        ["loop_id", sa.text("finished_at DESC")],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_discovery_run_records_loop_finished_at",
        table_name="discovery_run_records",
    )
    op.drop_index(
        "ix_discovery_run_records_loop_id",
        table_name="discovery_run_records",
    )
    op.drop_index(
        "ix_discovery_run_records_user_id",
        table_name="discovery_run_records",
    )
    op.drop_table("discovery_run_records")
