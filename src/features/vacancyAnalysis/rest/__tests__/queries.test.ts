import assert from "node:assert/strict";

import {
  buildCurrentAnalysisPlanUrl,
  buildLatestVacancyAnalysisUrl,
  buildVacancyAnalysesUrl,
} from "../queries";

const apiBaseUrl = "https://api.example.test/api/v1";

assert.equal(
  buildVacancyAnalysesUrl(apiBaseUrl, "loop 1", "match/1"),
  "https://api.example.test/api/v1/loops/loop%201/matches/match%2F1/analyses",
);

assert.equal(
  buildVacancyAnalysesUrl(apiBaseUrl, "loop-1", "match-1", { limit: 500, offset: -10 }),
  "https://api.example.test/api/v1/loops/loop-1/matches/match-1/analyses?limit=100&offset=0",
);

assert.equal(
  buildLatestVacancyAnalysisUrl(apiBaseUrl, "loop-1", "match-1"),
  "https://api.example.test/api/v1/loops/loop-1/matches/match-1/analyses/latest",
);

assert.equal(
  buildCurrentAnalysisPlanUrl(apiBaseUrl),
  "https://api.example.test/api/v1/users/me/analysis-plan",
);
