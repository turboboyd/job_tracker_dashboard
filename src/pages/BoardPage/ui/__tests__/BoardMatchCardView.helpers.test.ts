import assert from "node:assert/strict";

import type { LoopMatch } from "src/entities/loopMatch";

import {
  buildBoardMatchCardViewModel,
  canOpenBoardMatchCard,
  getBoardMatchCursorClass,
} from "../BoardMatchCardView.helpers";

const BASE_DATE = "2026-04-20T12:00:00.000Z";
const LINKEDIN_PLATFORM = "linkedin";

function test(_name: string, run: () => void) {
  run();
}

function match(overrides: Partial<LoopMatch> = {}): LoopMatch {
  return {
    id: "match-1",
    loopId: "loop-1",
    title: " Frontend Engineer ",
    company: " Acme GmbH ",
    location: " Berlin ",
    platform: LINKEDIN_PLATFORM,
    url: " https://example.com/job ",
    description: "",
    status: "APPLIED",
    matchedAt: BASE_DATE,
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
    ...overrides,
  } as LoopMatch;
}

test("buildBoardMatchCardViewModel trims display fields and builds metadata", () => {
  const vm = buildBoardMatchCardViewModel(match(), " Job search loop ");

  assert.equal(vm.title, "Frontend Engineer");
  assert.equal(vm.company, "Acme GmbH");
  assert.equal(vm.url, "https://example.com/job");
  assert.equal(vm.hasUrl, true);
  assert.equal(vm.meta, "Berlin / LINKEDIN / 20.04.2026 / Job search loop");
});

test("buildBoardMatchCardViewModel uses fallback display values and ignores invalid platform", () => {
  const vm = buildBoardMatchCardViewModel(
    match({
      company: "   ",
      title: "",
      location: " Remote ",
      matchedAt: "not-a-date",
      platform: "unknown-platform" as LoopMatch["platform"],
      url: "   ",
    }),
    "",
  );

  assert.equal(vm.title, "-");
  assert.equal(vm.company, "-");
  assert.equal(vm.url, "");
  assert.equal(vm.hasUrl, false);
  assert.equal(vm.meta, "Remote / not-a-date");
});

test("canOpenBoardMatchCard blocks busy and overlay states", () => {
  assert.equal(canOpenBoardMatchCard({ busy: false, overlay: false }), true);
  assert.equal(canOpenBoardMatchCard({ busy: true, overlay: false }), false);
  assert.equal(canOpenBoardMatchCard({ busy: false, overlay: true }), false);
});

test("getBoardMatchCursorClass returns the correct interaction class", () => {
  assert.equal(
    getBoardMatchCursorClass({ busy: false, overlay: true }),
    "cursor-grabbing",
  );
  assert.equal(
    getBoardMatchCursorClass({ busy: true, overlay: false }),
    "opacity-60 cursor-not-allowed",
  );
  assert.equal(
    getBoardMatchCursorClass({ busy: false, overlay: false }),
    "cursor-pointer md:cursor-grab",
  );
});
