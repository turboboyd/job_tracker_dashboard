import assert from "node:assert/strict";

import {
  getBoardColumn,
  STATUS,
} from "../status.constants";

function test(_name: string, run: () => void) {
  run();
}

test("keeps terminal statuses in their dedicated board columns", () => {
  assert.equal(getBoardColumn("OFFER_ACCEPTED"), "HIRED");
  assert.equal(getBoardColumn("START_PLANNED"), "HIRED");
  assert.equal(getBoardColumn("STARTED"), "HIRED");
});

test("keeps archived statuses out of active and rejected columns", () => {
  assert.equal(getBoardColumn("OFFER_DECLINED"), "ARCHIVED");
  assert.equal(getBoardColumn("ARCHIVED_GENERAL"), "ARCHIVED");
  assert.equal(getBoardColumn("KEEP_IN_TOUCH"), "ARCHIVED");
  assert.equal(getBoardColumn("WITHDREW_BEFORE_START"), "ARCHIVED");
});

test("keeps ghosting in no-response analytics", () => {
  assert.equal(getBoardColumn("GHOSTING"), "NO_RESPONSE");
});

test("does not overwrite explicit board columns with stage values", () => {
  assert.equal(STATUS.OFFER_ACCEPTED.stage, "HIRED");
  assert.equal(STATUS.OFFER_ACCEPTED.boardColumn, "HIRED");
  assert.equal(STATUS.OFFER_DECLINED.stage, "ARCHIVED");
  assert.equal(STATUS.OFFER_DECLINED.boardColumn, "ARCHIVED");
});
