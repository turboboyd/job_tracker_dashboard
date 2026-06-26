import assert from "node:assert/strict";

import type { VacancyImportPreview } from "src/features/applications/rest/queries";
import { ApiError } from "src/shared/api/rest/restClient";

import { buildCreateApplicationPayload } from "../applicationsPage.helpers";
import type { CreateFormState } from "../types";
import {
  applyVacancyImportFallbackToForm,
  applyVacancyImportPreviewToForm,
  canRunVacancyImportPreview,
  deriveSourceFromVacancyUrl,
  getVacancyImportFailureCode,
  normalizeCreateApplicationInitialMode,
  shouldPreselectCreateApplicationLoop,
} from "../vacancyImport.helpers";

function test(_name: string, run: () => void) {
  run();
}

const baseForm: CreateFormState = {
  loopId: "loop-1",
  companyName: "",
  roleTitle: "",
  vacancyUrl: "",
  source: "",
  locationText: "",
  rawDescription: "",
};

const preview: VacancyImportPreview = {
  sourceUrl: "https://example.com/jobs/frontend",
  source: "example.com",
  companyName: "Acme GmbH",
  roleTitle: "Frontend Developer",
  locationText: "Berlin",
  vacancyDescription: "Build UI.",
  confidence: { role_title: 0.9 },
  warnings: [],
};

test("canRunVacancyImportPreview requires loop, URL and non-loading state", () => {
  assert.equal(canRunVacancyImportPreview({ loopId: "loop-1", url: "https://x.test" }), true);
  assert.equal(canRunVacancyImportPreview({ loopId: "", url: "https://x.test" }), false);
  assert.equal(canRunVacancyImportPreview({ loopId: "loop-1", url: "" }), false);
  assert.equal(
    canRunVacancyImportPreview({ loopId: "loop-1", url: "https://x.test", isImporting: true }),
    false,
  );
});

test("applyVacancyImportPreviewToForm fills editable create fields", () => {
  const result = applyVacancyImportPreviewToForm(baseForm, preview);

  assert.deepEqual(result, {
    loopId: "loop-1",
    companyName: "Acme GmbH",
    roleTitle: "Frontend Developer",
    vacancyUrl: "https://example.com/jobs/frontend",
    source: "example.com",
    locationText: "Berlin",
    rawDescription: "Build UI.",
  });
});

test("applyVacancyImportFallbackToForm keeps failed preview URL and derives source", () => {
  const result = applyVacancyImportFallbackToForm(
    baseForm,
    " https://www.example.com/job/123 ",
  );

  assert.equal(result.vacancyUrl, "https://www.example.com/job/123");
  assert.equal(result.source, "example.com");
  assert.equal(result.loopId, "loop-1");
});

test("applyVacancyImportFallbackToForm does not overwrite manually entered source", () => {
  const result = applyVacancyImportFallbackToForm(
    { ...baseForm, source: "Manual Board" },
    "https://www.example.com/job/123",
  );

  assert.equal(result.source, "Manual Board");
});

test("deriveSourceFromVacancyUrl returns hostname without www when possible", () => {
  assert.equal(deriveSourceFromVacancyUrl("https://www.example.com/job/123"), "example.com");
  assert.equal(deriveSourceFromVacancyUrl("not a url"), "");
});

test("applyVacancyImportPreviewToForm keeps current values when preview fields are empty", () => {
  const result = applyVacancyImportPreviewToForm(
    {
      ...baseForm,
      companyName: "Manual Co",
      roleTitle: "Manual Role",
      source: "Manual Source",
    },
    {
      ...preview,
      companyName: null,
      roleTitle: " ",
      source: "",
    },
  );

  assert.equal(result.companyName, "Manual Co");
  assert.equal(result.roleTitle, "Manual Role");
  assert.equal(result.source, "Manual Source");
});

test("getVacancyImportFailureCode maps 502/504/network to the manual fallback code", () => {
  assert.equal(
    getVacancyImportFailureCode(new ApiError(502, "PREVIEW_FETCH_FAILED", "Bad gateway")),
    "fallback",
  );
  assert.equal(
    getVacancyImportFailureCode(new ApiError(504, "PREVIEW_TIMEOUT", "Timeout")),
    "fallback",
  );
  assert.equal(getVacancyImportFailureCode(new TypeError("Failed to fetch")), "fallback");
});

test("getVacancyImportFailureCode maps invalid URL validation to the invalid URL code", () => {
  assert.equal(
    getVacancyImportFailureCode(new ApiError(400, "INVALID_URL", "Invalid URL")),
    "invalidUrl",
  );
  assert.equal(
    getVacancyImportFailureCode(new ApiError(422, "INVALID_URL", "Invalid URL")),
    "invalidUrl",
  );
});

test("create after failed preview keeps loopId and vacancyUrl in payload", () => {
  const fallbackForm = applyVacancyImportFallbackToForm(
    {
      ...baseForm,
      loopId: "11111111-1111-4111-8111-111111111111",
      companyName: "Manual Co",
      roleTitle: "Manual Role",
      locationText: "Berlin",
      rawDescription: "Manual description",
    },
    "https://www.example.com/job/123",
  );

  assert.deepEqual(buildCreateApplicationPayload(fallbackForm), {
    loopId: "11111111-1111-4111-8111-111111111111",
    companyName: "Manual Co",
    roleTitle: "Manual Role",
    vacancyUrl: "https://www.example.com/job/123",
    source: "example.com",
    locationText: "Berlin",
    status: "SAVED",
    rawDescription: "Manual description",
  });
});


test("normalizeCreateApplicationInitialMode supports manual and import URL params", () => {
  assert.equal(normalizeCreateApplicationInitialMode("import"), "import");
  assert.equal(normalizeCreateApplicationInitialMode("manual"), "manual");
  assert.equal(normalizeCreateApplicationInitialMode("other"), "manual");
  assert.equal(normalizeCreateApplicationInitialMode(null), "manual");
});

test("shouldPreselectCreateApplicationLoop only accepts selectable loops", () => {
  assert.equal(
    shouldPreselectCreateApplicationLoop({
      currentLoopId: "",
      initialLoopId: "loop-1",
      selectableLoopIds: ["loop-1", "loop-2"],
    }),
    true,
  );
  assert.equal(
    shouldPreselectCreateApplicationLoop({
      currentLoopId: "loop-1",
      initialLoopId: "loop-1",
      selectableLoopIds: ["loop-1"],
    }),
    false,
  );
  assert.equal(
    shouldPreselectCreateApplicationLoop({
      currentLoopId: "",
      initialLoopId: "archived-loop",
      selectableLoopIds: ["loop-1"],
    }),
    false,
  );
});
