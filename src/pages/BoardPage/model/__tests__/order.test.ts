import assert from "node:assert/strict";

import type { LoopMatch } from "src/entities/loopMatch";

import { applyDropToOrder } from "../applyDropToOrder";
import {
  createEmptyOrder,
  ensureIdsExist,
  moveInArray,
  sortByOrder,
} from "../order";
import type { BoardOrderByStatus } from "../types";

function test(_name: string, run: () => void) {
  run();
}

function match(id: string, status: LoopMatch["status"]): LoopMatch {
  return {
    id,
    loopId: `loop-${id}`,
    status,
  } as LoopMatch;
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
    match("a", "APPLIED"),
    match("b", "HR_CALL_SCHEDULED"),
    match("c", "OFFER_ACCEPTED"),
  ]);

  assert.deepEqual(order.ACTIVE, ["a"]);
  assert.deepEqual(order.INTERVIEW, ["b"]);
  assert.deepEqual(order.HIRED, ["c"]);
});

test("moveInArray is immutable and ignores invalid source indexes", () => {
  const source = ["a", "b", "c"];

  assert.deepEqual(moveInArray(source, 0, 2), ["b", "c", "a"]);
  assert.deepEqual(source, ["a", "b", "c"]);
  assert.deepEqual(moveInArray(source, 99, 0), ["a", "b", "c"]);
});

test("sortByOrder follows stored order and keeps unknown ids stable at the end", () => {
  const matches = [
    match("a", "APPLIED"),
    match("b", "APPLIED"),
    match("c", "APPLIED"),
    match("d", "APPLIED"),
  ];

  assert.deepEqual(
    sortByOrder(matches, ["c", "a"]).map((item) => item.id),
    ["c", "a", "b", "d"],
  );
});
