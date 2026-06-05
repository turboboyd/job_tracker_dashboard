export type VacancyAnalysisType = "basic" | "ai";
export type VacancyAnalysisProvider = "deterministic" | "ollama" | "openai" | "gemini" | "groq";
export type VacancyAnalysisPlan = "free" | "basic" | "premium";

export interface VacancyAnalysisCreateInput {
  analysisType: VacancyAnalysisType;
  resumeText: string;
  language?: string;
  includeCoverLetter?: boolean;
  includeInterviewQuestions?: boolean;
}

export interface VacancyAnalysisQuotaDto {
  plan: VacancyAnalysisPlan;
  basic_used: number;
  basic_limit: number;
  ai_used: number;
  ai_limit: number;
  day: string;
}

export interface VacancyAnalysisDto {
  id: string;
  loop_id: string;
  match_id: string;
  analysis_type: VacancyAnalysisType;
  provider: VacancyAnalysisProvider;
  model: string;
  plan: VacancyAnalysisPlan;
  resume_hash: string;
  vacancy_snapshot: Record<string, unknown>;
  overall_score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  risks: string[];
  recommended_cv_keywords: string[];
  application_angle: string;
  cover_letter_draft: string | null;
  interview_questions: string[];
  model_info: Record<string, unknown>;
  quota_day: string;
  created_at: string;
}

export interface VacancyAnalysisResponseDto extends VacancyAnalysisDto {
  quota: VacancyAnalysisQuotaDto;
}

export interface VacancyAnalysisListResponseDto {
  items: VacancyAnalysisDto[];
  total: number;
  limit: number;
  offset: number;
}

export interface VacancyAnalysisQuota {
  plan: VacancyAnalysisPlan;
  basicUsed: number;
  basicLimit: number;
  aiUsed: number;
  aiLimit: number;
  day: string;
}

export interface VacancyAnalysis {
  id: string;
  loopId: string;
  matchId: string;
  analysisType: VacancyAnalysisType;
  provider: VacancyAnalysisProvider;
  model: string;
  plan: VacancyAnalysisPlan;
  resumeHash: string;
  vacancySnapshot: Record<string, unknown>;
  overallScore: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  risks: string[];
  recommendedCvKeywords: string[];
  applicationAngle: string;
  coverLetterDraft: string | null;
  interviewQuestions: string[];
  modelInfo: Record<string, unknown>;
  quotaDay: string;
  createdAt: string;
  quota?: VacancyAnalysisQuota;
}

export interface VacancyAnalysisListResponse {
  items: VacancyAnalysis[];
  total: number;
  limit: number;
  offset: number;
}

export type AnalysisPlanCoverLetterFeature = "disabled" | "short_template" | "enabled";
export type AnalysisPlanPriority = "normal" | "high";

export interface AnalysisPlanReadDto {
  plan: VacancyAnalysisPlan;
  limits: {
    basic_daily_limit: number;
    ai_daily_limit: number;
  };
  features: {
    cover_letter: AnalysisPlanCoverLetterFeature;
    interview_questions: boolean;
    cv_keywords: boolean;
    multi_match_comparison: boolean;
    priority: AnalysisPlanPriority;
  };
  ai_available: boolean;
}

export interface AnalysisPlan {
  plan: VacancyAnalysisPlan;
  limits: {
    basicDailyLimit: number;
    aiDailyLimit: number;
  };
  features: {
    coverLetter: AnalysisPlanCoverLetterFeature;
    interviewQuestions: boolean;
    cvKeywords: boolean;
    multiMatchComparison: boolean;
    priority: AnalysisPlanPriority;
  };
  aiAvailable: boolean;
}
