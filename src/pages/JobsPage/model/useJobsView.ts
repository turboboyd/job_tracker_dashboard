import { useMemo } from "react";

import type { Job } from "src/entities/job/model/types";

import type { JobsSort } from "./useJobQueryParams";

function safeLower(v: unknown) {
  return String(v ?? "").toLowerCase();
}

export function useJobsView(args: {
  jobs: Job[];
  status: Job["status"] | null;
  q: string;
  sort: JobsSort;
  page: number;
  pageSize: number;
}) {
  const { jobs, status, q, sort, page, pageSize } = args;

  const filteredByStatus = useMemo(() => {
    if (!status) return jobs;
    return jobs.filter((j) => j.status === status);
  }, [jobs, status]);

  const searched = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return filteredByStatus;

    return filteredByStatus.filter((j) => {
      const t = safeLower(j.title);
      const c = safeLower(j.company);
      return t.includes(needle) || c.includes(needle);
    });
  }, [filteredByStatus, q]);

  const sorted = useMemo(() => {
    const copy = [...searched];

    copy.sort((a, b) => {
      if (sort === "created_desc") return b.createdAt.localeCompare(a.createdAt);
      if (sort === "updated_desc") return b.updatedAt.localeCompare(a.updatedAt);

      if (sort === "company_asc") return safeLower(a.company).localeCompare(safeLower(b.company));
      if (sort === "title_asc") return safeLower(a.title).localeCompare(safeLower(b.title));

      return 0;
    });

    return copy;
  }, [searched, sort]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

  const emptyByFilters = jobs.length > 0 && total === 0;

  return {
    total,
    totalPages,
    currentPage,
    items: pageItems,
    emptyByFilters,
  };
}
