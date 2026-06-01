import assert from "node:assert/strict";

import {
  mapBackendLoopDtoToLoop,
  mapCreateLoopInputToDto,
  mapUpdateLoopInputToDto,
  type BackendLoopDto,
} from "../adapter";

function test(_name: string, run: () => void) {
  run();
}

function dto(overrides: Partial<BackendLoopDto> = {}): BackendLoopDto {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    user_id: "22222222-2222-4222-8222-222222222222",
    title: "Frontend Berlin",
    target_role: "Frontend Engineer",
    location: "Berlin",
    radius_km: 30,
    sources: ["linkedin", "indeed"],
    status: "active",
    keywords: ["React", "TypeScript"],
    excluded_keywords: ["Angular"],
    employment_types: ["full_time"],
    work_modes: ["hybrid"],
    selected_sources: ["linkedin"],
    auto_discovery_enabled: true,
    discovery_radius_km: 50,
    last_discovery_at: "2026-05-13T08:00:00.000Z",
    created_at: "2026-05-01T08:00:00.000Z",
    updated_at: "2026-05-02T08:00:00.000Z",
    ...overrides,
  };
}

test("mapBackendLoopDtoToLoop maps snake_case backend loop to frontend Loop", () => {
  const loop = mapBackendLoopDtoToLoop(dto());

  assert.equal(loop.id, "11111111-1111-4111-8111-111111111111");
  assert.equal(loop.name, "Frontend Berlin");
  assert.equal(loop.title, "Frontend Berlin");
  assert.equal(loop.targetRole, "Frontend Engineer");
  assert.deepEqual(loop.titles, ["Frontend Engineer"]);
  assert.equal(loop.radiusKm, 30);
  assert.deepEqual(loop.sources, ["linkedin", "indeed"]);
  assert.deepEqual(loop.selectedSources, ["linkedin"]);
  assert.deepEqual(loop.platforms, ["linkedin"]);
  assert.deepEqual(loop.keywords, ["React", "TypeScript"]);
  assert.deepEqual(loop.excludedKeywords, ["Angular"]);
  assert.deepEqual(loop.employmentTypes, ["full_time"]);
  assert.deepEqual(loop.workModes, ["hybrid"]);
  assert.equal(loop.autoDiscoveryEnabled, true);
  assert.equal(loop.discoveryRadiusKm, 50);
  assert.equal(loop.lastDiscoveryAt, "2026-05-13T08:00:00.000Z");
  assert.equal(loop.createdAt, "2026-05-01T08:00:00.000Z");
  assert.equal(loop.updatedAt, "2026-05-02T08:00:00.000Z");
  assert.equal(loop.filters?.role, "Frontend Engineer");
});

test("mapBackendLoopDtoToLoop falls back to sources when selected_sources is empty", () => {
  const loop = mapBackendLoopDtoToLoop(dto({ selected_sources: [] }));

  assert.deepEqual(loop.platforms, ["linkedin", "indeed"]);
});

test("mapBackendLoopDtoToLoop tolerates compact list response DTO", () => {
  const loop = mapBackendLoopDtoToLoop({
    id: "a5d87695-8fde-48e8-8cba-7b3a38c8e284",
    title: "New loop",
    target_role: "Frontend Developer",
    location: "Berlin",
    status: "active",
    metrics: {
      matches_saved: 0,
      applications_total: 8,
    },
  });

  assert.equal(loop.id, "a5d87695-8fde-48e8-8cba-7b3a38c8e284");
  assert.equal(loop.name, "New loop");
  assert.equal(loop.title, "New loop");
  assert.equal(loop.targetRole, "Frontend Developer");
  assert.equal(loop.location, "Berlin");
  assert.equal(loop.status, "active");
  assert.deepEqual(loop.selectedSources, []);
  assert.deepEqual(loop.keywords, []);
  assert.equal(loop.filters?.role, "Frontend Developer");
  assert.equal(loop.filters?.location, "Berlin");
  assert.deepEqual(loop.metrics, {
    matches_saved: 0,
    applications_total: 8,
    applied_count: 0,
    interview_count: 0,
    offer_count: 0,
    rejected_count: 0,
    response_rate: 0,
    interview_rate: 0,
    offer_rate: 0,
  });
});

test("mapCreateLoopInputToDto maps camelCase create input to snake_case payload", () => {
  const payload = mapCreateLoopInputToDto({
    name: "Backend Search",
    titles: ["Backend Engineer"],
    location: "Wolfsburg",
    radiusKm: 50,
    platforms: ["linkedin", "stepstone"],
    status: "paused",
    keywords: ["Python"],
    excludedKeywords: ["PHP"],
    employmentTypes: ["full_time"],
    workModes: ["remote"],
    autoDiscoveryEnabled: true,
    discoveryRadiusKm: 100,
  });

  assert.equal(payload.title, "Backend Search");
  assert.equal(payload.target_role, "Backend Engineer");
  assert.equal(payload.location, "Wolfsburg");
  assert.equal(payload.radius_km, 50);
  assert.deepEqual(payload.sources, ["linkedin", "stepstone"]);
  assert.deepEqual(payload.selected_sources, ["linkedin", "stepstone"]);
  assert.equal(payload.status, "paused");
  assert.deepEqual(payload.keywords, ["Python"]);
  assert.deepEqual(payload.excluded_keywords, ["PHP"]);
  assert.deepEqual(payload.employment_types, ["full_time"]);
  assert.deepEqual(payload.work_modes, ["remote"]);
  assert.equal(payload.auto_discovery_enabled, true);
  assert.equal(payload.discovery_radius_km, 100);
});

test("mapUpdateLoopInputToDto only includes fields present in the patch", () => {
  assert.deepEqual(mapUpdateLoopInputToDto({ status: "active" }), {
    status: "active",
  });
  assert.deepEqual(mapUpdateLoopInputToDto({ platforms: ["linkedin"] }), {
    sources: ["linkedin"],
    selected_sources: ["linkedin"],
  });
});

test("mapUpdateLoopInputToDto maps settings patch to snake_case payload", () => {
  assert.deepEqual(
    mapUpdateLoopInputToDto({
      keywords: ["React"],
      excludedKeywords: ["Angular"],
      employmentTypes: ["full_time"],
      workModes: ["remote"],
      selectedSources: ["linkedin"],
      discoveryRadiusKm: 100,
    }),
    {
      keywords: ["React"],
      excluded_keywords: ["Angular"],
      employment_types: ["full_time"],
      work_modes: ["remote"],
      selected_sources: ["linkedin"],
      discovery_radius_km: 100,
    },
  );
});
