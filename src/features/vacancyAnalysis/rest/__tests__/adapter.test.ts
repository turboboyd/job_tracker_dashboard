import assert from "node:assert/strict";

import {
  mapAnalysisPlanDto,
  mapCreateVacancyAnalysisInputToDto,
  mapVacancyAnalysisDto,
  mapVacancyAnalysisResponseDto,
} from "../adapter";
import type { VacancyAnalysisDto, VacancyAnalysisResponseDto } from "../types";

function dto(overrides: Partial<VacancyAnalysisDto> = {}): VacancyAnalysisDto {
  return {
    id: "analysis-1",
    loop_id: "loop-1",
    match_id: "match-1",
    analysis_type: "basic",
    provider: "deterministic",
    model: "deterministic-v1",
    plan: "free",
    resume_hash: "hash-1",
    vacancy_snapshot: { title: "Frontend Engineer" },
    overall_score: 72,
    summary: "Good fit",
    strengths: ["React"],
    gaps: ["Docker"],
    risks: ["Limited German details"],
    recommended_cv_keywords: ["TypeScript"],
    application_angle: "Lead with UI delivery",
    cover_letter_draft: null,
    interview_questions: ["Why this team?"],
    model_info: { mode: "deterministic" },
    quota_day: "2026-05-14",
    created_at: "2026-05-14T10:00:00Z",
    ...overrides,
  };
}

assert.deepEqual(
  mapCreateVacancyAnalysisInputToDto({
    analysisType: "ai",
    resumeText: "CV text",
    includeCoverLetter: true,
    includeInterviewQuestions: true,
  }),
  {
    analysis_type: "ai",
    resume_text: "CV text",
    language: "ru",
    include_cover_letter: true,
    include_interview_questions: true,
  },
);

const mapped = mapVacancyAnalysisDto(dto());
assert.equal(mapped.loopId, "loop-1");
assert.equal(mapped.matchId, "match-1");
assert.equal(mapped.analysisType, "basic");
assert.equal(mapped.resumeHash, "hash-1");
assert.equal(mapped.overallScore, 72);
assert.deepEqual(mapped.recommendedCvKeywords, ["TypeScript"]);
assert.equal(mapped.coverLetterDraft, null);
assert.deepEqual(mapped.interviewQuestions, ["Why this team?"]);

const responseDto: VacancyAnalysisResponseDto = {
  ...dto({ analysis_type: "ai" }),
  quota: {
    plan: "free",
    basic_used: 2,
    basic_limit: 10,
    ai_used: 1,
    ai_limit: 1,
    day: "2026-05-14",
  },
};

assert.deepEqual(mapVacancyAnalysisResponseDto(responseDto).quota, {
  plan: "free",
  basicUsed: 2,
  basicLimit: 10,
  aiUsed: 1,
  aiLimit: 1,
  day: "2026-05-14",
});

assert.deepEqual(
  mapAnalysisPlanDto({
    plan: "premium",
    limits: {
      basic_daily_limit: 300,
      ai_daily_limit: 100,
    },
    features: {
      cover_letter: "enabled",
      interview_questions: true,
      cv_keywords: true,
      multi_match_comparison: true,
      priority: "high",
    },
  }),
  {
    plan: "premium",
    limits: {
      basicDailyLimit: 300,
      aiDailyLimit: 100,
    },
    features: {
      coverLetter: "enabled",
      interviewQuestions: true,
      cvKeywords: true,
      multiMatchComparison: true,
      priority: "high",
    },
  },
);
