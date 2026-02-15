import type { LoopMatchStatus } from "src/entities/loopMatch";

import { ALL_PLATFORMS, PLATFORM_REGISTRY } from "./platformRegistry";
import type { LoopPlatform } from "./types";

export const LOOP_PLATFORMS: Array<{ value: LoopPlatform; label: string }> =
  PLATFORM_REGISTRY.map((p) => ({ value: p.id, label: p.label }));

export const LOOP_MATCH_STATUSES = [
  { value: "new", label: "New" },
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
] as const satisfies ReadonlyArray<{ value: LoopMatchStatus; label: string }>;

const LOOP_PLATFORM_SET: ReadonlySet<string> = new Set(ALL_PLATFORMS);
export function isLoopPlatform(v: unknown): v is LoopPlatform {
  return typeof v === "string" && LOOP_PLATFORM_SET.has(v);
}

const LOOP_MATCH_STATUS_SET: ReadonlySet<string> = new Set(
  LOOP_MATCH_STATUSES.map((s) => s.value)
);
export function isLoopMatchStatus(v: unknown): v is LoopMatchStatus {
  return typeof v === "string" && LOOP_MATCH_STATUS_SET.has(v);
}
