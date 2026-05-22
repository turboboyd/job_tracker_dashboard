import assert from "node:assert/strict";

import {
  buildLoopMatchCreateApplicationUrl,
  buildLoopMatchConvertUrl,
  buildLoopMatchDetailUrl,
  buildLoopMatchFromPreviewUrl,
  buildLoopMatchImportPreviewUrl,
  buildLoopMatchPreviewIgnoreUrl,
  buildLoopMatchPreviewIgnoresUrl,
  buildLoopMatchesListUrl,
} from "../queries";
import {
  mapCreateApplicationFromMatchInputToDto,
  mapCreateApplicationFromMatchResponseDto,
  mapIgnoreDiscoveryPreviewInputToDto,
  mapSaveDiscoveryPreviewMatchInputToDto,
  mapSaveVacancyMatchInputToDto,
  mapVacancyPreviewIgnoreResponseDto,
  mapVacancyMatchFromPreviewResponseDto,
  mapVacancyMatchDto,
  mapVacancyMatchPreviewDto,
} from "../adapter";

const apiBaseUrl = "https://api.example.test/api/v1";

assert.equal(
  buildLoopMatchImportPreviewUrl(apiBaseUrl, "loop 1"),
  "https://api.example.test/api/v1/loops/loop%201/matches/import-preview",
);

assert.equal(
  buildLoopMatchesListUrl(apiBaseUrl, "loop-1", { status: "saved", limit: 500, offset: -5 }),
  "https://api.example.test/api/v1/loops/loop-1/matches?status=saved&limit=100&offset=0",
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
  buildLoopMatchPreviewIgnoresUrl(apiBaseUrl, "loop 1"),
  "https://api.example.test/api/v1/loops/loop%201/matches/preview-ignores",
);

assert.equal(
  buildLoopMatchPreviewIgnoreUrl(apiBaseUrl, "loop 1", "ignore/1"),
  "https://api.example.test/api/v1/loops/loop%201/matches/preview-ignores/ignore%2F1",
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
      createdAt: "2026-05-13T00:00:00Z",
      updatedAt: "2026-05-13T00:00:00Z",
    },
  },
);

assert.deepEqual(
  mapIgnoreDiscoveryPreviewInputToDto({
    sourceId: "arbeitsagentur",
    externalId: "job-1",
    sourceUrl: "https://example.test/job",
    title: "Frontend Developer",
    company: "ACME GmbH",
  }),
  {
    source_id: "arbeitsagentur",
    external_id: "job-1",
    source_url: "https://example.test/job",
    title: "Frontend Developer",
    company: "ACME GmbH",
  },
);

assert.deepEqual(
  mapVacancyPreviewIgnoreResponseDto({
    created: true,
    duplicate: false,
    item: {
      id: "ignore-1",
      user_id: "user-1",
      loop_id: "loop-1",
      source_id: "arbeitsagentur",
      external_id: "job-1",
      source_url: "https://example.test/job",
      title: "Frontend Developer",
      company: "ACME GmbH",
      created_at: "2026-05-18T00:00:00Z",
      updated_at: "2026-05-18T00:00:00Z",
    },
  }),
  {
    created: true,
    duplicate: false,
    item: {
      id: "ignore-1",
      userId: "user-1",
      loopId: "loop-1",
      sourceId: "arbeitsagentur",
      externalId: "job-1",
      sourceUrl: "https://example.test/job",
      title: "Frontend Developer",
      company: "ACME GmbH",
      createdAt: "2026-05-18T00:00:00Z",
      updatedAt: "2026-05-18T00:00:00Z",
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
      createdAt: "2026-05-13T00:00:00Z",
      updatedAt: "2026-05-13T00:00:00Z",
    },
  },
);
