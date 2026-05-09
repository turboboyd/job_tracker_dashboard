import { useTranslation } from "react-i18next";

import { StatusBadge } from "src/entities/application";
import { Card } from "src/shared/ui";

import type { LoopMatch, LoopMatchStatus } from "../../model/types";

import {
  MatchMutationActions,
  MatchStatusMenuControl,
  useMatchMeta,
} from "./matchCard.parts";

interface MatchCardProps {
  match: LoopMatch;
  loopName: string;
  busy: boolean;
  onUpdateStatus: (matchId: LoopMatch["id"], status: LoopMatchStatus) => void;
  onDelete: (matchId: LoopMatch["id"]) => void;
  onEdit?: (matchId: LoopMatch["id"]) => void;
}

export function MatchCard({
  match,
  loopName,
  busy,
  onUpdateStatus,
  onDelete,
  onEdit,
}: MatchCardProps) {
  const { t } = useTranslation();
  const { meta } = useMatchMeta(match, loopName);

  return (
    <Card variant="default" padding="md" shadow="sm" className="flex flex-col gap-sm">
      <div className="flex items-start justify-between gap-md">
        <div className="min-w-0">
          <div className="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-sm">
            <span className="font-semibold text-foreground">{match.title || "—"}</span>
            <span className="ml-2 text-muted-foreground">{match.company || "—"}</span>
          </div>

          {meta ? (
            <div className="mt-1 text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
              {meta}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-sm">
          <StatusPill value={match.status} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-sm pt-xs">
        <label className="flex items-center gap-sm text-sm">
          <span className="text-muted-foreground">{t("matches.common.status")}</span>
          <MatchStatusMenuControl
            matchId={match.id}
            status={match.status}
            busy={busy}
            onUpdateStatus={onUpdateStatus}
          />
        </label>

        <div className="flex items-center gap-sm">
          <MatchMutationActions
            matchId={match.id}
            busy={busy}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </div>
      </div>
    </Card>
  );
}

interface StatusPillProps {
  value: LoopMatchStatus;
}

function StatusPill({ value }: StatusPillProps) {
  return <StatusBadge status={value} />;
}
