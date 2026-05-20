"""create vacancy preview ignores

Revision ID: 0014_preview_ignores
Revises: 0013_add_preview_match_metadata
Create Date: 2026-05-18

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0014_preview_ignores"
down_revision: Union[str, None] = "0013_add_preview_match_metadata"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "vacancy_preview_ignores",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("loop_id", sa.String(), nullable=False),
        sa.Column("source_id", sa.String(), nullable=False),
        sa.Column("external_id", sa.String(), nullable=True),
        sa.Column("source_url", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=True),
        sa.Column("company", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "loop_id",
            "source_id",
            "source_url",
            name="uq_vacancy_preview_ignores_source_url",
        ),
        sa.UniqueConstraint(
            "user_id",
            "loop_id",
            "source_id",
            "external_id",
            name="uq_vacancy_preview_ignores_external_id",
        ),
    )
    op.create_index("ix_vacancy_preview_ignores_user_id", "vacancy_preview_ignores", ["user_id"])
    op.create_index("ix_vacancy_preview_ignores_loop_id", "vacancy_preview_ignores", ["loop_id"])
    op.create_index("ix_vacancy_preview_ignores_source_id", "vacancy_preview_ignores", ["source_id"])
    op.create_index("ix_vacancy_preview_ignores_external_id", "vacancy_preview_ignores", ["external_id"])


def downgrade() -> None:
    op.drop_index("ix_vacancy_preview_ignores_external_id", table_name="vacancy_preview_ignores")
    op.drop_index("ix_vacancy_preview_ignores_source_id", table_name="vacancy_preview_ignores")
    op.drop_index("ix_vacancy_preview_ignores_loop_id", table_name="vacancy_preview_ignores")
    op.drop_index("ix_vacancy_preview_ignores_user_id", table_name="vacancy_preview_ignores")
    op.drop_table("vacancy_preview_ignores")
