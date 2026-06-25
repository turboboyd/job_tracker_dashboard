import type { TFunction } from "i18next";

import type { LoopStatus } from "src/entities/loop";
import { clampPage } from "src/shared/lib";

export const PAGE_SIZE = 10;
export const APPLICATIONS_PAGE_SIZE = 100;

export type LoopsTab = "active" | "paused" | "archive";

/** Read a clamped 1-based page number from a URL search string, or null. */
export function readPageParam(search: string): number | null {
  const sp = new URLSearchParams(search);
  const raw = sp.get("page");
  if (!raw) return null;

  return clampPage(Number(raw));
}

/** Read the active loops tab from a URL search string (defaults to "active"). */
export function readTabParam(search: string): LoopsTab {
  const tab = new URLSearchParams(search).get("tab");
  if (tab === "archive") return "archive";
  if (tab === "paused") return "paused";
  return "active";
}

/** Merge a page/tab patch into a URL search string ("active" tab is the default
 * and is represented by the absence of the `tab` param). */
export function writeLoopsSearch(
  search: string,
  patch: { page?: number; tab?: LoopsTab },
): string {
  const sp = new URLSearchParams(search);
  if (patch.page !== undefined) sp.set("page", String(clampPage(patch.page)));
  if (patch.tab !== undefined) {
    if (patch.tab === "archive") sp.set("tab", "archive");
    else if (patch.tab === "paused") sp.set("tab", "paused");
    else sp.delete("tab");
  }

  const next = sp.toString();
  return next ? `?${next}` : "";
}

export function getMetricValueClass(params: { accent?: boolean; green?: boolean }): string {
  if (params.accent) return "text-primary";
  if (params.green) return "text-emerald-600";
  return "text-foreground";
}

export function getLoopStatusClassName(status: LoopStatus): string {
  if (status === "archived") return "bg-muted text-muted-foreground";
  if (status === "paused") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  }
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
}

export function getLoopStatusLabel(status: LoopStatus, t: TFunction): string {
  if (status === "archived") return t("loops.archived", "Archived");
  if (status === "paused") return t("loops.paused", "Paused");
  return t("loops.active", "Active");
}
