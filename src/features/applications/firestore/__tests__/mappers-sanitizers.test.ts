import assert from "node:assert/strict";

import { Timestamp } from "firebase/firestore";

import {
  buildCreateApplicationDoc,
  mapLegacyStatusToStageSub,
} from "../mappers";
import {
  sanitizeHistoryEvents,
  sanitizeWritePatch,
} from "../sanitizers";
import type { HistoryEventDoc } from "../types";

function test(_name: string, run: () => void | Promise<void>) {
  const result = run();

  if (result && typeof result.then === "function") {
    result.catch((error) => {
      queueMicrotask(() => {
        throw error;
      });
    });
  }
}

function ts(value = "2026-01-02T03:04:05.000Z") {
  return Timestamp.fromDate(new Date(value));
}

test("buildCreateApplicationDoc builds a minimal manual application document", () => {
  const timestamp = ts();
  const doc = buildCreateApplicationDoc(
    "user-1",
    {
      companyName: "Acme GmbH",
      roleTitle: "Frontend Engineer",
    },
    timestamp,
  );

  assert.equal(doc.createdBy, "user-1");
  assert.equal(doc.archived, false);
  assert.equal(doc.createdAt, timestamp);
  assert.equal(doc.updatedAt, timestamp);
  assert.deepEqual(doc.job, {
    companyName: "Acme GmbH",
    roleTitle: "Frontend Engineer",
  });
  assert.deepEqual(doc.notes, { tags: [] });
  assert.equal(doc.loopLinkage?.loopId, "manual");
  assert.equal(doc.loopLinkage?.source, "manual");
  assert.equal(doc.process.status, "SAVED");
  assert.equal(doc.process.contactAttempts, 0);
  assert.equal(doc.process.followUpLevel, 0);
  assert.equal(doc.process.needsFollowUp, false);
  assert.equal(doc.process.needsReapplySuggestion, false);
});

test("buildCreateApplicationDoc includes optional job, notes, vacancy, and loop linkage fields", () => {
  const timestamp = ts();
  const matchedAt = new Date("2026-02-03T04:05:06.000Z");
  const doc = buildCreateApplicationDoc(
    "user-1",
    {
      companyName: "Acme GmbH",
      roleTitle: "Backend Engineer",
      currentNote: "Promising role",
      employmentType: "FULL_TIME",
      legacyMatchId: "match-1",
      locationText: "Berlin",
      loopId: "loop-1",
      loopMatchedAt: matchedAt,
      loopPlatform: "linkedin",
      loopSource: "import",
      rawDescription: "TypeScript role",
      source: "LinkedIn",
      status: "APPLIED",
      tags: ["ts", "react"],
      vacancyUrl: "https://example.test/job",
      workMode: "HYBRID",
    },
    timestamp,
  );

  assert.deepEqual(doc.job, {
    companyName: "Acme GmbH",
    roleTitle: "Backend Engineer",
    vacancyUrl: "https://example.test/job",
    source: "LinkedIn",
    locationText: "Berlin",
    workMode: "HYBRID",
    employmentType: "FULL_TIME",
  });
  assert.deepEqual(doc.notes, {
    currentNote: "Promising role",
    tags: ["ts", "react"],
  });
  assert.deepEqual(doc.vacancy, { rawDescription: "TypeScript role" });
  assert.equal(doc.process.status, "APPLIED");
  assert.equal(doc.loopLinkage?.loopId, "loop-1");
  assert.equal(doc.loopLinkage?.platform, "linkedin");
  assert.equal(doc.loopLinkage?.source, "import");
  assert.equal(doc.loopLinkage?.legacyMatchId, "match-1");
  assert.equal(doc.loopLinkage?.matchedAt?.toDate().toISOString(), matchedAt.toISOString());
});

test("mapLegacyStatusToStageSub maps legacy process statuses to stage and sub-status", () => {
  assert.deepEqual(mapLegacyStatusToStageSub("SAVED"), {
    stage: "ACTIVE",
    subStatus: "SAVED",
  });
  assert.deepEqual(mapLegacyStatusToStageSub("INTERVIEW_2"), {
    stage: "INTERVIEW",
    subStatus: "TECH_INTERVIEW_SCHEDULED",
  });
  assert.deepEqual(mapLegacyStatusToStageSub("TEST_TASK"), {
    stage: "INTERVIEW",
    subStatus: "TEST_TASK_ASSIGNED",
  });
  assert.deepEqual(mapLegacyStatusToStageSub("NO_RESPONSE"), {
    stage: "NO_RESPONSE",
    subStatus: "GHOSTING",
  });
});

test("sanitizeWritePatch recursively removes undefined values and preserves nulls and timestamps", () => {
  const timestamp = ts();

  const sanitized = sanitizeWritePatch({
    keep: "value",
    remove: undefined,
    nested: {
      keep: 1,
      remove: undefined,
      deeper: { remove: undefined, keep: null },
    },
    list: ["a", undefined, { keep: true, remove: undefined }],
    timestamp,
  });

  assert.deepEqual(sanitized, {
    keep: "value",
    nested: {
      keep: 1,
      deeper: { keep: null },
    },
    list: ["a", { keep: true }],
    timestamp,
  });
  assert.equal(sanitized.timestamp, timestamp);
});

test("sanitizeHistoryEvents sanitizes every history event without changing the array order", () => {
  const events = [
    {
      actor: "user",
      type: "COMMENT",
      comment: "first",
      oldValue: undefined,
    },
    {
      actor: "system",
      type: "SYSTEM",
      comment: undefined,
      newValue: { keep: "yes", remove: undefined },
    },
  ] as unknown as HistoryEventDoc[];

  assert.deepEqual(sanitizeHistoryEvents(events), [
    {
      actor: "user",
      type: "COMMENT",
      comment: "first",
    },
    {
      actor: "system",
      type: "SYSTEM",
      newValue: { keep: "yes" },
    },
  ]);
});
