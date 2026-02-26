import React from "react";
import { useTranslation } from "react-i18next";

import { StatusLabel, StatusMenu } from "src/entities/application/ui/StatusKit";
import { classNames } from "src/shared/lib";
import { Button, Modal } from "src/shared/ui";

import type { LoopMatch, LoopMatchStatus } from "../../model/types";

import { formatMatchedAt, normalizePlatform } from "./matchFormat";

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
  const matchedAt = React.useMemo(() => formatMatchedAt(match.matchedAt), [match.matchedAt]);

  const platform = React.useMemo(() => {
    const p = normalizePlatform(match.platform);
    return p ? p.toUpperCase() : "";
  }, [match.platform]);

  const meta = React.useMemo(() => {
    const parts = [match.location, platform, matchedAt, loopName]
      .map((v) => String(v ?? "").trim())
      .filter(Boolean);
    return parts.join(" • ");
  }, [match.location, platform, matchedAt, loopName]);

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
      description={meta || undefined}
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
          <span className="mr-auto rounded-full border border-border bg-card px-sm py-1 text-xs text-muted-foreground">
            <StatusLabel status={match.status} />
          </span>

          {hasUrl ? (
            <Button asChild variant="outline" size="sm" shape="pill" disabled={busy}>
              <a href={url} target="_blank" rel="noreferrer">
                {t("matches.common.openLink", { defaultValue: "Open link" })}
              </a>
            </Button>
          ) : null}

          {onUpdateStatus ? (
            <StatusMenu value={match.status} disabled={busy} onChange={(s) => onUpdateStatus(match.id, s)} size="sm" />
          ) : null}

          {onEdit ? (
            <Button
              variant="outline"
              size="sm"
              shape="pill"
              disabled={busy}
              onClick={() => onEdit(match.id)}
            >
              {t("matches.common.edit", { defaultValue: "Edit" })}
            </Button>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            shape="pill"
            disabled={busy}
            onClick={() => onDelete(match.id)}
          >
            {t("matches.common.delete", { defaultValue: "Delete" })}
          </Button>
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

