import React from "react";

import type { StatusTone } from "../StatusPill";

export type CtaBlock = React.ReactNode;

export type StatItem = {
  label: string;
  value: string;
  hint: string;
};

export type FeatureItem = {
  title: string;
  text: string;
  points: string[];
};

export type PreviewModel = {
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
};
