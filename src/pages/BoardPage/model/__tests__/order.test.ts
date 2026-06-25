import assert from "node:assert/strict";

import { applyDropToOrder } from "../applyDropToOrder";
import {
  createEmptyOrder,
  ensureIdsExist,
  moveInArray,
  sortByOrder,
} from "../order";
import type { BoardCardItem, BoardOrderByStatus } from "../types";

function test(_name: string, run: () => void) {
  run();
}

function item(id: string, status: BoardCardItem["status"]): BoardCardItem {
  return {
    id,
    status,
    loopId: `loop-${id}`,
    roleTitle: `Role ${id}`,
    companyName: `Company ${id}`,
    location: "Berlin",
    matchScore: null,
    createdAtMs: null,
    isFavorite: false,
  };
}

test("applyDropToOrder moves a card within the same column", () => {
  const order: BoardOrderByStatus = {
    ...createEmptyOrder(),
    ACTIVE: ["a", "b", "c"],
  };

  const next = applyDropToOrder(
    order,
    { matchId: "a", fromStatus: "ACTIVE", fromIndex: 0 },
    "ACTIVE",
    2,
  );

  assert.deepEqual(next.ACTIVE, ["b", "c", "a"]);
  assert.deepEqual(order.ACTIVE, ["a", "b", "c"]);
});

test("applyDropToOrder moves a card across columns and clamps target index", () => {
  const order: BoardOrderByStatus = {
    ...createEmptyOrder(),
    ACTIVE: ["a", "b"],
    INTERVIEW: ["c"],
  };

  const next = applyDropToOrder(
    order,
    { matchId: "b", fromStatus: "ACTIVE", fromIndex: 1 },
    "INTERVIEW",
    99,
  );

  assert.deepEqual(next.ACTIVE, ["a"]);
  assert.deepEqual(next.INTERVIEW, ["c", "b"]);
});

test("ensureIdsExist removes stale ids and appends missing ids to their board columns", () => {
  const order: BoardOrderByStatus = {
    ...createEmptyOrder(),
    ACTIVE: ["stale", "a"],
    INTERVIEW: [],
  };

  ensureIdsExist(order, [
    item("a", "APPLIED"),
    item("b", "HR_CALL_SCHEDULED"),
    item("c", "OFFER_RECEIVED"),
  ]);

  assert.deepEqual(order.ACTIVE, ["a"]);
  assert.deepEqual(order.INTERVIEW, ["b"]);
  assert.deepEqual(order.OFFER, ["c"]);
});

test("ensureIdsExist buckets non-board columns (e.g. HIRED) into ACTIVE", () => {
  const order: BoardOrderByStatus = { ...createEmptyOrder() };

  // OFFER_ACCEPTED resolves to the HIRED column, which the board does not render,
  // so its id must fall back into ACTIVE.
  ensureIdsExist(order, [item("hired", "OFFER_ACCEPTED")]);

  assert.deepEqual(order.ACTIVE, ["hired"]);
  assert.deepEqual(order.HIRED, []);
});

test("moveInArray is immutable and ignores invalid source indexes", () => {
  const source = ["a", "b", "c"];

  assert.deepEqual(moveInArray(source, 0, 2), ["b", "c", "a"]);
  assert.deepEqual(source, ["a", "b", "c"]);
  assert.deepEqual(moveInArray(source, 99, 0), ["a", "b", "c"]);
});

test("sortByOrder follows stored order and keeps unknown ids stable at the end", () => {
  const items = [
    item("a", "APPLIED"),
    item("b", "APPLIED"),
    item("c", "APPLIED"),
    item("d", "APPLIED"),
  ];

  assert.deepEqual(
    sortByOrder(items, ["c", "a"]).map((entry) => entry.id),
    ["c", "a", "b", "d"],
  );
});
