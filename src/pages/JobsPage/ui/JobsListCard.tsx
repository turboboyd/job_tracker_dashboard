import React from "react";

import type { Job, JobStatus } from "src/entities/job/model/types";
import { JobStatusDropdown } from "src/entities/job/ui/JobStatusDropdown/JobStatusDropdown";
import { normalizeError } from "src/shared/lib";
import { formatDate } from "src/shared/lib/date/formatDate";
import { Button } from "src/shared/ui";
import { Card } from "src/shared/ui/Card/Card";

import { JobsListSkeleton } from "./JobsListSkeleton";
import { JobsPagination } from "./JobsPagination";



type Props = {
  userId: string | null;

  title: string;
  subtitle?: string;

  isLoading: boolean;
  isError: boolean;
  error: unknown;

  jobsTotal: number;
  jobs: Job[];

  emptyByFilters: boolean;
  onResetFilters: () => void;

  onEdit: (job: Job) => void;

  onStatusChange: (args: { jobId: string; status: JobStatus }) => void;
  updatingJobId: string | null;

  page: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function JobsListCard({
  userId,
  title,
  subtitle,

  isLoading,
  isError,
  error,

  jobsTotal,
  jobs,

  emptyByFilters,
  onResetFilters,

  onEdit,
  onStatusChange,
  updatingJobId,

  page,
  totalPages,
  onPrevPage,
  onNextPage,
}: Props) {
  return (
    <Card radius="xl" padding="md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-foreground">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>
          ) : null}
          <div className="mt-1 text-xs text-muted-foreground">
            Showing {jobs.length} of {jobsTotal}
          </div>
        </div>
      </div>

      {!userId ? (
        <div className="mt-4 text-sm text-muted-foreground">Sign in to see your jobs.</div>
      ) : isLoading ? (
        <JobsListSkeleton rows={4} />
      ) : isError ? (
        <div className="mt-4 text-sm text-muted-foreground">{normalizeError(error)}</div>
      ) : jobsTotal === 0 ? (
        <div className="mt-4 text-sm text-muted-foreground">No jobs yet.</div>
      ) : emptyByFilters ? (
        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          <div>No results for current filters/search.</div>
          <Button variant="outline" size="sm" shape="pill" onClick={onResetFilters}>
            Reset filters
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            {jobs.map((j) => (
              <div
                key={j.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">{j.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{j.company}</div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    Created: {formatDate(j.createdAt)}
                    {j.updatedAt !== j.createdAt ? (
                      <> · Updated: {formatDate(j.updatedAt)}</>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <JobStatusDropdown
                    mode="edit"
                    value={j.status}
                    disabled={updatingJobId === j.id}
                    onChange={(next) => onStatusChange({ jobId: j.id, status: next })}
                    size="sm"
                  />

                  <Button
                    variant="outline"
                    size="sm"
                    shape="pill"
                    onClick={() => onEdit(j)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <JobsPagination
            page={page}
            totalPages={totalPages}
            onPrev={onPrevPage}
            onNext={onNextPage}
          />
        </>
      )}
    </Card>
  );
}
