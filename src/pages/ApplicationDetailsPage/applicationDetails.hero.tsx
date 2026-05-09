import { ArrowLeft, CalendarClock, ExternalLink, Sparkles } from "lucide-react";

import { StatusLabel } from "src/entities/application";
import type { ApplicationDoc, ProcessStatus } from "src/features/applications";
import { classNames } from "src/shared/lib";
import { Button } from "src/shared/ui/Button";

import { STATUS_BUTTONS, formatTs, toStatusKey } from "./applicationDetails.helpers";
import type { ApplicationDetailsText } from "./applicationDetails.text";

interface ApplicationDetailsHeroProps {
  app: ApplicationDoc | null;
  isMutating: boolean;
  onBack: () => void;
  onChangeStatus: (next: ProcessStatus) => void;
  onEditNextAction: () => void;
  text: ApplicationDetailsText;
  title: string;
}

function HeroBackLink({
  onBack,
  text,
}: {
  onBack: () => void;
  text: ApplicationDetailsText;
}) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
      {text.back}
    </button>
  );
}

function HeroTitleBlock({
  app,
  text,
  title,
}: {
  app: ApplicationDoc | null;
  text: ApplicationDetailsText;
  title: string;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <h1 className="truncate text-2xl font-semibold leading-tight text-foreground">
        {title || text.titleFallback}
      </h1>
      {app?.job.companyName ? (
        <div className="text-sm text-muted-foreground">{app.job.companyName}</div>
      ) : null}
      {app?.job.vacancyUrl ? (
        <a
          href={app.job.vacancyUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex max-w-full items-center gap-1.5 truncate text-xs font-medium text-primary hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{text.openVacancy}</span>
        </a>
      ) : null}
    </div>
  );
}

function HeroBadgeRow({
  app,
  text,
}: {
  app: ApplicationDoc | null;
  text: ApplicationDetailsText;
}) {
  if (!app) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {app.priority ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          {text.priority}: {app.priority.score}
        </span>
      ) : null}
      {app.job.source ? (
        <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          {text.source}: {app.job.source}
        </span>
      ) : null}
    </div>
  );
}

function StatusQuickChange({
  activeStatus,
  disabled,
  onChangeStatus,
  text,
}: {
  activeStatus: ProcessStatus | undefined;
  disabled: boolean;
  onChangeStatus: (next: ProcessStatus) => void;
  text: ApplicationDetailsText;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {text.changeStatus}
      </span>
      <div className="flex flex-wrap gap-1">
        {STATUS_BUTTONS.map((status) => {
          const isActive = activeStatus === status;
          return (
            <button
              key={status}
              type="button"
              disabled={disabled}
              onClick={() => onChangeStatus(status)}
              className={classNames(
                "inline-flex items-center rounded-full border px-2.5 h-6 text-[11px] font-medium transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-60",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted",
              )}
            >
              <StatusLabel status={toStatusKey(status)} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NextActionCallout({
  app,
  onEditNextAction,
  text,
}: {
  app: ApplicationDoc | null;
  onEditNextAction: () => void;
  text: ApplicationDetailsText;
}) {
  const plannedAt = formatTs(app?.process.nextActionAt);
  const note = app?.process.nextActionText?.trim();
  const hasPlan = Boolean(plannedAt);
  const remindersCount = app?.process.reminders?.length ?? 0;
  const additionalCount = remindersCount > 1 ? remindersCount - 1 : 0;

  return (
    <div
      className={classNames(
        "flex flex-wrap items-start gap-3 rounded-lg border p-3",
        hasPlan
          ? "border-amber-200 bg-amber-50/70 dark:border-amber-800/40 dark:bg-amber-950/20"
          : "border-dashed border-border bg-muted/40",
      )}
    >
      <div
        className={classNames(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          hasPlan
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            : "bg-muted text-muted-foreground",
        )}
      >
        <CalendarClock className="h-4 w-4" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <div
          className={classNames(
            "text-[11px] font-semibold uppercase tracking-wide",
            hasPlan
              ? "text-amber-700 dark:text-amber-300"
              : "text-muted-foreground",
          )}
        >
          {hasPlan ? text.nextActionCalloutPlanned : text.nextAction}
        </div>
        {hasPlan ? (
          <div className="mt-0.5 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-foreground">{plannedAt}</span>
              {additionalCount > 0 ? (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  +{additionalCount} more
                </span>
              ) : null}
            </div>
            {note ? (
              <div className="text-sm text-muted-foreground">{note}</div>
            ) : null}
          </div>
        ) : (
          <div className="mt-0.5 text-sm text-muted-foreground">
            {text.nextActionCalloutEmpty}
          </div>
        )}
      </div>

      <Button
        size="sm"
        variant={hasPlan ? "outline" : "default"}
        shape="pill"
        className="shrink-0"
        onClick={onEditNextAction}
      >
        {hasPlan ? text.editNextAction : text.nextActionCalloutCta}
      </Button>
    </div>
  );
}

export function ApplicationDetailsHero({
  app,
  isMutating,
  onBack,
  onChangeStatus,
  onEditNextAction,
  text,
  title,
}: ApplicationDetailsHeroProps) {
  const isStatusChangeDisabled = !app || isMutating;

  return (
    <div className="space-y-md rounded-xl border border-border bg-card p-md shadow-sm">
      <HeroBackLink onBack={onBack} text={text} />

      <div className="flex flex-wrap items-start justify-between gap-md">
        <HeroTitleBlock app={app} text={text} title={title} />

        <div className="flex flex-col items-start gap-2 sm:items-end">
          {app ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              <StatusLabel status={toStatusKey(app.process.status)} />
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {text.emptyValue}
            </span>
          )}
          <HeroBadgeRow app={app} text={text} />
        </div>
      </div>

      <NextActionCallout
        app={app}
        onEditNextAction={onEditNextAction}
        text={text}
      />

      <StatusQuickChange
        activeStatus={app?.process.status}
        disabled={isStatusChangeDisabled}
        onChangeStatus={onChangeStatus}
        text={text}
      />
    </div>
  );
}
