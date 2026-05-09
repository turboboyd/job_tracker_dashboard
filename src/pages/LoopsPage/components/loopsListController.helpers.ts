import { clampPage } from "src/shared/lib";

import { PAGE_SIZE, readPageParam } from "./loopsListView.helpers";

export function getLoopsListPage(search: string, savedListPage: number): number {
  const fromUrl = readPageParam(search);
  return fromUrl ?? clampPage(savedListPage);
}

export function getLoopsTotalPages(total: number): number {
  const pages = Math.ceil(total / PAGE_SIZE);
  return pages <= 0 ? 1 : pages;
}

export function getLoopsVisibleRange(args: {
  itemCount: number;
  page: number;
  total: number;
}): { showFrom: number; showTo: number } {
  const { itemCount, page, total } = args;

  if (total === 0) {
    return { showFrom: 0, showTo: 0 };
  }

  return {
    showFrom: (page - 1) * PAGE_SIZE + 1,
    showTo: (page - 1) * PAGE_SIZE + itemCount,
  };
}

