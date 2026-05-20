from __future__ import annotations

import json
from typing import Any

import httpx

from app.db.models.loop import Loop
from app.db.models.vacancy_match import VacancyMatch
from app.modules.vacancy_analysis.policy import PlanPolicy
from app.modules.vacancy_analysis.providers import AnalysisProviderResult


class OllamaProviderError(Exception):
    """Base class for safe provider errors."""


class OllamaProviderUnavailable(OllamaProviderError):
    pass


class OllamaProviderTimeout(OllamaProviderError):
    pass


class OllamaProviderInvalidResponse(OllamaProviderError):
    pass


class OllamaProviderNotConfigured(OllamaProviderError):
    pass


class OllamaAnalysisProvider:
    provider = "ollama"

    def __init__(
        self,
        *,
        base_url: str,
        model: str,
        timeout_seconds: int,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout_seconds = timeout_seconds
        self._client = client

    async def analyze(
        self,
        *,
        loop: Loop,
        match: VacancyMatch,
        resume_text: str,
        language: str,
        plan: PlanPolicy,
        analysis_type: str,
        include_cover_letter: bool,
        include_interview_questions: bool,
    ) -> AnalysisProviderResult:
        if not self.base_url or not self.model:
            raise OllamaProviderNotConfigured()

        payload = {
            "model": self.model,
            "stream": False,
            "messages": build_ollama_messages(
                loop=loop,
                match=match,
                resume_text=resume_text,
                language=language,
                plan=plan,
                include_cover_letter=include_cover_letter,
                include_interview_questions=include_interview_questions,
            ),
            "options": {"temperature": 0.2},
        }
        data = await self._post_chat(payload)
        content = _extract_message_content(data)
        parsed = _parse_json_content(content)
        return _result_from_payload(
            parsed,
            model=self.model,
            language=language,
            plan=plan,
            analysis_type=analysis_type,
            include_cover_letter=include_cover_letter,
            include_interview_questions=include_interview_questions,
        )

    async def _post_chat(self, payload: dict[str, Any]) -> dict[str, Any]:
        url = f"{self.base_url}/api/chat"
        try:
            if self._client is not None:
                response = await self._client.post(url, json=payload)
            else:
                async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                    response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
        except httpx.TimeoutException as exc:
            raise OllamaProviderTimeout() from exc
        except (httpx.HTTPStatusError, httpx.RequestError) as exc:
            raise OllamaProviderUnavailable() from exc
        except ValueError as exc:
            raise OllamaProviderInvalidResponse() from exc

        if not isinstance(data, dict):
            raise OllamaProviderInvalidResponse()
        return data


def build_ollama_messages(
    *,
    loop: Loop,
    match: VacancyMatch,
    resume_text: str,
    language: str,
    plan: PlanPolicy,
    include_cover_letter: bool,
    include_interview_questions: bool,
) -> list[dict[str, str]]:
    allowed_cover_letter = include_cover_letter and (
        plan.cover_letter or plan.short_cover_letter_template
    )
    allowed_questions = include_interview_questions and plan.interview_questions
    vacancy = {
        "title": match.role_title,
        "company": match.company_name,
        "location": match.location_text,
        "source": match.source,
        "description": match.vacancy_description,
    }
    loop_settings = {
        "target_role": loop.target_role,
        "location": loop.location,
        "keywords": loop.keywords or [],
        "excluded_keywords": loop.excluded_keywords or [],
        "employment_types": loop.employment_types or [],
        "work_modes": loop.work_modes or [],
        "selected_sources": loop.selected_sources or [],
    }
    instructions = {
        "language": language,
        "cover_letter_allowed": allowed_cover_letter,
        "interview_questions_allowed": allowed_questions,
        "score_range": "integer 0..100",
        "output": {
            "overall_score": 0,
            "summary": "",
            "strengths": [],
            "gaps": [],
            "risks": [],
            "recommended_cv_keywords": [],
            "application_angle": "",
            "cover_letter_draft": None,
            "interview_questions": [],
        },
    }
    return [
        {
            "role": "system",
            "content": (
                "You analyze a saved vacancy against a resume. Return JSON only. "
                "Do not use markdown fences. Do not invent facts. If information is "
                "missing, state uncertainty. Respect the requested language and the "
                "feature flags. The score must be an integer from 0 to 100."
            ),
        },
        {
            "role": "user",
            "content": json.dumps(
                {
                    "instructions": instructions,
                    "loop_settings": loop_settings,
                    "vacancy": vacancy,
                    "resume_text": resume_text,
                },
                ensure_ascii=False,
            ),
        },
    ]


def _extract_message_content(data: dict[str, Any]) -> str:
    message = data.get("message")
    if isinstance(message, dict) and isinstance(message.get("content"), str):
        return message["content"]
    if isinstance(data.get("response"), str):
        return data["response"]
    raise OllamaProviderInvalidResponse()


def _parse_json_content(content: str) -> dict[str, Any]:
    cleaned = content.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`").strip()
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise OllamaProviderInvalidResponse() from exc
    if not isinstance(parsed, dict):
        raise OllamaProviderInvalidResponse()
    return parsed


def _result_from_payload(
    payload: dict[str, Any],
    *,
    model: str,
    language: str,
    plan: PlanPolicy,
    analysis_type: str,
    include_cover_letter: bool,
    include_interview_questions: bool,
) -> AnalysisProviderResult:
    cover_letter_allowed = include_cover_letter and (
        plan.cover_letter or plan.short_cover_letter_template
    )
    questions_allowed = include_interview_questions and plan.interview_questions
    return AnalysisProviderResult(
        provider="ollama",
        model=model,
        overall_score=_bounded_score(payload.get("overall_score")),
        summary=_string_field(payload.get("summary"), "Analysis completed by local provider."),
        strengths=_string_list(payload.get("strengths")),
        gaps=_string_list(payload.get("gaps")),
        risks=_string_list(payload.get("risks")),
        recommended_cv_keywords=(
            _string_list(payload.get("recommended_cv_keywords")) if plan.cv_keywords else []
        ),
        application_angle=_string_field(
            payload.get("application_angle"),
            "Use the strongest relevant experience from the resume.",
        ),
        cover_letter_draft=(
            _nullable_string(payload.get("cover_letter_draft")) if cover_letter_allowed else None
        ),
        interview_questions=(
            _string_list(payload.get("interview_questions")) if questions_allowed else []
        ),
        model_info={
            "provider": "ollama",
            "mode": "local_llm",
            "model": model,
            "language": language,
            "analysis_type": analysis_type,
            "external_call": False,
            "local_provider": True,
        },
    )


def _bounded_score(value: Any) -> int:
    if not isinstance(value, int):
        raise OllamaProviderInvalidResponse()
    if value < 0 or value > 100:
        raise OllamaProviderInvalidResponse()
    return value


def _string_field(value: Any, fallback: str) -> str:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return fallback


def _nullable_string(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        normalized = value.strip()
        return normalized or None
    return None


def _string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    result: list[str] = []
    for item in value:
        if isinstance(item, str) and item.strip():
            result.append(item.strip())
    return result[:12]
