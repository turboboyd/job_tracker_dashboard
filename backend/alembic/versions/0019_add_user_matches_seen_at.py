"""add user matches_seen_at watermark

Revision ID: 0019_add_user_matches_seen_at
Revises: 0018_add_user_resume_text
Create Date: 2026-06-07

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0019_add_user_matches_seen_at"
down_revision: Union[str, None] = "0018_add_user_resume_text"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("matches_seen_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "matches_seen_at")
