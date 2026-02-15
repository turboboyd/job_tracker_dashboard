export function trimOrEmpty(v: string | null | undefined): string {
  return (v ?? "").trim();
}

export function toTitleCase(v: string): string {
  const s = trimOrEmpty(v);
  if (!s) return "";
  return s
    .split(/\s+/g)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

export function clampNumber(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}
