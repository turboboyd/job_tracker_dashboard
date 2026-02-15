import type { SearchFilters, LoopPlatform } from "src/entities/loop/model";
import { buildUrlByPlatform } from "src/entities/loop/model/";

export type SearchLink = { platform: LoopPlatform; url: string };

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
