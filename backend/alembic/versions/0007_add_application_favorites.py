"""add application favorites

Revision ID: 0007_add_application_favorites
Revises: 0005_create_documents
Create Date: 2026-05-12

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0007_add_application_favorites"
down_revision: Union[str, None] = "0005_create_documents"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "applications",
        sa.Column(
            "is_favorite",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    op.create_index("ix_applications_is_favorite", "applications", ["is_favorite"])


def downgrade() -> None:
    op.drop_index("ix_applications_is_favorite", table_name="applications")
    op.drop_column("applications", "is_favorite")
