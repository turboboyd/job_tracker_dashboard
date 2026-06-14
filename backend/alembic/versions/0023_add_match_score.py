"""add persisted match score columns to vacancy_matches

Revision ID: 0023_add_match_score
Revises: 0022_loops_interval_default_4
Create Date: 2026-06-12

Adds the Stage 6c match-score persistence (see vacancy_matches/scoring.py):

- ``score``         INT NULL, indexed — 0–100 total from the scoring core, used
                    for server-side ``ORDER BY score DESC NULLS LAST``.
- ``score_version`` INT NULL — SCORE_VERSION that produced the value, so stale
                    rows are identifiable after formula changes.
- ``score_details`` JSONB NULL — component breakdown + machine-readable coded
                    reasons/penalties.

Purely additive and reversible: all columns are nullable with no defaults and
no backfill — existing rows keep NULL (= "not yet scored") and are re-scored
lazily by the loop-PATCH rescore hook or future discovery passes.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0023_add_match_score"
down_revision: str | None = "0022_loops_interval_default_4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("vacancy_matches", sa.Column("score", sa.Integer(), nullable=True))
    op.add_column(
        "vacancy_matches", sa.Column("score_version", sa.Integer(), nullable=True)
    )
    op.add_column(
        "vacancy_matches",
        sa.Column("score_details", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.create_index(
        "ix_vacancy_matches_score", "vacancy_matches", ["score"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_vacancy_matches_score", table_name="vacancy_matches")
    op.drop_column("vacancy_matches", "score_details")
    op.drop_column("vacancy_matches", "score_version")
    op.drop_column("vacancy_matches", "score")
