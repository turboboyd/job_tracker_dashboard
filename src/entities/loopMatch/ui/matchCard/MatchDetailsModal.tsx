import React from "react";
import { useTranslation } from "react-i18next";

import { classNames } from "src/shared/lib";
import { Modal } from "src/shared/ui";

import type { LoopMatch, LoopMatchStatus } from "../../model/types";

import {
  MatchMutationActions,
  MatchOpenLinkButton,
  MatchStatusLabelPill,
  MatchStatusMenuControl,
  useMatchMeta,
} from "./matchCard.parts";

type Props = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;

  match: LoopMatch;
  loopName: string;

  busy: boolean;

  onDelete: (matchId: string) => void;
  onUpdateStatus?: (matchId: string, status: LoopMatchStatus) => void;
  onEdit?: (matchId: string) => void;
}>;

export function MatchDetailsModal({
  open,
  onOpenChange,
  match,
  loopName,
  busy,
  onDelete,
  onUpdateStatus,
  onEdit,
}: Props) {
  const { t } = useTranslation();
  const { matchedAt, platform, meta } = useMatchMeta(match, loopName);

  const title = React.useMemo(() => {
    const raw = String(match.title ?? "").trim();
    return raw ? raw : t("matches.details.untitled", { defaultValue: "Match" });
  }, [match.title, t]);

  const url = React.useMemo(() => String(match.url ?? "").trim(), [match.url]);
  const hasUrl = Boolean(url);

  const description = React.useMemo(() => String(match.description ?? "").trim(), [match.description]);
  const hasDescription = Boolean(description);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      {...(meta ? { description: meta } : {})}
      size="md"
    >
      <div className="flex flex-col gap-lg">
        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <Field label={t("matches.fields.location", { defaultValue: "Location" })} value={match.location} />
          <Field label={t("matches.fields.platform", { defaultValue: "Platform" })} value={platform} />
          <Field label={t("matches.fields.matchedAt", { defaultValue: "Matched" })} value={matchedAt} />
          <Field label={t("matches.fields.loop", { defaultValue: "Loop" })} value={loopName} />
        </div>

        {/* Description */}
        <div>
          <div className="text-sm font-semibold text-foreground">
            {t("matches.fields.description", { defaultValue: "Description" })}
          </div>
          <div
            className={classNames(
              "mt-2 rounded-xl border border-border bg-card p-md",
              "text-sm leading-relaxed whitespace-pre-wrap",
              !hasDescription && "text-muted-foreground",
            )}
          >
            {hasDescription ? description : t("matches.details.noDescription", { defaultValue: "No description." })}
          </div>
        </div>

        {/* Actions */}
        <div className={classNames("flex flex-wrap items-center justify-end gap-sm pt-sm")}>
          {/* Keep status visible, but do not duplicate the whole summary card */}
          <MatchStatusLabelPill status={match.status} />

          {hasUrl ? <MatchOpenLinkButton url={url} busy={busy} /> : null}

          <MatchStatusMenuControl
            matchId={match.id}
            status={match.status}
            busy={busy}
            onUpdateStatus={onUpdateStatus}
          />

          <MatchMutationActions
            matchId={match.id}
            busy={busy}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        </div>
      </div>
    </Modal>
  );
}

type FieldProps = Readonly<{ label: string; value: string | null | undefined }>;

function Field({ label, value }: FieldProps) {
  const v = String(value ?? "").trim();
  return (
    <div className="rounded-xl border border-border bg-card p-md">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium text-foreground whitespace-nowrap overflow-hidden text-ellipsis">
        {v || "—"}
      </div>
    </div>
  );
}
