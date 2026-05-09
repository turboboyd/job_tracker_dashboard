import type { LoopPlatform, SearchFilters } from "../../model";
import { buildUrlByPlatform } from "../../model";

export interface SearchLink { platform: LoopPlatform; url: string }

export function buildSearchLinks(
  platforms: LoopPlatform[],
  filters: SearchFilters
): SearchLink[] {
  return platforms.map((p) => ({
    platform: p,
    url: buildUrlByPlatform(p, filters),
  }));
}

export function openUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}
