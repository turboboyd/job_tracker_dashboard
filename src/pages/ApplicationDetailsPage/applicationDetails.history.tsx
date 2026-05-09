import { Clock3, MessageSquareText, PencilLine, RefreshCw } from "lucide-react";
import type { ReactElement } from "react";

import { StatusLabel } from "src/entities/application";
import type { HistoryEventDoc } from "src/features/applications";
import { Button } from "src/shared/ui/Button";
import { Card } from "src/shared/ui/Card";

import {
  formatTs,
  type ApplicationHistoryItem,
  type HistoryFilter,
  toStatusKey,
} from "./applicationDetails.helpers";
import {
  DetailsCardTitle,
  DetailsMutedMessage,
} from "./applicationDetails.primitives";
import type { ApplicationDetailsText } from "./applicationDetails.text";

function buildHistoryTitle(
  event: HistoryEventDoc,
  text: ApplicationDetailsText,
): ReactElement {
  if (event.type === "STATUS_CHANGE") {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <span>{text.historyStatusPrefix}:</span>
        {event.fromStatus ? (
          <StatusLabel status={toStatusKey(event.fromStatus)} />
        ) : (
          text.emptyValue
        )}
        <span className="text-muted-foreground">-&gt;</span>
        {event.toStatus ? (
          <StatusLabel status={toStatusKey(event.toStatus)} />
        ) : (
          text.emptyValue
        )}
      </span>
    );
  }

  if (event.type === "COMMENT") {
    return <span>{text.historyCommentTitle}</span>;
  }

  if (event.type === "FIELD_CHANGE") {
    return (
      <span>
        {text.fieldPrefix}: {getFieldLabel(event.fieldPath, text)}
      </span>
    );
  }

  return <span>{event.comment ?? text.historySystemTitle}</span>;
}

function getFieldLabel(
  fieldPath: string | undefined,
  text: ApplicationDetailsText,
): string {
  if (fieldPath === "process.nextActionAt") {
    return text.nextAction;
  }

  if (fieldPath === "process.nextActionText") {
    return text.nextActionNote;
  }

  return fieldPath ?? text.emptyValue;
}

function getHistoryVisual(type: HistoryEventDoc["type"]) {
  if (type === "STATUS_CHANGE") {
    return {
      icon: RefreshCw,
      className: "border-l-status-info bg-blue-50/70 dark:bg-blue-950/20",
      iconClassName: "text-status-info",
    };
  }

  if (type === "COMMENT") {
    return {
      icon: MessageSquareText,
      className: "border-l-status-success bg-emerald-50/70 dark:bg-emerald-950/20",
      iconClassName: "text-status-success",
    };
  }

  if (type === "FIELD_CHANGE") {
    return {
      icon: PencilLine,
      className: "border-l-status-warning bg-amber-50/70 dark:bg-amber-950/20",
      iconClassName: "text-status-warning",
    };
  }

  return {
    icon: Clock3,
    className: "border-l-border bg-muted/30",
    iconClassName: "text-muted-foreground",
  };
}

function HistoryFilterButtons({
  historyFilter,
  onHistoryFilterChange,
  text,
}: {
  historyFilter: HistoryFilter;
  onHistoryFilterChange: (next: HistoryFilter) => void;
  text: ApplicationDetailsText;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant={historyFilter === "all" ? "default" : "outline"}
        onClick={() => onHistoryFilterChange("all")}
      >
        {text.historyFilterAll}
      </Button>
      <Button
        size="sm"
        variant={historyFilter === "statuses" ? "default" : "outline"}
        onClick={() => onHistoryFilterChange("statuses")}
      >
        {text.historyFilterStatuses}
      </Button>
      <Button
        size="sm"
        variant={historyFilter === "comments" ? "default" : "outline"}
        onClick={() => onHistoryFilterChange("comments")}
      >
        {text.historyFilterComments}
      </Button>
    </div>
  );
}

interface ApplicationHistoryCardProps {
  history: ApplicationHistoryItem[];
  historyFilter: HistoryFilter;
  onHistoryFilterChange: (next: HistoryFilter) => void;
  text: ApplicationDetailsText;
}

function HistoryItemRow({
  item,
  text,
}: {
  item: ApplicationHistoryItem;
  text: ApplicationDetailsText;
}) {
  const visual = getHistoryVisual(item.data.type);
  const Icon = visual.icon;

  return (
    <div className={`rounded-lg border border-border border-l-4 p-3 ${visual.className}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background/80">
          <Icon className={`h-4 w-4 ${visual.iconClassName}`} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">
            {buildHistoryTitle(item.data, text)}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {formatTs(item.data.createdAt)} - {item.data.actor}
          </div>
          {item.data.comment ? (
            <div className="mt-2 whitespace-pre-wrap text-sm text-foreground">
              {item.data.comment}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Render a tight visual group of history events that share a correlationId
 * (e.g. STATUS_CHANGE + COMMENT emitted by the outcome wizard).
 *
 * Visually styled like a single card with sub-rows; each event keeps its
 * own icon and content, but they share the timestamp+actor line.
 */
function HistoryGroupRow({
  items,
  text,
}: {
  items: ApplicationHistoryItem[];
  text: ApplicationDetailsText;
}) {
  // Use the strongest/leading event (first in group) for the visual border tone.
  const leading = items[0]!;
  const visual = getHistoryVisual(leading.data.type);
  const headerTs = leading.data.createdAt;
  const headerActor = leading.data.actor;

  return (
    <div className={`rounded-lg border border-border border-l-4 p-3 ${visual.className}`}>
      <div className="text-xs text-muted-foreground">
        {formatTs(headerTs)} - {headerActor}
      </div>
      <div className="mt-2 space-y-2">
        {items.map((item) => {
          const itemVisual = getHistoryVisual(item.data.type);
          const Icon = itemVisual.icon;
          return (
            <div key={item.id} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background/80">
                <Icon className={`h-3.5 w-3.5 ${itemVisual.iconClassName}`} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground">
                  {buildHistoryTitle(item.data, text)}
                </div>
                {item.data.comment ? (
                  <div className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {item.data.comment}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type HistoryRow =
  | { kind: "single"; item: ApplicationHistoryItem }
  | { kind: "group"; key: string; items: ApplicationHistoryItem[] };

/**
 * Walk history once, collapsing consecutive items that share a non-empty
 * correlationId into a single group. Order is preserved.
 */
function groupHistoryByCorrelation(
  history: ApplicationHistoryItem[],
): HistoryRow[] {
  const rows: HistoryRow[] = [];
  let i = 0;
  while (i < history.length) {
    const current = history[i]!;
    const cid = current.data.correlationId;
    if (!cid) {
      rows.push({ kind: "single", item: current });
      i += 1;
      continue;
    }
    let j = i + 1;
    while (j < history.length && history[j]!.data.correlationId === cid) {
      j += 1;
    }
    if (j - i === 1) {
      rows.push({ kind: "single", item: current });
    } else {
      rows.push({
        kind: "group",
        key: `g-${cid}-${current.id}`,
        items: history.slice(i, j),
      });
    }
    i = j;
  }
  return rows;
}

export function ApplicationHistoryCard({
  history,
  historyFilter,
  onHistoryFilterChange,
  text,
}: ApplicationHistoryCardProps) {
  return (
    <Card padding="md" shadow="sm" className="space-y-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DetailsCardTitle>{text.history}</DetailsCardTitle>
        <HistoryFilterButtons
          historyFilter={historyFilter}
          onHistoryFilterChange={onHistoryFilterChange}
          text={text}
        />
      </div>

      {history.length === 0 ? (
        <DetailsMutedMessage>{text.noHistory}</DetailsMutedMessage>
      ) : (
        <div className="space-y-2">
          {groupHistoryByCorrelation(history).map((row) =>
            row.kind === "single" ? (
              <HistoryItemRow key={row.item.id} item={row.item} text={text} />
            ) : (
              <HistoryGroupRow key={row.key} items={row.items} text={text} />
            ),
          )}
        </div>
      )}
    </Card>
  );
}
