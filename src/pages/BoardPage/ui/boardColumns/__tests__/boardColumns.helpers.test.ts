import assert from "node:assert/strict";

import type { BoardColumnKey } from "src/entities/application";
import type { LoopMatch } from "src/entities/loopMatch";

import {
  findActiveMatchById,
  getActiveLoopName,
  isPendingDropSettled,
  resolveDragStartPayload,
} from "../boardColumnsDnd.helpers";
import type { ColumnsState } from "../columnsState";
import {
  buildColumnsFromVm,
  findContainerOfId,
  getLaneStatusFromOverId,
  insertIntoList,
  removeFromList,
} from "../columnsState";

const BASE_DATE = "2026-04-20T12:00:00.000Z";
const DEFAULT_LOCATION = "Berlin";

function test(_name: string, run: () => void) {
  run();
}

function match(id: string, status: LoopMatch["status"], loopId = `loop-${id}`): LoopMatch {
  return {
    id,
    loopId,
    title: `Title ${id}`,
    company: `Company ${id}`,
    location: DEFAULT_LOCATION,
    platform: "linkedin",
    url: "",
    description: "",
    status,
    matchedAt: BASE_DATE,
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
  } as LoopMatch;
}

function columns(entries: Partial<Record<BoardColumnKey, LoopMatch[]>>): ColumnsState {
  return new Map(Object.entries(entries) as [BoardColumnKey, LoopMatch[]][]);
}

test("buildColumnsFromVm merges HIRED matches into ARCHIVED for board display", () => {
  const archived = match("archived", "ARCHIVED_GENERAL");
  const hired = match("hired", "OFFER_ACCEPTED");
  const vm = {
    busy: false,
    queries: { matchesQ: { isLoading: false, isError: false } },
    data: {
      matches: [archived, hired],
      byStatus: new Map<BoardColumnKey, readonly LoopMatch[]>([
        ["ARCHIVED", [archived]],
        ["HIRED", [hired]],
      ]),
      loopIdToName: new Map<string, string>(),
    },
    actions: {
      onDelete: () => undefined,
      onDropToStatus: async () => undefined,
    },
  };

  const state = buildColumnsFromVm(vm);

  assert.equal(state.has("HIRED"), false);
  assert.deepEqual(state.get("ARCHIVED")?.map((item) => item.id), [
    "archived",
    "hired",
  ]);
});

test("findContainerOfId locates the column that contains the match", () => {
  const state = columns({
    ACTIVE: [match("a", "APPLIED")],
    INTERVIEW: [match("b", "HR_CALL_SCHEDULED")],
  });

  assert.equal(findContainerOfId(state, "b"), "INTERVIEW");
  assert.equal(findContainerOfId(state, "missing"), null);
});

test("removeFromList and insertIntoList are immutable", () => {
  const source = [match("a", "APPLIED"), match("b", "APPLIED")];

  const removed = removeFromList(source, "a");
  assert.deepEqual(removed.next.map((item) => item.id), ["b"]);
  assert.equal(removed.item?.id, "a");
  assert.deepEqual(source.map((item) => item.id), ["a", "b"]);

  const inserted = insertIntoList(source, match("c", "APPLIED"), 1);
  assert.deepEqual(inserted.map((item) => item.id), ["a", "c", "b"]);
  assert.deepEqual(source.map((item) => item.id), ["a", "b"]);
});

test("getLaneStatusFromOverId extracts lane identifiers", () => {
  assert.equal(getLaneStatusFromOverId("lane:ACTIVE"), "ACTIVE");
  assert.equal(getLaneStatusFromOverId("lane-tab:INTERVIEW"), "INTERVIEW");
  assert.equal(getLaneStatusFromOverId("match:123"), null);
});

test("isPendingDropSettled accepts exact index and clamped end position", () => {
  const a = match("a", "APPLIED");
  const b = match("b", "APPLIED");
  const byStatus = new Map<BoardColumnKey, readonly LoopMatch[]>([["ACTIVE", [a, b]]]);

  assert.equal(
    isPendingDropSettled({ matchId: "b", toStatus: "ACTIVE", toIndex: 1 }, byStatus),
    true,
  );
  assert.equal(
    isPendingDropSettled({ matchId: "b", toStatus: "ACTIVE", toIndex: 99 }, byStatus),
    true,
  );
  assert.equal(
    isPendingDropSettled({ matchId: "a", toStatus: "ACTIVE", toIndex: 1 }, byStatus),
    false,
  );
});

test("findActiveMatchById and getActiveLoopName resolve active card metadata", () => {
  const active = match("a", "APPLIED", "loop-a");
  const state = columns({ ACTIVE: [active] });
  const loopIdToName = new Map([["loop-a", "Frontend searches"]]);

  assert.equal(findActiveMatchById(state, "a"), active);
  assert.equal(findActiveMatchById(state, null), null);
  assert.equal(getActiveLoopName(active, loopIdToName), "Frontend searches");
  assert.equal(getActiveLoopName(null, loopIdToName), "");
});

test("resolveDragStartPayload falls back to the match status when the card is not in columns", () => {
  const active = match("a", "HR_CALL_SCHEDULED");
  const payload = resolveDragStartPayload(
    columns({ ACTIVE: [] }),
    active,
    "a",
    () => "INTERVIEW",
  );

  assert.deepEqual(payload, {
    matchId: "a",
    fromStatus: "INTERVIEW",
    fromIndex: -1,
  });
});
