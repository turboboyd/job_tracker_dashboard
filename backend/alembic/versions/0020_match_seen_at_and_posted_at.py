"""add per-match seen_at + posted_at; drop user matches_seen_at watermark

Revision ID: 0020_match_seen_at_and_posted_at
Revises: 0019_add_user_matches_seen_at
Create Date: 2026-06-08

Moves "seen" tracking from a single global watermark on ``users`` to a
per-match ``seen_at`` timestamp, and adds ``posted_at`` for a stable
server-side freshness sort.

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0020_match_seen_at_and_posted_at"
down_revision: Union[str, None] = "0019_add_user_matches_seen_at"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "vacancy_matches",
        sa.Column("seen_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "vacancy_matches",
        sa.Column("posted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.drop_column("users", "matches_seen_at")


def downgrade() -> None:
    op.add_column(
        "users",
        sa.Column("matches_seen_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.drop_column("vacancy_matches", "posted_at")
    op.drop_column("vacancy_matches", "seen_at")
