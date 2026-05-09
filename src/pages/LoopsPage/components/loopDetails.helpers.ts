import type { TFunction } from "i18next";

import { joinTitles, type Loop } from "src/entities/loop";

export function getLoopDetailsTitle(loop: Loop | null, t: TFunction) {
  return loop?.name ?? t("loops.detailsTitle", "Loop");
}

export function getLoopDetailsSubtitle(loop: Loop | null, t: TFunction) {
  if (!loop) {
    return t(
      "loops.detailsHint",
      "Change filters → Apply → links update and filters persist.",
    );
  }

  const roles =
    joinTitles(Array.isArray(loop.titles) ? loop.titles : []) ??
    t("loops.dash", "—");
  const remoteText =
    loop.remoteMode === "remote_only"
      ? t("loops.remoteOnly", "Remote")
      : t("loops.any", "Any");

  return `${roles} · ${loop.location} · ${remoteText}`;
}

export function toLoopSearchLinksLoop(loop: Loop) {
  return {
    id: loop.id,
    name: loop.name,
    titles: loop.titles,
    location: loop.location,
    radiusKm: loop.radiusKm,
    platforms: loop.platforms,
    remoteMode: loop.remoteMode,
    ...(loop.filters ? { filters: loop.filters } : {}),
  };
}
