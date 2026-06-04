export type TabKey = "overview" | "sources" | "preview" | "history" | "analytics" | "settings";

export interface StatTile {
  label: string;
  value: string | number;
  sub: string;
  accent: boolean;
}

export type ChipDef = { label: string; value: string };
