import assert from "node:assert/strict";

import {
  createAdminAuthRecipientResolver,
  createEmailOutboxRuntime,
  createFirestoreEmailOutboxRepository,
  type AdminAuthLike,
  type AdminFirestoreLike,
} from "../emailOutbox.runtime";
import type { EmailProvider } from "../emailOutbox.worker";

function test(_name: string, run: () => void | Promise<void>) {
  void run();
}

const NOW = new Date("2026-05-20T09:00:00Z");
const RECIPIENT_EMAIL = "denis@example.com";

class FakeDocumentRef {
  updates: Record<string, unknown>[] = [];

  async update(data: Record<string, unknown>) {
    this.updates.push(data);
  }
}

class FakeQuery {
  filters: [string, string, unknown][] = [];
  limitValue = 0;
  order: [string, string | undefined] | null = null;

  constructor(private readonly docs: FakeSnapshot[]) {}

  where(field: string, operator: string, value: unknown) {
    this.filters.push([field, operator, value]);
    return this;
  }

  orderBy(field: string, direction?: "asc" | "desc") {
    this.order = [field, direction];
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  async get() {
    return { docs: this.docs.slice(0, this.limitValue || this.docs.length) };
  }
}

class FakeSnapshot {
  constructor(
    readonly id: string,
    private readonly value: Record<string, unknown> | undefined,
    readonly ref: FakeDocumentRef,
  ) {}

  data() {
    return this.value;
  }
}

function createReminderData(overrides: Record<string, unknown> = {}) {
  return {
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
  };
}

test("createFirestoreEmailOutboxRepository maps due docs and applies patches", async () => {
  const ref = new FakeDocumentRef();
  const query = new FakeQuery([
    new FakeSnapshot("outbox-1", createReminderData(), ref),
    new FakeSnapshot("bad", { channel: "email" }, new FakeDocumentRef()),
  ]);
  const db: AdminFirestoreLike = {
    collectionGroup(collectionId) {
      assert.equal(collectionId, "notificationOutbox");
      return query;
    },
  };
  const repository = createFirestoreEmailOutboxRepository(db);

  const items = await repository.listDue({ limit: 10, now: NOW });
  await repository.applyResult({
    id: "outbox-1",
    patch: {
      attemptCount: 1,
      lastAttemptAt: NOW,
      providerMessageId: "message-1",
      sentAt: NOW,
      status: "sent",
    },
  });

  assert.equal(items.length, 1);
  assert.equal(items[0]?.doc.kind, "application_reminder");
  assert.deepEqual(query.filters.map(([field, operator]) => [field, operator]), [
    ["channel", "=="],
    ["status", "in"],
    ["sendAfter", "<="],
  ]);
  assert.deepEqual(ref.updates[0], {
    attemptCount: 1,
    lastAttemptAt: NOW,
    providerMessageId: "message-1",
    sentAt: NOW,
    status: "sent",
  });
});

test("createAdminAuthRecipientResolver returns active users with email only", async () => {
  const auth: AdminAuthLike = {
    async getUser(userId) {
      if (userId === "disabled") {
        return { disabled: true, email: "disabled@example.com" };
      }

      if (userId === "missing") {
        return {};
      }

      return { displayName: " Denis ", email: ` ${RECIPIENT_EMAIL} ` };
    },
  };
  const resolver = createAdminAuthRecipientResolver(auth);

  assert.deepEqual(await resolver.resolve("user-1"), {
    displayName: "Denis",
    email: RECIPIENT_EMAIL,
  });
  assert.equal(await resolver.resolve("disabled"), null);
  assert.equal(await resolver.resolve("missing"), null);
});

test("createEmailOutboxRuntime wires repository, resolver and provider", async () => {
  const repository = createFirestoreEmailOutboxRepository({
    collectionGroup() {
      return new FakeQuery([
        new FakeSnapshot("outbox-1", createReminderData(), new FakeDocumentRef()),
      ]);
    },
  });
  const provider: EmailProvider = {
    async send() {
      return { providerMessageId: "message-1" };
    },
  };
  const runtime = createEmailOutboxRuntime({
    fromEmail: "noreply@example.com",
    now: NOW,
    provider,
    recipientResolver: {
      async resolve() {
        return { email: RECIPIENT_EMAIL };
      },
    },
    repository,
  });

  const summary = await runtime.run({ limit: 5 });

  assert.equal(summary.scanned, 1);
  assert.equal(summary.sent, 1);
});
