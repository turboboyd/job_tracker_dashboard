import assert from "node:assert/strict";

import type { BoardColumnKey } from "src/entities/application/model/status";

import { APPLICATION_BOARD_COLUMNS } from "../../model/boardStatusMap";
import type { BoardCardItem } from "../../model/types";
import {
  BOARD_COLUMN_FALLBACK_COLOR,
  getBoardColumnColor,
} from "../boardColumnColors";
import { buildBoardColumnSummaries } from "../boardStats.helpers";

function test(_name: string, run: () => void) {
  run();
}

function item(id: string, status: BoardCardItem["status"]): BoardCardItem {
  return {
    id,
    status,
    loopId: "",
    roleTitle: "",
    companyName: "",
    location: "",
    matchScore: null,
    createdAtMs: null,
    isFavorite: false,
  };
}

const identityTranslate = (_key: string, fallback: string) => fallback;

test("buildBoardColumnSummaries returns the five application columns in order", () => {
  const summaries = buildBoardColumnSummaries(new Map(), identityTranslate);

  assert.equal(summaries.length, APPLICATION_BOARD_COLUMNS.length);
  assert.deepEqual(
    summaries.map((s) => s.key),
    [...APPLICATION_BOARD_COLUMNS],
  );
});

test("buildBoardColumnSummaries counts items per column and zero-fills empties", () => {
  const byStatus = new Map<BoardColumnKey, readonly BoardCardItem[]>([
    ["ACTIVE", [item("a", "APPLIED"), item("b", "APPLIED")]],
  ]);

  const summaries = buildBoardColumnSummaries(byStatus, identityTranslate);
  const byKey = new Map(summaries.map((s) => [s.key, s]));

  assert.equal(byKey.get("ACTIVE")?.count, 2);
  assert.equal(byKey.get("INTERVIEW")?.count, 0);
  assert.equal(byKey.get("NO_RESPONSE")?.count, 0);
});

test("buildBoardColumnSummaries applies the translated label and column color", () => {
  const summaries = buildBoardColumnSummaries(
    new Map(),
    (key, fallback) => `t:${key}:${fallback}`,
  );
  const first = summaries[0]!;

  assert.equal(first.key, "ACTIVE");
  assert.equal(first.color, getBoardColumnColor("ACTIVE"));
  assert.ok(first.label.startsWith("t:"));
});

test("getBoardColumnColor returns known colors and falls back for unknown keys", () => {
  assert.equal(getBoardColumnColor("ACTIVE"), "rgb(var(--status-info))");
  assert.equal(getBoardColumnColor("INTERVIEW"), "rgb(var(--status-purple))");
  assert.equal(getBoardColumnColor("OFFER"), "rgb(var(--status-warning))");
  assert.equal(
    getBoardColumnColor("NOT_A_REAL_COLUMN"),
    BOARD_COLUMN_FALLBACK_COLOR,
  );
});
