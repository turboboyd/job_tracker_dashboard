from fastapi import APIRouter

from app.core.config import get_settings
from app.modules.activity.router import router as activity_router
from app.modules.analytics.router import router as analytics_router
from app.modules.applications.router import router as applications_router
from app.modules.history.router import router as history_router
from app.modules.users.router import router as users_router

router = APIRouter()

# ── System ─────────────────────────────────────────────────────────────────────


@router.get("/health", tags=["system"])
async def health_check() -> dict[str, str]:
    """Liveness probe. Returns 200 when the API process is running."""
    settings = get_settings()
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


# ── Domain routers ─────────────────────────────────────────────────────────────

router.include_router(users_router)
router.include_router(applications_router)
router.include_router(history_router)
router.include_router(activity_router)
router.include_router(analytics_router)
