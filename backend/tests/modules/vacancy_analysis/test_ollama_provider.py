from __future__ import annotations

import json
from types import SimpleNamespace
from uuid import uuid4

import httpx
import pytest

from app.modules.vacancy_analysis.policy import PLAN_POLICIES
from app.modules.vacancy_analysis.providers_ollama import (
    OllamaAnalysisProvider,
    OllamaProviderInvalidResponse,
    OllamaProviderTimeout,
    OllamaProviderUnavailable,
    build_ollama_messages,
)


def make_loop(**overrides):
    data = {
        "target_role": "Backend Engineer",
        "location": "Berlin",
        "keywords": ["Python"],
        "excluded_keywords": ["contract"],
        "employment_types": ["full_time"],
        "work_modes": ["remote"],
        "selected_sources": ["manual_url"],
    }
    data.update(overrides)
    return SimpleNamespace(**data)


def make_match(**overrides):
    data = {
        "id": uuid4(),
        "role_title": "Python Backend Engineer",
        "company_name": "Acme GmbH",
        "location_text": "Berlin",
        "source_url": "https://example.com/job",
        "source": "manual_url",
        "vacancy_description": "Build Python APIs.",
    }
    data.update(overrides)
    return SimpleNamespace(**data)


@pytest.mark.asyncio
async def test_ollama_json_response_is_parsed() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/api/chat"
        body = json.loads(request.content)
        assert body["model"] == "llama-test"
        return httpx.Response(
            200,
            json={
                "message": {
                    "content": json.dumps(
                        {
                            "overall_score": 81,
                            "summary": "Strong fit.",
                            "strengths": ["Python"],
                            "gaps": ["Kubernetes"],
                            "risks": [],
                            "recommended_cv_keywords": ["FastAPI"],
                            "application_angle": "Lead with backend API work.",
                            "cover_letter_draft": "Dear team...",
                            "interview_questions": ["Tell us about APIs."],
                        }
                    )
                }
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        result = await OllamaAnalysisProvider(
            base_url="http://ollama.local",
            model="llama-test",
            timeout_seconds=5,
            client=client,
        ).analyze(
            loop=make_loop(),
            match=make_match(),
            resume_text="Python FastAPI backend engineer",
            language="ru",
            plan=PLAN_POLICIES["basic"],
            analysis_type="ai",
            include_cover_letter=True,
            include_interview_questions=True,
        )

    assert result.provider == "ollama"
    assert result.model == "llama-test"
    assert result.overall_score == 81
    assert result.model_info["mode"] == "local_llm"
    assert result.model_info["external_call"] is False
    assert result.cover_letter_draft == "Dear team..."
    assert result.interview_questions == ["Tell us about APIs."]


@pytest.mark.asyncio
async def test_invalid_ollama_response_is_safe_error() -> None:
    async with httpx.AsyncClient(
        transport=httpx.MockTransport(lambda _request: httpx.Response(200, json={"message": {"content": "no json"}}))
    ) as client:
        provider = OllamaAnalysisProvider(
            base_url="http://ollama.local",
            model="llama-test",
            timeout_seconds=5,
            client=client,
        )
        with pytest.raises(OllamaProviderInvalidResponse):
            await provider.analyze(
                loop=make_loop(),
                match=make_match(),
                resume_text="Python",
                language="ru",
                plan=PLAN_POLICIES["free"],
                analysis_type="ai",
                include_cover_letter=False,
                include_interview_questions=False,
            )


@pytest.mark.asyncio
async def test_ollama_http_error_is_unavailable() -> None:
    async with httpx.AsyncClient(
        transport=httpx.MockTransport(lambda _request: httpx.Response(500))
    ) as client:
        provider = OllamaAnalysisProvider(
            base_url="http://ollama.local",
            model="llama-test",
            timeout_seconds=5,
            client=client,
        )
        with pytest.raises(OllamaProviderUnavailable):
            await provider.analyze(
                loop=make_loop(),
                match=make_match(),
                resume_text="Python",
                language="ru",
                plan=PLAN_POLICIES["free"],
                analysis_type="ai",
                include_cover_letter=False,
                include_interview_questions=False,
            )


def test_ollama_timeout_error_type_exists() -> None:
    assert issubclass(OllamaProviderTimeout, Exception)


def test_prompt_builder_keeps_json_only_contract() -> None:
    messages = build_ollama_messages(
        loop=make_loop(),
        match=make_match(),
        resume_text="Python resume",
        language="ru",
        plan=PLAN_POLICIES["free"],
        include_cover_letter=True,
        include_interview_questions=True,
    )

    assert messages[0]["role"] == "system"
    assert "Return JSON only" in messages[0]["content"]
    payload = json.loads(messages[1]["content"])
    assert payload["instructions"]["cover_letter_allowed"] is True
    assert payload["instructions"]["interview_questions_allowed"] is False
