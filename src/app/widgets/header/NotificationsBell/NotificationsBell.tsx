import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AlarmClock, Bell, Check, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useAuthSelectors } from "src/features/auth/model";
import {
  completeReminderInApp,
  snoozeReminderInApp,
  useActiveReminders,
  type ActiveReminder,
} from "src/features/reminders";
import { db } from "src/shared/config/firebase/firestore";
import { AppRoutes, RoutePath } from "src/shared/config/routes";
import { classNames } from "src/shared/lib";

const UPCOMING_LIMIT = 6;

function formatShort(date: Date, locale: string): string {
  const day = date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });
  const time = date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day} · ${time}`;
}

function tomorrowAt9(): Date {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(9, 0, 0, 0);
  return next;
}

function inMinutesFromNow(minutes: number): Date {
  const next = new Date();
  next.setMinutes(next.getMinutes() + minutes);
  return next;
}

interface ReminderRowProps {
  reminder: ActiveReminder;
  isOverdue: boolean;
  userId: string;
  doneLabel: string;
  text: {
    snoozeIn1Hour: string;
    snoozeIn3Hours: string;
    snoozeTomorrow: string;
    actionDone: string;
    actionSnooze: string;
    actionOpen: string;
  };
  onAfterAction: () => void;
}

function ReminderRow({
  reminder,
  isOverdue,
  userId,
  doneLabel,
  text,
  onAfterAction,
}: ReminderRowProps) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [busy, setBusy] = useState(false);

  const company = reminder.companyName.trim();
  const role = reminder.roleTitle.trim();
  const note = reminder.text.trim();

  const open = () => {
    navigate(`${RoutePath[AppRoutes.APPLICATIONS]}/${reminder.appId}`);
    onAfterAction();
  };

  const done = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await completeReminderInApp(db, userId, reminder.appId, reminder.id, doneLabel);
    } finally {
      setBusy(false);
    }
  };

  const snoozeTo = async (target: Date) => {
    if (busy) return;
    setBusy(true);
    try {
      await snoozeReminderInApp(db, userId, reminder.appId, reminder.id, target);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={classNames(
        "group flex items-start gap-3 rounded-lg border px-3 py-2",
        isOverdue
          ? "border-destructive/40 bg-destructive/5"
          : "border-border bg-card",
        busy && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className="min-w-0 flex-1 text-left"
      >
        <div className="truncate text-sm font-medium text-foreground">
          {company || role || "—"}
          {company && role ? <span className="text-muted-foreground"> · {role}</span> : null}
        </div>
        <div
          className={classNames(
            "mt-0.5 truncate text-xs",
            isOverdue ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {formatShort(reminder.dueAt, i18n.language)}
          {note ? ` · ${note}` : ""}
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={done}
          disabled={busy}
          title={text.actionDone}
          aria-label={text.actionDone}
          className={classNames(
            "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground",
            "hover:bg-muted hover:text-status-success",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <Check className="h-4 w-4" aria-hidden="true" />
        </button>

        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger asChild>
            <button
              type="button"
              disabled={busy}
              title={text.actionSnooze}
              aria-label={text.actionSnooze}
              onPointerDown={(e) => e.stopPropagation()}
              className={classNames(
                "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground",
                "hover:bg-muted hover:text-foreground",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <AlarmClock className="h-4 w-4" aria-hidden="true" />
            </button>
          </DropdownMenu.SubTrigger>
          <DropdownMenu.Portal>
            <DropdownMenu.SubContent
              sideOffset={4}
              className="z-popover min-w-[180px] rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
            >
              <DropdownMenu.Item
                disabled={busy}
                onSelect={(e) => {
                  e.preventDefault();
                  void snoozeTo(inMinutesFromNow(60));
                }}
                className="cursor-pointer rounded-md px-3 py-2 text-sm outline-none focus:bg-muted data-[highlighted]:bg-muted"
              >
                {text.snoozeIn1Hour}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                disabled={busy}
                onSelect={(e) => {
                  e.preventDefault();
                  void snoozeTo(inMinutesFromNow(3 * 60));
                }}
                className="cursor-pointer rounded-md px-3 py-2 text-sm outline-none focus:bg-muted data-[highlighted]:bg-muted"
              >
                {text.snoozeIn3Hours}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                disabled={busy}
                onSelect={(e) => {
                  e.preventDefault();
                  void snoozeTo(tomorrowAt9());
                }}
                className="cursor-pointer rounded-md px-3 py-2 text-sm outline-none focus:bg-muted data-[highlighted]:bg-muted"
              >
                {text.snoozeTomorrow}
              </DropdownMenu.Item>
            </DropdownMenu.SubContent>
          </DropdownMenu.Portal>
        </DropdownMenu.Sub>

        <button
          type="button"
          onClick={open}
          disabled={busy}
          title={text.actionOpen}
          aria-label={text.actionOpen}
          className={classNames(
            "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground",
            "hover:bg-muted hover:text-foreground",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function NotificationsBell() {
  const { t } = useTranslation();
  const { userId } = useAuthSelectors();
  const { buckets } = useActiveReminders(userId);

  const overdue = buckets.overdue;
  const upcoming = useMemo(
    () => buckets.upcoming.slice(0, UPCOMING_LIMIT),
    [buckets.upcoming],
  );

  const overdueCount = overdue.length;
  const hasAny = overdueCount > 0 || upcoming.length > 0;

  // Decide what to show on the trigger:
  //   - red badge with count when there's anything overdue
  //   - small dot when only upcoming exists
  //   - nothing when there are no reminders
  let badge: React.ReactNode = null;
  if (overdueCount > 0) {
    badge = (
      <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
        {overdueCount > 9 ? "9+" : overdueCount}
      </span>
    );
  } else if (upcoming.length > 0) {
    badge = (
      <span
        className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-status-warning"
        aria-hidden="true"
      />
    );
  }

  const labels = {
    snoozeIn1Hour: t("header.notifications.in1Hour", { defaultValue: "In 1 hour" }),
    snoozeIn3Hours: t("header.notifications.in3Hours", { defaultValue: "In 3 hours" }),
    snoozeTomorrow: t("header.notifications.tomorrow9", {
      defaultValue: "Tomorrow 09:00",
    }),
    actionDone: t("header.notifications.done", { defaultValue: "Done" }),
    actionSnooze: t("header.notifications.snooze", { defaultValue: "Snooze" }),
    actionOpen: t("header.notifications.open", { defaultValue: "Open" }),
  };

  const titleNotifications = t("header.notifications.title", {
    defaultValue: "Reminders",
  });
  const sectionOverdue = t("header.notifications.overdue", {
    defaultValue: "Overdue",
  });
  const sectionUpcoming = t("header.notifications.upcoming", {
    defaultValue: "Upcoming",
  });
  const empty = t("header.notifications.empty", {
    defaultValue: "All caught up — no pending reminders.",
  });
  const doneCommentLabel = t("header.notifications.doneComment", {
    defaultValue: "Reminder completed",
  });

  if (!userId) return null;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={titleNotifications}
          title={titleNotifications}
          className={classNames(
            "relative inline-flex h-9 w-9 items-center justify-center rounded-full",
            "text-muted-foreground transition-colors",
            "hover:bg-muted/60 hover:text-foreground",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {badge}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className={classNames(
            "z-popover w-[340px] max-w-[92vw]",
            "rounded-xl border border-border bg-popover text-popover-foreground",
            "shadow-md",
          )}
        >
          <div className="border-b border-border px-3 py-2">
            <div className="text-sm font-semibold text-foreground">
              {titleNotifications}
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {!hasAny ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                {empty}
              </div>
            ) : (
              <div className="space-y-3">
                {overdue.length > 0 ? (
                  <section className="space-y-1.5">
                    <div className="px-1 text-[11px] font-semibold uppercase tracking-wide text-destructive">
                      {sectionOverdue} · {overdueCount}
                    </div>
                    <div className="space-y-1.5">
                      {overdue.map((r) => (
                        <ReminderRow
                          key={`${r.appId}-${r.id}`}
                          reminder={r}
                          isOverdue
                          userId={userId}
                          doneLabel={doneCommentLabel}
                          text={labels}
                          onAfterAction={() => undefined}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}

                {upcoming.length > 0 ? (
                  <section className="space-y-1.5">
                    <div className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {sectionUpcoming}
                    </div>
                    <div className="space-y-1.5">
                      {upcoming.map((r) => (
                        <ReminderRow
                          key={`${r.appId}-${r.id}`}
                          reminder={r}
                          isOverdue={false}
                          userId={userId}
                          doneLabel={doneCommentLabel}
                          text={labels}
                          onAfterAction={() => undefined}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
