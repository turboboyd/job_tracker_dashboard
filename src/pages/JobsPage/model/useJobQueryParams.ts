import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { isJobStatus } from "src/entities/job/model/constants";
import type { JobStatus } from "src/entities/job/model/types";

export type JobsSort = "created_desc" | "updated_desc" | "company_asc" | "title_asc";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 4;
const PAGE_SIZES = [4, 8, 12] as const;

function parseIntSafe(v: string | null, fallback: number) {
  if (!v) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.floor(n);
  return i > 0 ? i : fallback;
}

function isJobsSort(v: unknown): v is JobsSort {
  return (
    v === "created_desc" ||
    v === "updated_desc" ||
    v === "company_asc" ||
    v === "title_asc"
  );
}

export function useJobQueryParams() {
  const [params, setParams] = useSearchParams();

  const statusParam = params.get("status");
  const status = isJobStatus(statusParam) ? (statusParam as JobStatus) : null;

  const q = params.get("q") ?? "";

  const page = parseIntSafe(params.get("page"), DEFAULT_PAGE);

  const rawPageSize = parseIntSafe(params.get("pageSize"), DEFAULT_PAGE_SIZE);
  const pageSize = (PAGE_SIZES as readonly number[]).includes(rawPageSize)
    ? rawPageSize
    : DEFAULT_PAGE_SIZE;

  const sortParam = params.get("sort");
  const sort: JobsSort = isJobsSort(sortParam) ? sortParam : "updated_desc";

  const hasAnyFilter = useMemo(() => {
    return Boolean(status) || Boolean(q.trim()) || sort !== "updated_desc" || page !== 1 || pageSize !== DEFAULT_PAGE_SIZE;
  }, [status, q, sort, page, pageSize]);

  function setStatus(next: JobStatus | null) {
    const sp = new URLSearchParams(params);
    if (!next) sp.delete("status");
    else sp.set("status", next);
    sp.set("page", "1");
    setParams(sp);
  }

  function setQ(next: string) {
    const sp = new URLSearchParams(params);
    const trimmed = next.trim();
    if (!trimmed) sp.delete("q");
    else sp.set("q", trimmed);
    sp.set("page", "1");
    setParams(sp);
  }

  function setPage(next: number) {
    const sp = new URLSearchParams(params);
    sp.set("page", String(next));
    setParams(sp);
  }

  function setPageSize(next: number) {
    const sp = new URLSearchParams(params);
    sp.set("pageSize", String(next));
    sp.set("page", "1");
    setParams(sp);
  }

  function setSort(next: JobsSort) {
    const sp = new URLSearchParams(params);
    sp.set("sort", next);
    sp.set("page", "1");
    setParams(sp);
  }

  function resetAll() {
    const sp = new URLSearchParams(params);
    sp.delete("status");
    sp.delete("q");
    sp.delete("sort");
    sp.delete("page");
    sp.delete("pageSize");
    setParams(sp);
  }

  return {
    status,
    q,
    page,
    pageSize,
    sort,
    hasAnyFilter,
    setStatus,
    setQ,
    setPage,
    setPageSize,
    setSort,
    resetAll,
  };
}
