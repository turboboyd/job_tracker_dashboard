"""add user analysis plan

Revision ID: 0012_add_user_analysis_plan
Revises: 0011_vacancy_match_analyses
Create Date: 2026-05-14

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0012_add_user_analysis_plan"
down_revision: Union[str, None] = "0011_vacancy_match_analyses"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("analysis_plan", sa.String(), server_default="free", nullable=False),
    )
    op.execute("update users set analysis_plan = 'free' where analysis_plan is null")


def downgrade() -> None:
    op.drop_column("users", "analysis_plan")
