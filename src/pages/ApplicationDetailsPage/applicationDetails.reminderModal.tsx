import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";

import { classNames } from "src/shared/lib";
import { Button } from "src/shared/ui/Button";
import { Input } from "src/shared/ui/Form/Input";
import { Modal } from "src/shared/ui/Modal/Modal";

import {
  REMINDER_PRESETS,
  formatDateInput,
  formatTimeInput,
  startOfDay,
  validateReminderInputs,
  type ReminderPresetId,
} from "./applicationDetails.helpers";
import type { ApplicationDetailsText } from "./applicationDetails.text";

export interface ReminderDraft {
  date: string;
  time: string;
  text: string;
}

interface ReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, popup operates in "edit" mode. */
  initial?: ReminderDraft | null;
  onSubmit: (next: ReminderDraft) => void;
  text: ApplicationDetailsText;
}

const DEFAULT_HOUR = 9;
const DEFAULT_MINUTE = 0;

function emptyDraft(): ReminderDraft {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(DEFAULT_HOUR, DEFAULT_MINUTE, 0, 0);
  return {
    date: formatDateInput(tomorrow),
    time: formatTimeInput(tomorrow),
    text: "",
  };
}

export function ReminderModal({
  open,
  onOpenChange,
  initial,
  onSubmit,
  text,
}: ReminderModalProps) {
  const { i18n } = useTranslation();
  const [draft, setDraft] = useState<ReminderDraft>(() => initial ?? emptyDraft());
  const [touched, setTouched] = useState(false);

  // Reset whenever popup re-opens
  useEffect(() => {
    if (open) {
      setDraft(initial ?? emptyDraft());
      setTouched(false);
    }
  }, [open, initial]);

  const minDate = useMemo(() => formatDateInput(startOfDay(new Date())), []);

  const validation = useMemo(
    () => validateReminderInputs(draft.date, draft.time),
    [draft.date, draft.time],
  );

  const showError = touched && validation.code !== "ok";
  const errorMessage = showError ? errorTextFor(validation.code, text) : "";

  const isEdit = Boolean(initial);
  const title = isEdit ? text.reminderModalTitleEdit : text.reminderModalTitleAdd;

  const applyPreset = (id: ReminderPresetId) => {
    const preset = REMINDER_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const target = preset.resolve(new Date(), DEFAULT_HOUR, DEFAULT_MINUTE);
    setDraft((prev) => ({
      ...prev,
      date: formatDateInput(target),
      time: formatTimeInput(target),
    }));
    setTouched(true);
  };

  const handleSubmit = () => {
    setTouched(true);
    if (validation.code !== "ok") return;
    onSubmit({
      date: draft.date,
      time: draft.time,
      text: draft.text.trim(),
    });
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      showClose={false}
      title={title}
      description={text.reminderModalSubtitle}
    >
      <div className="space-y-md">
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            {text.reminderModalPresetsLabel}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {REMINDER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={classNames(
                  "inline-flex items-center rounded-full border border-border bg-card px-3 h-8",
                  "text-xs font-medium text-foreground",
                  "transition-colors hover:bg-muted",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                {presetLabelFor(preset.id, text)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]">
          <label className="space-y-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">
              {text.nextActionDate}
            </span>
            <Input
              preset="default"
              type="date"
              value={draft.date}
              min={minDate}
              onChange={(event) => {
                setDraft((prev) => ({ ...prev, date: event.target.value }));
                setTouched(true);
              }}
              className={showError ? "border-destructive focus-visible:ring-destructive" : ""}
              lang={i18n.language}
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">
              {text.nextActionTime}
            </span>
            <Input
              preset="default"
              type="time"
              value={draft.time}
              onChange={(event) => {
                setDraft((prev) => ({ ...prev, time: event.target.value }));
                setTouched(true);
              }}
              className={showError ? "border-destructive focus-visible:ring-destructive" : ""}
            />
          </label>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="text-xs font-medium text-muted-foreground">
            {text.nextActionNote}
          </span>
          <Input
            preset="default"
            value={draft.text}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, text: event.target.value }))
            }
            placeholder={text.nextActionNotePlaceholder}
          />
        </label>

        {errorMessage ? (
          <div role="alert" className="text-xs font-medium text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="outline"
            shape="pill"
            onClick={() => onOpenChange(false)}
          >
            {text.reminderModalCancel}
          </Button>
          <Button
            shape="pill"
            onClick={handleSubmit}
            disabled={validation.code !== "ok"}
          >
            {text.reminderModalSave}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function presetLabelFor(id: ReminderPresetId, text: ApplicationDetailsText): string {
  switch (id) {
    case "tomorrow":
      return text.reminderPresetTomorrow;
    case "in_3_days":
      return text.reminderPresetIn3Days;
    case "in_1_week":
      return text.reminderPresetIn1Week;
    case "in_2_weeks":
      return text.reminderPresetIn2Weeks;
    case "in_1_month":
      return text.reminderPresetIn1Month;
    default:
      return id;
  }
}

function errorTextFor(
  code: ReturnType<typeof validateReminderInputs>["code"],
  text: ApplicationDetailsText,
): string {
  switch (code) {
    case "missing_date":
      return text.reminderErrorMissingDate;
    case "invalid_format":
      return text.reminderErrorInvalidFormat;
    case "in_past":
      return text.reminderErrorInPast;
    default:
      return "";
  }
}
