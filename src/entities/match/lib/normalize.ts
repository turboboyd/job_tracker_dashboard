export function norm(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}
