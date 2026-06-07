from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User


class UsersRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, user_id: UUID) -> User | None:
        result = await self._db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_firebase_uid(self, firebase_uid: str) -> User | None:
        result = await self._db.execute(
            select(User).where(User.firebase_uid == firebase_uid)
        )
        return result.scalar_one_or_none()

    async def patch(self, user: User, updates: dict) -> User:
        """Apply a dict of field updates, bump updated_at, and flush."""
        for field, value in updates.items():
            setattr(user, field, value)
        user.updated_at = datetime.now(UTC)
        await self._db.flush()
        return user

    async def set_analysis_plan(self, user: User, plan: str) -> User:
        user.analysis_plan = plan
        user.updated_at = datetime.now(UTC)
        await self._db.flush()
        return user

    async def set_matches_seen_at(self, user: User, seen_at: datetime) -> User:
        """Advance the Matches "seen" watermark and flush."""
        user.matches_seen_at = seen_at
        user.updated_at = datetime.now(UTC)
        await self._db.flush()
        return user
