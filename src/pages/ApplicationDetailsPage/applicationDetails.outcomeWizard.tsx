import { ArrowLeft, Check, ChevronDown, Phone, PhoneOff, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { classNames } from "src/shared/lib";
import { Button } from "src/shared/ui/Button";
import { Input } from "src/shared/ui/Form/Input";
import { TextArea } from "src/shared/ui/Form/TextArea/TextArea";
import { Modal } from "src/shared/ui/Modal/Modal";

import {
  formatDateInput,
  formatTimeInput,
  startOfDay,
  validateReminderInputs,
} from "./applicationDetails.helpers";
import {
  outcomesByType,
  type OutcomeOption,
  type OutcomeType,
} from "./applicationDetails.outcomes";
import type { ApplicationDetailsText } from "./applicationDetails.text";

export interface OutcomeWizardSubmit {
  outcome: OutcomeOption;
  commentOverride?: string | undefined;
  followUpAt?: Date | null | undefined;
  contactLabel?: string | null | undefined;
}

interface OutcomeWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing contact options for this application. */
  contactOptions?: { id: string; label: string }[] | undefined;
  onSubmit: (payload: OutcomeWizardSubmit) => void;
  text: ApplicationDetailsText;
}

type Step = "type" | "option";

function TypeChoiceButton({
  icon: Icon,
  label,
  tone,
  onClick,
}: {
  icon: typeof Phone;
  label: string;
  tone: "success" | "warning" | "danger";
  onClick: () => void;
}) {
  const toneStyle = (() => {
    if (tone === "success") return "border-status-success/40 hover:bg-status-success/5";
    if (tone === "warning") return "border-status-warning/40 hover:bg-status-warning/5";
    return "border-destructive/40 hover:bg-destructive/5";
  })();

  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "flex flex-col items-start gap-2 rounded-xl border bg-card p-4",
        "transition-colors text-left",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        toneStyle,
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </button>
  );
}

function tomorrowAt9(): Date {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(9, 0, 0, 0);
  return next;
}

interface ContactOption {
  id: string;
  label: string;
}

/**
 * Inline searchable contact picker. Shows the selected contact label as the
 * trigger; on click opens a filterable list. Closes on blur or selection.
 *
 * Designed to scale beyond the ~5–7 items where a native <select> becomes
 * unusable. Inline contact creation is intentionally NOT included here —
 * keep the wizard surface small; that's a follow-up.
 */
function ContactPicker({
  value,
  onChange,
  options,
  placeholder,
  noneLabel,
}: {
  value: string;
  onChange: (id: string) => void;
  options: ContactOption[];
  placeholder: string;
  noneLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((o) => o.id === value);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 8);
    return options.filter((o) => o.label.toLowerCase().includes(q)).slice(0, 8);
  }, [query, options]);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={classNames(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-3",
          "text-sm text-foreground",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <span className={classNames("truncate", !selected && "text-muted-foreground")}>
          {selected?.label ?? noneLabel}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md">
          <div className="border-b border-border p-1.5">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="h-8 w-full rounded-sm bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
                setQuery("");
              }}
              className={classNames(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm",
                "hover:bg-muted",
                value === "" && "bg-muted/50",
              )}
            >
              <span className={classNames("h-4 w-4", value === "" ? "" : "opacity-0")}>
                <Check className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="truncate text-muted-foreground">{noneLabel}</span>
            </button>
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">—</div>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={classNames(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm",
                    "hover:bg-muted",
                    value === option.id && "bg-muted/50",
                  )}
                >
                  <span className={classNames("h-4 w-4", value === option.id ? "" : "opacity-0")}>
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface OutcomeWizardContentProps {
  contactOptions?: { id: string; label: string }[] | undefined;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: OutcomeWizardSubmit) => void;
  text: ApplicationDetailsText;
  minDate: string;
}

function OutcomeWizardContent({
  contactOptions,
  onOpenChange,
  onSubmit,
  text,
  minDate,
}: OutcomeWizardContentProps) {
  const [step, setStep] = useState<Step>("type");
  const [type, setType] = useState<OutcomeType | null>(null);
  const [selectedOption, setSelectedOption] = useState<OutcomeOption | null>(null);
  const [commentText, setCommentText] = useState("");
  const [contactId, setContactId] = useState<string>("");
  const [initialManualValues] = useState(() => {
    const tomorrow = tomorrowAt9();
    return {
      date: formatDateInput(tomorrow),
      time: formatTimeInput(tomorrow),
    };
  });
  const [manualDate, setManualDate] = useState<string>(initialManualValues.date);
  const [manualTime, setManualTime] = useState<string>(initialManualValues.time);

  const options = useMemo(() => (type ? outcomesByType(type) : []), [type]);

  const needsManualDate =
    selectedOption?.followUp?.timing.kind === "manual";
  const requiresComment = selectedOption?.requireCustomComment === true;

  const manualDateValidation = useMemo(
    () => (needsManualDate ? validateReminderInputs(manualDate, manualTime) : null),
    [needsManualDate, manualDate, manualTime],
  );

  const canCommit = (() => {
    if (!selectedOption) return false;
    if (requiresComment && !commentText.trim()) return false;
    if (needsManualDate && manualDateValidation?.code !== "ok") return false;
    return true;
  })();

  const handleCommit = () => {
    if (!selectedOption || !canCommit) return;

    const followUpAt = (() => {
      if (!needsManualDate) return null;
      return manualDateValidation?.date ?? null;
    })();

    const contactLabel =
      (contactOptions ?? []).find((c) => c.id === contactId)?.label ?? null;

    onSubmit({
      outcome: selectedOption,
      commentOverride: commentText.trim() ? commentText.trim() : undefined,
      followUpAt,
      contactLabel,
    });

    onOpenChange(false);
  };

  return (
    <>
      {step === "type" ? (
        <div className="space-y-md">
          <div className="text-xs text-muted-foreground">{text.outcomeWizardStep1Hint}</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <TypeChoiceButton
              icon={Phone}
              label={text.outcomeWizardCalled}
              tone="success"
              onClick={() => {
                setType("called");
                setStep("option");
              }}
            />
            <TypeChoiceButton
              icon={PhoneOff}
              label={text.outcomeWizardNoAnswer}
              tone="warning"
              onClick={() => {
                setType("no_answer");
                setStep("option");
              }}
            />
            <TypeChoiceButton
              icon={X}
              label={text.outcomeWizardRejected}
              tone="danger"
              onClick={() => {
                setType("rejected");
                setStep("option");
              }}
            />
          </div>
          <div className="flex justify-end pt-1">
            <Button
              variant="outline"
              shape="pill"
              onClick={() => onOpenChange(false)}
            >
              {text.reminderModalCancel}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-md">
          {/* Quick options */}
          <div className="space-y-1.5">
            {options.map((opt) => {
              const isActive = selectedOption?.id === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedOption(opt)}
                  className={classNames(
                    "block w-full rounded-lg border px-3 py-2 text-left text-sm",
                    "transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-card text-foreground hover:bg-muted/40",
                  )}
                >
                  {String(text[opt.labelKey] ?? opt.id)}
                </button>
              );
            })}
          </div>

          {/* Contact picker — searchable when there are contacts on this app */}
          {contactOptions && contactOptions.length > 0 ? (
            <div className="space-y-1 text-sm">
              <span className="block text-xs font-medium text-muted-foreground">
                {text.outcomeContactLabel}
              </span>
              <ContactPicker
                value={contactId}
                onChange={setContactId}
                options={contactOptions}
                placeholder={text.outcomeContactPickHint}
                noneLabel={text.outcomeContactNone}
              />
            </div>
          ) : null}

          {/* Manual follow-up date — only if outcome requires it */}
          {needsManualDate ? (
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
              <div className="text-xs font-medium text-muted-foreground">
                {text.outcomeWizardFollowUpLabel}
              </div>

              {/* Quick date presets above the manual picker */}
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: "tomorrow", label: text.outcomeManualPresetTomorrow, days: 1 },
                    { id: "in_2_days", label: text.outcomeManualPresetIn2Days, days: 2 },
                    { id: "in_1_week", label: text.outcomeManualPresetIn1Week, days: 7 },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      const target = new Date();
                      target.setDate(target.getDate() + preset.days);
                      target.setHours(9, 0, 0, 0);
                      setManualDate(formatDateInput(target));
                      setManualTime(formatTimeInput(target));
                    }}
                    className={classNames(
                      "inline-flex items-center rounded-full border border-border bg-card px-3 h-7",
                      "text-xs font-medium text-foreground",
                      "transition-colors hover:bg-muted",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]">
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-medium text-muted-foreground">
                    {text.outcomeManualPresetCustom} — {text.nextActionDate}
                  </span>
                  <Input
                    preset="default"
                    type="date"
                    value={manualDate}
                    min={minDate}
                    onChange={(e) => setManualDate(e.target.value)}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-medium text-muted-foreground">
                    {text.nextActionTime}
                  </span>
                  <Input
                    preset="default"
                    type="time"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                  />
                </label>
              </div>
            </div>
          ) : null}

          {/* Comment — required for "custom" options, optional otherwise */}
          <label className="block space-y-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">
              {text.outcomeWizardCommentLabel}
              {requiresComment ? " *" : ""}
            </span>
            <TextArea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={text.outcomeWizardCommentPlaceholder}
              rows={3}
            />
          </label>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <Button
              variant="ghost"
              shape="pill"
              onClick={() => setStep("type")}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {text.outcomeWizardBack}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                shape="pill"
                onClick={() => onOpenChange(false)}
              >
                {text.reminderModalCancel}
              </Button>
              <Button shape="pill" disabled={!canCommit} onClick={handleCommit}>
                {text.outcomeWizardCommit}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function OutcomeWizard({
  open,
  onOpenChange,
  contactOptions,
  onSubmit,
  text,
}: OutcomeWizardProps) {
  const minDate = useMemo(() => formatDateInput(startOfDay(new Date())), []);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      showClose={false}
      title={text.outcomeWizardTitle}
      description={text.outcomeWizardSubtitle}
    >
      <OutcomeWizardContent
        contactOptions={contactOptions}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        text={text}
        minDate={minDate}
      />
    </Modal>
  );
}
