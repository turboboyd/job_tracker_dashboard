import assert from "node:assert/strict";

import {
  addStageToPipeline,
  addSubStatusToPipeline,
  clonePipeline,
  deleteStageFromPipeline,
  deleteSubStatusFromPipeline,
  extractSavedPipeline,
  getStageDefaultSubStatusId,
  isPipelineDirty,
  moveItem,
  moveStageInPipeline,
  moveSubStatusInPipeline,
  resequence,
  sortByOrder,
  updateStagePatch,
  updateSubStatusPatch,
} from "../pipelineStatuses.helpers";

import { pipeline, stage, subStatus } from "./pipelineStatuses.testFactories";

function test(_name: string, run: () => void) {
  run();
}

test("clonePipeline returns an independent deep copy", () => {
  const source = pipeline();
  const copy = clonePipeline(source);

  copy.stages[0]!.label = "changed";
  copy.stages[0]!.subStatuses[0]!.label = "changed-sub";

  assert.equal(source.stages[0]!.label, "applied");
  assert.equal(source.stages[0]!.subStatuses[0]!.label, "sent");
});

test("extractSavedPipeline sanitizes invalid values and keeps valid defaults", () => {
  const saved = extractSavedPipeline({
    pipeline: {
      version: 3,
      defaultStageId: "interview",
      stages: [
        {
          id: "interview",
          label: " Interview ",
          order: 20,
          visible: false,
          defaultSubStatusId: "tech",
          subStatuses: [
            { id: "hr", label: " HR ", order: 10, visible: true },
            { id: "tech", label: "", order: 20, visible: false },
            { id: "", label: "ignored", order: 30 },
          ],
        },
        null,
      ],
    },
  });

  assert.equal(saved.version, 3);
  assert.equal(saved.defaultStageId, "interview");
  assert.equal(saved.stages.length, 1);
  assert.equal(saved.stages[0]!.label, "Interview");
  assert.equal(saved.stages[0]!.visible, false);
  assert.equal(saved.stages[0]!.defaultSubStatusId, "tech");
  assert.deepEqual(
    saved.stages[0]!.subStatuses.map((item) => item.id),
    ["hr", "tech"],
  );
  assert.equal(saved.stages[0]!.subStatuses[1]!.label, "tech");
});

test("sortByOrder, resequence and moveItem are immutable ordering helpers", () => {
  const source = [
    { id: "b", order: 20 },
    { id: "a", order: 10 },
    { id: "c", order: 30 },
  ];

  assert.deepEqual(sortByOrder(source).map((item) => item.id), ["a", "b", "c"]);
  assert.deepEqual(resequence(source).map((item) => item.order), [10, 20, 30]);
  assert.deepEqual(moveItem(source, 0, 1).map((item) => item.id), ["a", "b", "c"]);
  assert.deepEqual(source.map((item) => item.id), ["b", "a", "c"]);
  assert.deepEqual(moveItem(source, 0, -1), source);
});

test("stage mutations update only targeted stage fields", () => {
  const source = pipeline();
  const next = updateStagePatch(source, "interview", { label: "Interviews", visible: false });

  assert.equal(next.stages[0]!.label, "applied");
  assert.equal(next.stages[1]!.label, "Interviews");
  assert.equal(next.stages[1]!.visible, false);
  assert.notEqual(next, source);
});

test("sub-status mutations update only targeted sub-status fields", () => {
  const source = pipeline();
  const next = updateSubStatusPatch(source, "interview", "tech", {
    label: "Technical",
    visible: false,
  });

  assert.equal(next.stages[1]!.subStatuses[0]!.label, "hr");
  assert.equal(next.stages[1]!.subStatuses[1]!.label, "Technical");
  assert.equal(next.stages[1]!.subStatuses[1]!.visible, false);
  assert.notEqual(next.stages[1], source.stages[1]);
});

test("add and delete stage keep stage order and default stage valid", () => {
  const source = pipeline();
  const withAddedStage = addStageToPipeline(source);

  assert.equal(withAddedStage.stages.length, 3);
  assert.deepEqual(withAddedStage.stages.map((item) => item.order), [10, 20, 30]);
  assert.equal(withAddedStage.defaultStageId, "applied");

  const withoutDefaultStage = deleteStageFromPipeline(withAddedStage, "applied");

  assert.equal(withoutDefaultStage.defaultStageId, "interview");
  assert.deepEqual(withoutDefaultStage.stages.map((item) => item.order), [10, 20]);
});

test("moveStageInPipeline and moveSubStatusInPipeline resequence moved items", () => {
  const source = pipeline();
  const movedStage = moveStageInPipeline(source, "interview", -1);

  assert.deepEqual(movedStage.stages.map((item) => item.id), ["interview", "applied"]);
  assert.deepEqual(movedStage.stages.map((item) => item.order), [10, 20]);

  const movedSubStatus = moveSubStatusInPipeline(source, "interview", "tech", -1);
  const interview = movedSubStatus.stages.find((item) => item.id === "interview")!;

  assert.deepEqual(interview.subStatuses.map((item) => item.id), ["tech", "hr"]);
  assert.deepEqual(interview.subStatuses.map((item) => item.order), [10, 20]);
});

test("add and delete sub-status keep default sub-status valid", () => {
  const source = pipeline();
  const withAddedSubStatus = addSubStatusToPipeline(source, "interview");
  const withAddedInterview = withAddedSubStatus.stages.find((item) => item.id === "interview")!;

  assert.equal(withAddedInterview.subStatuses.length, 3);
  assert.deepEqual(withAddedInterview.subStatuses.map((item) => item.order), [10, 20, 30]);
  assert.equal(withAddedInterview.defaultSubStatusId, "hr");

  const withoutDefault = deleteSubStatusFromPipeline(withAddedSubStatus, "interview", "hr");
  const withoutDefaultInterview = withoutDefault.stages.find((item) => item.id === "interview")!;

  assert.equal(withoutDefaultInterview.defaultSubStatusId, "tech");
  assert.deepEqual(withoutDefaultInterview.subStatuses.map((item) => item.order), [10, 20]);
});

test("getStageDefaultSubStatusId falls back to first ordered sub-status", () => {
  const currentStage = stage(
    "interview",
    10,
    [subStatus("second", 20), subStatus("first", 10)],
    { defaultSubStatusId: "missing" },
  );

  assert.equal(getStageDefaultSubStatusId(currentStage), "first");
});

test("isPipelineDirty compares serialized pipeline state", () => {
  const saved = pipeline();
  const same = clonePipeline(saved);
  const changed = updateStagePatch(saved, "applied", { label: "Applied" });

  assert.equal(isPipelineDirty(saved, same), false);
  assert.equal(isPipelineDirty(saved, changed), true);
});
