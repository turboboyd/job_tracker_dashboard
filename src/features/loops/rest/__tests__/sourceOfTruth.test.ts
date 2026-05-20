import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function test(_name: string, run: () => void) {
  run();
}

const runtimeFiles = [
  "src/pages/LoopsPage/components/LoopDetailsView.tsx",
  "src/pages/LoopsPage/components/LoopsListView.tsx",
  "src/pages/MatchesPage/model/useMatchesQueries.ts",
  "src/pages/BoardPage/model/useBoardQueries.ts",
  "src/pages/DashboardPage/model/useDashboardData.ts",
];

const legacyLoopHooks = [
  "useGetLoopsQuery",
  "useLazyGetLoopsQuery",
  "useGetLoopsPageQuery",
  "useLazyGetLoopsPageQuery",
  "useGetLoopQuery",
  "useCreateLoopMutation",
  "useUpdateLoopMutation",
  "useDeleteLoopMutation",
];

test("runtime Loop views use backend REST hooks instead of legacy Loop hooks", () => {
  for (const file of runtimeFiles) {
    const source = readFileSync(join(process.cwd(), file), "utf8");

    assert.equal(
      source.includes("useBackendLoopsQuery") ||
        source.includes("listLoopsViaRest") ||
        source.includes("getLoopViaRest"),
      true,
      `${file} should use backend Loops REST integration`,
    );

    for (const legacyHook of legacyLoopHooks) {
      assert.equal(
        source.includes(legacyHook),
        false,
        `${file} should not import ${legacyHook}`,
      );
    }
  }
});
