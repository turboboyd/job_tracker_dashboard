import assert from "node:assert/strict";

import {
  mapCreateApplicationFromMatchInputToDto,
  mapCreateApplicationFromMatchResponseDto,
  mapMatchesFeedResponseDto,
  mapSaveDiscoveryPreviewMatchInputToDto,
  mapSaveVacancyMatchInputToDto,
  mapVacancyMatchFromPreviewResponseDto,
  mapVacancyMatchDto,
  mapVacancyMatchEvaluationDto,
  mapVacancyMatchPreviewDto,
  type VacancyMatchDto,
  type VacancyMatchEvaluationDto,
} from "../adapter";
import {
  buildLoopMatchCreateApplicationUrl,
  buildLoopMatchConvertUrl,
  buildLoopMatchDetailUrl,
  buildLoopMatchFromPreviewUrl,
  buildLoopMatchImportPreviewUrl,
  buildLoopMatchSeenUrl,
  buildLoopMatchesListUrl,
  buildMatchesFeedUrl,
} from "../queries";

const apiBaseUrl = "https://api.example.test/api/v1";

assert.equal(
  buildLoopMatchImportPreviewUrl(apiBaseUrl, "loop 1"),
  "https://api.example.test/api/v1/loops/loop%201/matches/import-preview",
);

assert.equal(
  buildLoopMatchesListUrl(apiBaseUrl, "loop-1", { status: "saved", limit: 500, offset: -5 }),
  "https://api.example.test/api/v1/loops/loop-1/matches?status=saved&limit=100&offset=0",
);

// sort=score is forwarded; default (no sort) keeps the freshness behavior.
assert.equal(
  buildLoopMatchesListUrl(apiBaseUrl, "loop-1", { sort: "score" }),
  "https://api.example.test/api/v1/loops/loop-1/matches?sort=score",
);
assert.equal(
  buildLoopMatchesListUrl(apiBaseUrl, "loop-1", {}),
  "https://api.example.test/api/v1/loops/loop-1/matches",
);

assert.equal(
  buildLoopMatchConvertUrl(apiBaseUrl, "loop-1", "match/1"),
  "https://api.example.test/api/v1/loops/loop-1/matches/match%2F1/convert-to-application",
);

assert.equal(
  buildLoopMatchDetailUrl(apiBaseUrl, "loop-1", "match/1"),
  "https://api.example.test/api/v1/loops/loop-1/matches/match%2F1",
);

assert.equal(
  buildLoopMatchCreateApplicationUrl(apiBaseUrl, "loop-1", "match/1"),
  "https://api.example.test/api/v1/loops/loop-1/matches/match%2F1/create-application",
);

assert.equal(
  buildLoopMatchFromPreviewUrl(apiBaseUrl, "loop 1"),
  "https://api.example.test/api/v1/loops/loop%201/matches/from-preview",
);

assert.equal(
  buildLoopMatchSeenUrl(apiBaseUrl, "loop-1", "match/1"),
  "https://api.example.test/api/v1/loops/loop-1/matches/match%2F1/seen",
);

assert.equal(
  buildMatchesFeedUrl(apiBaseUrl),
  "https://api.example.test/api/v1/matches",
);

assert.equal(
  buildMatchesFeedUrl(apiBaseUrl, {
    tab: "new",
    q: "react dev",
    source: "arbeitsagentur",
    sort: "company",
    limit: 500,
    offset: -5,
  }),
  "https://api.example.test/api/v1/matches?tab=new&q=react+dev&source=arbeitsagentur&sort=company&limit=100&offset=0",
);

assert.deepEqual(
  mapVacancyMatchPreviewDto({
    source_url: "https://example.test/job",
    source: "example.test",
    company_name: "ACME GmbH",
    role_title: "Frontend Developer",
    location_text: "Berlin",
    vacancy_description: "Build UI",
    confidence: { role_title: 0.9 },
    warnings: [],
  }),
  {
    sourceUrl: "https://example.test/job",
    source: "example.test",
    companyName: "ACME GmbH",
    roleTitle: "Frontend Developer",
    locationText: "Berlin",
    vacancyDescription: "Build UI",
    confidence: { role_title: 0.9 },
    warnings: [],
  },
);

assert.deepEqual(
  mapSaveVacancyMatchInputToDto({
    sourceUrl: "https://example.test/job",
    source: "example.test",
    companyName: "ACME GmbH",
    roleTitle: "Frontend Developer",
    locationText: "Berlin",
    vacancyDescription: "Build UI",
    confidence: { company_name: 0.8 },
    warnings: ["fallback"],
  }),
  {
    source_url: "https://example.test/job",
    source: "example.test",
    company_name: "ACME GmbH",
    role_title: "Frontend Developer",
    location_text: "Berlin",
    vacancy_description: "Build UI",
    raw_metadata: {},
    confidence: { company_name: 0.8 },
    warnings: ["fallback"],
    status: "saved",
  },
);

assert.equal(
  mapVacancyMatchDto({
    id: "match-1",
    user_id: "user-1",
    loop_id: "loop-1",
    source_url: "https://example.test/job",
    source: "example.test",
    external_id: null,
    company_name: "ACME GmbH",
    role_title: "Frontend Developer",
    location_text: "Berlin",
    vacancy_description: "Build UI",
    raw_metadata: {},
    confidence: {},
    warnings: [],
    status: "converted",
    application_id: "app-1",
    created_at: "2026-05-13T00:00:00Z",
    updated_at: "2026-05-13T00:00:00Z",
  }).loopId,
  "loop-1",
);

assert.deepEqual(
  mapSaveDiscoveryPreviewMatchInputToDto({
    sourceId: "adzuna",
    externalId: "job-1",
    sourceUrl: "https://example.test/job",
    title: "Frontend Developer",
    company: "ACME GmbH",
    location: "Berlin",
    description: "Build UI",
    postedAt: "2026-05-15",
    rawMetadata: { refnr: "job-1" },
    confidence: { source_quality: 0.9 },
  }),
  {
    source_id: "adzuna",
    external_id: "job-1",
    source_url: "https://example.test/job",
    title: "Frontend Developer",
    company: "ACME GmbH",
    location: "Berlin",
    description: "Build UI",
    posted_at: "2026-05-15",
    raw_metadata: { refnr: "job-1" },
    confidence: { source_quality: 0.9 },
  },
);

assert.deepEqual(
  mapVacancyMatchFromPreviewResponseDto({
    created: false,
    duplicate: true,
    match: {
      id: "match-1",
      user_id: "user-1",
      loop_id: "loop-1",
      source_url: "https://example.test/job",
      source: "arbeitsagentur",
      external_id: "job-1",
      company_name: "ACME GmbH",
      role_title: "Frontend Developer",
      location_text: "Berlin",
      vacancy_description: "Build UI",
      raw_metadata: { refnr: "job-1" },
      confidence: {},
      warnings: [],
      status: "saved",
      application_id: null,
      created_at: "2026-05-13T00:00:00Z",
      updated_at: "2026-05-13T00:00:00Z",
    },
  }),
  {
    created: false,
    duplicate: true,
    match: {
      id: "match-1",
      userId: "user-1",
      loopId: "loop-1",
      sourceUrl: "https://example.test/job",
      source: "arbeitsagentur",
      externalId: "job-1",
      companyName: "ACME GmbH",
      roleTitle: "Frontend Developer",
      locationText: "Berlin",
      vacancyDescription: "Build UI",
      rawMetadata: { refnr: "job-1" },
      confidence: {},
      warnings: [],
      status: "saved",
      applicationId: null,
      seenAt: null,
      postedAt: null,
      score: null,
      scoreVersion: null,
      createdAt: "2026-05-13T00:00:00Z",
      updatedAt: "2026-05-13T00:00:00Z",
    },
  },
);

assert.deepEqual(
  mapCreateApplicationFromMatchInputToDto({
    status: "SAVED",
    notes: "Call recruiter",
    favorite: true,
  }),
  {
    status: "SAVED",
    notes: "Call recruiter",
    favorite: true,
  },
);

assert.deepEqual(
  mapCreateApplicationFromMatchResponseDto({
    application: { id: "app-1" },
    created: false,
    already_linked: true,
    match: {
      id: "match-1",
      user_id: "user-1",
      loop_id: "loop-1",
      source_url: "https://example.test/job",
      source: "arbeitsagentur",
      external_id: "job-1",
      company_name: "ACME GmbH",
      role_title: "Frontend Developer",
      location_text: "Berlin",
      vacancy_description: "Build UI",
      raw_metadata: {},
      confidence: {},
      warnings: [],
      status: "converted",
      application_id: "app-1",
      created_at: "2026-05-13T00:00:00Z",
      updated_at: "2026-05-13T00:00:00Z",
    },
  }),
  {
    applicationId: "app-1",
    created: false,
    alreadyLinked: true,
    match: {
      id: "match-1",
      userId: "user-1",
      loopId: "loop-1",
      sourceUrl: "https://example.test/job",
      source: "arbeitsagentur",
      externalId: "job-1",
      companyName: "ACME GmbH",
      roleTitle: "Frontend Developer",
      locationText: "Berlin",
      vacancyDescription: "Build UI",
      rawMetadata: {},
      confidence: {},
      warnings: [],
      status: "converted",
      applicationId: "app-1",
      seenAt: null,
      postedAt: null,
      score: null,
      scoreVersion: null,
      createdAt: "2026-05-13T00:00:00Z",
      updatedAt: "2026-05-13T00:00:00Z",
    },
  },
);

assert.deepEqual(
  mapMatchesFeedResponseDto({
    items: [
      {
        id: "match-1",
        user_id: "user-1",
        loop_id: "loop-1",
        source_url: "https://example.test/job",
        source: "arbeitsagentur",
        external_id: "job-1",
        company_name: "ACME GmbH",
        role_title: "Frontend Developer",
        location_text: "Berlin",
        vacancy_description: "Build UI",
        raw_metadata: {},
        confidence: {},
        warnings: [],
        status: "new",
        application_id: null,
        seen_at: null,
        posted_at: "2026-05-01T00:00:00Z",
        created_at: "2026-05-13T00:00:00Z",
        updated_at: "2026-05-13T00:00:00Z",
        loop_name: "Frontend Loop",
      },
    ],
    total: 7,
    limit: 20,
    offset: 0,
    counts: { all: 7, new: 3, saved: 4 },
  }),
  {
    items: [
      {
        loopName: "Frontend Loop",
        match: {
          id: "match-1",
          userId: "user-1",
          loopId: "loop-1",
          sourceUrl: "https://example.test/job",
          source: "arbeitsagentur",
          externalId: "job-1",
          companyName: "ACME GmbH",
          roleTitle: "Frontend Developer",
          locationText: "Berlin",
          vacancyDescription: "Build UI",
          rawMetadata: {},
          confidence: {},
          warnings: [],
          status: "new",
          applicationId: null,
          seenAt: null,
          postedAt: "2026-05-01T00:00:00Z",
          score: null,
          scoreVersion: null,
          createdAt: "2026-05-13T00:00:00Z",
          updatedAt: "2026-05-13T00:00:00Z",
        },
      },
    ],
    total: 7,
    limit: 20,
    offset: 0,
    counts: { all: 7, new: 3, saved: 4 },
  },
);

// --- mapVacancyMatchDto: backend score fields -----------------------------
function matchDto(patch: Partial<VacancyMatchDto>): VacancyMatchDto {
  return {
    id: "m",
    user_id: "u",
    loop_id: "l",
    source_url: "https://example.test/job",
    source: "arbeitsagentur",
    company_name: null,
    role_title: null,
    location_text: null,
    vacancy_description: null,
    confidence: {},
    warnings: [],
    status: "new",
    application_id: null,
    created_at: "2026-05-13T00:00:00Z",
    updated_at: "2026-05-13T00:00:00Z",
    ...patch,
  };
}
// Present score is mapped through.
{
  const mapped = mapVacancyMatchDto(matchDto({ score: 73, score_version: 1 }));
  assert.equal(mapped.score, 73);
  assert.equal(mapped.scoreVersion, 1);
}
// Absent score fields → null (older backend / unscored row).
{
  const mapped = mapVacancyMatchDto(matchDto({}));
  assert.equal(mapped.score, null);
  assert.equal(mapped.scoreVersion, null);
}

// --- mapVacancyMatchEvaluationDto: reason/penalty codes -------------------
function evalDto(patch: Partial<VacancyMatchEvaluationDto>): VacancyMatchEvaluationDto {
  return {
    match_id: "m",
    loop_id: "l",
    total_score: 50,
    title_match_score: 25,
    location_match_score: 10,
    employment_type_match_score: 0,
    work_mode_match_score: 0,
    keyword_score: 0,
    excluded_keyword_penalty: 0,
    source_score: 15,
    reasons: [],
    penalties: [],
    duplicate_status: "none",
    duplicate_of_match_id: null,
    duplicate_application_id: null,
    duplicate_reasons: [],
    ...patch,
  };
}
// Codes are mapped through with terms.
{
  const mapped = mapVacancyMatchEvaluationDto(
    evalDto({
      reason_codes: [{ code: "title_match", terms: ["frontend"] }],
      penalty_codes: [{ code: "excluded_keyword", terms: ["senior"] }],
    }),
  );
  assert.deepEqual(mapped.reasonCodes, [{ code: "title_match", terms: ["frontend"] }]);
  assert.deepEqual(mapped.penaltyCodes, [{ code: "excluded_keyword", terms: ["senior"] }]);
}
// Absent codes (older backend) → empty arrays, so the panel falls back to strings.
{
  const mapped = mapVacancyMatchEvaluationDto(evalDto({}));
  assert.deepEqual(mapped.reasonCodes, []);
  assert.deepEqual(mapped.penaltyCodes, []);
}

console.log("vacancyMatches queries.test passed");
