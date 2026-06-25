import { Eye } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  getMatchInitial,
  getMatchScore,
  getMatchTags,
  getSourceColor,
  getSourceLabel,
  getVacancyMetaChips,
  isMatchSeen,
  type MatchWithLoopName,
} from "./matchesV2.helpers";

function getScoreTone(score: number): string {
  if (score >= 85) {
    return "border-emerald-300/70 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-300";
  }
  if (score >= 70) {
    return "border-amber-300/70 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-300";
  }
  return "border-border bg-muted text-muted-foreground";
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <div className="flex h-8 w-10 items-center justify-center rounded-md border border-border bg-muted text-[10px] text-muted-foreground">
        —
      </div>
    );
  }
  const tone = getScoreTone(score);
  return (
    <div
      className={`flex h-8 w-10 items-center justify-center rounded-md border text-[12.5px] font-semibold tabular-nums ${tone}`}
    >
      {score}
    </div>
  );
}

export function MatchListItem({
  item,
  isActive,
  onSelect,
}: {
  item: MatchWithLoopName;
  isActive: boolean;
  onSelect: (matchId: string) => void;
}) {
  const { t } = useTranslation();
  const { match, loopName } = item;
  const seen = isMatchSeen(match);
  // Backend-owned score (matchesV2.helpers.getMatchScore reads match.score; the
  // frontend never computes a score). Drives the row badge + the "Топ-матч" flag.
  const score = getMatchScore(match);
  const tags = getMatchTags(match);
  const metaChips = getVacancyMetaChips(match).slice(0, 3);
  const sourceColor = getSourceColor(match.source);
  const sourceLabel = getSourceLabel(match.source);
  const initial = getMatchInitial(match);

  return (
    <button
      type="button"
      onClick={() => onSelect(match.id)}
      className={[
        "block w-full border-l-2 px-4 py-3.5 text-left transition-colors",
        isActive
          ? "border-primary bg-muted/50"
          : "border-transparent hover:bg-muted/30",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[12px] font-semibold text-white"
          style={{ background: sourceColor }}
        >
          {initial}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-[13.5px] font-medium text-foreground">
              {match.roleTitle || t("matches.item.untitled", "Untitled")}
            </span>
            {seen ? (
              <span
                title={t("matches.item.seen", "Viewed")}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10.5px] text-muted-foreground"
              >
                <Eye className="h-3 w-3" />
                {t("matches.item.seen", "Viewed")}
              </span>
            ) : null}
            {match.status === "saved" ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] text-muted-foreground">
                {t("matches.matchStatus.saved", "Saved")}
              </span>
            ) : null}
            {match.status === "converted" ? (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10.5px] text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {t("matches.matchStatus.converted", "Application created")}
              </span>
            ) : null}
            {match.status === "new" && score !== null && score >= 90 ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-medium text-primary">
                ★ {t("matches.item.topMatch", "Top match")}
              </span>
            ) : null}
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-muted-foreground">
            {match.companyName ? (
              <span className="font-medium text-foreground/80">{match.companyName}</span>
            ) : null}
            {match.locationText ? <span>· {match.locationText}</span> : null}
            <span className="inline-flex items-center gap-1">
              ·
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 rounded-[1px]"
                style={{ background: sourceColor }}
              />
              {sourceLabel}
            </span>
            <span className="text-muted-foreground/70">· {loopName}</span>
          </div>

          {metaChips.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {metaChips.map((chip) => (
                <span
                  key={chip.key}
                  title={chip.title}
                  className="rounded border border-border/70 bg-muted/40 px-1.5 py-0.5 text-[10.5px] text-muted-foreground"
                >
                  {chip.label}
                </span>
              ))}
            </div>
          ) : null}

          {tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10.5px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 4 ? (
                <span className="text-[10.5px] text-muted-foreground/70">+{tags.length - 4}</span>
              ) : null}
            </div>
          ) : null}
        </div>

        <ScoreBadge score={score} />
      </div>
    </button>
  );
}
