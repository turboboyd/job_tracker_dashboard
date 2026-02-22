// Utilities to keep Firestore values serializable inside Redux state.
//
// Firestore Timestamp is not serializable (class instance), so whenever we
// want to store time-like values in RTK Query cache or Redux state, we convert
// them to plain numbers (epoch millis) or strings.

export function toMillis(value: unknown): number {
  if (value && typeof (value as { toMillis?: unknown }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }

  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : 0;
  }

  // Firestore Timestamp-like POJO: { seconds, nanoseconds }
  const seconds = (value as { seconds?: unknown } | null)?.seconds;
  if (typeof seconds === "number") return seconds * 1000;

  return 0;
}

export function toMillisOptional(value: unknown): number | undefined {
  if (value == null) return undefined;
  const ms = toMillis(value);
  return ms > 0 ? ms : undefined;
}
