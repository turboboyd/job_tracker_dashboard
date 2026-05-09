import assert from "node:assert/strict";

import {
  processEmailOutboxBatch,
  shouldProcessEmailOutboxItem,
  type EmailOutboxRepository,
} from "../emailOutbox.processor";
import type { EmailProvider } from "../emailOutbox.worker";
import type {
  EmailOutboxItem,
  EmailOutboxReminderDoc,
  EmailOutboxWorkerResult,
} from "../types";

function test(_name: string, run: () => void | Promise<void>) {
  void run();
}

const NOW = new Date("2026-05-20T09:00:00Z");
const FUTURE = new Date("2026-05-20T10:00:00Z");
const FROM_EMAIL = "noreply@example.com";

function reminderItem(overrides: Partial<EmailOutboxReminderDoc> = {}): EmailOutboxItem {
  return {
    id: "reminder-1",
    doc: {
      channel: "email",
      createdAt: NOW,
      dedupeKey: "email:user-1:app-1:30",
      kind: "application_reminder",
      language: "en",
      payload: {
        actionAtMs: Date.parse("2026-05-20T09:30:00Z"),
        appId: "app-1",
        applicationUrl: "https://app.example.com/dashboard/applications/app-1",
        companyName: "NovaSoft",
        nextActionText: "Call back",
        roleTitle: "Frontend Developer",
      },
      sendAfter: NOW,
      status: "pending",
      userId: "user-1",
      ...overrides,
    },
  };
}

function createRepository(items: EmailOutboxItem[]) {
  const results: EmailOutboxWorkerResult[] = [];
  const repository: EmailOutboxRepository = {
    async applyResult(result) {
      results.push(result);
    },
    async listDue() {
      return items;
    },
  };

  return { repository, results };
}

test("shouldProcessEmailOutboxItem respects sendAfter and retry time", () => {
  assert.equal(shouldProcessEmailOutboxItem(reminderItem(), NOW), true);
  assert.equal(
    shouldProcessEmailOutboxItem(reminderItem({ sendAfter: FUTURE }), NOW),
    false,
  );
  assert.equal(
    shouldProcessEmailOutboxItem(
      reminderItem({ nextRetryAt: FUTURE, status: "failed" }),
      NOW,
    ),
    false,
  );
});

test("processEmailOutboxBatch sends due items and persists patches", async () => {
  const { repository, results } = createRepository([reminderItem()]);
  const provider: EmailProvider = {
    async send() {
      return { providerMessageId: "message-1" };
    },
  };

  const summary = await processEmailOutboxBatch({
    fromEmail: FROM_EMAIL,
    now: NOW,
    provider,
    recipientResolver: {
      async resolve() {
        return { email: "denis@example.com" };
      },
    },
    repository,
  });

  assert.equal(summary.scanned, 1);
  assert.equal(summary.processed, 1);
  assert.equal(summary.sent, 1);
  assert.equal(summary.failed, 0);
  assert.equal(results[0]?.patch.status, "sent");
});

test("processEmailOutboxBatch marks missing recipients as failed", async () => {
  const { repository, results } = createRepository([reminderItem()]);
  const provider: EmailProvider = {
    async send() {
      throw new Error("Should not send without recipient");
    },
  };

  const summary = await processEmailOutboxBatch({
    fromEmail: FROM_EMAIL,
    now: NOW,
    provider,
    recipientResolver: {
      async resolve() {
        return null;
      },
    },
    repository,
  });

  assert.equal(summary.failed, 1);
  assert.equal(results[0]?.patch.status, "failed");
  assert.equal(results[0]?.patch.errorMessage, "Recipient email is missing");
});

test("processEmailOutboxBatch skips future items defensively", async () => {
  const { repository, results } = createRepository([
    reminderItem({ sendAfter: FUTURE }),
  ]);
  const provider: EmailProvider = {
    async send() {
      throw new Error("Should not send future items");
    },
  };

  const summary = await processEmailOutboxBatch({
    fromEmail: FROM_EMAIL,
    now: NOW,
    provider,
    recipientResolver: {
      async resolve() {
        return { email: "denis@example.com" };
      },
    },
    repository,
  });

  assert.equal(summary.scanned, 1);
  assert.equal(summary.processed, 0);
  assert.equal(summary.skipped, 1);
  assert.equal(results.length, 0);
});
