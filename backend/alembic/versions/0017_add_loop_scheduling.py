"""add loop scheduling fields

Revision ID: 0017_add_loop_scheduling
Revises: 0016_discovery_run_records
Create Date: 2026-05-25

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0017_add_loop_scheduling"
down_revision: Union[str, None] = "0016_discovery_run_records"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "loops",
        sa.Column("next_run_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "loops",
        sa.Column(
            "discovery_interval_hours",
            sa.Integer(),
            nullable=False,
            server_default="24",
        ),
    )
    op.create_index(
        "ix_loops_next_run_at",
        "loops",
        ["next_run_at"],
        postgresql_where=sa.text(
            "auto_discovery_enabled = true AND status = 'active' AND next_run_at IS NOT NULL"
        ),
    )


def downgrade() -> None:
    op.drop_index("ix_loops_next_run_at", table_name="loops")
    op.drop_column("loops", "discovery_interval_hours")
    op.drop_column("loops", "next_run_at")
