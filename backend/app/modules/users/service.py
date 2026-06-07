from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.db.models.user import User
from app.modules.users.repository import UsersRepository
from app.modules.users.schemas import (
    AnalysisPlanFeatures,
    AnalysisPlanLimits,
    AnalysisPlanRead,
    PlanName,
    UserPatch,
)
from app.modules.vacancy_analysis.policy import (
    PlanPolicy,
    get_plan_policy,
    normalize_plan,
    resolve_user_plan,
)


class UsersService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = UsersRepository(db)

    async def patch_me(self, user: User, patch: UserPatch) -> User:
        """Apply allowed profile updates. Skips None / unset fields."""
        updates = patch.model_dump(exclude_unset=True, exclude_none=True)
        if not updates:
            return user
        return await self._repo.patch(user, updates)

    async def mark_matches_seen(self, user: User) -> User:
        """Advance the user's Matches "seen" watermark to now (UTC).

        Matches created after this timestamp are considered "unseen" by the
        Matches "Новые" tab.
        """
        return await self._repo.set_matches_seen_at(user, datetime.now(UTC))

    def get_analysis_plan(self, user: User) -> AnalysisPlanRead:
        return get_analysis_plan_for_user(user)

    async def set_user_analysis_plan_for_admin(self, user: User, plan: PlanName) -> User:
        """Admin/dev service hook. No public route is exposed until admin auth exists."""
        normalized = normalize_plan(plan)
        return await self._repo.set_analysis_plan(user, normalized)


def _cover_letter_feature(policy: PlanPolicy) -> str:
    if policy.cover_letter:
        return "enabled"
    if policy.short_cover_letter_template:
        return "short_template"
    return "disabled"


def _plan_response(
    plan: PlanName, policy: PlanPolicy, *, ai_available: bool
) -> AnalysisPlanRead:
    return AnalysisPlanRead(
        plan=plan,
        limits=AnalysisPlanLimits(
            basic_daily_limit=policy.basic_daily_limit,
            ai_daily_limit=policy.ai_daily_limit,
        ),
        features=AnalysisPlanFeatures(
            cover_letter=_cover_letter_feature(policy),
            interview_questions=policy.interview_questions,
            cv_keywords=policy.cv_keywords,
            multi_match_comparison=policy.multi_match_comparison,
            priority=policy.priority,
        ),
        ai_available=ai_available,
    )


def get_analysis_plan_for_user(
    user: User, settings: Settings | None = None
) -> AnalysisPlanRead:
    settings = settings or get_settings()
    plan = resolve_user_plan(user)
    ai_available = settings.AI_ANALYSIS_PROVIDER != "deterministic"
    return _plan_response(plan, get_plan_policy(plan), ai_available=ai_available)
