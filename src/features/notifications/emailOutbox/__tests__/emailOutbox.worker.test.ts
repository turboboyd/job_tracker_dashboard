import assert from "node:assert/strict";

import {
  buildEmailContent,
  processEmailOutboxItem,
  type EmailProvider,
} from "../emailOutbox.worker";
import type { EmailOutboxItem } from "../types";

function test(_name: string, run: () => void | Promise<void>) {
  void run();
}

const NOW = new Date("2026-05-20T09:00:00Z");
const RECIPIENT_EMAIL = "denis@example.com";

const reminderItem: EmailOutboxItem = {
  id: "reminder-1",
  doc: {
    channel: "email",
    createdAt: NOW,
    dedupeKey: "email:user-1:app-1:30",
    kind: "application_reminder",
    language: "en",
    payload: {
      actionAtMs: Date.parse("2026-05-20T10:00:00Z"),
      appId: "app-1",
      applicationUrl: "https://app.example.com/dashboard/applications/app-1",
      companyName: "NovaSoft",
      nextActionText: "Call back",
      roleTitle: "Frontend Developer",
    },
    sendAfter: NOW,
    status: "pending",
    userId: "user-1",
  },
};

test("buildEmailContent creates a readable reminder email", () => {
  const content = buildEmailContent(
    reminderItem.doc,
    { displayName: "Denis", email: RECIPIENT_EMAIL },
    NOW,
  );

  assert.equal(content.subject, "Application reminder: Frontend Developer");
  assert.match(content.text, /Hi, Denis!/);
  assert.match(content.text, /Call back/);
  assert.match(content.html, /Frontend Developer/);
});

test("processEmailOutboxItem returns sent patch after provider success", async () => {
  const sentMessages: unknown[] = [];
  const provider: EmailProvider = {
    async send(message) {
      sentMessages.push(message);
      return { providerMessageId: "provider-1" };
    },
  };

  const result = await processEmailOutboxItem(reminderItem, {
    fromEmail: "noreply@example.com",
    fromName: "Job Tracker",
    now: NOW,
    provider,
    recipient: { email: RECIPIENT_EMAIL },
  });

  assert.equal(result.id, reminderItem.id);
  assert.equal(result.patch.status, "sent");
  assert.equal(result.patch.providerMessageId, "provider-1");
  assert.equal(sentMessages.length, 1);
});

test("processEmailOutboxItem returns failed patch after provider error", async () => {
  const provider: EmailProvider = {
    async send() {
      throw new Error("SMTP unavailable");
    },
  };

  const result = await processEmailOutboxItem(reminderItem, {
    fromEmail: "noreply@example.com",
    now: NOW,
    provider,
    recipient: { email: RECIPIENT_EMAIL },
    retryDelayMinutes: 15,
  });

  assert.equal(result.patch.status, "failed");
  assert.equal(result.patch.errorMessage, "SMTP unavailable");
  assert.equal(result.patch.nextRetryAt?.toISOString(), "2026-05-20T09:15:00.000Z");
});
