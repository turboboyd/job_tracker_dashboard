export function getDefaultTimeZone(fallback = "Europe/Berlin"): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (typeof tz === "string" && tz.trim()) return tz;
    return fallback;
  } catch {
    return fallback;
  }
}
