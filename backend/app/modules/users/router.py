from fastapi import APIRouter

from app.auth.deps import CurrentUser
from app.db.session import DbSession
from app.modules.users.schemas import UserPatch, UserRead
from app.modules.users.service import UsersService

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
