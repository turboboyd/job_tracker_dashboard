"""add preview match metadata

Revision ID: 0013_add_preview_match_metadata
Revises: 0012_add_user_analysis_plan
Create Date: 2026-05-15

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "0013_add_preview_match_metadata"
down_revision: Union[str, None] = "0012_add_user_analysis_plan"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("vacancy_matches", sa.Column("external_id", sa.String(), nullable=True))
    op.add_column(
        "vacancy_matches",
        sa.Column("raw_metadata", JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
    )
    op.create_index("ix_vacancy_matches_external_id", "vacancy_matches", ["external_id"])


def downgrade() -> None:
    op.drop_index("ix_vacancy_matches_external_id", table_name="vacancy_matches")
    op.drop_column("vacancy_matches", "raw_metadata")
    op.drop_column("vacancy_matches", "external_id")
