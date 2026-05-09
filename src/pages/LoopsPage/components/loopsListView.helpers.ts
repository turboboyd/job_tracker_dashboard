import { clampPage } from "src/shared/lib";

export const PAGE_SIZE = 7;

export type CursorMap = Record<number, string | null | undefined>;

export function readPageParam(search: string): number | null {
  const params = new URLSearchParams(search);
  const raw = params.get("page");

  if (!raw) return null;

  return clampPage(Number(raw));
}

export function writePageToSearch(search: string, page: number): string {
  const params = new URLSearchParams(search);
  params.set("page", String(clampPage(page)));

  const nextSearch = params.toString();
  return nextSearch ? `?${nextSearch}` : "";
}
