import React from "react";
import { useTranslation } from "react-i18next";

import { StatusLabel, StatusMenu } from "src/entities/application";
import { Button } from "src/shared/ui";

import type { LoopMatch, LoopMatchStatus } from "../../model/types";

import { buildMatchMeta, formatMatchedAt, formatPlatformLabel } from "./matchFormat";

type MatchId = LoopMatch["id"];
type MatchActionHandler = (matchId: MatchId) => void;
type MatchStatusHandler = (matchId: MatchId, status: LoopMatchStatus) => void;

export function useMatchMeta(match: LoopMatch, loopName: string) {
  const matchedAt = React.useMemo(
    () => formatMatchedAt(match.matchedAt),
    [match.matchedAt],
  );

  const platform = React.useMemo(
    () => formatPlatformLabel(match.platform),
    [match.platform],
  );

  const meta = React.useMemo(
    () => buildMatchMeta([match.location, platform, matchedAt, loopName]),
    [match.location, platform, matchedAt, loopName],
  );

  return { matchedAt, platform, meta };
}

interface MatchStatusMenuControlProps {
  matchId: MatchId;
  status: LoopMatchStatus;
  busy: boolean;
  onUpdateStatus?: MatchStatusHandler | undefined;
}

export function MatchStatusMenuControl({
  matchId,
  status,
  busy,
  onUpdateStatus,
}: MatchStatusMenuControlProps) {
  if (!onUpdateStatus) return null;

  return (
    <StatusMenu
      value={status}
      disabled={busy}
      onChange={(nextStatus) => onUpdateStatus(matchId, nextStatus)}
      size="sm"
    />
  );
}

interface MatchStatusLabelPillProps {
  status: LoopMatchStatus;
}

export function MatchStatusLabelPill({ status }: MatchStatusLabelPillProps) {
  return (
    <span className="mr-auto rounded-full border border-border bg-card px-sm py-1 text-xs text-muted-foreground">
      <StatusLabel status={status} />
    </span>
  );
}

interface MatchOpenLinkButtonProps {
  url: string;
  busy: boolean;
}

export function MatchOpenLinkButton({ url, busy }: MatchOpenLinkButtonProps) {
  const { t } = useTranslation();

  return (
    <Button asChild variant="outline" size="sm" shape="pill" disabled={busy}>
      <a href={url} target="_blank" rel="noreferrer">
        {t("matches.common.openLink", { defaultValue: "Open link" })}
      </a>
    </Button>
  );
}

interface MatchMutationActionsProps {
  matchId: MatchId;
  busy: boolean;
  onDelete: MatchActionHandler;
  onEdit?: MatchActionHandler | undefined;
}

export function MatchMutationActions({
  matchId,
  busy,
  onDelete,
  onEdit,
}: MatchMutationActionsProps) {
  const { t } = useTranslation();

  return (
    <>
      {onEdit ? (
        <Button
          variant="outline"
          size="sm"
          shape="pill"
          disabled={busy}
          onClick={() => onEdit(matchId)}
        >
          {t("matches.common.edit", { defaultValue: "Edit" })}
        </Button>
      ) : null}

      <Button
        variant="outline"
        size="sm"
        shape="pill"
        disabled={busy}
        onClick={() => onDelete(matchId)}
      >
        {t("matches.common.delete", { defaultValue: "Delete" })}
      </Button>
    </>
  );
}
