"""add user resume text

Revision ID: 0018_add_user_resume_text
Revises: 0017_add_loop_scheduling
Create Date: 2026-06-04

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0018_add_user_resume_text"
down_revision: Union[str, None] = "0017_add_loop_scheduling"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("resume_text", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "resume_text")
