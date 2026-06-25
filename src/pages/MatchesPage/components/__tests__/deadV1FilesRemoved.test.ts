import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";

// Stage 10 removed the dead V1 / orphaned shadow implementations that duplicated
// the live LoopsPage and MatchesPage code. This guard fails if any of them is
// reintroduced, so a future agent can't accidentally resurrect a file that
// shadows the real page (the original source of "edit the wrong file" bugs).
const removedFiles = [
  // MatchesPage V1 UI + orchestrator (the live page is MatchesPage.tsx + the
  // MatchesHeader/Tabs/Toolbar/ListPanel/DetailPanel components + useMatchesFeed).
  "src/pages/MatchesPage/MatchesPage.sections.tsx",
  "src/pages/MatchesPage/matchesPage.helpers.ts",
  "src/pages/MatchesPage/components/MatchesFilters.tsx",
  "src/pages/MatchesPage/components/matchesFilters.controls.tsx",
  "src/pages/MatchesPage/components/matchesFilters.fields.tsx",
  "src/pages/MatchesPage/components/matchesFilters.helpers.ts",
  "src/pages/MatchesPage/components/matchesFilters.pagination.tsx",
  "src/pages/MatchesPage/components/matchesFilters.summary.tsx",
  "src/pages/MatchesPage/components/matchesFilters.sections.tsx",
  "src/pages/MatchesPage/components/EditMatchModal.tsx",
  "src/pages/MatchesPage/components/editMatchModal.helpers.ts",
  "src/pages/MatchesPage/components/editMatchModal.sections.tsx",
  "src/pages/MatchesPage/components/useEditMatchModalController.ts",
  // The orphaned matchDetails/* card cluster (NOT the live MatchesDetailPanel.tsx).
  "src/pages/MatchesPage/components/matchDetails",
  "src/pages/MatchesPage/model/useMatchesPageController.ts",
  "src/pages/MatchesPage/model/useMatchesEditingActions.ts",
  // LoopsPage orphaned scaffold (the live list view is LoopsListView.tsx + the
  // LoopCard/LoopListToolbar/LoopStatsBar/LoopEmptyState/LoopSkeleton components).
  "src/pages/LoopsPage/components/loopsListView.content.tsx",
  "src/pages/LoopsPage/components/loopsListView.sections.tsx",
  "src/pages/LoopsPage/components/loopsListView.helpers.ts",
  "src/pages/LoopsPage/components/loopsListView.types.ts",
  "src/pages/LoopsPage/components/LoopListCard.tsx",
  "src/pages/LoopsPage/components/loopsListController.helpers.ts",
  // The orphaned loopDetails.* pair (NOT the live loopDetailsView.* family).
  "src/pages/LoopsPage/components/loopDetails.sections.tsx",
  "src/pages/LoopsPage/components/loopDetails.helpers.ts",
];

for (const file of removedFiles) {
  assert.equal(
    existsSync(join(process.cwd(), file)),
    false,
    `${file} was removed in Stage 10 and must not be reintroduced`,
  );
}

console.log("deadV1FilesRemoved.test passed");
