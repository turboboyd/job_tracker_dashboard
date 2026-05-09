import { PLATFORM_REGISTRY } from "src/entities/loop/model";

const MATCH_META_SEPARATOR = " / ";
const knownPlatforms = new Set<string>(
  PLATFORM_REGISTRY.map((platform) => platform.id),
);

export function normalizePlatform(platform: unknown): string {
  if (typeof platform !== "string") return "";

  const normalized = platform.trim().toLowerCase();
  if (!normalized) return "";
  if (!knownPlatforms.has(normalized)) return "";

  return normalized;
}

export function formatPlatformLabel(platform: unknown): string {
  const normalized = normalizePlatform(platform);
  return normalized ? normalized.toUpperCase() : "";
}

export function formatMatchedAt(iso: string): string {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${dd}.${mm}.${yyyy}`;
}

function toMetaPart(part: unknown): string {
  if (typeof part === "string") {
    return part.trim();
  }

  if (
    typeof part === "number" ||
    typeof part === "boolean" ||
    typeof part === "bigint"
  ) {
    return String(part).trim();
  }

  return "";
}

export function buildMatchMeta(parts: readonly unknown[]): string {
  return parts.map(toMetaPart).filter(Boolean).join(MATCH_META_SEPARATOR);
}
