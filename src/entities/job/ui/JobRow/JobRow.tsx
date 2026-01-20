import React from "react";

import type { JobStatus } from "src/entities/job/model/types";
import { JobStatusDropdown } from "src/entities/job/ui/JobStatusDropdown/JobStatusDropdown";
import { classNames } from "src/shared/lib";
import { formatDate } from "src/shared/lib/date/formatDate";

type Props = {
  id: string;
  title: string;
  company: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;

  statusMode?: "read" | "edit";
  onChangeStatus?: (next: JobStatus) => void;
  statusDisabled?: boolean;

  rightAction?: React.ReactNode;

  onOpen?: () => void;

  showDates?: boolean;
};

export function JobRow({
  title,
  company,
  status,
  createdAt,
  updatedAt,
  statusMode = "read",
  onChangeStatus,
  statusDisabled,
  rightAction,
  onOpen,
  showDates = true,
}: Props) {
  const isClickable = Boolean(onOpen);
  // const Wrapper: "button" | "div" = isClickable ? "button" : "div";

  const wrapperClassName = classNames(
    "w-full",
    "flex items-center justify-between gap-3",
    "rounded-lg border border-border bg-background p-3",
    isClickable
      ? "text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
      : ""
  );

  if (isClickable) {
    return (
      <button type="button" onClick={onOpen} className={wrapperClassName}>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground">
            {title}
          </div>
          <div className="truncate text-xs text-muted-foreground">{company}</div>

          {showDates ? (
            <div className="mt-1 text-xs text-muted-foreground">
              Created: {formatDate(createdAt)}
              {updatedAt !== createdAt ? (
                <> · Updated: {formatDate(updatedAt)}</>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <JobStatusDropdown
            mode={statusMode}
            value={status}
            disabled={statusDisabled}
            onChange={onChangeStatus}
          />
          {rightAction}
        </div>
      </button>
    );
  }

  return (
    <div className={wrapperClassName}>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-foreground">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{company}</div>

        {showDates ? (
          <div className="mt-1 text-xs text-muted-foreground">
            Created: {formatDate(createdAt)}
            {updatedAt !== createdAt ? <> · Updated: {formatDate(updatedAt)}</> : null}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <JobStatusDropdown
          mode={statusMode}
          value={status}
          disabled={statusDisabled}
          onChange={onChangeStatus}
        />
        {rightAction}
      </div>
    </div>
  );
}
