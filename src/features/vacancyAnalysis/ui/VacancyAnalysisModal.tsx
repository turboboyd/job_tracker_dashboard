import { useEffect, useMemo, useState } from "react";

import { Button, Modal } from "src/shared/ui";

import type {
  AnalysisPlan,
  VacancyAnalysis,
  VacancyAnalysisCreateInput,
  VacancyAnalysisType,
} from "../rest/types";

import { AnalysisQuotaSummary } from "./AnalysisQuotaSummary";
import {
  getVacancyAnalysisErrorMessage,
  VACANCY_ANALYSIS_COPY,
} from "./vacancyAnalysis.helpers";

interface VacancyAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: VacancyAnalysisCreateInput) => Promise<VacancyAnalysis>;
  onSaved: (analysis: VacancyAnalysis) => void;
  plan: AnalysisPlan | null;
  planError?: string | null;
  /** Resume saved on the user's profile, used to prefill the textarea. */
  profileResumeText?: string;
}

export function VacancyAnalysisModal({
  open,
  onOpenChange,
  onSubmit,
  onSaved,
  plan,
  planError,
  profileResumeText,
}: VacancyAnalysisModalProps) {
  const [analysisType, setAnalysisType] = useState<VacancyAnalysisType>("basic");
  const [resumeText, setResumeText] = useState("");
  const [includeCoverLetter, setIncludeCoverLetter] = useState(false);
  const [includeInterviewQuestions, setIncludeInterviewQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasProfileResume = (profileResumeText ?? "").trim().length > 0;
  // Submit is allowed when the user typed something OR a profile resume exists
  // (the backend falls back to the saved resume when the field is empty).
  const canSubmit = useMemo(
    () => (resumeText.trim().length > 0 || hasProfileResume) && !isSubmitting,
    [resumeText, hasProfileResume, isSubmitting],
  );
  const canRequestInterviewQuestions = plan?.features.interviewQuestions ?? true;
  // Only force-disable AI once we actually know the server can't do it. While the
  // plan is still loading (null) we leave it enabled and let the backend reject.
  const aiUnavailable = plan ? !plan.aiAvailable : false;

  useEffect(() => {
    if (!canRequestInterviewQuestions) {
      setIncludeInterviewQuestions(false);
    }
  }, [canRequestInterviewQuestions]);

  useEffect(() => {
    if (aiUnavailable && analysisType === "ai") {
      setAnalysisType("basic");
    }
  }, [aiUnavailable, analysisType]);

  // Prefill the textarea with the saved profile resume each time the modal
  // opens, unless the user has already typed something in this session.
  useEffect(() => {
    if (!open) return;
    setResumeText((current) =>
      current.trim().length > 0 ? current : profileResumeText ?? "",
    );
  }, [open, profileResumeText]);

  async function handleSubmit() {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const analysis = await onSubmit({
        analysisType,
        resumeText,
        language: "ru",
        includeCoverLetter,
        includeInterviewQuestions,
      });
      onSaved(analysis);
      setResumeText("");
      setIncludeCoverLetter(false);
      setIncludeInterviewQuestions(false);
      onOpenChange(false);
    } catch (submitError: unknown) {
      setError(getVacancyAnalysisErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={VACANCY_ANALYSIS_COPY.action}
      description="Сохранённая вакансия будет оценена по тексту резюме."
      size="lg"
    >
      <div className="space-y-5">
        <div className="rounded-[10px] border border-border bg-muted/25 p-3 text-[12.5px] text-muted-foreground">
          <p>{VACANCY_ANALYSIS_COPY.privacy}</p>
          <p className="mt-1">{VACANCY_ANALYSIS_COPY.historySaved}</p>
        </div>

        <AnalysisQuotaSummary
          plan={plan}
          loadError={
            planError
              ? "Не удалось загрузить план. Анализ всё равно можно запустить."
              : null
          }
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="rounded-[10px] border border-border bg-background p-3">
            <span className="flex items-start gap-2">
              <input
                type="radio"
                name="vacancy-analysis-type"
                value="basic"
                checked={analysisType === "basic"}
                onChange={() => setAnalysisType("basic")}
                className="mt-1"
              />
              <span>
                <span className="block text-[13px] font-semibold text-foreground">
                  {VACANCY_ANALYSIS_COPY.basicLabel}
                </span>
                <span className="mt-1 block text-[12px] text-muted-foreground">
                  {VACANCY_ANALYSIS_COPY.basicDescription}
                </span>
              </span>
            </span>
          </label>

          <label
            className={`rounded-[10px] border border-border bg-background p-3${
              aiUnavailable ? " opacity-60" : ""
            }`}
          >
            <span className="flex items-start gap-2">
              <input
                type="radio"
                name="vacancy-analysis-type"
                value="ai"
                checked={analysisType === "ai"}
                disabled={aiUnavailable}
                onChange={() => setAnalysisType("ai")}
                className="mt-1"
              />
              <span>
                <span className="block text-[13px] font-semibold text-foreground">
                  {VACANCY_ANALYSIS_COPY.aiLabel}
                </span>
                <span className="mt-1 block text-[12px] text-muted-foreground">
                  {aiUnavailable
                    ? VACANCY_ANALYSIS_COPY.aiUnavailableNote
                    : VACANCY_ANALYSIS_COPY.aiDescription}
                </span>
              </span>
            </span>
          </label>
        </div>

        <label className="block">
          <span className="text-[13px] font-medium text-foreground">
            {VACANCY_ANALYSIS_COPY.resumeLabel}
          </span>
          <textarea
            value={resumeText}
            onChange={(event) => setResumeText(event.target.value)}
            maxLength={20_000}
            rows={10}
            className="mt-2 min-h-[220px] w-full resize-y rounded-[10px] border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            placeholder={VACANCY_ANALYSIS_COPY.resumePlaceholder}
          />
          {hasProfileResume ? (
            <span className="mt-1 block text-[12px] text-muted-foreground">
              {resumeText.trim().length > 0
                ? VACANCY_ANALYSIS_COPY.resumeProfileHint
                : VACANCY_ANALYSIS_COPY.resumeProfileFallbackHint}
            </span>
          ) : null}
        </label>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-start gap-2 rounded-[10px] border border-border bg-background p-3 text-[12.5px] text-muted-foreground">
            <input
              type="checkbox"
              checked={includeCoverLetter}
              onChange={(event) => setIncludeCoverLetter(event.target.checked)}
              className="mt-0.5"
            />
            <span>Короткое сопроводительное письмо</span>
          </label>
          <label className="flex items-start gap-2 rounded-[10px] border border-border bg-background p-3 text-[12.5px] text-muted-foreground">
            <input
              type="checkbox"
              checked={includeInterviewQuestions}
              disabled={!canRequestInterviewQuestions}
              onChange={(event) => setIncludeInterviewQuestions(event.target.checked)}
              className="mt-0.5"
            />
            <span>
              Вопросы для интервью
              {!canRequestInterviewQuestions ? (
                <span className="mt-1 block text-[12px]">
                  Доступны в платных планах.
                </span>
              ) : null}
            </span>
          </label>
        </div>

        {error ? (
          <div className="rounded-[10px] border border-destructive/30 bg-destructive/10 p-3 text-[13px] text-destructive">
            {error}
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? "Анализируем..." : VACANCY_ANALYSIS_COPY.action}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
