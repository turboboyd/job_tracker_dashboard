import assert from "node:assert/strict";

import type { Loop } from "src/entities/loop";
import type { VacancyMatch } from "src/features/vacancyMatches";

import {
  getApplicationDetailsRoute,
  getCreateApplicationLabel,
  getPersistedApplicationFeedback,
  getSavedMatchesTargetLoops,
  getSavedMatchesCopyText,
  getSavedMatchSourceLabel,
  getSavedMatchStatusLabel,
  isSavedMatchActionable,
  MATCHES_SAVED_MATCHES_COPY,
  sortSavedMatchesByUpdatedAt,
} from "../matchesSavedVacancyMatches.helpers";

function match(patch: Partial<VacancyMatch> & Pick<VacancyMatch, "id">): VacancyMatch {
  const { id, ...rest } = patch;
  return {
    id,
    userId: "user-1",
    loopId: "loop-1",
    sourceUrl: `https://example.test/${patch.id}`,
    source: "arbeitsagentur",
    externalId: null,
    companyName: "Example GmbH",
    roleTitle: "Frontend Engineer",
    locationText: "Berlin",
    vacancyDescription: "React role",
    rawMetadata: {},
    confidence: {},
    warnings: [],
    status: "saved",
    applicationId: null,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    ...rest,
  };
}

function loop(patch: Partial<Loop> & Pick<Loop, "id" | "name">): Loop {
  const { id, name, ...rest } = patch;
  return {
    id,
    name,
    title: name,
    titles: [],
    targetRole: "",
    location: "",
    radiusKm: 30,
    selectedSources: [],
    remoteMode: "any",
    platforms: [],
    status: "active",
    ...rest,
  };
}

assert.equal(isSavedMatchActionable(match({ id: "saved", status: "saved" })), true);
assert.equal(isSavedMatchActionable(match({ id: "new", status: "new" })), true);
assert.equal(isSavedMatchActionable(match({ id: "ignored", status: "ignored" })), false);
assert.equal(
  isSavedMatchActionable(match({ id: "converted", status: "converted" })),
  false,
);

assert.equal(getSavedMatchStatusLabel(match({ id: "new", status: "new" })), "Новая");
assert.equal(
  getSavedMatchStatusLabel(match({ id: "saved", status: "saved" })),
  "Сохранена",
);
assert.equal(
  getSavedMatchStatusLabel(match({ id: "ignored", status: "ignored" })),
  "Игнорирована",
);
assert.equal(
  getSavedMatchStatusLabel(
    match({ id: "app", status: "saved", applicationId: "app-1" }),
  ),
  "Заявка создана",
);
assert.equal(getSavedMatchSourceLabel(match({ id: "adzuna", source: "adzuna" })), "Adzuna");
assert.equal(
  getSavedMatchSourceLabel(match({ id: "greenhouse", source: "greenhouse" })),
  "Greenhouse",
);
assert.equal(getSavedMatchSourceLabel(match({ id: "custom", source: "custom" })), "custom");

assert.equal(getCreateApplicationLabel(false), "Создать заявку");
assert.equal(getCreateApplicationLabel(true), "Создаём...");
assert.equal(getApplicationDetailsRoute("app 1"), "/dashboard/applications/app%201");
assert.deepEqual(
  getPersistedApplicationFeedback(match({ id: "app", applicationId: "app-1" })),
  {
    applicationId: "app-1",
    message: "Заявка уже создана",
  },
);
assert.equal(getPersistedApplicationFeedback(match({ id: "no-app" })), null);

const sorted = sortSavedMatchesByUpdatedAt([
  { loopName: "A", match: match({ id: "older", updatedAt: "2026-05-01T00:00:00.000Z" }) },
  { loopName: "B", match: match({ id: "newer", updatedAt: "2026-05-03T00:00:00.000Z" }) },
]);
assert.deepEqual(
  sorted.map((item) => item.match.id),
  ["newer", "older"],
);

const targetLoops = getSavedMatchesTargetLoops(
  [
    loop({ id: "loop-a", name: "Frontend" }),
    loop({ id: "loop-b", name: "Backend" }),
    loop({ id: "loop-c", name: "Archived", status: "archived" }),
  ],
  ["loop-b", "missing"],
);
assert.deepEqual(
  targetLoops.map((item) => item.id),
  ["loop-b"],
);
assert.deepEqual(
  getSavedMatchesTargetLoops(
    [
      loop({ id: "loop-a", name: "Frontend" }),
      loop({ id: "loop-c", name: "Archived", status: "archived" }),
    ],
    [],
  ).map((item) => item.id),
  ["loop-a"],
);

const copy = getSavedMatchesCopyText();
assert.equal(copy.includes("Заявка создаётся только по вашему нажатию."), true);
assert.equal(copy.includes("Внешний отклик на сайте работодателя не отправляется."), true);
assert.equal(MATCHES_SAVED_MATCHES_COPY.openApplication, "Открыть заявку");

const forbiddenSearchDirectionWords = new RegExp(
  [`ци${"кл"}`, `ци${"клы"}`, `cy${"cle"}`].join("|"),
  "i",
);
assert.equal(forbiddenSearchDirectionWords.test(copy), false);
