import {
  processEmailOutboxItem,
  type EmailProvider,
  type EmailRecipient,
} from "./emailOutbox.worker";
import type {
  EmailOutboxDueQuery,
  EmailOutboxItem,
  EmailOutboxWorkerResult,
} from "./types";

const DEFAULT_BATCH_LIMIT = 20;

export interface EmailOutboxRepository {
  applyResult: (result: EmailOutboxWorkerResult) => Promise<void>;
  listDue: (query: EmailOutboxDueQuery) => Promise<EmailOutboxItem[]>;
}

export interface EmailRecipientResolver {
  resolve: (userId: string) => Promise<EmailRecipient | null>;
}

export interface ProcessEmailOutboxBatchOptions {
  fromEmail: string;
  fromName?: string | undefined;
  limit?: number | undefined;
  now?: Date | undefined;
  provider: EmailProvider;
  recipientResolver: EmailRecipientResolver;
  repository: EmailOutboxRepository;
  retryDelayMinutes?: number | undefined;
}

export interface EmailOutboxBatchSummary {
  failed: number;
  processed: number;
  results: EmailOutboxWorkerResult[];
  scanned: number;
  sent: number;
  skipped: number;
}

export async function processEmailOutboxBatch(
  options: ProcessEmailOutboxBatchOptions,
): Promise<EmailOutboxBatchSummary> {
  const now = options.now ?? new Date();
  const limit = options.limit ?? DEFAULT_BATCH_LIMIT;
  const items = await options.repository.listDue({ limit, now });
  const results: EmailOutboxWorkerResult[] = [];
  let skipped = 0;

  for (const item of items) {
    if (!shouldProcessEmailOutboxItem(item, now)) {
      skipped += 1;
      continue;
    }

    const recipient = await options.recipientResolver.resolve(item.doc.userId);
    const result = recipient
      ? await processEmailOutboxItem(item, {
          fromEmail: options.fromEmail,
          fromName: options.fromName,
          now,
          provider: options.provider,
          recipient,
          retryDelayMinutes: options.retryDelayMinutes,
        })
      : buildMissingRecipientResult(item, now);

    await options.repository.applyResult(result);
    results.push(result);
  }

  return {
    failed: results.filter((result) => result.patch.status === "failed").length,
    processed: results.length,
    results,
    scanned: items.length,
    sent: results.filter((result) => result.patch.status === "sent").length,
    skipped,
  };
}

export function shouldProcessEmailOutboxItem(
  item: EmailOutboxItem,
  now: Date,
): boolean {
  if (item.doc.status === "sent") return false;

  const dueAt =
    item.doc.status === "failed" && item.doc.nextRetryAt
      ? item.doc.nextRetryAt
      : item.doc.sendAfter;

  return dueAt.getTime() <= now.getTime();
}

function buildMissingRecipientResult(
  item: EmailOutboxItem,
  now: Date,
): EmailOutboxWorkerResult {
  return {
    id: item.id,
    patch: {
      attemptCount: (item.doc.attemptCount ?? 0) + 1,
      errorMessage: "Recipient email is missing",
      failedAt: now,
      lastAttemptAt: now,
      status: "failed",
    },
  };
}
