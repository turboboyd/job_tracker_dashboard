import assert from "node:assert/strict";

import {
  normalizeAppStatus,
  normalizeStatusKey,
} from "../status.normalization";

function test(_name: string, run: () => void) {
  run();
}

test("normalizes exact status keys", () => {
  assert.equal(normalizeStatusKey("APPLIED"), "APPLIED");
  assert.equal(normalizeStatusKey("OFFER_ACCEPTED"), "OFFER_ACCEPTED");
});

test("normalizes human-style and legacy status strings", () => {
  assert.equal(normalizeStatusKey("offer accepted"), "OFFER_ACCEPTED");
  assert.equal(normalizeStatusKey("offer-accepted"), "OFFER_ACCEPTED");
  assert.equal(normalizeStatusKey("INTERVIEW_1"), "HR_CALL_SCHEDULED");
  assert.equal(normalizeStatusKey("NO_RESPONSE"), "GHOSTING");
});

test("normalizes board columns to their representative default status", () => {
  assert.equal(normalizeStatusKey("ACTIVE"), "SAVED");
  assert.equal(normalizeStatusKey("INTERVIEW"), "HR_CALL_SCHEDULED");
  assert.equal(normalizeStatusKey("HIRED"), "OFFER_ACCEPTED");
});

test("returns null for unsupported status values", () => {
  assert.equal(normalizeStatusKey("not a status"), null);
  assert.equal(normalizeStatusKey(undefined), null);
  assert.equal(normalizeStatusKey({ status: "APPLIED" }), null);
});

test("keeps valid subStatus and corrects stale stage", () => {
  assert.deepEqual(
    normalizeAppStatus({
      process: {
        stage: "ACTIVE",
        subStatus: "OFFER_ACCEPTED",
      },
    }),
    {
      stage: "HIRED",
      subStatus: "OFFER_ACCEPTED",
      changed: true,
    },
  );
});

test("keeps valid process status unchanged when stage matches subStatus", () => {
  assert.deepEqual(
    normalizeAppStatus({
      process: {
        stage: "INTERVIEW",
        subStatus: "HR_CALL_SCHEDULED",
      },
    }),
    {
      stage: "INTERVIEW",
      subStatus: "HR_CALL_SCHEDULED",
      changed: false,
    },
  );
});

test("falls back from legacy process.status", () => {
  assert.deepEqual(
    normalizeAppStatus({ process: { status: "REJECTED" } }),
    {
      stage: "REJECTED",
      subStatus: "REJECTED_PRE_INTERVIEW",
      changed: true,
    },
  );
});

test("falls back to saved active state for invalid objects", () => {
  assert.deepEqual(normalizeAppStatus(null), {
    stage: "ACTIVE",
    subStatus: "SAVED",
    changed: true,
  });
});
