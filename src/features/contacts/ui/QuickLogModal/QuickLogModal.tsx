import type { ReactNode } from "react";
import { useCallback, useState } from "react";

import {
  CONTACT_ROLE_LABELS,
  INTERACTION_TYPE_KEYS,
  INTERACTION_TYPE_LABELS,
  getContactFullName,
} from "src/entities/contact";
import type {
  ContactDoc,
  InteractionDirection,
  InteractionSentiment,
  InteractionType,
} from "src/entities/contact";
import type { CreateInteractionInput } from "src/features/contacts";
import { classNames } from "src/shared/lib";
import { Button } from "src/shared/ui/Button";
import { Input } from "src/shared/ui/Form/Input";
import { Select } from "src/shared/ui/Form/Select";
import { TextArea } from "src/shared/ui/Form/TextArea";
import { Modal } from "src/shared/ui/Modal";

interface ContactOption {
  id: string;
  data: ContactDoc;
}

interface QuickLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selected contact (e.g., when opened from application detail) */
  preselectedContact?: ContactOption | undefined;
  /** Application context */
  applicationId?: string | undefined;
  applicationDisplayTitle?: string | undefined;
  /** Available contacts for selection */
  contacts?: ContactOption[] | undefined;
  /** Called after successful save */
  onSave: (input: CreateInteractionInput) => Promise<void>;
}

const TYPE_OPTIONS = INTERACTION_TYPE_KEYS.map((key) => ({
  value: key,
  label: INTERACTION_TYPE_LABELS[key],
}));

const DIRECTION_OPTIONS: { value: InteractionDirection; label: string }[] = [
  { value: "INBOUND", label: "Inbound (they contacted me)" },
  { value: "OUTBOUND", label: "Outbound (I reached out)" },
];

const SENTIMENT_OPTIONS: { value: InteractionSentiment | ""; label: string }[] = [
  { value: "", label: "— No sentiment —" },
  { value: "positive", label: "😊 Positive" },
  { value: "neutral", label: "😐 Neutral" },
  { value: "negative", label: "😕 Negative" },
];

function FieldLabel({ children }: { children: string }) {
  return (
    <span className="block text-xs font-semibold text-muted-foreground mb-1">
      {children}
    </span>
  );
}

function FormRow({ children, cols = 1 }: { children: ReactNode; cols?: 1 | 2 }) {
  return (
    <div
      className={classNames(
        "gap-3",
        cols === 2 ? "grid grid-cols-2" : "flex flex-col",
      )}
    >
      {children}
    </div>
  );
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowTimeString(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function QuickLogModal({
  open,
  onOpenChange,
  preselectedContact,
  applicationId,
  applicationDisplayTitle,
  contacts = [],
  onSave,
}: QuickLogModalProps) {
  const [type, setType] = useState<InteractionType>("CALL");
  const [direction, setDirection] = useState<InteractionDirection>("INBOUND");
  const [selectedContactId, setSelectedContactId] = useState<string>(
    preselectedContact?.id ?? "",
  );
  const [occurredDate, setOccurredDate] = useState(todayDateString());
  const [occurredTime, setOccurredTime] = useState(nowTimeString());
  const [durationMin, setDurationMin] = useState("");
  const [summary, setSummary] = useState("");
  const [agreements, setAgreements] = useState("");
  const [nextStepDate, setNextStepDate] = useState("");
  const [nextStepText, setNextStepText] = useState("");
  const [sentiment, setSentiment] = useState<InteractionSentiment | "">("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setType("CALL");
    setDirection("INBOUND");
    setSelectedContactId(preselectedContact?.id ?? "");
    setOccurredDate(todayDateString());
    setOccurredTime(nowTimeString());
    setDurationMin("");
    setSummary("");
    setAgreements("");
    setNextStepDate("");
    setNextStepText("");
    setSentiment("");
    setError(null);
  }, [preselectedContact?.id]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) resetForm();
      onOpenChange(next);
    },
    [onOpenChange, resetForm],
  );

  const handleSave = useCallback(async () => {
    if (!occurredDate) {
      setError("Date is required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const occurredAt = new Date(`${occurredDate}T${occurredTime || "00:00"}`);

      const selectedContact =
        preselectedContact ??
        contacts.find((c) => c.id === selectedContactId);

      const contactDisplayName = selectedContact
        ? getContactFullName(selectedContact.data)
        : undefined;

      const input: CreateInteractionInput = {
        type,
        direction,
        occurredAt,
        ...(durationMin ? { durationMin: parseInt(durationMin, 10) } : {}),
        ...(summary.trim() ? { summary: summary.trim() } : {}),
        ...(agreements.trim() ? { agreements: agreements.trim() } : {}),
        ...(nextStepDate
          ? { nextStepAt: new Date(`${nextStepDate}T09:00`) }
          : {}),
        ...(nextStepText.trim() ? { nextStepText: nextStepText.trim() } : {}),
        ...(selectedContact ? { contactId: selectedContact.id } : {}),
        ...(contactDisplayName ? { contactDisplayName } : {}),
        ...(applicationId ? { applicationId } : {}),
        ...(applicationDisplayTitle
          ? { applicationDisplayTitle }
          : {}),
        ...(sentiment ? { sentiment } : {}),
      };

      await onSave(input);
      handleOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [
    agreements,
    applicationDisplayTitle,
    applicationId,
    contacts,
    direction,
    durationMin,
    handleOpenChange,
    nextStepDate,
    nextStepText,
    occurredDate,
    occurredTime,
    onSave,
    preselectedContact,
    selectedContactId,
    sentiment,
    summary,
    type,
  ]);

  const contactOptions = [
    { value: "", label: "— No contact —" },
    ...contacts.map((c) => ({
      value: c.id,
      label: `${getContactFullName(c.data)} — ${CONTACT_ROLE_LABELS[c.data.role]}`,
    })),
  ];

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Log interaction"
      description={
        applicationDisplayTitle
          ? `For: ${applicationDisplayTitle}`
          : "Record a call, email or meeting."
      }
      size="md"
    >
      <div className="space-y-4">
        {/* Type + Direction */}
        <FormRow cols={2}>
          <div>
            <FieldLabel>Type</FieldLabel>
            <Select
              value={type}
              onChange={setType}
              options={TYPE_OPTIONS}
              size="md"
              radius="lg"
            />
          </div>
          <div>
            <FieldLabel>Direction</FieldLabel>
            <Select
              value={direction}
              onChange={setDirection}
              options={DIRECTION_OPTIONS}
              size="md"
              radius="lg"
            />
          </div>
        </FormRow>

        {/* Contact selector (only when no preselected) */}
        {!preselectedContact && contacts.length > 0 ? (
          <div>
            <FieldLabel>Contact</FieldLabel>
            <Select
              value={selectedContactId}
              onChange={setSelectedContactId}
              options={contactOptions}
              size="md"
              radius="lg"
            />
          </div>
        ) : null}

        {preselectedContact ? (
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Contact: </span>
            <span className="font-medium">
              {getContactFullName(preselectedContact.data)}
            </span>
          </div>
        ) : null}

        {/* Date + Time + Duration */}
        <FormRow cols={2}>
          <div>
            <FieldLabel>Date</FieldLabel>
            <Input
              preset="default"
              type="date"
              value={occurredDate}
              onChange={(e) => setOccurredDate(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel>Time</FieldLabel>
            <Input
              preset="default"
              type="time"
              value={occurredTime}
              onChange={(e) => setOccurredTime(e.target.value)}
            />
          </div>
        </FormRow>

        {type === "CALL" || type === "MEETING" ? (
          <div>
            <FieldLabel>Duration (minutes)</FieldLabel>
            <Input
              preset="default"
              type="number"
              min="1"
              max="480"
              placeholder="e.g. 30"
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
            />
          </div>
        ) : null}

        {/* Summary */}
        <div>
          <FieldLabel>What was discussed?</FieldLabel>
          <TextArea
            size="sm"
            radius="lg"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Tech stack, salary expectations, timeline..."
          />
        </div>

        {/* Agreements */}
        <div>
          <FieldLabel>What was agreed?</FieldLabel>
          <TextArea
            size="sm"
            radius="lg"
            value={agreements}
            onChange={(e) => setAgreements(e.target.value)}
            placeholder="They will send a test task by Friday..."
          />
        </div>

        {/* Next step */}
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Next step / callback
          </p>
          <FormRow cols={2}>
            <div>
              <FieldLabel>When to follow up</FieldLabel>
              <Input
                preset="default"
                type="date"
                value={nextStepDate}
                onChange={(e) => setNextStepDate(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>What to do</FieldLabel>
              <Input
                preset="default"
                value={nextStepText}
                onChange={(e) => setNextStepText(e.target.value)}
                placeholder="Call back, send portfolio..."
              />
            </div>
          </FormRow>
        </div>

        {/* Sentiment */}
        <div>
          <FieldLabel>How did it go?</FieldLabel>
          <Select
            value={sentiment}
            onChange={setSentiment}
            options={SENTIMENT_OPTIONS}
            size="md"
            radius="lg"
          />
        </div>

        {/* Error */}
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="outline"
            shape="pill"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            shape="pill"
            onClick={handleSave}
            disabled={isSaving || !occurredDate}
          >
            {isSaving ? "Saving..." : "Save interaction"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
