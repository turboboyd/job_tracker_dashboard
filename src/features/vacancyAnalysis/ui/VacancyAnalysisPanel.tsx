import { useEffect, useMemo, useState } from "react";

import { getCurrentUserProfileViaRest } from "src/features/userProfile";
import { Button } from "src/shared/ui";

import {
  createVacancyAnalysisViaRest,
  getCurrentAnalysisPlanViaRest,
  getLatestVacancyAnalysisViaRest,
  listVacancyAnalysesViaRest,
} from "../rest/queries";
import type { AnalysisPlan, VacancyAnalysis, VacancyAnalysisCreateInput } from "../rest/types";

import { AnalysisQuotaSummary } from "./AnalysisQuotaSummary";
import {
  formatAnalysisType,
  formatQuota,
  getVacancyAnalysisErrorMessage,
  VACANCY_ANALYSIS_COPY,
} from "./vacancyAnalysis.helpers";
import { VacancyAnalysisModal } from "./VacancyAnalysisModal";

interface VacancyAnalysisPanelProps {
  loopId: string;
  matchId: string;
}

function SectionList({ title, items }: { title: string; items: readonly string[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="text-[12px] font-semibold text-foreground">{title}</div>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-[12.5px] text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function AnalysisResult({ analysis }: { analysis: VacancyAnalysis }) {
  const quota = formatQuota(analysis);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
          {formatAnalysisType(analysis.analysisType)}
        </span>
        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
          {analysis.provider} / {analysis.model}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
        <div className="rounded-[10px] border border-border bg-card p-3 text-center">
          <div className="text-[11px] text-muted-foreground">{VACANCY_ANALYSIS_COPY.score}</div>
          <div className="mt-1 text-[28px] font-semibold text-foreground">
            {analysis.overallScore}
          </div>
        </div>
        <div className="rounded-[10px] border border-border bg-card p-3 text-[12.5px] text-muted-foreground">
          <div className="text-[12px] font-semibold text-foreground">Резюме анализа</div>
          <p className="mt-1">{analysis.summary}</p>
          {quota ? <p className="mt-2 text-[12px] text-muted-foreground">{quota}</p> : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SectionList title={VACANCY_ANALYSIS_COPY.strengths} items={analysis.strengths} />
        <SectionList title={VACANCY_ANALYSIS_COPY.gaps} items={analysis.gaps} />
        <SectionList title={VACANCY_ANALYSIS_COPY.risks} items={analysis.risks} />
      </div>

      <SectionList
        title={VACANCY_ANALYSIS_COPY.cvKeywords}
        items={analysis.recommendedCvKeywords}
      />

      {analysis.applicationAngle ? (
        <div className="rounded-[10px] border border-border bg-card p-3">
          <div className="text-[12px] font-semibold text-foreground">
            {VACANCY_ANALYSIS_COPY.applicationAngle}
          </div>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            {analysis.applicationAngle}
          </p>
        </div>
      ) : null}

      {analysis.coverLetterDraft ? (
        <div className="rounded-[10px] border border-border bg-card p-3">
          <div className="text-[12px] font-semibold text-foreground">
            {VACANCY_ANALYSIS_COPY.coverLetter}
          </div>
          <p className="mt-1 whitespace-pre-wrap text-[12.5px] text-muted-foreground">
            {analysis.coverLetterDraft}
          </p>
        </div>
      ) : null}

      <SectionList
        title={VACANCY_ANALYSIS_COPY.interviewQuestions}
        items={analysis.interviewQuestions}
      />
    </div>
  );
}

export function VacancyAnalysisPanel({ loopId, matchId }: VacancyAnalysisPanelProps) {
  const [latest, setLatest] = useState<VacancyAnalysis | null>(null);
  const [history, setHistory] = useState<VacancyAnalysis[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisPlan, setAnalysisPlan] = useState<AnalysisPlan | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [profileResumeText, setProfileResumeText] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadLatest() {
      setIsLoading(true);
      setError(null);
      try {
        const analysis = await getLatestVacancyAnalysisViaRest(loopId, matchId);
        if (!cancelled) setLatest(analysis);
      } catch (loadError: unknown) {
        if (!cancelled) setError(getVacancyAnalysisErrorMessage(loadError));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadLatest();

    return () => {
      cancelled = true;
    };
  }, [loopId, matchId]);

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      setPlanError(null);
      try {
        const plan = await getCurrentAnalysisPlanViaRest();
        if (!cancelled) setAnalysisPlan(plan);
      } catch {
        if (!cancelled) {
          setAnalysisPlan(null);
          setPlanError("Не удалось загрузить план. Использование обновится после анализа.");
        }
      }
    }

    loadPlan();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProfileResume() {
      try {
        const profile = await getCurrentUserProfileViaRest();
        if (!cancelled) setProfileResumeText(profile.resumeText ?? "");
      } catch {
        // A missing/failed profile resume is non-blocking: the user can still
        // paste a resume directly into the modal.
        if (!cancelled) setProfileResumeText("");
      }
    }

    loadProfileResume();

    return () => {
      cancelled = true;
    };
  }, []);

  const historySummary = useMemo(() => {
    if (history.length === 0) return "История анализа";
    return `История анализа (${history.length})`;
  }, [history.length]);

  async function handleCreate(input: VacancyAnalysisCreateInput): Promise<VacancyAnalysis> {
    return createVacancyAnalysisViaRest(loopId, matchId, input);
  }

  function handleSaved(analysis: VacancyAnalysis) {
    setLatest(analysis);
    setHistory((current) => [analysis, ...current.filter((item) => item.id !== analysis.id)]);
  }

  async function handleToggleHistory() {
    const nextOpen = !isHistoryOpen;
    setIsHistoryOpen(nextOpen);
    if (!nextOpen || history.length > 0) return;

    setIsHistoryLoading(true);
    setError(null);
    try {
      const response = await listVacancyAnalysesViaRest(loopId, matchId, { limit: 20, offset: 0 });
      setHistory(response.items);
    } catch (historyError: unknown) {
      setError(getVacancyAnalysisErrorMessage(historyError));
    } finally {
      setIsHistoryLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-[12px] border border-border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[13px] font-semibold text-foreground">
            {VACANCY_ANALYSIS_COPY.action}
          </div>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {latest ? "Последний сохранённый анализ вакансии." : VACANCY_ANALYSIS_COPY.emptyBody}
          </p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          {VACANCY_ANALYSIS_COPY.action}
        </Button>
      </div>

      {isLoading ? (
        <p className="mt-3 text-[12.5px] text-muted-foreground">Загружаем анализ...</p>
      ) : null}

      <div className="mt-3">
        <AnalysisQuotaSummary
          plan={analysisPlan}
          quota={latest?.quota}
          loadError={planError}
        />
      </div>

      {error ? (
        <div className="mt-3 rounded-[10px] border border-border bg-background p-3 text-[12.5px] text-muted-foreground">
          {error}
        </div>
      ) : null}

      {!isLoading && !latest ? (
        <div className="mt-3 rounded-[10px] border border-dashed border-border bg-background p-3 text-[12.5px] text-muted-foreground">
          <p className="font-medium text-foreground">{VACANCY_ANALYSIS_COPY.emptyTitle}</p>
          <p className="mt-1">{VACANCY_ANALYSIS_COPY.privacy}</p>
        </div>
      ) : null}

      {latest ? (
        <div className="mt-3">
          <AnalysisResult analysis={latest} />
          <button
            type="button"
            onClick={handleToggleHistory}
            className="mt-3 text-[12px] font-medium text-primary hover:underline"
          >
            {historySummary}
          </button>
          {isHistoryOpen ? (
            <div className="mt-2 rounded-[10px] border border-border bg-background p-3">
              {isHistoryLoading ? (
                <p className="text-[12.5px] text-muted-foreground">Загружаем историю...</p>
              ) : null}
              {!isHistoryLoading && history.length === 0 ? (
                <p className="text-[12.5px] text-muted-foreground">История пока пуста.</p>
              ) : null}
              {!isHistoryLoading && history.length > 0 ? (
                <ul className="space-y-1 text-[12.5px] text-muted-foreground">
                  {history.map((item) => (
                    <li key={item.id}>
                      {new Date(item.createdAt).toLocaleString("ru-RU")} ·{" "}
                      {formatAnalysisType(item.analysisType)} · {item.overallScore}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <VacancyAnalysisModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreate}
        onSaved={handleSaved}
        plan={analysisPlan}
        planError={planError}
        profileResumeText={profileResumeText}
      />
    </div>
  );
}
