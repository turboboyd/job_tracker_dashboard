"""create vacancy match analyses

Revision ID: 0011_vacancy_match_analyses
Revises: 0010_add_loop_search_settings
Create Date: 2026-05-14

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0011_vacancy_match_analyses"
down_revision: Union[str, None] = "0010_add_loop_search_settings"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "vacancy_match_analyses",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("loop_id", sa.String(), nullable=False),
        sa.Column("match_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("analysis_type", sa.String(), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("model", sa.String(), nullable=False),
        sa.Column("plan", sa.String(), nullable=False),
        sa.Column("resume_hash", sa.String(), nullable=False),
        sa.Column("vacancy_snapshot", postgresql.JSONB(), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("overall_score", sa.Integer(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("strengths", postgresql.JSONB(), server_default=sa.text("'[]'::jsonb"), nullable=False),
        sa.Column("gaps", postgresql.JSONB(), server_default=sa.text("'[]'::jsonb"), nullable=False),
        sa.Column("risks", postgresql.JSONB(), server_default=sa.text("'[]'::jsonb"), nullable=False),
        sa.Column("recommended_cv_keywords", postgresql.JSONB(), server_default=sa.text("'[]'::jsonb"), nullable=False),
        sa.Column("application_angle", sa.Text(), nullable=False),
        sa.Column("cover_letter_draft", sa.Text(), nullable=True),
        sa.Column("interview_questions", postgresql.JSONB(), server_default=sa.text("'[]'::jsonb"), nullable=False),
        sa.Column("model_info", postgresql.JSONB(), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("quota_day", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["match_id"], ["vacancy_matches.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_vacancy_match_analyses_user_id", "vacancy_match_analyses", ["user_id"])
    op.create_index("ix_vacancy_match_analyses_loop_id", "vacancy_match_analyses", ["loop_id"])
    op.create_index("ix_vacancy_match_analyses_match_id", "vacancy_match_analyses", ["match_id"])
    op.create_index("ix_vacancy_match_analyses_analysis_type", "vacancy_match_analyses", ["analysis_type"])
    op.create_index("ix_vacancy_match_analyses_resume_hash", "vacancy_match_analyses", ["resume_hash"])
    op.create_index("ix_vacancy_match_analyses_quota_day", "vacancy_match_analyses", ["quota_day"])

    op.create_table(
        "analysis_usage_daily",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("day", sa.Date(), nullable=False),
        sa.Column("plan", sa.String(), server_default="free", nullable=False),
        sa.Column("basic_used", sa.Integer(), server_default="0", nullable=False),
        sa.Column("ai_used", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "day", name="uq_analysis_usage_daily_user_day"),
    )
    op.create_index("ix_analysis_usage_daily_user_id", "analysis_usage_daily", ["user_id"])
    op.create_index("ix_analysis_usage_daily_day", "analysis_usage_daily", ["day"])


def downgrade() -> None:
    op.drop_index("ix_analysis_usage_daily_day", table_name="analysis_usage_daily")
    op.drop_index("ix_analysis_usage_daily_user_id", table_name="analysis_usage_daily")
    op.drop_table("analysis_usage_daily")

    op.drop_index("ix_vacancy_match_analyses_quota_day", table_name="vacancy_match_analyses")
    op.drop_index("ix_vacancy_match_analyses_resume_hash", table_name="vacancy_match_analyses")
    op.drop_index("ix_vacancy_match_analyses_analysis_type", table_name="vacancy_match_analyses")
    op.drop_index("ix_vacancy_match_analyses_match_id", table_name="vacancy_match_analyses")
    op.drop_index("ix_vacancy_match_analyses_loop_id", table_name="vacancy_match_analyses")
    op.drop_index("ix_vacancy_match_analyses_user_id", table_name="vacancy_match_analyses")
    op.drop_table("vacancy_match_analyses")
