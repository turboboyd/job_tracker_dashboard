from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.db.session import check_db_connection
from app.modules.activity.router import router as activity_router
from app.modules.analytics.router import router as analytics_router
from app.modules.applications.router import router as applications_router
from app.modules.dev_tools.router import router as dev_tools_router
from app.modules.discovery_preview.router import router as discovery_preview_router
from app.modules.discovery_runs.router import router as discovery_runs_router
from app.modules.discovery_sources.router import router as discovery_sources_router
from app.modules.documents.router import router as documents_router
from app.modules.history.router import router as history_router
from app.modules.loops.router import router as loops_router
from app.modules.users.router import router as users_router
from app.modules.vacancy_analysis.router import router as vacancy_analysis_router
from app.modules.vacancy_import.router import router as vacancy_import_router
from app.modules.vacancy_matches.router import (
    loop_applications_router,
    matches_feed_router,
    router as vacancy_matches_router,
)

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


@router.get("/health/ready", tags=["system"])
async def readiness_check() -> JSONResponse:
    """Readiness probe. Returns 200 when the database is reachable, 503 otherwise."""
    if await check_db_connection():
        return JSONResponse(status_code=200, content={"status": "ready"})
    return JSONResponse(
        status_code=503,
        content={"status": "degraded", "reason": "database"},
    )


# ── Domain routers ─────────────────────────────────────────────────────────────

router.include_router(users_router)
router.include_router(dev_tools_router)
router.include_router(vacancy_import_router)
router.include_router(discovery_sources_router)
router.include_router(discovery_preview_router)
router.include_router(discovery_runs_router)
router.include_router(loops_router)
router.include_router(vacancy_matches_router)
router.include_router(matches_feed_router)
router.include_router(loop_applications_router)
router.include_router(vacancy_analysis_router)
router.include_router(applications_router)
router.include_router(documents_router)
router.include_router(history_router)
router.include_router(activity_router)
router.include_router(analytics_router)
