export function norm(text: string): string {
  return text
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .replace(/[\u201c\u201d\u201e"]/g, '"')
    .replace(/[\u2019\u2018]/g, "'")
    // keep letters, digits and common tech symbols
    .replace(/[^\p{L}\p{N}#+./\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Backward-compatible alias (older patches used normalizeText)
export const normalizeText = norm;

export function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
