import { skipToken } from "@reduxjs/toolkit/query";
import React, { useMemo, useState } from "react";

import { EditJobModal, JobModal } from "src/entities/job";
import { useGetJobsQuery } from "src/entities/job/api/jobApi";
import type { Job } from "src/entities/job/model/types";
import { useAuth } from "src/shared/lib";

import { useDebouncedValue } from "./model/useDebouncedValue";
import { useJobQueryParams } from "./model/useJobQueryParams";
import { useJobStatusUpdate } from "./model/useJobStatusUpdate";
import { useJobsView } from "./model/useJobsView";
import { JobsFilters } from "./ui/JobsFilters";
import { JobsHeader } from "./ui/JobsHeader";
import { JobsListCard } from "./ui/JobsListCard";

export default function JobsPage() {
  const { user } = useAuth();
  const userId = user?.uid ?? null;

  const { data: jobs = [], isLoading, isError, error } = useGetJobsQuery(
    userId ? { userId } : skipToken
  );

  const qp = useJobQueryParams();

  // debounce только для поиска (в URL пишем сразу, но фильтровать можно по debounced)
  const debouncedQ = useDebouncedValue(qp.q, 250);

  const view = useJobsView({
    jobs,
    status: qp.status,
    q: debouncedQ,
    sort: qp.sort,
    page: qp.page,
    pageSize: qp.pageSize,
  });

  const { changeStatus, updatingJobId } = useJobStatusUpdate();

  const [addOpen, setAddOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const listTitle = useMemo(() => {
    return `Jobs list${qp.status ? ` • ${qp.status.toUpperCase()}` : ""}`;
  }, [qp.status]);

  return (
    <div className="space-y-6">
      <JobsHeader onAdd={() => setAddOpen(true)} />

      <JobsFilters
        activeStatus={qp.status}
        q={qp.q}
        sort={qp.sort}
        pageSize={qp.pageSize}
        onSelectStatus={qp.setStatus}
        onSearch={qp.setQ}
        onSort={qp.setSort}
        onPageSize={qp.setPageSize}
        onReset={qp.resetAll}
        showReset={qp.hasAnyFilter}
      />

      <JobsListCard
        userId={userId}
        title={listTitle}
        subtitle="Search, filters, sort and pagination are stored in URL."
        isLoading={isLoading}
        isError={isError}
        error={error}
        jobsTotal={view.total}
        jobs={view.items}
        emptyByFilters={view.emptyByFilters}
        onResetFilters={qp.resetAll}
        onEdit={(job) => setEditingJob(job)}
        onStatusChange={({ jobId, status }) => changeStatus(jobId, status)}
        updatingJobId={updatingJobId}
        page={view.currentPage}
        totalPages={view.totalPages}
        onPrevPage={() => qp.setPage(view.currentPage - 1)}
        onNextPage={() => qp.setPage(view.currentPage + 1)}
      />

      <JobModal open={addOpen} onOpenChange={setAddOpen} />

      <EditJobModal
        open={Boolean(editingJob)}
        onOpenChange={(o: boolean) => {
          if (!o) setEditingJob(null);
        }}
        job={editingJob}
      />
    </div>
  );
}
