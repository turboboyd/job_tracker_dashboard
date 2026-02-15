import { useMemo } from "react";

import { clamp } from "src/shared/lib/pagination/usePagination";
import { Button } from "src/shared/ui";

type Props = {
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
  disabled?: boolean;
  siblingCount?: number;
};

function buildPages(page: number, totalPages: number, siblingCount: number) {
  const pages: Array<number | "..."> = [];

  const safePage = clamp(page, 1, totalPages);
  const left = Math.max(1, safePage - siblingCount);
  const right = Math.min(totalPages, safePage + siblingCount);

  const showLeftDots = left > 2;
  const showRightDots = right < totalPages - 1;

  pages.push(1);

  if (showLeftDots) pages.push("...");
  else {
    for (let p = 2; p < left; p++) pages.push(p);
  }

  for (let p = Math.max(2, left); p <= Math.min(totalPages - 1, right); p++) {
    pages.push(p);
  }

  if (showRightDots) pages.push("...");
  else {
    for (let p = right + 1; p < totalPages; p++) pages.push(p);
  }

  if (totalPages > 1) pages.push(totalPages);

  return pages.filter((x, i, arr) => i === 0 || x !== arr[i - 1]);
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled,
  siblingCount = 1,
}: Props) {
  const pages = useMemo(
    () => buildPages(page, totalPages, siblingCount),
    [page, totalPages, siblingCount]
  );

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        shape="pill"
        onClick={() => onPageChange(1)}
        disabled={disabled || page <= 1}
      >
        First
      </Button>

      <Button
        variant="outline"
        size="sm"
        shape="pill"
        onClick={() => onPageChange(page - 1)}
        disabled={disabled || page <= 1}
      >
        Prev
      </Button>

      <div className="flex flex-wrap items-center gap-1">
        {pages.map((p, idx) =>
          p === "..." ? (
            <span
              key={`dots-${idx}`}
              className="px-2 text-xs text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              shape="pill"
              onClick={() => onPageChange(p)}
              disabled={disabled}
              className="shrink-0 min-w-9 justify-center"
            >
              {p}
            </Button>
          )
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        shape="pill"
        onClick={() => onPageChange(page + 1)}
        disabled={disabled || page >= totalPages}
      >
        Next
      </Button>

      <Button
        variant="outline"
        size="sm"
        shape="pill"
        onClick={() => onPageChange(totalPages)}
        disabled={disabled || page >= totalPages}
      >
        Last
      </Button>
    </div>
  );
}
