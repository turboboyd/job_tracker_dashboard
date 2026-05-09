export function uniqLoopIds(ids: string[]): string[] {
  return Array.from(new Set(ids));
}
