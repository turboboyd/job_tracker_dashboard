import assert from "node:assert/strict";

import type { BoardColumnKey } from "src/entities/application";

import type { BoardCardItem, BoardVM } from "../../../model/types";
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

function test(_name: string, run: () => void) {
  run();
}

function item(
  id: string,
  status: BoardCardItem["status"],
  loopId = `loop-${id}`,
): BoardCardItem {
  return {
    id,
    status,
    loopId,
    roleTitle: `Role ${id}`,
    companyName: `Company ${id}`,
    location: "Berlin",
    matchScore: null,
    createdAtMs: null,
    isFavorite: false,
  };
}

function columns(entries: Partial<Record<BoardColumnKey, BoardCardItem[]>>): ColumnsState {
  return new Map(Object.entries(entries) as [BoardColumnKey, BoardCardItem[]][]);
}

test("buildColumnsFromVm builds the five application columns from byStatus", () => {
  const a = item("a", "APPLIED");
  const b = item("b", "HR_CALL_SCHEDULED");
  const vm: BoardVM = {
    busy: false,
    queries: { matchesQ: { isLoading: false, isError: false } },
    data: {
      items: [a, b],
      byStatus: new Map<BoardColumnKey, readonly BoardCardItem[]>([
        ["ACTIVE", [a]],
        ["INTERVIEW", [b]],
      ]),
      loopIdToName: new Map<string, string>(),
    },
    actions: {
      onDelete: () => undefined,
      onDropToStatus: async () => undefined,
    },
  };

  const state = buildColumnsFromVm(vm);

  assert.deepEqual(
    [...state.keys()],
    ["ACTIVE", "INTERVIEW", "OFFER", "REJECTED", "NO_RESPONSE"],
  );
  assert.deepEqual(state.get("ACTIVE")?.map((entry) => entry.id), ["a"]);
  assert.deepEqual(state.get("INTERVIEW")?.map((entry) => entry.id), ["b"]);
  assert.equal(state.has("HIRED"), false);
  assert.equal(state.has("ARCHIVED"), false);
});

test("findContainerOfId locates the column that contains the card", () => {
  const state = columns({
    ACTIVE: [item("a", "APPLIED")],
    INTERVIEW: [item("b", "HR_CALL_SCHEDULED")],
  });

  assert.equal(findContainerOfId(state, "b"), "INTERVIEW");
  assert.equal(findContainerOfId(state, "missing"), null);
});

test("removeFromList and insertIntoList are immutable", () => {
  const source = [item("a", "APPLIED"), item("b", "APPLIED")];

  const removed = removeFromList(source, "a");
  assert.deepEqual(removed.next.map((entry) => entry.id), ["b"]);
  assert.equal(removed.item?.id, "a");
  assert.deepEqual(source.map((entry) => entry.id), ["a", "b"]);

  const inserted = insertIntoList(source, item("c", "APPLIED"), 1);
  assert.deepEqual(inserted.map((entry) => entry.id), ["a", "c", "b"]);
  assert.deepEqual(source.map((entry) => entry.id), ["a", "b"]);
});

test("getLaneStatusFromOverId extracts lane identifiers", () => {
  assert.equal(getLaneStatusFromOverId("lane:ACTIVE"), "ACTIVE");
  assert.equal(getLaneStatusFromOverId("lane-tab:INTERVIEW"), "INTERVIEW");
  assert.equal(getLaneStatusFromOverId("match:123"), null);
});

test("isPendingDropSettled accepts exact index and clamped end position", () => {
  const a = item("a", "APPLIED");
  const b = item("b", "APPLIED");
  const byStatus = new Map<BoardColumnKey, readonly BoardCardItem[]>([["ACTIVE", [a, b]]]);

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
  const active = item("a", "APPLIED", "loop-a");
  const state = columns({ ACTIVE: [active] });
  const loopIdToName = new Map([["loop-a", "Frontend searches"]]);

  assert.equal(findActiveMatchById(state, "a"), active);
  assert.equal(findActiveMatchById(state, null), null);
  assert.equal(getActiveLoopName(active, loopIdToName), "Frontend searches");
  assert.equal(getActiveLoopName(null, loopIdToName), "");
});

test("resolveDragStartPayload falls back to the card status when not in columns", () => {
  const active = item("a", "HR_CALL_SCHEDULED");
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
