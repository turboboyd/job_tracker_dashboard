const DEFAULT_DURATION_MINUTES = 30;
const FOLD_LIMIT = 75;

export interface IcsEventInput {
  description?: string | undefined;
  durationMinutes?: number | undefined;
  location?: string | undefined;
  startsAt: Date;
  title: string;
  uid: string;
  url?: string | undefined;
}

export interface IcsCalendarInput {
  events: readonly IcsEventInput[];
  now?: Date;
  productId?: string;
  title?: string;
}

export function buildIcsCalendar({
  events,
  now = new Date(),
  productId = "-//Job Tracker Dashboard//Application Plan//EN",
  title = "Application plan",
}: IcsCalendarInput): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${escapeIcsText(productId)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(title)}`,
    ...events.flatMap((event) => buildEventLines(event, now)),
    "END:VCALENDAR",
  ];

  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

export function downloadIcsFile(fileName: string, contents: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const blob = new Blob([contents], { type: "text/calendar;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = sanitizeIcsFileName(fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
}

export function sanitizeIcsFileName(fileName: string): string {
  const cleaned = fileName
    .trim()
    .replace(/\.ics$/i, "")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return `${cleaned || "application-plan"}.ics`;
}

function buildEventLines(event: IcsEventInput, now: Date): string[] {
  const durationMinutes = event.durationMinutes ?? DEFAULT_DURATION_MINUTES;
  const endsAt = new Date(event.startsAt.getTime() + durationMinutes * 60 * 1000);
  const lines = [
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(event.uid)}`,
    `DTSTAMP:${formatIcsUtc(now)}`,
    `DTSTART:${formatIcsUtc(event.startsAt)}`,
    `DTEND:${formatIcsUtc(endsAt)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
  ];

  appendOptionalLine(lines, "DESCRIPTION", event.description);
  appendOptionalLine(lines, "LOCATION", event.location);
  appendOptionalLine(lines, "URL", event.url);

  return [...lines, "END:VEVENT"];
}

function appendOptionalLine(lines: string[], field: string, value: string | undefined): void {
  const trimmed = value?.trim();
  if (trimmed) {
    lines.push(`${field}:${escapeIcsText(trimmed)}`);
  }
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function foldIcsLine(line: string): string {
  if (line.length <= FOLD_LIMIT) return line;

  const chunks: string[] = [line.slice(0, FOLD_LIMIT)];
  for (let index = FOLD_LIMIT; index < line.length; index += FOLD_LIMIT - 1) {
    chunks.push(` ${line.slice(index, index + FOLD_LIMIT - 1)}`);
  }

  return chunks.join("\r\n");
}

function formatIcsUtc(date: Date): string {
  const year = date.getUTCFullYear();
  const month = padDatePart(date.getUTCMonth() + 1);
  const day = padDatePart(date.getUTCDate());
  const hours = padDatePart(date.getUTCHours());
  const minutes = padDatePart(date.getUTCMinutes());
  const seconds = padDatePart(date.getUTCSeconds());

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}
