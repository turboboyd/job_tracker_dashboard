"""add discovery preview cache

Revision ID: 0015_discovery_preview_cache
Revises: 0014_preview_ignores
Create Date: 2026-05-20

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0015_discovery_preview_cache"
down_revision: Union[str, None] = "0014_preview_ignores"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "discovery_preview_cache",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("loop_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_id", sa.String(length=64), nullable=False),
        sa.Column(
            "search_scope",
            sa.String(length=32),
            nullable=False,
            server_default="normal",
        ),
        sa.Column("page", sa.Integer(), nullable=False, server_default="1"),
        sa.Column(
            "items_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column(
            "warnings_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
        sa.Column(
            "has_more",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["loop_id"], ["loops.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "loop_id",
            "source_id",
            "search_scope",
            "page",
            name="uq_discovery_preview_cache_key",
        ),
    )
    op.create_index(
        "ix_discovery_preview_cache_loop_expires",
        "discovery_preview_cache",
        ["loop_id", "expires_at"],
    )
    op.create_index(
        "ix_discovery_preview_cache_source_id",
        "discovery_preview_cache",
        ["source_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_discovery_preview_cache_source_id",
        table_name="discovery_preview_cache",
    )
    op.drop_index(
        "ix_discovery_preview_cache_loop_expires",
        table_name="discovery_preview_cache",
    )
    op.drop_table("discovery_preview_cache")
