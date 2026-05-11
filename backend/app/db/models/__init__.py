# Import all models here so that SQLAlchemy metadata is fully populated
# before Alembic or test fixtures call Base.metadata.create_all().
from app.db.models.activity_event import ActivityEvent  # noqa: F401
from app.db.models.application import Application  # noqa: F401
from app.db.models.application_history import ApplicationHistory  # noqa: F401
from app.db.models.firestore_migration_log import FirestoreMigrationLog  # noqa: F401
from app.db.models.user import User  # noqa: F401

__all__ = ["ActivityEvent", "Application", "ApplicationHistory", "FirestoreMigrationLog", "User"]
