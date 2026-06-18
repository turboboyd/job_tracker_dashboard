import assert from "node:assert/strict";

import { Timestamp } from "firebase/firestore";

import type { CreateApplicationInput } from "src/entities/application";

import {
  mapCreateInputToDto,
  mapDtoToDoc,
  mapPatchToDto,
  type ApplicationReadDto,
} from "../adapter";

function test(_name: string, run: () => void) {
  run();
}

function makeDto(overrides: Partial<ApplicationReadDto> = {}): ApplicationReadDto {
  const { loop_id: loopIdOverride, is_favorite: isFavoriteOverride, ...restOverrides } = overrides;

  return {
    id: "app-1",
    user_id: "user-1",
    archived: false,
    company_name: "Acme GmbH",
    role_title: "Frontend Engineer",
    location_text: null,
    vacancy_url: null,
    source: null,
    employment_type: null,
    work_mode: null,
    salary: null,
    posted_at: null,
    status: "SAVED",
    stage: null,
    sub_status: null,
    last_status_change_at: "2026-01-01T00:00:00.000Z",
    applied_at: null,
    applied_via: null,
    next_action_at: null,
    next_action_text: null,
    contact_attempts: 0,
    last_contact_at: null,
    last_follow_up_at: null,
    follow_up_level: 0,
    needs_follow_up: false,
    follow_up_due_at: null,
    needs_reapply_suggestion: false,
    reapply_eligible_at: null,
    reapply_reason: null,
    reminders: null,
    current_note: null,
    tags: null,
    vacancy_description: null,
    role_fingerprint: null,
    has_loop: false,
    cv_version_id: null,
    profile_version_id: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
    ...restOverrides,
    loop_id: loopIdOverride ?? null,
    is_favorite: isFavoriteOverride ?? false,
  };
}

// ── mapDtoToDoc ──────────────────────────────────────────────────────────────

test("mapDtoToDoc maps company name and role title", () => {
  const doc = mapDtoToDoc(makeDto(), "user-1");
  assert.equal(doc.job.companyName, "Acme GmbH");
  assert.equal(doc.job.roleTitle, "Frontend Engineer");
});


test("makeDto normalizes undefined loop_id override to null", () => {
  const dto = makeDto({ loop_id: undefined });
  const doc = mapDtoToDoc(dto, "user-1");

  assert.equal(dto.loop_id, null);
  assert.equal(doc.loopLinkage, undefined);
});

test("mapDtoToDoc converts ISO timestamps to Firestore Timestamps", () => {
  const doc = mapDtoToDoc(makeDto(), "user-1");
  assert.ok(doc.createdAt instanceof Timestamp);
  assert.equal(doc.createdAt.toDate().toISOString(), "2026-01-01T00:00:00.000Z");
  assert.ok(doc.updatedAt instanceof Timestamp);
  assert.equal(doc.updatedAt.toDate().toISOString(), "2026-01-02T00:00:00.000Z");
});

test("mapDtoToDoc maps process status and lastStatusChangeAt", () => {
  const doc = mapDtoToDoc(makeDto({ status: "APPLIED" }), "user-1");
  assert.equal(doc.process.status, "APPLIED");
  assert.ok(doc.process.lastStatusChangeAt instanceof Timestamp);
});

test("mapDtoToDoc maps optional job fields when present", () => {
  const doc = mapDtoToDoc(
    makeDto({
      location_text: "Berlin",
      vacancy_url: "https://example.test/job",
      source: "LinkedIn",
      employment_type: "FULL_TIME",
      work_mode: "HYBRID",
    }),
    "user-1",
  );
  assert.equal(doc.job.locationText, "Berlin");
  assert.equal(doc.job.vacancyUrl, "https://example.test/job");
  assert.equal(doc.job.source, "LinkedIn");
  assert.equal(doc.job.employmentType, "FULL_TIME");
  assert.equal(doc.job.workMode, "HYBRID");
});

test("mapDtoToDoc omits optional job fields when null", () => {
  const doc = mapDtoToDoc(makeDto(), "user-1");
  assert.equal("locationText" in doc.job, false);
  assert.equal("vacancyUrl" in doc.job, false);
});

test("mapDtoToDoc maps reminders to Firestore Timestamps", () => {
  const doc = mapDtoToDoc(
    makeDto({
      reminders: [
        { id: "r-1", at: "2026-03-01T09:00:00.000Z", text: "Follow up" },
      ],
    }),
    "user-1",
  );
  const reminders = doc.process.reminders;
  assert.ok(Array.isArray(reminders));
  assert.equal(reminders?.[0]?.id, "r-1");
  assert.ok(reminders?.[0]?.at instanceof Timestamp);
  assert.equal(reminders?.[0]?.text, "Follow up");
});

test("mapDtoToDoc maps notes when current_note or tags are present", () => {
  const doc = mapDtoToDoc(
    makeDto({ current_note: "Great role", tags: ["ts", "react"] }),
    "user-1",
  );
  assert.equal(doc.notes?.currentNote, "Great role");
  assert.deepEqual(doc.notes?.tags, ["ts", "react"]);
});

test("mapDtoToDoc omits notes block when both fields are null/empty", () => {
  const doc = mapDtoToDoc(makeDto({ current_note: null, tags: null }), "user-1");
  assert.equal("notes" in doc, false);
});

test("mapDtoToDoc maps vacancy block when description is present", () => {
  const doc = mapDtoToDoc(makeDto({ vacancy_description: "TypeScript role" }), "user-1");
  assert.equal(doc.vacancy?.rawDescription, "TypeScript role");
});

test("mapDtoToDoc maps loopLinkage when loop_id is present", () => {
  const doc = mapDtoToDoc(makeDto({ loop_id: "loop-abc" }), "user-1");
  assert.equal(doc.loopLinkage?.loopId, "loop-abc");
  assert.equal(doc.loopLinkage?.source, "manual");
});

test("mapDtoToDoc sets archived and hasLoop flags", () => {
  const doc = mapDtoToDoc(makeDto({ archived: true, has_loop: true }), "user-1");
  assert.equal(doc.archived, true);
  assert.equal(doc.hasLoop, true);
});

test("mapDtoToDoc preserves backend-derived day metrics", () => {
  const doc = mapDtoToDoc(
    makeDto({
      days_in_pipeline: 40,
      days_since_applied: 12,
      days_in_current_status: 5,
    }),
    "user-1",
  );

  assert.equal(doc.daysInPipeline, 40);
  assert.equal(doc.daysSinceApplied, 12);
  assert.equal(doc.daysInCurrentStatus, 5);
});

// ── mapCreateInputToDto ──────────────────────────────────────────────────────

test("mapCreateInputToDto maps required fields", () => {
  const input: CreateApplicationInput = {
    companyName: "Acme",
    roleTitle: "Engineer",
  };
  const dto = mapCreateInputToDto(input);
  assert.equal(dto["company_name"], "Acme");
  assert.equal(dto["role_title"], "Engineer");
});

test("mapCreateInputToDto maps optional fields when provided", () => {
  const input: CreateApplicationInput = {
    companyName: "Acme",
    roleTitle: "Engineer",
    vacancyUrl: "https://example.test",
    source: "LinkedIn",
    status: "APPLIED",
    locationText: "Berlin",
    workMode: "REMOTE",
    employmentType: "FULL_TIME",
    tags: ["ts"],
    currentNote: "Good role",
    rawDescription: "Job desc",
    loopId: "loop-1",
  };
  const dto = mapCreateInputToDto(input);
  assert.equal(dto["vacancy_url"], "https://example.test");
  assert.equal(dto["source"], "LinkedIn");
  assert.equal(dto["status"], "APPLIED");
  assert.equal(dto["location_text"], "Berlin");
  assert.equal(dto["work_mode"], "REMOTE");
  assert.equal(dto["employment_type"], "FULL_TIME");
  assert.deepEqual(dto["tags"], ["ts"]);
  assert.equal(dto["current_note"], "Good role");
  assert.equal(dto["vacancy_description"], "Job desc");
  assert.equal(dto["loop_id"], "loop-1");
});

test("mapCreateInputToDto omits undefined optional fields", () => {
  const dto = mapCreateInputToDto({ companyName: "X", roleTitle: "Y" });
  assert.equal("vacancy_url" in dto, false);
  assert.equal("source" in dto, false);
});

// ── mapPatchToDto ────────────────────────────────────────────────────────────

test("mapPatchToDto handles dot-path keys", () => {
  const dto = mapPatchToDto({ "process.status": "APPLIED" });
  assert.equal(dto["status"], "APPLIED");
});

test("mapPatchToDto handles nested object keys", () => {
  const dto = mapPatchToDto({ process: { status: "INTERVIEW" } } as Record<string, unknown>);
  assert.equal(dto["status"], "INTERVIEW");
});

test("mapPatchToDto serializes Firestore Timestamp to ISO string", () => {
  const ts = Timestamp.fromDate(new Date("2026-03-15T10:00:00.000Z"));
  const dto = mapPatchToDto({ "process.appliedAt": ts });
  assert.equal(dto["applied_at"], "2026-03-15T10:00:00.000Z");
});

test("mapPatchToDto serializes Date to ISO string", () => {
  const date = new Date("2026-05-01T00:00:00.000Z");
  const dto = mapPatchToDto({ "job.postedAt": date });
  assert.equal(dto["posted_at"], "2026-05-01T00:00:00.000Z");
});

test("mapPatchToDto maps notes fields", () => {
  const dto = mapPatchToDto({ "notes.currentNote": "Updated note", "notes.tags": ["a", "b"] });
  assert.equal(dto["current_note"], "Updated note");
  assert.deepEqual(dto["tags"], ["a", "b"]);
});

test("mapPatchToDto skips unknown keys silently", () => {
  const dto = mapPatchToDto({ "matching.score": 0.9, unknownField: "x" } as Record<string, unknown>);
  assert.equal("matching" in dto, false);
  assert.equal("unknownField" in dto, false);
  assert.deepEqual(Object.keys(dto), []);
});

test("mapPatchToDto returns empty object for empty patch", () => {
  assert.deepEqual(mapPatchToDto({}), {});
});

test("mapCreateInputToDto maps frontend loopId to backend loop_id", () => {
  const dto = mapCreateInputToDto({
    companyName: "Acme",
    roleTitle: "Engineer",
    loopId: "loop-frontend-1",
  });

  assert.equal(dto["loop_id"], "loop-frontend-1");
  assert.equal("loopId" in dto, false);
});

test("mapDtoToDoc maps backend loop_id to frontend loopId", () => {
  const doc = mapDtoToDoc(makeDto({ loop_id: "loop-backend-1", has_loop: true }), "user-1");

  assert.equal(doc.loopLinkage?.loopId, "loop-backend-1");
  assert.equal(doc.hasLoop, true);
});
