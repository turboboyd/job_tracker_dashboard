import type React from "react";

export type LanguageLabelMode = "short" | "full";

export interface LanguageItem<L extends string> {
  code: L;
  shortLabel: string;
  fullLabel: string;
  disabled?: boolean;
}

export interface LanguageSelectProps<L extends string> {
  labelMode?: LanguageLabelMode;
  value: L;
  onChange: (next: L) => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  radius?: "md" | "lg" | "xl";
  width?: "full" | "auto";
  intent?: "default" | "error" | "success" | "warning";
  shadow?: "none" | "sm" | "md";
  placeholder?: React.ReactNode;
}
