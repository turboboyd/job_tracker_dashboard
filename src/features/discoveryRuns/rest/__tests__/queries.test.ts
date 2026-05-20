import assert from "node:assert/strict";

import {
  buildDiscoveryRunsUrl,
  buildDiscoverySourceRuntimeStatusUrl,
} from "../queries";

assert.equal(
  buildDiscoveryRunsUrl("https://api.example.test/api/v1"),
  "https://api.example.test/api/v1/discovery-runs",
);

assert.equal(
  buildDiscoverySourceRuntimeStatusUrl("https://api.example.test/api/v1"),
  "https://api.example.test/api/v1/discovery-sources/runtime-status",
);
