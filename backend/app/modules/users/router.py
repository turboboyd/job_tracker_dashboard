from fastapi import APIRouter

from app.auth.deps import CurrentUser
from app.db.session import DbSession
from app.modules.users.schemas import AnalysisPlanRead, UserPatch, UserRead
from app.modules.users.service import UsersService, get_analysis_plan_for_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead, summary="Get current user")
async def get_me(current_user: CurrentUser) -> UserRead:
    """Return the authenticated user's profile.

    Creates a local DB record on first call for a new Firebase UID.
    """
    return UserRead.model_validate(current_user)


@router.patch("/me", response_model=UserRead, summary="Update current user")
async def patch_me(
    patch: UserPatch,
    current_user: CurrentUser,
    db: DbSession,
) -> UserRead:
    """Update allowed profile fields (language, timezone, date_format, display_name).

    Fields not included in the request body are left unchanged.
    Protected fields (firebase_uid, email, id, created_at) cannot be changed here.
    """
    service = UsersService(db)
    updated = await service.patch_me(current_user, patch)
    return UserRead.model_validate(updated)


@router.post(
    "/me/matches-seen",
    response_model=UserRead,
    summary="Mark the Matches list as seen",
)
async def mark_matches_seen(
    current_user: CurrentUser,
    db: DbSession,
) -> UserRead:
    """Advance the user's Matches "seen" watermark to now.

    The Matches "Новые" tab treats matches created after this timestamp as
    unseen; calling this marks everything currently visible as seen.
    """
    service = UsersService(db)
    updated = await service.mark_matches_seen(current_user)
    return UserRead.model_validate(updated)


@router.get(
    "/me/analysis-plan",
    response_model=AnalysisPlanRead,
    summary="Get current user's analysis plan",
)
async def get_my_analysis_plan(
    current_user: CurrentUser,
) -> AnalysisPlanRead:
    """Return current analysis plan limits and feature flags.

    This is read-only. Plan changes are intentionally not exposed as public
    self-upgrade until billing/admin authorization is implemented.
    """
    return get_analysis_plan_for_user(current_user)
