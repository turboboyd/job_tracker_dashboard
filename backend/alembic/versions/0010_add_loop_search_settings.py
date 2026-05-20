"""add loop search settings

Revision ID: 0010_add_loop_search_settings
Revises: 0009_create_loops
Create Date: 2026-05-13

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "0010_add_loop_search_settings"
down_revision: Union[str, None] = "0009_create_loops"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_JSONB_EMPTY_LIST = sa.text("'[]'::jsonb")


def upgrade() -> None:
    op.add_column(
        "loops",
        sa.Column(
            "keywords",
            JSONB(),
            nullable=False,
            server_default=_JSONB_EMPTY_LIST,
        ),
    )
    op.add_column(
        "loops",
        sa.Column(
            "excluded_keywords",
            JSONB(),
            nullable=False,
            server_default=_JSONB_EMPTY_LIST,
        ),
    )
    op.add_column(
        "loops",
        sa.Column(
            "employment_types",
            JSONB(),
            nullable=False,
            server_default=_JSONB_EMPTY_LIST,
        ),
    )
    op.add_column(
        "loops",
        sa.Column(
            "work_modes",
            JSONB(),
            nullable=False,
            server_default=_JSONB_EMPTY_LIST,
        ),
    )
    op.add_column(
        "loops",
        sa.Column(
            "selected_sources",
            JSONB(),
            nullable=False,
            server_default=_JSONB_EMPTY_LIST,
        ),
    )
    op.add_column(
        "loops",
        sa.Column(
            "auto_discovery_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.add_column(
        "loops",
        sa.Column("discovery_radius_km", sa.Integer(), nullable=True),
    )
    op.add_column(
        "loops",
        sa.Column("last_discovery_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("loops", "last_discovery_at")
    op.drop_column("loops", "discovery_radius_km")
    op.drop_column("loops", "auto_discovery_enabled")
    op.drop_column("loops", "selected_sources")
    op.drop_column("loops", "work_modes")
    op.drop_column("loops", "employment_types")
    op.drop_column("loops", "excluded_keywords")
    op.drop_column("loops", "keywords")
