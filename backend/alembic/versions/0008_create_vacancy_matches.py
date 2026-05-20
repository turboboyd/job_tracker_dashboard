"""create vacancy matches table

Revision ID: 0008_create_vacancy_matches
Revises: 0007_add_application_favorites
Create Date: 2026-05-13

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "0008_create_vacancy_matches"
down_revision: Union[str, None] = "0007_add_application_favorites"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "vacancy_matches",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("loop_id", sa.String(), nullable=False),
        sa.Column("source_url", sa.String(), nullable=False),
        sa.Column("source", sa.String(), nullable=True),
        sa.Column("company_name", sa.String(), nullable=True),
        sa.Column("role_title", sa.String(), nullable=True),
        sa.Column("location_text", sa.String(), nullable=True),
        sa.Column("vacancy_description", sa.Text(), nullable=True),
        sa.Column("confidence", JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("warnings", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("status", sa.String(), nullable=False, server_default="new"),
        sa.Column(
            "application_id",
            UUID(as_uuid=True),
            sa.ForeignKey("applications.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_vacancy_matches_user_id", "vacancy_matches", ["user_id"])
    op.create_index("ix_vacancy_matches_loop_id", "vacancy_matches", ["loop_id"])
    op.create_index("ix_vacancy_matches_status", "vacancy_matches", ["status"])
    op.create_index("ix_vacancy_matches_application_id", "vacancy_matches", ["application_id"])


def downgrade() -> None:
    op.drop_index("ix_vacancy_matches_application_id", table_name="vacancy_matches")
    op.drop_index("ix_vacancy_matches_status", table_name="vacancy_matches")
    op.drop_index("ix_vacancy_matches_loop_id", table_name="vacancy_matches")
    op.drop_index("ix_vacancy_matches_user_id", table_name="vacancy_matches")
    op.drop_table("vacancy_matches")
