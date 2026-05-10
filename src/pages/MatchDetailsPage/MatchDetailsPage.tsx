import React from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { AppRoutes, RoutePath } from "src/app/providers/router/routeConfig/routeConfig";
import { StatusBadge } from "src/entities/application/ui/StatusBadge/StatusBadge";
import { StatusMenu } from "src/entities/application/ui/StatusKit";
import type { LoopMatchStatus, UpdateMatchInput } from "src/entities/loopMatch";
import { formatMatchedAt, normalizePlatform } from "src/entities/loopMatch";
import { getErrorMessage } from "src/shared/lib";
import { Button, Card, PageMessage } from "src/shared/ui";

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

  const pageHeader = (
    <div className="shrink-0 border-b border-border bg-background px-7 py-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11.5px] text-subtle-foreground mb-1">
            <span>Loopboard</span>
            <span>/</span>
            <Link to={RoutePath[AppRoutes.MATCHES]} className="hover:text-foreground transition-colors">
              {t("matches.list.title", "Matches")}
            </Link>
            <span>/</span>
            <span className="text-muted-foreground">{match?.title ?? t("matches.details.title", "Match details")}</span>
          </div>
          <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
            {match?.title ?? t("matches.details.title", "Match details")}
          </h1>
          {meta ? (
            <p className="mt-1 text-[13px] text-muted-foreground">{meta}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={backTo}
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            ← {t("matches.details.backToFiltered", "Back")}
          </Link>
          {match?.url ? (
            <a
              href={match.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t("matches.details.openLink", "Open job")}
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {pageHeader}
        <div className="flex-1 overflow-y-auto bg-background p-7">
          <PageMessage>{t("matches.common.loading")}</PageMessage>
        </div>
      </div>
    );
  }

  if (mergedError) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {pageHeader}
        <div className="flex-1 overflow-y-auto bg-background p-7">
          <PageMessage>{getErrorMessage(mergedError)}</PageMessage>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {pageHeader}
        <div className="flex-1 overflow-y-auto bg-background p-7">
          <PageMessage>{t("matches.details.notFound")}</PageMessage>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {pageHeader}

      <div className="flex-1 overflow-y-auto bg-background">
      <div className="p-7">
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

                    <StatusPill status={match.status} />
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
  return (
    <label className="flex items-center justify-between gap-md text-sm">
      <span className="text-muted-foreground">{label}</span>
      <StatusMenu
        value={value}
        disabled={disabled}
        onChange={(s) => onChange(s as LoopMatchStatus)}
        size="sm"
      />
    </label>
  );
}

function StatusPill({ status }: { status: LoopMatchStatus }) {
  return <StatusBadge status={status} />;
}
