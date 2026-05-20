import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AlarmClock, CalendarClock, CalendarPlus, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ApplicationDoc } from "src/features/applications";
import { classNames } from "src/shared/lib";
import { buildIcsCalendar, downloadIcsFile } from "src/shared/lib/calendar";
import { Button } from "src/shared/ui/Button";
import { Card } from "src/shared/ui/Card";

import {
  formatReminderShort,
  formatTs,
  resolveReminderDate,
  validateReminderInputs,
} from "./applicationDetails.helpers";
import {
  OutcomeWizard,
  type OutcomeWizardSubmit,
} from "./applicationDetails.outcomeWizard";
import {
  DetailsCardTitle,
  DetailsMutedMessage,
} from "./applicationDetails.primitives";
import {
  ReminderModal,
  type ReminderDraft,
} from "./applicationDetails.reminderModal";
import type { ApplicationDetailsText } from "./applicationDetails.text";
import type { ReminderRow } from "./useApplicationDetailsController";

export interface PlanContactOption {
  id: string;
  label: string;
}

interface ApplicationPlanCardProps {
  app: ApplicationDoc | null;
  appId: string | undefined;
  isMutating: boolean;
  reminders: ReminderRow[];
  contactOptions?: PlanContactOption[] | undefined;
  onUpsertReminder: (row: ReminderRow) => void;
  onRemoveReminder: (id: string) => void;
  onCompleteReminder: (id: string, doneLabel: string) => void;
  onSnoozeReminder: (id: string, minutesFromNow: number) => void;
  onSnoozeReminderTo: (id: string, target: Date) => void;
  onApplyOutcome: (rowId: string, payload: OutcomeWizardSubmit) => void;
  buildEmptyRow: () => ReminderRow;
  text: ApplicationDetailsText;
}

function getPlanTextOrFallback(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  return trimmed;
}

function buildPlanDescription({
  app,
  appUrl,
  reminderText,
  text,
}: {
  app: ApplicationDoc;
  appUrl: string;
  reminderText: string;
  text: ApplicationDetailsText;
}): string {
  return [
    `${text.role}: ${getPlanTextOrFallback(app.job.roleTitle, text.titleFallback)}`,
    `${text.company}: ${getPlanTextOrFallback(app.job.companyName, text.emptyValue)}`,
    reminderText.trim() ? `${text.nextActionNote}: ${reminderText.trim()}` : "",
    `${text.calendarLink}: ${appUrl}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function tomorrowAt9From(now: Date): Date {
  const next = new Date(now);
  next.setDate(now.getDate() + 1);
  next.setHours(9, 0, 0, 0);
  return next;
}

function SnoozeMenu({
  isMutating,
  onSnoozeMinutes,
  onSnoozeTomorrow,
  text,
}: {
  isMutating: boolean;
  onSnoozeMinutes: (minutes: number) => void;
  onSnoozeTomorrow: () => void;
  text: ApplicationDetailsText;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button
          size="sm"
          variant="ghost"
          shape="md"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          disabled={isMutating}
          title={text.reminderActionSnooze}
          aria-label={text.reminderActionSnooze}
        >
          <AlarmClock className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className={classNames(
            "z-popover min-w-[180px]",
            "rounded-lg border border-border bg-popover text-popover-foreground",
            "shadow-md p-1",
          )}
        >
          <DropdownMenu.Item
            disabled={isMutating}
            onSelect={(e) => {
              e.preventDefault();
              onSnoozeMinutes(60);
            }}
            className="px-3 py-2 text-sm rounded-md outline-none cursor-pointer focus:bg-muted data-[highlighted]:bg-muted"
          >
            {text.reminderSnoozeIn1Hour}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            disabled={isMutating}
            onSelect={(e) => {
              e.preventDefault();
              onSnoozeMinutes(60 * 3);
            }}
            className="px-3 py-2 text-sm rounded-md outline-none cursor-pointer focus:bg-muted data-[highlighted]:bg-muted"
          >
            {text.reminderSnoozeIn3Hours}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            disabled={isMutating}
            onSelect={(e) => {
              e.preventDefault();
              onSnoozeTomorrow();
            }}
            className="px-3 py-2 text-sm rounded-md outline-none cursor-pointer focus:bg-muted data-[highlighted]:bg-muted"
          >
            {text.reminderSnoozeTomorrow}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function ReminderListItem({
  row,
  isMutating,
  onEdit,
  onRemove,
  onComplete,
  onSnoozeMinutes,
  onSnoozeTomorrow,
  text,
  locale,
}: {
  row: ReminderRow;
  isMutating: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onComplete: () => void;
  onSnoozeMinutes: (minutes: number) => void;
  onSnoozeTomorrow: () => void;
  text: ApplicationDetailsText;
  locale: string;
}) {
  const validation = useMemo(
    () => validateReminderInputs(row.date, row.time),
    [row.date, row.time],
  );

  // Resolve actual date even when in the past, so we can show overdue UI.
  const resolved = useMemo(
    () => resolveReminderDate(row.date, row.time),
    [row.date, row.time],
  );

  const isOverdue = validation.code === "in_past" && resolved !== null;
  const isInvalid =
    validation.code !== "ok" && validation.code !== "in_past";

  const stateLabel = (() => {
    if (resolved && (validation.code === "ok" || validation.code === "in_past")) {
      return formatReminderShort(resolved, locale);
    }
    return text.reminderErrorInvalidFormat;
  })();

  let containerStyle: string;
  let dotStyle: string;
  let labelStyle: string;
  if (isOverdue) {
    containerStyle = "border-destructive/50 bg-destructive/5";
    dotStyle = "bg-destructive/15 text-destructive";
    labelStyle = "text-destructive";
  } else if (isInvalid) {
    containerStyle = "border-destructive/30 bg-destructive/5";
    dotStyle = "bg-destructive/10 text-destructive";
    labelStyle = "text-destructive";
  } else {
    containerStyle = "border-border bg-card";
    dotStyle = "bg-muted text-muted-foreground";
    labelStyle = "text-foreground";
  }

  return (
    <div
      className={classNames(
        "group flex items-center gap-3 rounded-lg border px-3 py-2",
        "transition-colors hover:bg-muted/40",
        containerStyle,
      )}
    >
      <div
        className={classNames(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          dotStyle,
        )}
      >
        <CalendarClock className="h-4 w-4" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <div
          className={classNames(
            "flex items-center gap-1.5 truncate text-sm font-medium",
            labelStyle,
          )}
        >
          <span className="truncate">{stateLabel}</span>
          {isOverdue ? (
            <span className="inline-flex shrink-0 items-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive-foreground">
              {text.reminderOverdue}
            </span>
          ) : null}
        </div>
        {row.text.trim() ? (
          <div className="truncate text-xs text-muted-foreground">{row.text}</div>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          shape="md"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-status-success"
          onClick={onComplete}
          disabled={isMutating}
          title={text.reminderActionDone}
          aria-label={text.reminderActionDone}
        >
          <Check className="h-4 w-4" aria-hidden="true" />
        </Button>
        <SnoozeMenu
          isMutating={isMutating}
          onSnoozeMinutes={onSnoozeMinutes}
          onSnoozeTomorrow={onSnoozeTomorrow}
          text={text}
        />
        <Button
          size="sm"
          variant="ghost"
          shape="md"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          onClick={onEdit}
          disabled={isMutating}
          title={text.planEditAria}
          aria-label={text.planEditAria}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          shape="md"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          disabled={isMutating}
          title={text.planDeleteAria}
          aria-label={text.planDeleteAria}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

export function ApplicationPlanCard({
  app,
  appId,
  isMutating,
  reminders,
  contactOptions,
  onUpsertReminder,
  onRemoveReminder,
  onCompleteReminder: _onCompleteReminder,
  onSnoozeReminder,
  onSnoozeReminderTo,
  onApplyOutcome,
  buildEmptyRow,
  text,
}: ApplicationPlanCardProps) {
  void _onCompleteReminder;
  const { i18n } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [outcomeRowId, setOutcomeRowId] = useState<string | null>(null);

  const plannedAt = formatTs(app?.process.nextActionAt);
  const totalReminders = reminders.length;

  const editingRow = useMemo(
    () => (editingId ? reminders.find((r) => r.id === editingId) ?? null : null),
    [editingId, reminders],
  );

  const initialDraft: ReminderDraft | null = editingRow
    ? { date: editingRow.date, time: editingRow.time, text: editingRow.text }
    : null;

  const handleAddClick = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const handleEditClick = (id: string) => {
    setEditingId(id);
    setModalOpen(true);
  };

  const handleSubmit = (draft: ReminderDraft) => {
    const id = editingId ?? buildEmptyRow().id;
    onUpsertReminder({
      id,
      date: draft.date,
      time: draft.time,
      text: draft.text,
    });
  };

  // For ICS export: only the rows that resolve to a valid date
  const exportableReminders = reminders
    .map((row) => {
      const result = validateReminderInputs(row.date, row.time);
      return result.code === "ok" && result.date ? { row, at: result.date } : null;
    })
    .filter((entry): entry is { row: ReminderRow; at: Date } => entry !== null);

  const isExportDisabled = !app || !appId || exportableReminders.length === 0;

  const exportPlan = () => {
    if (!app || !appId || exportableReminders.length === 0) return;

    const roleTitle = getPlanTextOrFallback(app.job.roleTitle, text.titleFallback);
    const companyName = getPlanTextOrFallback(app.job.companyName, text.emptyValue);
    const appUrl = window.location.href;

    const contents = buildIcsCalendar({
      title: text.plan,
      events: exportableReminders.map(({ row, at }) => ({
        description: buildPlanDescription({
          app,
          appUrl,
          reminderText: row.text,
          text,
        }),
        location: app.job.locationText,
        startsAt: at,
        title: `${text.nextAction}: ${roleTitle} / ${companyName}`,
        uid: `${appId}-${at.getTime()}@job-tracker-dashboard`,
        url: appUrl,
      })),
    });

    const earliestDate = exportableReminders[0]?.row.date ?? "plan";
    downloadIcsFile(
      `application-plan-${earliestDate}-${roleTitle}-${companyName}.ics`,
      contents,
    );
  };

  return (
    <Card padding="md" shadow="sm" className="space-y-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <DetailsCardTitle>{text.plan}</DetailsCardTitle>
          {totalReminders > 0 ? (
            <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground">
              {totalReminders}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {plannedAt ? (
            <span className="hidden items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline-flex">
              <CalendarClock className="h-3 w-3" aria-hidden="true" />
              {plannedAt}
              {totalReminders > 1 ? ` · +${totalReminders - 1}` : ""}
            </span>
          ) : null}
          <Button
            size="sm"
            shape="pill"
            className="gap-1"
            onClick={handleAddClick}
            disabled={!app || isMutating}
            title={text.planAddAria}
            aria-label={text.planAddAria}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{text.addReminder}</span>
          </Button>
        </div>
      </div>

      {!app ? (
        <DetailsMutedMessage>{text.notFound}</DetailsMutedMessage>
      ) : reminders.length === 0 ? (
        <DetailsMutedMessage>{text.planEmpty}</DetailsMutedMessage>
      ) : (
        <div className="space-y-1.5">
          {reminders.map((row) => (
            <ReminderListItem
              key={row.id}
              row={row}
              isMutating={isMutating}
              onEdit={() => handleEditClick(row.id)}
              onRemove={() => onRemoveReminder(row.id)}
              onComplete={() => {
                setOutcomeRowId(row.id);
                setOutcomeOpen(true);
              }}
              onSnoozeMinutes={(minutes) => onSnoozeReminder(row.id, minutes)}
              onSnoozeTomorrow={() => onSnoozeReminderTo(row.id, tomorrowAt9From(new Date()))}
              text={text}
              locale={i18n.language}
            />
          ))}
        </div>
      )}

      {!isExportDisabled ? (
        <div className="flex justify-end pt-1">
          <Button
            size="sm"
            variant="outline"
            shape="pill"
            className="gap-2"
            onClick={exportPlan}
          >
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            {text.exportPlan}
          </Button>
        </div>
      ) : null}

      <ReminderModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingId(null);
        }}
        initial={initialDraft}
        onSubmit={handleSubmit}
        text={text}
      />

      <OutcomeWizard
        open={outcomeOpen}
        onOpenChange={(open) => {
          setOutcomeOpen(open);
          if (!open) setOutcomeRowId(null);
        }}
        contactOptions={contactOptions}
        onSubmit={(payload) => {
          if (outcomeRowId) onApplyOutcome(outcomeRowId, payload);
        }}
        text={text}
      />
    </Card>
  );
}
