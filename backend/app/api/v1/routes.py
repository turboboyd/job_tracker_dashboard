from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.db.session import check_db_connection
from app.modules.activity.router import router as activity_router
from app.modules.analytics.router import router as analytics_router
from app.modules.applications.router import router as applications_router
from app.modules.cycles.router import router as cycles_router
from app.modules.documents.router import router as documents_router
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
router.include_router(cycles_router)
router.include_router(applications_router)
router.include_router(documents_router)
router.include_router(history_router)
router.include_router(activity_router)
router.include_router(analytics_router)
