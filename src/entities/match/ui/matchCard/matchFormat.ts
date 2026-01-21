export function normalizePlatform(p: unknown): string {
  if (typeof p === "string") return p.trim();
  if (typeof p === "number") return String(p);
  return "";
}

export function formatMatchedAt(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("de-DE");
}