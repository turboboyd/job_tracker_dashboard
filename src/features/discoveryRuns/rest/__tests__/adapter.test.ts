import assert from "node:assert/strict";

import {
  mapDiscoveryRunPreviewInputToDto,
  mapDiscoveryRunResponseDto,
  mapDiscoverySourceRuntimeStatusResponseDto,
} from "../adapter";
import type { DiscoveryRunResponseDto } from "../types";

assert.deepEqual(
  mapDiscoveryRunPreviewInputToDto({
    loopId: "loop-1",
    dryRun: true,
    sourceIds: ["arbeitsagentur"],
    searchScope: "broad",
    page: 2,
    pageSize: 5,
  }),
  {
    loop_id: "loop-1",
    dry_run: true,
    source_ids: ["arbeitsagentur"],
    search_scope: "broad",
    page: 2,
    page_size: 5,
  },
);

const dto: DiscoveryRunResponseDto = {
  run_id: "run-1",
  status: "completed",
  dry_run: true,
  page: 2,
  page_size: 5,
  loops_checked: 1,
  sources_checked: 1,
  matches_created: 0,
  matches_previewed: 1,
  warnings: [],
  items: [
    {
      loop_id: "loop-1",
      source_id: "arbeitsagentur",
      status: "would_run",
      reason: "adapter_preview_ready",
      message: "ok",
      items_previewed: 1,
      has_more: true,
      warnings: ["arbeitsagentur_dry_run_preview_only"],
      errors: [],
      preview_items: [
        {
          external_id: "job-1",
          source_url: "https://example.test/job-1",
          title: "Backend Engineer",
          company: "Example GmbH",
          location: "Berlin",
          snippet: "FastAPI role",
          posted_at: "2026-05-01",
          raw_metadata: { refnr: "job-1" },
          confidence: { source_quality: 0.7 },
        },
      ],
    },
  ],
};

const mapped = mapDiscoveryRunResponseDto(dto);
assert.equal(mapped.runId, "run-1");
assert.equal(mapped.page, 2);
assert.equal(mapped.pageSize, 5);
assert.equal(mapped.loopsChecked, 1);
assert.equal(mapped.sourcesChecked, 1);
assert.equal(mapped.matchesCreated, 0);
assert.equal(mapped.matchesPreviewed, 1);
assert.equal(mapped.items[0].loopId, "loop-1");
assert.equal(mapped.items[0].itemsPreviewed, 1);
assert.equal(mapped.items[0].hasMore, true);
assert.equal(mapped.items[0].previewItems[0].sourceUrl, "https://example.test/job-1");
assert.equal(mapped.items[0].previewItems[0].postedAt, "2026-05-01");
assert.deepEqual(mapped.items[0].previewItems[0].rawMetadata, { refnr: "job-1" });

assert.equal(
  mapDiscoveryRunResponseDto({
    ...dto,
    items: [
      {
        ...dto.items[0],
        items_previewed: 5,
        has_more: undefined,
      },
    ],
  }).items[0].hasMore,
  true,
);
assert.equal(
  mapDiscoveryRunResponseDto({
    ...dto,
    items: [
      {
        ...dto.items[0],
        items_previewed: 4,
        has_more: undefined,
      },
    ],
  }).items[0].hasMore,
  false,
);

assert.deepEqual(
  mapDiscoverySourceRuntimeStatusResponseDto({
    items: [
      {
        source_id: "adzuna",
        name: "Adzuna Germany",
        automatic_discovery: true,
        configured: false,
        runnable: false,
        configuration_status: "not_configured",
        message_code: "adzuna_not_configured",
      },
    ],
  }),
  {
    items: [
      {
        sourceId: "adzuna",
        name: "Adzuna Germany",
        automaticDiscovery: true,
        configured: false,
        runnable: false,
        configurationStatus: "not_configured",
        messageCode: "adzuna_not_configured",
      },
    ],
  },
);
