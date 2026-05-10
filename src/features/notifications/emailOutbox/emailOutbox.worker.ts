import type {
  EmailOutboxDailyDigestDoc,
  EmailOutboxDoc,
  EmailOutboxItem,
  EmailOutboxReminderDoc,
  EmailOutboxWorkerResult,
} from "./types";

const APP_SIGNATURE = "Job Tracker Dashboard";

export interface EmailRecipient {
  displayName?: string | undefined;
  email: string;
}

export interface EmailSendRequest {
  fromEmail: string;
  fromName?: string | undefined;
  html: string;
  subject: string;
  text: string;
  toEmail: string;
  toName?: string | undefined;
}

export interface EmailSendResult {
  providerMessageId?: string | undefined;
}

export interface EmailProvider {
  send: (message: EmailSendRequest) => Promise<EmailSendResult>;
}

export interface ProcessEmailOutboxItemOptions {
  fromEmail: string;
  fromName?: string | undefined;
  now?: Date | undefined;
  provider: EmailProvider;
  recipient: EmailRecipient;
  retryDelayMinutes?: number | undefined;
}

interface EmailCopy {
  applicationLink: string;
  at: string;
  dailyDigestSubject: string;
  defaultCompany: string;
  defaultRole: string;
  greeting: string;
  reminderSubject: string;
  reason: string;
  signature: string;
  todayCount: (count: number) => string;
}

interface BuiltEmailContent {
  html: string;
  subject: string;
  text: string;
}

export async function processEmailOutboxItem(
  item: EmailOutboxItem,
  options: ProcessEmailOutboxItemOptions,
): Promise<EmailOutboxWorkerResult> {
  const now = options.now ?? new Date();
  const attemptCount = (item.doc.attemptCount ?? 0) + 1;

  try {
    const content = buildEmailContent(item.doc, options.recipient, now);
    const result = await options.provider.send({
      fromEmail: options.fromEmail,
      fromName: options.fromName,
      html: content.html,
      subject: content.subject,
      text: content.text,
      toEmail: options.recipient.email,
      toName: options.recipient.displayName,
    });

    return {
      id: item.id,
      patch: {
        attemptCount,
        lastAttemptAt: now,
        providerMessageId: result.providerMessageId,
        sentAt: now,
        status: "sent",
      },
    };
  } catch (error) {
    return {
      id: item.id,
      patch: {
        attemptCount,
        errorMessage: getErrorMessage(error),
        failedAt: now,
        lastAttemptAt: now,
        nextRetryAt: buildNextRetryAt(now, options.retryDelayMinutes),
        status: "failed",
      },
    };
  }
}

export function buildEmailContent(
  doc: EmailOutboxDoc,
  recipient: EmailRecipient,
  now = new Date(),
): BuiltEmailContent {
  const copy = getEmailCopy(doc.language);

  return doc.kind === "application_reminder"
    ? buildReminderEmailContent(doc, recipient, copy, now)
    : buildDailyDigestEmailContent(doc, recipient, copy, now);
}

function buildReminderEmailContent(
  doc: EmailOutboxReminderDoc,
  recipient: EmailRecipient,
  copy: EmailCopy,
  now: Date,
): BuiltEmailContent {
  const title = getTextOrFallback(doc.payload.roleTitle, copy.defaultRole);
  const company = getTextOrFallback(doc.payload.companyName, copy.defaultCompany);
  const actionTime = formatEmailDateTime(doc.payload.actionAtMs, doc.language);
  const reason = getTextOrFallback(doc.payload.nextActionText, "");
  const subject = `${copy.reminderSubject}: ${title}`;
  const lines = [
    buildGreeting(recipient, copy),
    `${title} / ${company}`,
    `${copy.at}: ${actionTime}`,
    reason ? `${copy.reason}: ${reason}` : "",
    `${copy.applicationLink}: ${doc.payload.applicationUrl}`,
    "",
    copy.signature,
  ].filter((line) => line !== "");

  return {
    html: wrapHtml(subject, lines, now),
    subject,
    text: lines.join("\n"),
  };
}

function buildDailyDigestEmailContent(
  doc: EmailOutboxDailyDigestDoc,
  recipient: EmailRecipient,
  copy: EmailCopy,
  now: Date,
): BuiltEmailContent {
  const subject = copy.dailyDigestSubject;
  const itemLines = doc.payload.items.map((item) => {
    const title = getTextOrFallback(item.roleTitle, copy.defaultRole);
    const company = getTextOrFallback(item.companyName, copy.defaultCompany);
    const time = formatEmailDateTime(item.actionAtMs, doc.language);
    const reason = item.nextActionText.trim() ? ` - ${item.nextActionText.trim()}` : "";

    return `${time}: ${title} / ${company}${reason}`;
  });
  const lines = [
    buildGreeting(recipient, copy),
    copy.todayCount(doc.payload.count),
    ...itemLines,
    `${copy.applicationLink}: ${doc.payload.calendarUrl}`,
    "",
    copy.signature,
  ].filter((line) => line !== "");

  return {
    html: wrapHtml(subject, lines, now),
    subject,
    text: lines.join("\n"),
  };
}

function getEmailCopy(language: string): EmailCopy {
  if (language.startsWith("ru")) {
    return {
      applicationLink: "Ссылка",
      at: "Время",
      dailyDigestSubject: "План заявок на сегодня",
      defaultCompany: "Без компании",
      defaultRole: "Заявка",
      greeting: "Здравствуйте",
      reminderSubject: "Напоминание по заявке",
      reason: "Причина",
      signature: APP_SIGNATURE,
      todayCount: (count) => `Сегодня запланировано действий: ${count}`,
    };
  }

  if (language.startsWith("de")) {
    return {
      applicationLink: "Link",
      at: "Zeit",
      dailyDigestSubject: "Heutiger Bewerbungsplan",
      defaultCompany: "Kein Unternehmen",
      defaultRole: "Bewerbung",
      greeting: "Hallo",
      reminderSubject: "Bewerbungserinnerung",
      reason: "Grund",
      signature: APP_SIGNATURE,
      todayCount: (count) => `Heute geplante Aktionen: ${count}`,
    };
  }

  return {
    applicationLink: "Link",
    at: "Time",
    dailyDigestSubject: "Today's application plan",
    defaultCompany: "No company",
    defaultRole: "Application",
    greeting: "Hi",
    reminderSubject: "Application reminder",
    reason: "Reason",
    signature: APP_SIGNATURE,
    todayCount: (count) => `${count} planned application action(s) today`,
  };
}

function buildGreeting(recipient: EmailRecipient, copy: EmailCopy): string {
  return recipient.displayName?.trim()
    ? `${copy.greeting}, ${recipient.displayName.trim()}!`
    : `${copy.greeting}!`;
}

function wrapHtml(title: string, lines: readonly string[], now: Date): string {
  const paragraphs = lines.map((line) =>
    line
      ? `<p>${escapeHtml(line)}</p>`
      : "<br />",
  );

  return [
    "<!doctype html>",
    "<html>",
    "<body>",
    `<h1>${escapeHtml(title)}</h1>`,
    ...paragraphs,
    `<p style="color:#777;font-size:12px">${escapeHtml(now.toISOString())}</p>`,
    "</body>",
    "</html>",
  ].join("");
}

function buildNextRetryAt(now: Date, retryDelayMinutes: number | undefined): Date | undefined {
  if (!retryDelayMinutes || retryDelayMinutes <= 0) return undefined;

  return new Date(now.getTime() + retryDelayMinutes * 60 * 1000);
}

function formatEmailDateTime(ms: number, language: string): string {
  return new Intl.DateTimeFormat(language, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ms));
}

function getTextOrFallback(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  return trimmed;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown email provider error";
}
