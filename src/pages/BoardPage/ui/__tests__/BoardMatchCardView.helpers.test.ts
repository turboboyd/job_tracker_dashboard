import assert from "node:assert/strict";

import type { BoardCardItem } from "../../model/types";
import {
  buildBoardCardViewModel,
  canOpenBoardCard,
  formatBoardCardDate,
  getBoardCardCursorClass,
} from "../BoardMatchCardView.helpers";

function test(_name: string, run: () => void) {
  run();
}

function item(overrides: Partial<BoardCardItem> = {}): BoardCardItem {
  return {
    id: "app-1",
    status: "APPLIED",
    loopId: "loop-1",
    roleTitle: " Frontend Engineer ",
    companyName: " Acme GmbH ",
    location: " Berlin ",
    matchScore: 88,
    createdAtMs: Date.UTC(2026, 3, 20, 12, 0, 0),
    isFavorite: false,
    ...overrides,
  };
}

test("buildBoardCardViewModel trims fields and derives initial + score", () => {
  const vm = buildBoardCardViewModel(item(), " Frontend EU ");

  assert.equal(vm.title, "Frontend Engineer");
  assert.equal(vm.company, "Acme GmbH");
  assert.equal(vm.initial, "A");
  assert.equal(vm.location, "Berlin");
  assert.equal(vm.loopName, "Frontend EU");
  assert.equal(vm.hasScore, true);
  assert.equal(vm.score, 88);
  assert.notEqual(vm.dateLabel, "");
});

test("buildBoardCardViewModel falls back when fields are blank and score missing", () => {
  const vm = buildBoardCardViewModel(
    item({
      roleTitle: "",
      companyName: "   ",
      location: "  ",
      matchScore: null,
      createdAtMs: null,
    }),
    "",
  );

  assert.equal(vm.title, "-");
  assert.equal(vm.company, "-");
  assert.equal(vm.initial, "?");
  assert.equal(vm.location, "");
  assert.equal(vm.loopName, "");
  assert.equal(vm.hasScore, false);
  assert.equal(vm.score, 0);
  assert.equal(vm.dateLabel, "");
});

test("formatBoardCardDate returns empty string for null/non-finite input", () => {
  assert.equal(formatBoardCardDate(null), "");
  assert.equal(formatBoardCardDate(Number.NaN), "");
  assert.notEqual(formatBoardCardDate(Date.UTC(2026, 3, 20)), "");
});

test("canOpenBoardCard blocks busy and overlay states", () => {
  assert.equal(canOpenBoardCard({ busy: false, overlay: false }), true);
  assert.equal(canOpenBoardCard({ busy: true, overlay: false }), false);
  assert.equal(canOpenBoardCard({ busy: false, overlay: true }), false);
});

test("getBoardCardCursorClass returns the correct interaction class", () => {
  assert.equal(
    getBoardCardCursorClass({ busy: false, overlay: true }),
    "cursor-grabbing",
  );
  assert.equal(
    getBoardCardCursorClass({ busy: true, overlay: false }),
    "opacity-60 cursor-not-allowed",
  );
  assert.equal(
    getBoardCardCursorClass({ busy: false, overlay: false }),
    "cursor-pointer md:cursor-grab",
  );
});
