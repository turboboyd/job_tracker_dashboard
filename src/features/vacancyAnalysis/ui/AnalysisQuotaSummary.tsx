import type { AnalysisPlan, VacancyAnalysisQuota } from "../rest/types";

import {
  formatPlanLabel,
  formatQuotaLine,
  getFeatureAvailabilityText,
  isAiQuotaExhausted,
  VACANCY_ANALYSIS_COPY,
} from "./vacancyAnalysis.helpers";

interface AnalysisQuotaSummaryProps {
  plan: AnalysisPlan | null;
  quota?: VacancyAnalysisQuota | null;
  loadError?: string | null;
}

export function AnalysisQuotaSummary({
  plan,
  quota,
  loadError,
}: AnalysisQuotaSummaryProps) {
  const planName = plan?.plan ?? quota?.plan ?? "free";
  const basicLimit = quota?.basicLimit ?? plan?.limits.basicDailyLimit;
  const aiLimit = quota?.aiLimit ?? plan?.limits.aiDailyLimit;
  const featureLines = getFeatureAvailabilityText(plan);

  return (
    <div className="rounded-[10px] border border-border bg-background p-3 text-[12.5px] text-muted-foreground">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-foreground">
          {VACANCY_ANALYSIS_COPY.plan}: {formatPlanLabel(planName)}
        </span>
        {quota ? (
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px]">
            {VACANCY_ANALYSIS_COPY.quotaToday}
          </span>
        ) : null}
      </div>

      <div className="mt-2 grid gap-1 sm:grid-cols-2">
        {basicLimit !== undefined ? (
          <p>
            {formatQuotaLine({
              label: VACANCY_ANALYSIS_COPY.basicLabel,
              used: quota?.basicUsed,
              limit: basicLimit,
            })}
          </p>
        ) : null}
        {aiLimit !== undefined ? (
          <p>
            {formatQuotaLine({
              label: VACANCY_ANALYSIS_COPY.aiLabel,
              used: quota?.aiUsed,
              limit: aiLimit,
            })}
          </p>
        ) : null}
      </div>

      {!quota ? (
        <p className="mt-2 text-[12px]">{VACANCY_ANALYSIS_COPY.usageUpdatesAfterAnalysis}</p>
      ) : null}
      {isAiQuotaExhausted(quota) ? (
        <p className="mt-2 text-[12px] font-medium text-amber-600">
          AI-лимит на сегодня исчерпан.
        </p>
      ) : null}
      {loadError ? <p className="mt-2 text-[12px]">{loadError}</p> : null}

      <div className="mt-2 space-y-1">
        {featureLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}
