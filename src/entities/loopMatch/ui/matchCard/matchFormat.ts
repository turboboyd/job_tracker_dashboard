import type { LoopPlatform } from "src/entities/loop/model";
import { PLATFORM_REGISTRY } from "src/entities/loop/model/platformRegistry";

const knownPlatforms = new Set<string>(PLATFORM_REGISTRY.map((p) => p.id));

export function normalizePlatform(p: unknown): LoopPlatform | "" {
  if (typeof p !== "string") return "";
  const v = p.trim().toLowerCase();
  if (!v) return "";
  if (!knownPlatforms.has(v)) return "";
  return v as LoopPlatform;
}

export function formatMatchedAt(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${dd}.${mm}.${yyyy}`;
}
