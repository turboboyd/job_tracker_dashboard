# Import all models here so that SQLAlchemy metadata is fully populated
# before Alembic or test fixtures call Base.metadata.create_all().
from app.db.models.user import User  # noqa: F401

__all__ = ["User"]
