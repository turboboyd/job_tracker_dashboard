import assert from "node:assert/strict";

import type { LoopMatch } from "src/entities/loopMatch";

import {
  deriveMatchesFilterChips,
  matchesFiltersDefaults,
  selectVisibleMatches,
  type MatchesFiltersState,
} from "../filters";
import {
  buildLoopIdToName,
  buildMatchesResetKey,
  buildPlatformOptions,
  buildStatusOptions,
  findMatchById,
  getPagedMatches,
  stableFiltersKey,
} from "../matchesViewModel";

const BASE_DATE = "2026-01-01T00:00:00.000Z";
const LINKEDIN_PLATFORM = "linkedin";
const FRONTEND_LOOP_NAME = "Frontend loop";

function test(_name: string, run: () => void) {
  run();
}

function filters(patch: Partial<MatchesFiltersState> = {}): MatchesFiltersState {
  return {
    ...matchesFiltersDefaults,
    ...patch,
  };
}

function match(patch: Partial<LoopMatch> & Pick<LoopMatch, "id">): LoopMatch {
  const { id, ...overrides } = patch;

  return {
    id,
    loopId: "loop-a",
    title: "Frontend Engineer",
    company: "Acme",
    location: "Berlin",
    platform: LINKEDIN_PLATFORM,
    url: `https://example.test/${id}`,
    description: "React TypeScript role",
    status: "SAVED",
    matchedAt: BASE_DATE,
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
    ...overrides,
  } as LoopMatch;
}

const matches = [
  match({
    id: "older",
    loopId: "loop-a",
    title: "Backend Developer",
    company: "Beta",
    platform: "indeed",
    status: "APPLIED",
    matchedAt: BASE_DATE,
  }),
  match({
    id: "newer",
    loopId: "loop-b",
    title: "Frontend Engineer",
    company: "Acme",
    platform: LINKEDIN_PLATFORM,
    status: "HR_CALL_SCHEDULED",
    matchedAt: "2026-01-03T00:00:00.000Z",
  }),
  match({
    id: "middle",
    loopId: "loop-a",
    title: "QA Engineer",
    company: "Core Labs",
    platform: LINKEDIN_PLATFORM,
    status: "SAVED",
    matchedAt: "2026-01-02T00:00:00.000Z",
  }),
];

test("selectVisibleMatches filters by search, loop, platform, and status", () => {
  const visible = selectVisibleMatches(
    matches,
    filters({
      q: "engineer",
      loopIds: ["loop-b"],
      platforms: ["LinkedIn"],
      statuses: ["HR_CALL_SCHEDULED"],
    }),
  );

  assert.deepEqual(
    visible.map((item) => item.id),
    ["newer"],
  );
});

test("selectVisibleMatches sorts by date and text fields without mutating source", () => {
  assert.deepEqual(
    selectVisibleMatches(matches, filters()).map((item) => item.id),
    ["newer", "middle", "older"],
  );
  assert.deepEqual(
    selectVisibleMatches(matches, filters({ sort: "matchedAtAsc" })).map((item) => item.id),
    ["older", "middle", "newer"],
  );
  assert.deepEqual(
    selectVisibleMatches(matches, filters({ sort: "companyAsc" })).map((item) => item.id),
    ["newer", "older", "middle"],
  );
  assert.deepEqual(
    matches.map((item) => item.id),
    ["older", "newer", "middle"],
  );
});

test("deriveMatchesFilterChips creates reset patches and resolves loop names", () => {
  const chips = deriveMatchesFilterChips({
    filters: filters({
      q: "  react  ",
      sort: "titleAsc",
      loopIds: ["loop-a", "missing-loop"],
      platforms: [LINKEDIN_PLATFORM],
      statuses: ["SAVED"],
    }),
    loopOptions: [{ id: "loop-a", name: FRONTEND_LOOP_NAME }],
  });

  assert.deepEqual(
    chips.map((chip) => chip.key),
    ["q", "sort", "loops", "platforms", "statuses"],
  );
  assert.deepEqual(chips[0], { key: "q", kind: "q", q: "react", patch: { q: "" } });
  assert.deepEqual(chips[2], {
    key: "loops",
    kind: "loops",
    loopNames: [FRONTEND_LOOP_NAME, "missing-loop"],
    patch: { loopIds: [] },
  });
});

test("view-model helpers build lookup maps, options and stable keys", () => {
  const loopOptions = [
    { id: "loop-a", name: FRONTEND_LOOP_NAME },
    { id: "loop-b", name: "Backend loop" },
  ];

  assert.deepEqual(Array.from(buildLoopIdToName(loopOptions)), [
    ["loop-a", FRONTEND_LOOP_NAME],
    ["loop-b", "Backend loop"],
  ]);
  assert.deepEqual(buildPlatformOptions(matches), ["indeed", LINKEDIN_PLATFORM]);
  assert.deepEqual(buildStatusOptions(matches), [
    "APPLIED",
    "HR_CALL_SCHEDULED",
    "SAVED",
  ]);
  assert.equal(
    stableFiltersKey(
      filters({
        q: "x",
        loopIds: ["b", "a"],
        platforms: ["z", "a"],
        statuses: ["SAVED", "APPLIED"],
      }),
    ),
    "q=x|sort=matchedAtDesc|loops=a,b|platforms=a,z|statuses=APPLIED,SAVED",
  );
});

test("pagination, reset keys and lookup helpers are deterministic", () => {
  assert.deepEqual(getPagedMatches(matches, 2, 2).map((item) => item.id), ["middle"]);
  assert.equal(findMatchById(matches, "newer")?.company, "Acme");
  assert.equal(findMatchById(matches, "missing"), null);
  assert.equal(
    buildMatchesResetKey({
      userId: "user-1",
      filtersKey: stableFiltersKey(filters({ q: "react" })),
      totalMatches: matches.length,
      visibleMatches: 1,
    }),
    "userId:user-1|filters:q=react|sort=matchedAtDesc|loops=|platforms=|statuses=|total:3|visible:1",
  );
});
