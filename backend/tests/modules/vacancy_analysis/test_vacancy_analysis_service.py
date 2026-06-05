from __future__ import annotations

from datetime import UTC, date, datetime
from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest

from app.db.models.user import User
from app.db.models.vacancy_analysis import AnalysisUsageDaily
from app.db.models.vacancy_match import VacancyMatch
from app.modules.loops.service import LoopNotFoundError
from app.modules.vacancy_analysis.schemas import VacancyAnalysisCreate
from app.modules.vacancy_analysis.service import (
    AIProviderInvalidResponseError,
    AIProviderNotConfiguredError,
    AIProviderUnavailableError,
    AnalysisNotFoundError,
    AnalysisQuotaExceededError,
    AnalysisResumeRequiredError,
    VacancyAnalysisService,
)
from app.modules.vacancy_analysis.providers import AnalysisProviderResult
from app.modules.vacancy_analysis.providers_ollama import (
    OllamaProviderInvalidResponse,
    OllamaProviderUnavailable,
)
from app.modules.vacancy_matches.service import VacancyMatchNotFoundError

USER_ID = uuid4()
LOOP_ID = UUID("4b33e9a4-7a7e-4d94-87c1-5d70b78e48a0")
MATCH_ID = uuid4()


def make_user(plan: str = "free", resume_text: str | None = None) -> User:
    return User(
        id=USER_ID,
        firebase_uid="firebase-user",
        email="user@example.com",
        display_name="User",
        photo_url=None,
        analysis_plan=plan,
        resume_text=resume_text,
    )


def make_loop(**overrides):
    data = {
        "id": LOOP_ID,
        "user_id": USER_ID,
        "target_role": "Backend Engineer",
        "location": "Berlin",
        "keywords": ["Python", "FastAPI"],
        "excluded_keywords": [],
    }
    data.update(overrides)
    return SimpleNamespace(**data)


def make_match(**overrides) -> VacancyMatch:
    data = {
        "id": MATCH_ID,
        "user_id": USER_ID,
        "loop_id": str(LOOP_ID),
        "source_url": "https://example.com/job",
        "source": "manual_url",
        "company_name": "Acme GmbH",
        "role_title": "Python Backend Engineer",
        "location_text": "Berlin",
        "vacancy_description": "Build Python APIs with FastAPI.",
        "status": "saved",
        "application_id": None,
    }
    data.update(overrides)
    return VacancyMatch(**data)


class FakeRepo:
    def __init__(self) -> None:
        self.items = []
        self.usage = AnalysisUsageDaily(
            id=uuid4(),
            user_id=USER_ID,
            day=date(2026, 5, 14),
            plan="free",
            basic_used=0,
            ai_used=0,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    async def create_analysis(self, analysis):
        analysis.id = uuid4()
        analysis.created_at = datetime.now(UTC)
        analysis.updated_at = analysis.created_at
        self.items.append(analysis)
        return analysis

    async def list_for_match(self, *, user_id, loop_id, match_id, limit=20, offset=0):
        items = [
            item
            for item in self.items
            if item.user_id == user_id and item.loop_id == loop_id and item.match_id == match_id
        ]
        return items[offset : offset + limit], len(items)

    async def latest_for_match(self, *, user_id, loop_id, match_id):
        items, _ = await self.list_for_match(
            user_id=user_id,
            loop_id=loop_id,
            match_id=match_id,
        )
        return items[-1] if items else None

    async def get_or_create_usage(self, *, user_id, day, plan):
        self.usage.day = day
        self.usage.plan = plan
        return self.usage

    async def increment_usage(self, usage, analysis_type):
        if analysis_type == "basic":
            usage.basic_used += 1
        else:
            usage.ai_used += 1
        return usage


class FakeLoops:
    def __init__(self, loop=None, error=None) -> None:
        self.loop = loop or make_loop()
        self.error = error

    async def require_owned_for_read(self, user, loop_id):
        if self.error:
            raise self.error
        return self.loop


class FakeMatches:
    def __init__(self, match=None, error=None) -> None:
        self.match = match or make_match()
        self.error = error

    async def get_owned_in_loop(self, user, loop_id, match_id):
        if self.error:
            raise self.error
        return self.match


class FakeProvider:
    def __init__(self, *, provider: str = "deterministic", error: Exception | None = None) -> None:
        self.provider = provider
        self.error = error
        self.calls = 0

    async def analyze(self, **kwargs):
        self.calls += 1
        if self.error is not None:
            raise self.error
        return AnalysisProviderResult(
            provider=self.provider,
            model=f"{self.provider}-test",
            overall_score=88,
            summary="Provider result.",
            strengths=["Python"],
            gaps=[],
            risks=[],
            recommended_cv_keywords=["FastAPI"],
            application_angle="Lead with backend experience.",
            cover_letter_draft=None,
            interview_questions=[],
            model_info={"provider": self.provider, "mode": self.provider},
        )


def settings(provider: str = "deterministic"):
    return SimpleNamespace(
        AI_ANALYSIS_PROVIDER=provider,
        OLLAMA_BASE_URL="http://ollama.local",
        OLLAMA_MODEL="llama-test",
        OLLAMA_TIMEOUT_SECONDS=5,
    )


def make_service(
    repo: FakeRepo,
    loops=None,
    matches=None,
    provider=None,
    ollama_provider=None,
    provider_name: str = "deterministic",
) -> VacancyAnalysisService:
    return VacancyAnalysisService(
        db=None,  # type: ignore[arg-type]
        provider=provider,
        ollama_provider=ollama_provider,
        settings=settings(provider_name),  # type: ignore[arg-type]
        repo=repo,
        loops=loops or FakeLoops(),
        matches=matches or FakeMatches(),
    )


@pytest.mark.asyncio
async def test_creates_basic_analysis_and_saves_result_without_raw_resume_text() -> None:
    repo = FakeRepo()
    service = make_service(repo)

    result = await service.create(
        make_user(),
        str(LOOP_ID),
        MATCH_ID,
        VacancyAnalysisCreate(
            analysis_type="basic",
            resume_text="Python FastAPI PostgreSQL backend engineer",
        ),
    )

    assert result.analysis_type == "basic"
    assert result.provider == "deterministic"
    assert result.model == "deterministic-v1"
    assert result.quota.basic_used == 1
    assert result.resume_hash
    assert "resume_text" not in repo.items[0].__dict__
    assert "Python FastAPI PostgreSQL backend engineer" not in str(repo.items[0].vacancy_snapshot)


@pytest.mark.asyncio
async def test_ai_analysis_without_real_provider_is_rejected_not_faked() -> None:
    # No silent fallback: requesting "ai" while the server is in deterministic
    # mode must error, never return deterministic output dressed up as AI.
    repo = FakeRepo()
    service = make_service(repo)

    with pytest.raises(AIProviderNotConfiguredError):
        await service.create(
            make_user(),
            str(LOOP_ID),
            MATCH_ID,
            VacancyAnalysisCreate(
                analysis_type="ai",
                resume_text="Python FastAPI PostgreSQL backend engineer",
            ),
        )

    assert repo.items == []
    assert repo.usage.ai_used == 0


@pytest.mark.asyncio
async def test_free_plan_rejects_11th_basic_analysis() -> None:
    repo = FakeRepo()
    repo.usage.basic_used = 10

    with pytest.raises(AnalysisQuotaExceededError):
        await make_service(repo).create(
            make_user(),
            str(LOOP_ID),
            MATCH_ID,
            VacancyAnalysisCreate(analysis_type="basic", resume_text="Python"),
        )


@pytest.mark.asyncio
async def test_free_plan_rejects_2nd_ai_analysis() -> None:
    repo = FakeRepo()
    repo.usage.ai_used = 1

    with pytest.raises(AnalysisQuotaExceededError):
        await make_service(repo).create(
            make_user(),
            str(LOOP_ID),
            MATCH_ID,
            VacancyAnalysisCreate(analysis_type="ai", resume_text="Python"),
        )


@pytest.mark.asyncio
async def test_basic_plan_allows_more_than_one_ai_analysis_per_day() -> None:
    repo = FakeRepo()
    repo.usage.ai_used = 1

    result = await make_service(
        repo,
        ollama_provider=FakeProvider(provider="ollama"),
        provider_name="ollama",
    ).create(
        make_user("basic"),
        str(LOOP_ID),
        MATCH_ID,
        VacancyAnalysisCreate(analysis_type="ai", resume_text="Python"),
    )

    assert result.plan == "basic"
    assert result.quota.ai_limit == 50
    assert result.quota.ai_used == 2


@pytest.mark.asyncio
async def test_premium_plan_uses_premium_quota_limits() -> None:
    repo = FakeRepo()

    result = await make_service(repo).create(
        make_user("premium"),
        str(LOOP_ID),
        MATCH_ID,
        VacancyAnalysisCreate(analysis_type="basic", resume_text="Python"),
    )

    assert result.plan == "premium"
    assert result.quota.basic_limit == 300
    assert result.quota.ai_limit == 100


@pytest.mark.asyncio
async def test_invalid_user_plan_falls_back_to_free_quota() -> None:
    repo = FakeRepo()
    repo.usage.ai_used = 1

    with pytest.raises(AnalysisQuotaExceededError):
        await make_service(repo).create(
            make_user("unexpected"),
            str(LOOP_ID),
            MATCH_ID,
            VacancyAnalysisCreate(analysis_type="ai", resume_text="Python"),
        )


@pytest.mark.asyncio
async def test_history_and_latest_return_saved_results() -> None:
    repo = FakeRepo()
    service = make_service(repo)
    user = make_user()
    payload = VacancyAnalysisCreate(analysis_type="basic", resume_text="Python")

    first = await service.create(user, str(LOOP_ID), MATCH_ID, payload)
    second = await service.create(user, str(LOOP_ID), MATCH_ID, payload)

    history = await service.list_for_match(user, str(LOOP_ID), MATCH_ID)
    latest = await service.latest_for_match(user, str(LOOP_ID), MATCH_ID)

    assert history.total == 2
    assert [item.id for item in history.items] == [first.id, second.id]
    assert latest.id == second.id


@pytest.mark.asyncio
async def test_latest_unknown_analysis_returns_not_found() -> None:
    with pytest.raises(AnalysisNotFoundError):
        await make_service(FakeRepo()).latest_for_match(make_user(), str(LOOP_ID), MATCH_ID)


@pytest.mark.asyncio
async def test_unknown_loop_or_match_is_rejected() -> None:
    payload = VacancyAnalysisCreate(analysis_type="basic", resume_text="Python")

    with pytest.raises(LoopNotFoundError):
        await make_service(FakeRepo(), loops=FakeLoops(error=LoopNotFoundError())).create(
            make_user(), str(LOOP_ID), MATCH_ID, payload
        )

    with pytest.raises(VacancyMatchNotFoundError):
        await make_service(
            FakeRepo(), matches=FakeMatches(error=VacancyMatchNotFoundError())
        ).create(make_user(), str(LOOP_ID), MATCH_ID, payload)


@pytest.mark.asyncio
async def test_match_is_not_mutated_and_application_is_not_created() -> None:
    match = make_match()
    repo = FakeRepo()

    await make_service(repo, matches=FakeMatches(match=match)).create(
        make_user(),
        str(LOOP_ID),
        MATCH_ID,
        VacancyAnalysisCreate(analysis_type="basic", resume_text="Python"),
    )

    assert match.status == "saved"
    assert match.application_id is None
    assert len(repo.items) == 1


@pytest.mark.asyncio
async def test_basic_analysis_never_calls_ollama_provider() -> None:
    repo = FakeRepo()
    ollama = FakeProvider(provider="ollama")

    result = await make_service(
        repo,
        ollama_provider=ollama,
        provider_name="ollama",
    ).create(
        make_user(),
        str(LOOP_ID),
        MATCH_ID,
        VacancyAnalysisCreate(analysis_type="basic", resume_text="Python"),
    )

    assert result.provider == "deterministic"
    assert ollama.calls == 0


@pytest.mark.asyncio
async def test_ai_analysis_with_deterministic_setting_raises_and_does_not_call_provider() -> None:
    repo = FakeRepo()
    deterministic = FakeProvider(provider="deterministic")

    with pytest.raises(AIProviderNotConfiguredError):
        await make_service(repo, provider=deterministic).create(
            make_user(),
            str(LOOP_ID),
            MATCH_ID,
            VacancyAnalysisCreate(analysis_type="ai", resume_text="Python"),
        )

    assert deterministic.calls == 0
    assert repo.usage.ai_used == 0


@pytest.mark.asyncio
async def test_ai_analysis_with_ollama_setting_uses_ollama_provider() -> None:
    repo = FakeRepo()
    ollama = FakeProvider(provider="ollama")

    result = await make_service(
        repo,
        ollama_provider=ollama,
        provider_name="ollama",
    ).create(
        make_user(),
        str(LOOP_ID),
        MATCH_ID,
        VacancyAnalysisCreate(analysis_type="ai", resume_text="Python"),
    )

    assert result.provider == "ollama"
    assert result.model == "ollama-test"
    assert ollama.calls == 1
    assert repo.usage.ai_used == 1


@pytest.mark.asyncio
async def test_provider_invalid_response_does_not_save_or_consume_quota() -> None:
    repo = FakeRepo()
    ollama = FakeProvider(provider="ollama", error=OllamaProviderInvalidResponse())

    with pytest.raises(AIProviderInvalidResponseError):
        await make_service(
            repo,
            ollama_provider=ollama,
            provider_name="ollama",
        ).create(
            make_user(),
            str(LOOP_ID),
            MATCH_ID,
            VacancyAnalysisCreate(analysis_type="ai", resume_text="Python"),
        )

    assert repo.items == []
    assert repo.usage.ai_used == 0


@pytest.mark.asyncio
async def test_provider_unavailable_does_not_save_or_consume_quota() -> None:
    repo = FakeRepo()
    ollama = FakeProvider(provider="ollama", error=OllamaProviderUnavailable())

    with pytest.raises(AIProviderUnavailableError):
        await make_service(
            repo,
            ollama_provider=ollama,
            provider_name="ollama",
        ).create(
            make_user(),
            str(LOOP_ID),
            MATCH_ID,
            VacancyAnalysisCreate(analysis_type="ai", resume_text="Python"),
        )

    assert repo.items == []
    assert repo.usage.ai_used == 0


@pytest.mark.asyncio
async def test_resume_text_falls_back_to_profile_when_omitted() -> None:
    repo = FakeRepo()
    service = make_service(repo)
    user = make_user(resume_text="Saved profile resume: Python FastAPI engineer")

    result = await service.create(
        user,
        str(LOOP_ID),
        MATCH_ID,
        VacancyAnalysisCreate(analysis_type="basic"),  # no resume_text
    )

    assert result.provider == "deterministic"
    # The stored profile resume was used (hash present, raw text never stored).
    assert result.resume_hash
    assert "Saved profile resume" not in str(repo.items[0].vacancy_snapshot)


@pytest.mark.asyncio
async def test_request_resume_text_overrides_profile_resume() -> None:
    repo = FakeRepo()
    service = make_service(repo)
    user = make_user(resume_text="Stored resume")

    # Two analyses: stored-only vs request-provided should hash differently.
    stored = await service.create(
        user, str(LOOP_ID), MATCH_ID, VacancyAnalysisCreate(analysis_type="basic")
    )
    provided = await service.create(
        user,
        str(LOOP_ID),
        MATCH_ID,
        VacancyAnalysisCreate(analysis_type="basic", resume_text="Different resume"),
    )

    assert stored.resume_hash != provided.resume_hash


@pytest.mark.asyncio
async def test_missing_resume_everywhere_is_rejected() -> None:
    repo = FakeRepo()
    service = make_service(repo)

    with pytest.raises(AnalysisResumeRequiredError):
        await service.create(
            make_user(resume_text=None),
            str(LOOP_ID),
            MATCH_ID,
            VacancyAnalysisCreate(analysis_type="basic"),  # no resume anywhere
        )

    assert repo.items == []
    assert repo.usage.basic_used == 0
