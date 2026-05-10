import { useTranslation } from "react-i18next";

import type { LoopMatch, LoopMatchStatus } from "src/entities/loopMatch";
import { Button } from "src/shared/ui";

import { MatchDetailsPanel } from "./MatchDetailsPanel";
import { StatusSelect } from "./StatusSelect";

interface Props {
  match: LoopMatch;
  busy: boolean;
  onUpdateStatus: (next: LoopMatchStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function MatchDetailsActionsCard({
  match,
  busy,
  onUpdateStatus,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useTranslation();

  return (
    <MatchDetailsPanel title={t("matches.details.actionsTitle")}>
      <div className="mt-md flex flex-col gap-md">
        <StatusSelect
          value={match.status}
          disabled={busy}
          label={t("matches.common.status")}
          onChange={onUpdateStatus}
        />

        <div className="flex flex-wrap gap-sm">
          <Button
            variant="outline"
            size="sm"
            shape="pill"
            disabled={busy}
            onClick={onEdit}
          >
            {t("matches.common.edit")}
          </Button>

          <Button
            variant="outline"
            size="sm"
            shape="pill"
            disabled={busy}
            onClick={onDelete}
          >
            {t("matches.common.delete")}
          </Button>
        </div>
      </div>
    </MatchDetailsPanel>
  );
}
