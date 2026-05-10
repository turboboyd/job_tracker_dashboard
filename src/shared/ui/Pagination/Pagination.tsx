import { useMemo } from "react";

import { Button } from "../Button/Button";

import {
  buildPaginationViewModel,
  isPaginationEllipsis,
} from "./pagination.helpers";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (nextPage: number) => void;
  disabled?: boolean;
  siblingCount?: number;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled,
  siblingCount = 1,
}: Props) {
  const vm = useMemo(
    () =>
      buildPaginationViewModel({
        page,
        siblingCount,
        totalPages,
        ...(disabled !== undefined ? { disabled } : {}),
      }),
    [disabled, page, siblingCount, totalPages],
  );

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        shape="pill"
        onClick={() => onPageChange(1)}
        disabled={vm.isDisabled || !vm.canGoFirst}
      >
        First
      </Button>

      <Button
        variant="outline"
        size="sm"
        shape="pill"
        onClick={() => onPageChange(vm.safePage - 1)}
        disabled={vm.isDisabled || !vm.canGoPrev}
      >
        Prev
      </Button>

      <div className="flex flex-wrap items-center gap-1">
        {vm.items.map((item, index) =>
          isPaginationEllipsis(item) ? (
            <span
              key={`dots-${index}`}
              className="px-2 text-xs text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <Button
              key={item}
              variant={item === vm.safePage ? "default" : "outline"}
              size="sm"
              shape="pill"
              onClick={() => onPageChange(item)}
              disabled={vm.isDisabled}
              className="shrink-0 min-w-9 justify-center"
            >
              {item}
            </Button>
          ),
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        shape="pill"
        onClick={() => onPageChange(vm.safePage + 1)}
        disabled={vm.isDisabled || !vm.canGoNext}
      >
        Next
      </Button>

      <Button
        variant="outline"
        size="sm"
        shape="pill"
        onClick={() => onPageChange(vm.safeTotalPages)}
        disabled={vm.isDisabled || !vm.canGoLast}
      >
        Last
      </Button>
    </div>
  );
}
