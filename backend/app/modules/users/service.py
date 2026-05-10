from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User
from app.modules.users.repository import UsersRepository
from app.modules.users.schemas import UserPatch


class UsersService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = UsersRepository(db)

    async def patch_me(self, user: User, patch: UserPatch) -> User:
        """Apply allowed profile updates. Skips None / unset fields."""
        updates = patch.model_dump(exclude_unset=True, exclude_none=True)
        if not updates:
            return user
        return await self._repo.patch(user, updates)
