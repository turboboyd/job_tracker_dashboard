import React from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { AppRoutes, RoutePath } from "src/app/providers/router/routeConfig/routeConfig";
import type { LoopMatchStatus, UpdateMatchInput } from "src/entities/loopMatch";
import { formatMatchedAt, normalizePlatform } from "src/entities/loopMatch";
import { classNames, getErrorMessage } from "src/shared/lib";
import { Button, Card, PageHeader, PageMessage } from "src/shared/ui";

import { EditMatchModal } from "../MatchesPage/components/EditMatchModal";
import { useMatchesDerived } from "../MatchesPage/model/useMatchesDerived";
import { useMatchesMutations } from "../MatchesPage/model/useMatchesMutations";
import { useMatchesQueries } from "../MatchesPage/model/useMatchesQueries";


export default function MatchDetailsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const matchId = String(params.matchId ?? "");

  const backTo = React.useMemo(() => {
    const from = location?.state?.from;
    if (from?.pathname) {
      return `${from.pathname}${from.search ?? ""}`;
    }
    return RoutePath[AppRoutes.MATCHES];
  }, [location]);

  const { matchesQ, loopsQ, matches, loops } = useMatchesQueries();
  const { busy, actions } = useMatchesMutations();
  const { loopIdToName } = useMatchesDerived(matches, loops);

  const [editingId, setEditingId] = React.useState<string | null>(null);

  const match = React.useMemo(() => {
    if (!matchId) return null;
    return matches.find((m) => m.id === matchId) ?? null;
  }, [matches, matchId]);

  const loopName = React.useMemo(() => {
    if (!match) return "";
    return loopIdToName.get(match.loopId) ?? "";
  }, [match, loopIdToName]);

  const editingMatch = React.useMemo(() => {
    if (!editingId) return null;
    return matches.find((m) => m.id === editingId) ?? null;
  }, [editingId, matches]);

  const onDelete = React.useCallback(async () => {
    if (!match) return;
    await actions.onDelete(match.id, match.loopId);
    navigate(RoutePath[AppRoutes.MATCHES], { replace: true });
  }, [actions, match, navigate]);

  const onUpdateStatus = React.useCallback(
    async (status: LoopMatchStatus) => {
      if (!match) return;
      await actions.onUpdateStatus(match.id, match.loopId, status);
    },
    [actions, match],
  );

  const onSaveEdit = React.useCallback(
    async (id: string, patch: UpdateMatchInput["patch"]) => {
      await actions.onSaveEdit(id, patch);
      setEditingId(null);
    },
    [actions],
  );

  const loading = matchesQ.isLoading || loopsQ.isLoading;
  const error = matchesQ.isError ? matchesQ.error : null;
  const loopsError = loopsQ.isError ? loopsQ.error : null;
  const mergedError = error ?? loopsError;

  const matchedAt = match?.matchedAt ? formatMatchedAt(match.matchedAt) : "";
  const platform = (() => {
    const p = normalizePlatform(match?.platform);
    return p ? p.toUpperCase() : "";
  })();
  const meta = (() => {
    const parts = [match?.location, platform, matchedAt, loopName]
      .map((v) => String(v ?? "").trim())
      .filter(Boolean);
    return parts.join(" • ");
  })();

  const header = (
    <PageHeader
      title={t("matches.details.title")}
      subtitle={t("matches.details.subtitle")}
      right={
        <div className="flex items-center gap-sm">
          <Link to={backTo}>
            <Button variant="outline" size="sm" shape="pill">
              {t("matches.details.backToFiltered")}
            </Button>
          </Link>
        </div>
      }
    />
  );

  if (loading) {
    return (
      <div className="w-full">
        {header}
        <div className="pt-lg">
          <PageMessage>{t("matches.common.loading")}</PageMessage>
        </div>
      </div>
    );
  }

  if (mergedError) {
    return (
      <div className="w-full">
        {header}
        <div className="pt-lg">
          <PageMessage>{getErrorMessage(mergedError)}</PageMessage>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="w-full">
        {header}
        <div className="pt-lg">
          <PageMessage>{t("matches.details.notFound")}</PageMessage>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {header}

      <div className="pt-lg">
        <div className="grid grid-cols-1 gap-lg lg:grid-cols-[1.2fr_0.8fr]">
            <div className="min-w-0 space-y-lg">
              <Card variant="default" padding="md" shadow="sm" className="w-full">
                <div className="flex flex-col gap-md">
                  <div className="flex items-start justify-between gap-md">
                    <div className="min-w-0">
                      <div className="text-lg font-semibold text-foreground break-words">
                        {match.title || "—"}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground break-words">
                        {match.company || "—"}
                      </div>
                      {meta ? (
                        <div className="mt-2 text-xs text-muted-foreground break-words">
                          {meta}
                        </div>
                      ) : null}
                    </div>

                    <span
                      className={classNames(
                        "inline-flex items-center rounded-full px-sm py-[2px] text-xs font-medium",
                        getStatusPalette(match.status),
                      )}
                    >
                      {t(`matches.status.${match.status}`)}
                    </span>
                  </div>

                  {match.url ? (
                    <a
                      href={match.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline break-all"
                    >
                      {t("matches.details.openLink")}
                    </a>
                  ) : null}
                </div>
              </Card>

              <Card variant="default" padding="md" shadow="sm" className="w-full">
                <div className="text-base font-semibold text-foreground">
                  {t("matches.details.descriptionTitle")}
                </div>
                <div className="mt-sm text-sm leading-relaxed whitespace-pre-wrap">
                  {match.description || t("matches.details.noDescription")}
                </div>
              </Card>
            </div>

            <div className="space-y-lg">
              <Card variant="default" padding="md" shadow="sm" className="w-full">
                <div className="text-base font-semibold text-foreground">
                  {t("matches.details.actionsTitle")}
                </div>

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
                      onClick={() => setEditingId(match.id)}
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
              </Card>

              <Card variant="default" padding="md" shadow="sm" className="w-full">
                <div className="text-base font-semibold text-foreground">
                  {t("matches.details.metaTitle")}
                </div>

                <dl className="mt-md grid grid-cols-1 gap-sm text-sm">
                  <MetaRow label={t("matches.details.fields.loop")} value={loopName || "—"} />
                  <MetaRow label={t("matches.details.fields.location")} value={match.location || "—"} />
                  <MetaRow label={t("matches.details.fields.platform")} value={platform || "—"} />
                  <MetaRow label={t("matches.details.fields.matchedAt")} value={matchedAt || "—"} />
                </dl>
              </Card>
            </div>
        </div>
      </div>

      <EditMatchModal
        open={Boolean(editingMatch)}
        busy={busy}
        loopName={editingMatch ? loopIdToName.get(editingMatch.loopId) ?? "" : ""}
        match={editingMatch}
        onClose={() => setEditingId(null)}
        onSave={onSaveEdit}
      />
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-md">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground text-right break-words">{value}</dd>
    </div>
  );
}

const STATUS_OPTIONS = [
  "new",
  "saved",
  "interview",
  "offer",
  "applied",
  "rejected",
] as const satisfies readonly LoopMatchStatus[];

function StatusSelect({
  value,
  disabled,
  label,
  onChange,
}: {
  value: LoopMatchStatus;
  disabled: boolean;
  label: string;
  onChange: (next: LoopMatchStatus) => void;
}) {
  const { t } = useTranslation();

  const options = STATUS_OPTIONS;

  return (
    <label className="flex items-center justify-between gap-md text-sm">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as LoopMatchStatus)}
        className="h-9 rounded-full px-sm border border-border bg-card text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {options.map((s) => (
          <option key={s} value={s}>
            {t(`matches.status.${s}`)}
          </option>
        ))}
      </select>
    </label>
  );
}

function getStatusPalette(status: LoopMatchStatus) {
  switch (status) {
    case "new":
      return "bg-info text-info-foreground";
    case "saved":
      return "bg-secondary text-secondary-foreground";
    case "applied":
      return "bg-muted text-foreground";
    case "interview":
      return "bg-warning text-warning-foreground";
    case "offer":
      return "bg-success text-success-foreground";
    case "rejected":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-muted text-foreground";
  }
}
