from fastapi import APIRouter

from app.core.config import get_settings
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
