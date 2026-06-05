from __future__ import annotations

import hashlib
import inspect
from collections.abc import Awaitable
from datetime import UTC, date, datetime
from typing import Protocol
from uuid import UUID

from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import APIError
from app.core.config import Settings, get_settings
from app.db.models.user import User
from app.db.models.vacancy_analysis import AnalysisUsageDaily, VacancyMatchAnalysis
from app.db.models.vacancy_match import VacancyMatch
from app.modules.loops.service import LoopsService
from app.modules.vacancy_analysis.policy import (
    PlanPolicy,
    get_plan_policy,
    resolve_user_plan,
)
from app.modules.vacancy_analysis.providers import (
    AnalysisProviderResult,
    DeterministicAnalysisProvider,
)
from app.modules.vacancy_analysis.providers_ollama import (
    OllamaAnalysisProvider,
    OllamaProviderInvalidResponse,
    OllamaProviderNotConfigured,
    OllamaProviderTimeout,
    OllamaProviderUnavailable,
)
from app.modules.vacancy_analysis.repository import VacancyAnalysisRepository
from app.modules.vacancy_analysis.schemas import (
    VacancyAnalysisCreate,
    VacancyAnalysisListResponse,
    VacancyAnalysisQuota,
    VacancyAnalysisRead,
    VacancyAnalysisResponse,
)
from app.modules.vacancy_matches.service import VacancyMatchesService


class VacancyAnalysisRepositoryProtocol(Protocol):
    async def create_analysis(self, analysis: VacancyMatchAnalysis) -> VacancyMatchAnalysis: ...
    async def list_for_match(
        self,
        *,
        user_id: UUID,
        loop_id: str,
        match_id: UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[VacancyMatchAnalysis], int]: ...
    async def latest_for_match(
        self,
        *,
        user_id: UUID,
        loop_id: str,
        match_id: UUID,
    ) -> VacancyMatchAnalysis | None: ...
    async def get_or_create_usage(
        self,
        *,
        user_id: UUID,
        day: date,
        plan: str,
    ) -> AnalysisUsageDaily: ...
    async def increment_usage(
        self,
        usage: AnalysisUsageDaily,
        analysis_type: str,
    ) -> AnalysisUsageDaily: ...


class AnalysisProviderProtocol(Protocol):
    def analyze(
        self,
        *,
        loop: object,
        match: object,
        resume_text: str,
        language: str,
        plan: PlanPolicy,
        analysis_type: str,
        include_cover_letter: bool,
        include_interview_questions: bool,
    ) -> AnalysisProviderResult | Awaitable[AnalysisProviderResult]: ...


class AnalysisNotFoundError(APIError):
    def __init__(self, message: str = "Vacancy analysis not found") -> None:
        super().__init__("VACANCY_ANALYSIS_NOT_FOUND", message, status.HTTP_404_NOT_FOUND)


class AnalysisQuotaExceededError(APIError):
    def __init__(self, message: str = "Daily analysis quota exceeded") -> None:
        super().__init__("ANALYSIS_QUOTA_EXCEEDED", message, status.HTTP_429_TOO_MANY_REQUESTS)


class AnalysisFeatureUnavailableError(APIError):
    def __init__(self, message: str = "Feature is not available for current plan") -> None:
        super().__init__("ANALYSIS_FEATURE_UNAVAILABLE", message, status.HTTP_403_FORBIDDEN)


class AIProviderUnavailableError(APIError):
    def __init__(self, message: str = "AI provider is unavailable") -> None:
        super().__init__("AI_PROVIDER_UNAVAILABLE", message, status.HTTP_503_SERVICE_UNAVAILABLE)


class AIProviderInvalidResponseError(APIError):
    def __init__(self, message: str = "AI provider returned an invalid response") -> None:
        super().__init__("AI_PROVIDER_INVALID_RESPONSE", message, status.HTTP_502_BAD_GATEWAY)


class AIProviderTimeoutError(APIError):
    def __init__(self, message: str = "AI provider timed out") -> None:
        super().__init__("AI_PROVIDER_TIMEOUT", message, status.HTTP_504_GATEWAY_TIMEOUT)


class AIProviderNotConfiguredError(APIError):
    def __init__(self, message: str = "AI provider is not configured") -> None:
        super().__init__("AI_PROVIDER_NOT_CONFIGURED", message, status.HTTP_503_SERVICE_UNAVAILABLE)


class AnalysisResumeRequiredError(APIError):
    def __init__(self, message: str = "Resume text is required for analysis") -> None:
        super().__init__("ANALYSIS_RESUME_REQUIRED", message, status.HTTP_400_BAD_REQUEST)


class VacancyAnalysisService:
    def __init__(
        self,
        db: AsyncSession,
        provider: DeterministicAnalysisProvider | None = None,
        ollama_provider: AnalysisProviderProtocol | None = None,
        settings: Settings | None = None,
        repo: VacancyAnalysisRepositoryProtocol | None = None,
        loops: LoopsService | None = None,
        matches: VacancyMatchesService | None = None,
    ) -> None:
        self._repo = repo or VacancyAnalysisRepository(db)
        self._loops = loops or LoopsService(db)
        self._matches = matches or VacancyMatchesService(db)
        self._deterministic_provider = provider or DeterministicAnalysisProvider()
        self._ollama_provider = ollama_provider
        self._settings = settings or get_settings()

    async def create(
        self,
        user: User,
        loop_id: str,
        match_id: UUID,
        payload: VacancyAnalysisCreate,
    ) -> VacancyAnalysisResponse:
        loop = await self._loops.require_owned_for_read(user, loop_id)
        match = await self._matches.get_owned_in_loop(user, loop_id, match_id)
        plan_name = resolve_user_plan(user)
        policy = get_plan_policy(plan_name)
        self._validate_requested_features(payload, policy)

        # Resume text may come from the request OR fall back to the resume saved
        # on the user's profile, so users don't have to paste it every time.
        resume_text = self._resolve_resume_text(payload, user)

        today = datetime.now(UTC).date()
        usage = await self._repo.get_or_create_usage(user_id=user.id, day=today, plan=plan_name)
        self._ensure_quota_available(usage, policy, payload.analysis_type)

        provider = self._select_provider(payload.analysis_type)
        result = await self._run_provider(
            provider,
            loop=loop,
            match=match,
            resume_text=resume_text,
            language=payload.language,
            plan=policy,
            analysis_type=payload.analysis_type,
            include_cover_letter=payload.include_cover_letter,
            include_interview_questions=payload.include_interview_questions,
        )
        analysis = VacancyMatchAnalysis(
            user_id=user.id,
            loop_id=loop_id,
            match_id=match_id,
            analysis_type=payload.analysis_type,
            provider=result.provider,
            model=result.model,
            plan=plan_name,
            resume_hash=_hash_resume(resume_text),
            vacancy_snapshot=_snapshot_match(match),
            overall_score=result.overall_score,
            summary=result.summary,
            strengths=result.strengths,
            gaps=result.gaps,
            risks=result.risks,
            recommended_cv_keywords=result.recommended_cv_keywords,
            application_angle=result.application_angle,
            cover_letter_draft=result.cover_letter_draft,
            interview_questions=result.interview_questions,
            model_info=result.model_info,
            quota_day=today,
        )
        analysis = await self._repo.create_analysis(analysis)
        usage = await self._repo.increment_usage(usage, payload.analysis_type)
        return VacancyAnalysisResponse(
            **VacancyAnalysisRead.model_validate(analysis).model_dump(),
            quota=_quota_response(usage, policy),
        )

    async def list_for_match(
        self,
        user: User,
        loop_id: str,
        match_id: UUID,
        *,
        limit: int = 20,
        offset: int = 0,
    ) -> VacancyAnalysisListResponse:
        await self._loops.require_owned_for_read(user, loop_id)
        await self._matches.get_owned_in_loop(user, loop_id, match_id)
        items, total = await self._repo.list_for_match(
            user_id=user.id,
            loop_id=loop_id,
            match_id=match_id,
            limit=limit,
            offset=offset,
        )
        return VacancyAnalysisListResponse(
            items=[VacancyAnalysisRead.model_validate(item) for item in items],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def latest_for_match(
        self,
        user: User,
        loop_id: str,
        match_id: UUID,
    ) -> VacancyAnalysisRead:
        await self._loops.require_owned_for_read(user, loop_id)
        await self._matches.get_owned_in_loop(user, loop_id, match_id)
        analysis = await self._repo.latest_for_match(
            user_id=user.id,
            loop_id=loop_id,
            match_id=match_id,
        )
        if analysis is None:
            raise AnalysisNotFoundError()
        return VacancyAnalysisRead.model_validate(analysis)

    @staticmethod
    def _resolve_resume_text(payload: VacancyAnalysisCreate, user: User) -> str:
        """Use the request's resume_text, else the resume saved on the profile."""
        candidate = (payload.resume_text or "").strip()
        if candidate:
            return candidate
        stored = (getattr(user, "resume_text", None) or "").strip()
        if stored:
            return stored
        raise AnalysisResumeRequiredError()

    @staticmethod
    def _validate_requested_features(
        payload: VacancyAnalysisCreate,
        policy: PlanPolicy,
    ) -> None:
        if payload.include_interview_questions and not policy.interview_questions:
            raise AnalysisFeatureUnavailableError(
                "Interview questions are not available for current plan"
            )
        if payload.include_cover_letter and not (
            policy.cover_letter or policy.short_cover_letter_template
        ):
            raise AnalysisFeatureUnavailableError(
                "Cover letter draft is not available for current plan"
            )

    @staticmethod
    def _ensure_quota_available(
        usage: AnalysisUsageDaily,
        policy: PlanPolicy,
        analysis_type: str,
    ) -> None:
        if analysis_type == "basic" and usage.basic_used >= policy.basic_daily_limit:
            raise AnalysisQuotaExceededError("Daily basic analysis quota exceeded")
        if analysis_type == "ai" and usage.ai_used >= policy.ai_daily_limit:
            raise AnalysisQuotaExceededError("Daily AI analysis quota exceeded")

    def _select_provider(self, analysis_type: str) -> AnalysisProviderProtocol:
        if analysis_type == "basic":
            return self._deterministic_provider
        # analysis_type == "ai": a real AI backend is required. We deliberately
        # do NOT silently fall back to the deterministic provider — a user who
        # asks for AI must either get AI or a clear "not configured" error,
        # never keyword-matching output masquerading as AI.
        if self._settings.AI_ANALYSIS_PROVIDER == "ollama":
            return self._ollama_provider or OllamaAnalysisProvider(
                base_url=self._settings.OLLAMA_BASE_URL,
                model=self._settings.OLLAMA_MODEL,
                timeout_seconds=self._settings.OLLAMA_TIMEOUT_SECONDS,
            )
        raise AIProviderNotConfiguredError()

    @staticmethod
    async def _run_provider(
        provider: AnalysisProviderProtocol,
        *,
        loop: object,
        match: object,
        resume_text: str,
        language: str,
        plan: PlanPolicy,
        analysis_type: str,
        include_cover_letter: bool,
        include_interview_questions: bool,
    ) -> AnalysisProviderResult:
        try:
            result = provider.analyze(
                loop=loop,
                match=match,
                resume_text=resume_text,
                language=language,
                plan=plan,
                analysis_type=analysis_type,
                include_cover_letter=include_cover_letter,
                include_interview_questions=include_interview_questions,
            )
            if inspect.isawaitable(result):
                return await result
            return result
        except OllamaProviderTimeout as exc:
            raise AIProviderTimeoutError() from exc
        except OllamaProviderInvalidResponse as exc:
            raise AIProviderInvalidResponseError() from exc
        except OllamaProviderNotConfigured as exc:
            raise AIProviderNotConfiguredError() from exc
        except OllamaProviderUnavailable as exc:
            raise AIProviderUnavailableError() from exc


def _hash_resume(resume_text: str) -> str:
    return hashlib.sha256(resume_text.encode("utf-8")).hexdigest()


def _snapshot_match(match: VacancyMatch) -> dict:
    return {
        "source_url": match.source_url,
        "source": match.source,
        "company_name": match.company_name,
        "role_title": match.role_title,
        "location_text": match.location_text,
        "vacancy_description": match.vacancy_description,
    }


def _quota_response(
    usage: AnalysisUsageDaily,
    policy: PlanPolicy,
) -> VacancyAnalysisQuota:
    return VacancyAnalysisQuota(
        plan=policy.name,
        basic_used=usage.basic_used,
        basic_limit=policy.basic_daily_limit,
        ai_used=usage.ai_used,
        ai_limit=policy.ai_daily_limit,
        day=usage.day,
    )
