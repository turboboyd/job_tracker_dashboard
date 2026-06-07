import { AlertTriangle, CheckCircle2, ExternalLink, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { VacancyAnalysisPanel } from "src/features/vacancyAnalysis";
import type { VacancyMatch, VacancyMatchEvaluation } from "src/features/vacancyMatches";

import {
  formatRelativeTime,
  getDuplicateLabel,
  getEvaluationVerdict,
  getMatchInitial,
  getMatchScore,
  getMatchTags,
  getSourceColor,
  getSourceLabel,
  getVacancyMetaChips,
  localizeEvaluationPenalty,
  localizeEvaluationReason,
  STATUS_PILL_LABEL,
  type MatchWithLoopName,
} from "./matchesV2.helpers";
import { useMatchEvaluation, type MatchEvaluationState } from "./useMatchEvaluation";

interface MatchesDetailPanelProps {
  item: MatchWithLoopName | null;
  isConverting: boolean;
  isIgnoring: boolean;
  isSaving: boolean;
  onConvert: (match: VacancyMatch) => void;
  onSave: (match: VacancyMatch) => void;
  onIgnore: (match: VacancyMatch) => void;
  onOpenDetails: (match: VacancyMatch) => void;
}

function AiVerdict({ score }: { score: number | null }) {
  if (score !== null && score >= 80) {
    return (
      <>
        <strong className="font-medium">Скорее да.</strong> Сильный матч по скору ({score}/100). Проверьте детали перед откликом.
      </>
    );
  }
  if (score !== null && score >= 60) {
    return (
      <>
        <strong className="font-medium">Стоит изучить.</strong> Средний матч ({score}/100). Посмотрите описание, чтобы решить.
      </>
    );
  }
  return (
    <>
      <strong className="font-medium">Изучите внимательно.</strong> Возможны расхождения с вашими фильтрами — откройте оригинал на источнике.
    </>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div className="text-[12.5px] text-foreground">{value}</div>
    </>
  );
}

function verdictToneClass(tone: "positive" | "neutral" | "caution"): string {
  if (tone === "positive") return "text-emerald-700 dark:text-emerald-300";
  if (tone === "caution") return "text-amber-700 dark:text-amber-300";
  return "text-foreground";
}

function EvaluationShell({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[10px] border border-border bg-muted/40 p-3.5">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-primary/15 text-primary">
          <Sparkles className="h-3 w-3" />
        </span>
        <span className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
          AI · стоит ли откликаться?
        </span>
      </div>
      {children}
    </div>
  );
}

function EvaluationBody({ evaluation }: { evaluation: VacancyMatchEvaluation }) {
  const verdict = getEvaluationVerdict(evaluation);
  const reasons = evaluation.reasons.map(localizeEvaluationReason);
  const penalties = evaluation.penalties.map(localizeEvaluationPenalty);
  const duplicateLabel = getDuplicateLabel(evaluation.duplicateStatus);

  return (
    <EvaluationShell>
      <p className={`mb-2 text-[12.5px] leading-relaxed ${verdictToneClass(verdict.tone)}`}>
        <strong className="font-semibold">{verdict.title}.</strong> {verdict.detail}
      </p>
      {duplicateLabel ? (
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-300/70 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-300">
          <AlertTriangle className="h-3 w-3" />
          {duplicateLabel}
        </div>
      ) : null}
      {reasons.length > 0 ? (
        <ul className="mb-1.5 flex flex-col gap-1 text-[12px] leading-relaxed text-foreground">
          {reasons.map((reason, index) => (
            <li key={`reason-${index}`} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-1.5 text-[12px] text-muted-foreground">
          Явных совпадений с фильтрами не найдено.
        </p>
      )}
      {penalties.length > 0 ? (
        <ul className="flex flex-col gap-1 text-[12px] leading-relaxed text-muted-foreground">
          {penalties.map((penalty, index) => (
            <li key={`penalty-${index}`} className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span>{penalty}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </EvaluationShell>
  );
}

function EvaluationSection({
  state,
  fallbackScore,
}: {
  state: MatchEvaluationState;
  fallbackScore: number | null;
}) {
  if (state.isLoading) {
    return (
      <EvaluationShell>
        <p className="text-[12.5px] text-muted-foreground">
          Анализируем соответствие фильтрам цикла…
        </p>
      </EvaluationShell>
    );
  }
  if (!state.data) {
    return (
      <EvaluationShell>
        <p className="text-[12.5px] leading-relaxed text-foreground">
          <AiVerdict score={fallbackScore} />
        </p>
      </EvaluationShell>
    );
  }
  return <EvaluationBody evaluation={state.data} />;
}

interface DetailActionHandlers {
  onConvert: (match: VacancyMatch) => void;
  onSave: (match: VacancyMatch) => void;
  onIgnore: (match: VacancyMatch) => void;
  onOpenDetails: (match: VacancyMatch) => void;
}

interface DetailActionFlags {
  isConverting: boolean;
  isIgnoring: boolean;
  isSaving: boolean;
}

function DetailActions({
  match,
  isPreview,
  canAct,
  sourceLabel,
  flags,
  handlers,
}: {
  match: VacancyMatch;
  isPreview: boolean;
  canAct: boolean;
  sourceLabel: string;
  flags: DetailActionFlags;
  handlers: DetailActionHandlers;
}) {
  const { isConverting, isIgnoring, isSaving } = flags;
  const { onConvert, onSave, onIgnore, onOpenDetails } = handlers;
  return (
    <div className="flex flex-wrap gap-2">
      {isPreview ? (
        <button
          type="button"
          disabled={isSaving}
          onClick={() => onSave(match)}
          className="rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground disabled:opacity-50"
        >
          {isSaving ? "Сохраняем…" : "Сохранить"}
        </button>
      ) : (
        <button
          type="button"
          disabled={!canAct || isConverting}
          onClick={() => onConvert(match)}
          className="rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground disabled:opacity-50"
        >
          {isConverting ? "Сохраняем…" : "Создать заявку"}
        </button>
      )}
      <a
        href={match.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-[12.5px] font-medium text-foreground hover:bg-muted"
      >
        Открыть на {sourceLabel}
        <ExternalLink className="h-3 w-3" />
      </a>
      {!isPreview ? (
        <button
          type="button"
          onClick={() => onOpenDetails(match)}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-[12.5px] text-foreground hover:bg-muted"
        >
          Подробнее
        </button>
      ) : null}
      {isPreview || canAct ? (
        <button
          type="button"
          disabled={isIgnoring}
          onClick={() => onIgnore(match)}
          className="rounded-md px-3 py-1.5 text-[12.5px] text-muted-foreground hover:bg-muted disabled:opacity-50"
        >
          {isIgnoring ? "…" : "Скрыть"}
        </button>
      ) : null}
    </div>
  );
}

function DetailHeader({
  item,
  isPreview,
  flags,
  handlers,
}: {
  item: MatchWithLoopName;
  isPreview: boolean;
  flags: DetailActionFlags;
  handlers: DetailActionHandlers;
}) {
  const { match, loopName } = item;
  const metaChips = getVacancyMetaChips(match);
  const sourceColor = getSourceColor(match.source);
  const sourceLabel = getSourceLabel(match.source);
  const initial = getMatchInitial(match);
  const canAct = match.status === "new" || match.status === "saved";
  const statusLabel = isPreview ? "Найдено" : STATUS_PILL_LABEL[match.status];
  const subtitle =
    [match.companyName, match.locationText].filter(Boolean).join(" · ") || loopName;

  return (
    <div className="shrink-0 border-b border-border px-5 pb-3.5 pt-4">
      <div className="mb-3 flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-[18px] font-semibold text-white"
          style={{ background: sourceColor }}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
              {statusLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10.5px] text-muted-foreground">
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 rounded-[1px]"
                style={{ background: sourceColor }}
              />
              {sourceLabel}
            </span>
          </div>
          <div className="truncate text-[16px] font-semibold leading-tight text-foreground">
            {match.roleTitle || "Без названия"}
          </div>
          <div className="mt-0.5 text-[12.5px] text-muted-foreground">{subtitle}</div>
          {metaChips.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {metaChips.map((chip) => (
                <span
                  key={chip.key}
                  title={chip.title}
                  className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {chip.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <DetailActions
        match={match}
        isPreview={isPreview}
        canAct={canAct}
        sourceLabel={sourceLabel}
        flags={flags}
        handlers={handlers}
      />
    </div>
  );
}

function ScoreCard({ score, warnings }: { score: number | null; warnings: string[] }) {
  return (
    <div className="mb-4 rounded-[10px] border border-primary/25 bg-primary/5 p-3.5">
      <div className="mb-1.5 flex items-baseline gap-2.5">
        <span className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
          Match-скор
        </span>
        <span className="text-[28px] font-semibold leading-none text-primary tabular-nums">
          {score ?? "—"}
        </span>
        {score !== null ? (
          <span className="text-[12px] text-muted-foreground">/ 100</span>
        ) : null}
      </div>
      {warnings.length > 0 ? (
        <ul className="flex flex-col gap-1.5 text-[12px] leading-relaxed text-muted-foreground">
          {warnings.slice(0, 5).map((warning, index) => (
            <li key={`${warning}-${index}`} className="flex items-start gap-2">
              <span className="mt-0.5 text-amber-600">!</span>
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-muted-foreground">
          Скор основан на совпадении ключевых навыков, локации и формата работы с фильтрами цикла.
        </p>
      )}
    </div>
  );
}

function PreviewSaveHint() {
  return (
    <div className="rounded-[10px] border border-dashed border-border bg-muted/30 p-3.5 text-[12.5px] leading-relaxed text-muted-foreground">
      Эта вакансия найдена в источнике и пока не сохранена. Нажмите «Сохранить»,
      чтобы добавить её в матчи и получить AI-оценку и подробный анализ
      соответствия.
    </div>
  );
}

function DetailBody({
  item,
  isPreview,
  evaluation,
}: {
  item: MatchWithLoopName;
  isPreview: boolean;
  evaluation: MatchEvaluationState;
}) {
  const { match, loopName } = item;
  const score = getMatchScore(match);
  const tags = getMatchTags(match);
  const sourceLabel = getSourceLabel(match.source);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
      <ScoreCard score={score} warnings={match.warnings} />

      <div className="mb-5 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-[12.5px]">
        <MetaRow label="Цикл" value={loopName} />
        <MetaRow label="Источник" value={sourceLabel} />
        {match.locationText ? <MetaRow label="Локация" value={match.locationText} /> : null}
        {match.companyName ? <MetaRow label="Компания" value={match.companyName} /> : null}
        <MetaRow label="Обновлено" value={formatRelativeTime(match.updatedAt)} />
        <MetaRow label="Добавлено" value={formatRelativeTime(match.createdAt)} />
      </div>

      {tags.length > 0 ? (
        <>
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Технологии
          </div>
          <div className="mb-5 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </>
      ) : null}

      {match.vacancyDescription ? (
        <>
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            О роли
          </div>
          <div className="mb-5 whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">
            {match.vacancyDescription}
          </div>
        </>
      ) : null}

      {isPreview ? (
        <PreviewSaveHint />
      ) : (
        <>
          <EvaluationSection state={evaluation} fallbackScore={score} />

          <VacancyAnalysisPanel loopId={match.loopId} matchId={match.id} />
        </>
      )}
    </div>
  );
}

export function MatchesDetailPanel({
  item,
  isConverting,
  isIgnoring,
  isSaving,
  onConvert,
  onSave,
  onIgnore,
  onOpenDetails,
}: MatchesDetailPanelProps) {
  const isPreview = item?.isPreview ?? false;
  // Preview rows have a synthetic id; skip the match-id-bound /evaluate call
  // (it would 404) by passing a null matchId — the hook then never fetches.
  const evaluation = useMatchEvaluation(
    isPreview ? null : item?.match.loopId ?? null,
    isPreview ? null : item?.match.id ?? null,
  );

  if (!item) {
    return (
      <div className="flex h-full items-center justify-center rounded-[14px] border border-dashed border-border bg-card p-6 text-[13px] text-muted-foreground">
        Выберите вакансию слева, чтобы посмотреть детали.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[14px] border border-border bg-card">
      <DetailHeader
        item={item}
        isPreview={isPreview}
        flags={{ isConverting, isIgnoring, isSaving }}
        handlers={{ onConvert, onSave, onIgnore, onOpenDetails }}
      />
      <DetailBody item={item} isPreview={isPreview} evaluation={evaluation} />
    </div>
  );
}
