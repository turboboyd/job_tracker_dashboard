import { clamp } from "src/shared/lib/pagination/usePagination";

export const PAGINATION_ELLIPSIS = "..." as const;

export type PaginationItem = number | typeof PAGINATION_ELLIPSIS;

export interface PaginationViewModel {
  canGoFirst: boolean;
  canGoLast: boolean;
  canGoNext: boolean;
  canGoPrev: boolean;
  isDisabled: boolean;
  items: PaginationItem[];
  safePage: number;
  safeTotalPages: number;
}

function getSafeTotalPages(totalPages: number) {
  return Math.max(1, totalPages);
}

function dedupePaginationItems(items: PaginationItem[]) {
  return items.filter(
    (item, index, source) => index === 0 || item !== source[index - 1],
  );
}

export function buildPaginationItems(args: {
  page: number;
  siblingCount: number;
  totalPages: number;
}): PaginationItem[] {
  const { page, siblingCount, totalPages } = args;

  const safeTotalPages = getSafeTotalPages(totalPages);
  const safePage = clamp(page, 1, safeTotalPages);
  const left = Math.max(1, safePage - siblingCount);
  const right = Math.min(safeTotalPages, safePage + siblingCount);
  const items: PaginationItem[] = [1];

  if (left > 2) {
    items.push(PAGINATION_ELLIPSIS);
  } else {
    for (let value = 2; value < left; value += 1) {
      items.push(value);
    }
  }

  for (
    let value = Math.max(2, left);
    value <= Math.min(safeTotalPages - 1, right);
    value += 1
  ) {
    items.push(value);
  }

  if (right < safeTotalPages - 1) {
    items.push(PAGINATION_ELLIPSIS);
  } else {
    for (let value = right + 1; value < safeTotalPages; value += 1) {
      items.push(value);
    }
  }

  if (safeTotalPages > 1) {
    items.push(safeTotalPages);
  }

  return dedupePaginationItems(items);
}

export function buildPaginationViewModel(args: {
  disabled?: boolean;
  page: number;
  siblingCount: number;
  totalPages: number;
}): PaginationViewModel {
  const { disabled, page, siblingCount, totalPages } = args;
  const safeTotalPages = getSafeTotalPages(totalPages);
  const safePage = clamp(page, 1, safeTotalPages);
  const isDisabled = disabled === true;
  const canGoPrev = safePage > 1;
  const canGoNext = safePage < safeTotalPages;

  return {
    canGoFirst: canGoPrev,
    canGoLast: canGoNext,
    canGoNext,
    canGoPrev,
    isDisabled,
    items: buildPaginationItems({
      page: safePage,
      siblingCount,
      totalPages: safeTotalPages,
    }),
    safePage,
    safeTotalPages,
  };
}

export function isPaginationEllipsis(
  item: PaginationItem,
): item is typeof PAGINATION_ELLIPSIS {
  return item === PAGINATION_ELLIPSIS;
}
