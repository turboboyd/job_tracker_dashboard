"""align loops.discovery_interval_hours DB default 24 -> 4

Revision ID: 0022_loops_interval_default_4
Revises: 0021_drop_preview_ignores
Create Date: 2026-06-08

Brings the database-level column default in line with the product contract of
"auto-discovery every 4 hours" (matching the scheduler's WARM_INTERVAL_HOURS and
the SQLAlchemy model's Python ``default=4``).

This is a metadata-only change: ``ALTER COLUMN ... SET DEFAULT`` rewrites the
column's default clause used by future INSERTs that omit the column. It does NOT
touch, backfill, or rewrite existing rows, and it leaves the column's type and
NOT NULL constraint unchanged. Existing user-configured interval values are
preserved exactly.

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0022_loops_interval_default_4"
down_revision: Union[str, None] = "0021_drop_preview_ignores"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Metadata-only: change the DB default for new inserts to 4. Existing rows
    # are untouched (no UPDATE / backfill). Type and nullability are preserved.
    op.alter_column(
        "loops",
        "discovery_interval_hours",
        existing_type=sa.Integer(),
        existing_nullable=False,
        server_default="4",
    )


def downgrade() -> None:
    # Restore the original DB default of 24. Existing rows remain untouched.
    op.alter_column(
        "loops",
        "discovery_interval_hours",
        existing_type=sa.Integer(),
        existing_nullable=False,
        server_default="24",
    )
