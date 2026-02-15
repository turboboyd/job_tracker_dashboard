import type { TFunction } from "i18next";

import type { FeatureItem, PreviewModel, StatItem } from "./types";

function tt(t: TFunction, key: string, fallback: string) {
  return t(key, { defaultValue: fallback });
}

export function buildQuickStats(t: TFunction): StatItem[] {
  return [
    {
      label: tt(t, "home.stats.organized.label", "Organized"),
      value: tt(t, "home.stats.organized.value", "Everything in one place"),
      hint: tt(t, "home.stats.organized.hint", "Jobs, statuses, notes, links"),
    },
    {
      label: tt(t, "home.stats.speed.label", "Speed"),
      value: tt(t, "home.stats.speed.value", "Faster at every step"),
      hint: tt(t, "home.stats.speed.hint", "Templates, filters, saved searches"),
    },
    {
      label: tt(t, "home.stats.clarity.label", "Clarity"),
      value: tt(t, "home.stats.clarity.value", "See what works"),
      hint: tt(t, "home.stats.clarity.hint", "History, funnel, metrics"),
    },
  ];
}

export function buildFeatures(t: TFunction): FeatureItem[] {
  return [
    {
      title: tt(t, "home.features.track.title", "Track applications without chaos"),
      text: tt(
        t,
        "home.features.track.text",
        "Save jobs, keep links, track statuses and deadlines. Everything stays in one place instead of getting lost in bookmarks."
      ),
      points: [
        tt(t, "home.features.track.p1", "Statuses and change history"),
        tt(t, "home.features.track.p2", "Notes and conversation links"),
        tt(t, "home.features.track.p3", "Fast search across your list"),
      ],
    },
    {
      title: tt(t, "home.features.links.title", "Platform search links for your scenario"),
      text: tt(
        t,
        "home.features.links.text",
        "Create filters once and get ready links for different platforms. Update your loop → refresh your searches."
      ),
      points: [
        tt(t, "home.features.links.p1", "One set of filters across many sites"),
        tt(t, "home.features.links.p2", "Filters stored inside a loop"),
        tt(t, "home.features.links.p3", "Flexible, extensible logic"),
      ],
    },
    {
      title: tt(t, "home.features.pipeline.title", "Funnel + process control"),
      text: tt(
        t,
        "home.features.pipeline.text",
        "See where time is lost: how many saves, applications, replies, interviews. Improve strategy with real numbers."
      ),
      points: [
        tt(t, "home.features.pipeline.p1", "Clear structure by stages"),
        tt(t, "home.features.pipeline.p2", "Focus on the next action"),
        tt(t, "home.features.pipeline.p3", "Rhythm: planning and discipline"),
      ],
    },
  ];
}

export function buildPreviewModel(t: TFunction): PreviewModel {
  return {
    header: {
      title: tt(t, "home.preview.title", "What it looks like in real life"),
      subtitle: tt(t, "home.preview.sub", "Scenario → links → matches → statuses"),
      liveLabel: tt(t, "home.pill.live", "Live"),
      demoLabel: tt(t, "home.preview.tag", "demo"),
    },
    loop: {
      label: tt(t, "home.preview.loop", "Loop"),
      statusLabel: tt(t, "home.pill.saved", "Saved"),
      title: tt(t, "home.preview.loopTitle", "Fachinformatiker AE • React • Frankfurt"),
      badges: [
        tt(t, "home.preview.badge1", "Radius: 30km"),
        tt(t, "home.preview.badge2", "Mode: hybrid"),
        tt(t, "home.preview.badge3", "Posted: 7d"),
        tt(t, "home.preview.badge4", "Lang: de/en"),
      ],
    },
    links: {
      title: tt(t, "home.preview.links", "Platform links"),
      openLabel: tt(t, "home.preview.open", "Open"),
      items: ["LinkedIn", "StepStone", "Indeed", "XING"],
    },
    pipeline: {
      title: tt(t, "home.preview.pipeline", "Pipeline"),
      pills: [
        { label: tt(t, "home.pill.applied", "Applied"), tone: "warning" },
        { label: tt(t, "home.pill.interview", "Interview"), tone: "info" },
        { label: tt(t, "home.pill.offer", "Offer"), tone: "success" },
      ],
      stats: [
        { k: tt(t, "home.preview.saved", "Saved"), v: "12" },
        { k: tt(t, "home.preview.applied", "Applied"), v: "7" },
        { k: tt(t, "home.preview.interview", "Interview"), v: "2" },
      ],
    },
  };
}
