import type {
  AnalysisPlan,
  AnalysisPlanReadDto,
  VacancyAnalysis,
  VacancyAnalysisCreateInput,
  VacancyAnalysisDto,
  VacancyAnalysisListResponse,
  VacancyAnalysisListResponseDto,
  VacancyAnalysisQuota,
  VacancyAnalysisQuotaDto,
  VacancyAnalysisResponseDto,
} from "./types";

export function mapCreateVacancyAnalysisInputToDto(
  input: VacancyAnalysisCreateInput,
): Record<string, unknown> {
  return {
    analysis_type: input.analysisType,
    resume_text: input.resumeText,
    language: input.language ?? "ru",
    include_cover_letter: input.includeCoverLetter ?? false,
    include_interview_questions: input.includeInterviewQuestions ?? false,
  };
}

export function mapVacancyAnalysisQuotaDto(dto: VacancyAnalysisQuotaDto): VacancyAnalysisQuota {
  return {
    plan: dto.plan,
    basicUsed: dto.basic_used,
    basicLimit: dto.basic_limit,
    aiUsed: dto.ai_used,
    aiLimit: dto.ai_limit,
    day: dto.day,
  };
}

export function mapVacancyAnalysisDto(dto: VacancyAnalysisDto): VacancyAnalysis {
  return {
    id: dto.id,
    loopId: dto.loop_id,
    matchId: dto.match_id,
    analysisType: dto.analysis_type,
    provider: dto.provider,
    model: dto.model,
    plan: dto.plan,
    resumeHash: dto.resume_hash,
    vacancySnapshot: dto.vacancy_snapshot,
    overallScore: dto.overall_score,
    summary: dto.summary,
    strengths: dto.strengths,
    gaps: dto.gaps,
    risks: dto.risks,
    recommendedCvKeywords: dto.recommended_cv_keywords,
    applicationAngle: dto.application_angle,
    coverLetterDraft: dto.cover_letter_draft,
    interviewQuestions: dto.interview_questions,
    modelInfo: dto.model_info,
    quotaDay: dto.quota_day,
    createdAt: dto.created_at,
  };
}

export function mapVacancyAnalysisResponseDto(
  dto: VacancyAnalysisResponseDto,
): VacancyAnalysis {
  return {
    ...mapVacancyAnalysisDto(dto),
    quota: mapVacancyAnalysisQuotaDto(dto.quota),
  };
}

export function mapVacancyAnalysisListResponseDto(
  dto: VacancyAnalysisListResponseDto,
): VacancyAnalysisListResponse {
  return {
    items: dto.items.map(mapVacancyAnalysisDto),
    total: dto.total,
    limit: dto.limit,
    offset: dto.offset,
  };
}

export function mapAnalysisPlanDto(dto: AnalysisPlanReadDto): AnalysisPlan {
  return {
    plan: dto.plan,
    limits: {
      basicDailyLimit: dto.limits.basic_daily_limit,
      aiDailyLimit: dto.limits.ai_daily_limit,
    },
    features: {
      coverLetter: dto.features.cover_letter,
      interviewQuestions: dto.features.interview_questions,
      cvKeywords: dto.features.cv_keywords,
      multiMatchComparison: dto.features.multi_match_comparison,
      priority: dto.features.priority,
    },
  };
}
