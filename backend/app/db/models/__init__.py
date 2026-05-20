# Import all models here so that SQLAlchemy metadata is fully populated
# before Alembic or test fixtures call Base.metadata.create_all().
from app.db.models.activity_event import ActivityEvent  # noqa: F401
from app.db.models.application import Application  # noqa: F401
from app.db.models.application_history import ApplicationHistory  # noqa: F401
from app.db.models.discovery_preview_cache import DiscoveryPreviewCache  # noqa: F401
from app.db.models.firestore_migration_log import FirestoreMigrationLog  # noqa: F401
from app.db.models.loop import Loop  # noqa: F401
from app.db.models.user import User  # noqa: F401
from app.db.models.vacancy_analysis import AnalysisUsageDaily, VacancyMatchAnalysis  # noqa: F401
from app.db.models.vacancy_match import VacancyMatch  # noqa: F401
from app.db.models.vacancy_preview_ignore import VacancyPreviewIgnore  # noqa: F401

__all__ = [
    "ActivityEvent",
    "AnalysisUsageDaily",
    "Application",
    "ApplicationHistory",
    "DiscoveryPreviewCache",
    "FirestoreMigrationLog",
    "Loop",
    "User",
    "VacancyMatchAnalysis",
    "VacancyMatch",
    "VacancyPreviewIgnore",
]
