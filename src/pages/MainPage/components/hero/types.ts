import type React from "react";

import type { StatusTone } from "../StatusPill";

export type CtaBlock = React.ReactNode;

export interface StatItem {
  label: string;
  value: string;
  hint: string;
}

export interface FeatureItem {
  title: string;
  text: string;
  points: string[];
}

export interface PreviewModel {
  header: {
    title: string;
    subtitle: string;
    liveLabel: string;
    demoLabel: string;
  };
  loop: {
    label: string;
    statusLabel: string;
    title: string;
    badges: string[];
  };
  links: {
    title: string;
    openLabel: string;
    items: string[];
  };
  pipeline: {
    title: string;
    pills: { label: string; tone: StatusTone }[];
    stats: { k: string; v: string }[];
  };
}
