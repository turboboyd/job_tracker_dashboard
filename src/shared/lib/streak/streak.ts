export type StreakEvent = {
  createdAt: string | number | Date;
};

function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDate(input: string | number | Date): Date | null {
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}


export function calculateStreak(events: StreakEvent[], now = new Date()): number {
  const days = new Set<string>();

  for (const e of events) {
    const d = parseDate(e.createdAt);
    if (!d) continue;
    days.add(toDayKey(d));
  }

  if (days.size === 0) return 0;

  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);

  let streak = 0;
  while (true) {
    const key = toDayKey(cursor);
    if (!days.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function streakLabel(streak: number): string {
  if (streak <= 0) return "Start your streak";
  if (streak === 1) return "1-day streak";
  return `${streak}-day streak`;
}
