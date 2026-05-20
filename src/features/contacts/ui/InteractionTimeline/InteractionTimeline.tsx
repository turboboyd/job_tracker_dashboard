import { ArrowDownLeft, ArrowUpRight, CalendarClock, CheckCircle2, Trash2 } from "lucide-react";

import { InteractionTypeIcon, INTERACTION_TYPE_LABELS } from "src/entities/contact";
import type { InteractionDoc } from "src/entities/contact";
import { classNames } from "src/shared/lib";
import { Button } from "src/shared/ui/Button";

interface InteractionRow {
  id: string;
  data: InteractionDoc;
}

interface InteractionTimelineProps {
  interactions: InteractionRow[];
  isLoading: boolean;
  onDelete?: ((interactionId: string) => void) | undefined;
  onClearNextStep?: ((interactionId: string) => void) | undefined;
}

function formatTs(ts: unknown): string {
  if (!ts || typeof ts !== "object") return "";
  const timestamp = ts as { toDate?: () => Date };
  if (!timestamp.toDate) return "";
  const d = timestamp.toDate();
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SentimentDot({ sentiment }: { sentiment?: InteractionDoc["sentiment"] }) {
  if (!sentiment) return null;
  const colorMap = {
    positive: "bg-emerald-500",
    neutral: "bg-amber-400",
    negative: "bg-red-500",
  };
  return (
    <span
      className={classNames(
        "inline-block h-2 w-2 rounded-full",
        colorMap[sentiment],
      )}
      title={sentiment}
    />
  );
}

function DirectionIcon({ direction }: { direction: InteractionDoc["direction"] }) {
  if (direction === "INBOUND") {
    return (
      <ArrowDownLeft className="h-3 w-3 text-emerald-500" aria-label="Inbound" />
    );
  }
  return (
    <ArrowUpRight className="h-3 w-3 text-blue-500" aria-label="Outbound" />
  );
}

function NextStepBadge({
  nextStepAt,
  nextStepText,
  onClear,
}: {
  nextStepAt: unknown;
  nextStepText?: string | undefined;
  onClear?: (() => void) | undefined;
}) {
  const formatted = formatTs(nextStepAt);
  if (!formatted) return null;

  return (
    <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800/40 dark:bg-amber-950/20">
      <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
          Next step: {formatted}
        </p>
        {nextStepText ? (
          <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
            {nextStepText}
          </p>
        ) : null}
      </div>
      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          title="Mark as done"
          className="shrink-0 rounded p-0.5 text-amber-600 transition-colors hover:bg-amber-100 hover:text-amber-800 dark:hover:bg-amber-900/40"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function InteractionItem({
  row,
  onDelete,
  onClearNextStep,
}: {
  row: InteractionRow;
  onDelete?: ((id: string) => void) | undefined;
  onClearNextStep?: ((id: string) => void) | undefined;
}) {
  const { data } = row;
  const typeLabel = INTERACTION_TYPE_LABELS[data.type];

  return (
    <div className="group relative flex gap-3">
      <InteractionTypeIcon type={data.type} />

      <div className="min-w-0 flex-1 pb-4">
        {/* Title row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{typeLabel}</span>
          <DirectionIcon direction={data.direction} />
          <SentimentDot sentiment={data.sentiment} />
          {data.durationMin ? (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
              {data.durationMin} min
            </span>
          ) : null}
          <span className="ml-auto text-[11px] text-muted-foreground">
            {formatTs(data.occurredAt)}
          </span>
        </div>

        {/* Contact name */}
        {data.contactDisplayName ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
            with {data.contactDisplayName}
          </p>
        ) : null}

        {/* Summary */}
        {data.summary ? (
          <div className="mt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Discussed
            </p>
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">
              {data.summary}
            </p>
          </div>
        ) : null}

        {/* Agreements */}
        {data.agreements ? (
          <div className="mt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Agreed
            </p>
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">
              {data.agreements}
            </p>
          </div>
        ) : null}

        {/* Next step */}
        {data.nextStepAt ? (
          <NextStepBadge
            nextStepAt={data.nextStepAt}
            nextStepText={data.nextStepText}
            onClear={onClearNextStep ? () => onClearNextStep(row.id) : undefined}
          />
        ) : null}

        {/* Delete action — visible on hover */}
        {onDelete ? (
          <div className="mt-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(row.id)}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function InteractionTimeline({
  interactions,
  isLoading,
  onDelete,
  onClearNextStep,
}: InteractionTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg bg-muted/50"
          />
        ))}
      </div>
    );
  }

  if (interactions.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No interactions logged yet.
      </p>
    );
  }

  return (
    <div className="relative pl-1">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-4 bottom-0 w-px bg-border" aria-hidden="true" />

      <div className="space-y-0">
        {interactions.map((row) => (
          <InteractionItem
            key={row.id}
            row={row}
            onDelete={onDelete}
            onClearNextStep={onClearNextStep}
          />
        ))}
      </div>
    </div>
  );
}
