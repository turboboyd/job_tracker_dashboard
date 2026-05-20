"""create backend-owned loops table

Revision ID: 0009_create_loops
Revises: 0008_create_vacancy_matches
Create Date: 2026-05-13

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "0009_create_loops"
down_revision: Union[str, None] = "0008_create_vacancy_matches"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "loops",
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
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("target_role", sa.String(), nullable=True),
        sa.Column("location", sa.String(), nullable=True),
        sa.Column("radius_km", sa.Integer(), nullable=True),
        sa.Column("sources", JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("status", sa.String(), nullable=False, server_default="active"),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_loops_user_id", "loops", ["user_id"])
    op.create_index("ix_loops_user_id_status", "loops", ["user_id", "status"])


def downgrade() -> None:
    op.drop_index("ix_loops_user_id_status", table_name="loops")
    op.drop_index("ix_loops_user_id", table_name="loops")
    op.drop_table("loops")
