import assert from "node:assert/strict";

import type { ApplicationDoc } from "src/features/applications";

import { getApplicationVacancyDescription } from "../applicationDetails.helpers";

function test(_name: string, run: () => void) {
  run();
}

function makeApplication(overrides: Partial<ApplicationDoc> = {}): ApplicationDoc {
  return {
    createdAt: {} as ApplicationDoc["createdAt"],
    updatedAt: {} as ApplicationDoc["updatedAt"],
    createdBy: "user-1",
    archived: false,
    job: {
      companyName: "Acme GmbH",
      roleTitle: "Frontend Developer",
    },
    process: {
      status: "SAVED",
      lastStatusChangeAt: {} as ApplicationDoc["process"]["lastStatusChangeAt"],
      contactAttempts: 0,
      followUpLevel: 0,
      needsFollowUp: false,
      needsReapplySuggestion: false,
    },
    ...overrides,
  };
}

test("getApplicationVacancyDescription returns persisted raw description", () => {
  const app = makeApplication({
    vacancy: {
      rawDescription: " Build UI with React and TypeScript. ",
    },
  });

  assert.equal(
    getApplicationVacancyDescription(app),
    "Build UI with React and TypeScript.",
  );
});

test("getApplicationVacancyDescription returns empty string for missing description", () => {
  assert.equal(getApplicationVacancyDescription(makeApplication()), "");
  assert.equal(getApplicationVacancyDescription(null), "");
});
