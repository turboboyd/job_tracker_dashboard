from __future__ import annotations

import re
from dataclasses import dataclass

from app.db.models.loop import Loop
from app.db.models.vacancy_match import VacancyMatch
from app.modules.vacancy_analysis.policy import PlanPolicy

_WORD_RE = re.compile(r"[a-zA-Zа-яА-ЯёЁ0-9+#.-]{3,}")


@dataclass(frozen=True)
class AnalysisProviderResult:
    provider: str
    model: str
    overall_score: int
    summary: str
    strengths: list[str]
    gaps: list[str]
    risks: list[str]
    recommended_cv_keywords: list[str]
    application_angle: str
    cover_letter_draft: str | None
    interview_questions: list[str]
    model_info: dict


def extract_keywords(text: str, *, limit: int = 20) -> list[str]:
    seen: set[str] = set()
    keywords: list[str] = []
    for match in _WORD_RE.finditer(text.lower()):
        word = match.group(0).strip(".-")
        if word in seen or len(word) < 3:
            continue
        seen.add(word)
        keywords.append(word)
        if len(keywords) >= limit:
            break
    return keywords


class DeterministicAnalysisProvider:
    provider = "deterministic"
    model = "deterministic-v1"

    def analyze(
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
        vacancy_text = " ".join(
            value or ""
            for value in (
                match.role_title,
                match.company_name,
                match.location_text,
                match.vacancy_description,
            )
        )
        resume_keywords = extract_keywords(resume_text, limit=40)
        vacancy_keywords = extract_keywords(vacancy_text, limit=40)
        loop_keywords = [str(item).lower() for item in (loop.keywords or [])]
        excluded = [str(item).lower() for item in (loop.excluded_keywords or [])]

        matched_resume = [kw for kw in vacancy_keywords if kw in resume_keywords]
        matched_loop = [kw for kw in loop_keywords if kw and kw in vacancy_text.lower()]
        excluded_hits = [kw for kw in excluded if kw and kw in vacancy_text.lower()]

        score = 35
        score += min(len(matched_resume) * 5, 30)
        score += min(len(matched_loop) * 7, 20)
        if loop.target_role and match.role_title and loop.target_role.lower() in match.role_title.lower():
            score += 10
        if loop.location and match.location_text and loop.location.lower() in match.location_text.lower():
            score += 5
        score -= min(len(excluded_hits) * 15, 30)
        score = max(0, min(100, score))

        strengths = [f"Resume keyword matches vacancy: {kw}" for kw in matched_resume[:5]]
        strengths += [f"Loop keyword appears in vacancy: {kw}" for kw in matched_loop[:5]]
        if not strengths:
            strengths = ["The vacancy can be reviewed against the saved resume profile."]

        gaps = [
            f"Vacancy keyword not found in resume: {kw}"
            for kw in vacancy_keywords
            if kw not in resume_keywords
        ][:5]
        risks = [f"Excluded keyword appears in vacancy: {kw}" for kw in excluded_hits]

        recommended = [kw for kw in vacancy_keywords if kw not in resume_keywords][:8]
        title = match.role_title or "this role"
        company = match.company_name or "the company"

        cover_letter = None
        if include_cover_letter and (plan.cover_letter or plan.short_cover_letter_template):
            cover_letter = (
                f"I am interested in {title} at {company}. "
                "My experience aligns with the role requirements, and I would welcome "
                "the opportunity to discuss the fit."
            )

        questions: list[str] = []
        if include_interview_questions and plan.interview_questions:
            questions = [
                f"Which experience best demonstrates fit for {title}?",
                "What project result should be highlighted first?",
                "Which requirement needs a stronger CV example?",
            ]

        return AnalysisProviderResult(
            provider=self.provider,
            model=self.model,
            overall_score=score,
            summary=(
                f"Deterministic {analysis_type} analysis found "
                f"{len(matched_resume)} resume keyword match(es) and "
                f"{len(excluded_hits)} risk keyword(s)."
            ),
            strengths=strengths,
            gaps=gaps,
            risks=risks,
            recommended_cv_keywords=recommended if plan.cv_keywords else [],
            application_angle=f"Position the application around concrete fit for {title}.",
            cover_letter_draft=cover_letter,
            interview_questions=questions,
            model_info={
                "provider": self.provider,
                "mode": "deterministic",
                "model": self.model,
                "language": language,
                "external_call": False,
            },
        )
