export type ApplicationsBackend = "firestore" | "rest";

declare const __ENV__:
  | {
      BACKEND_API_BASE_URL?: string;
    }
  | undefined;

export interface BackendConfig {
  applicationsBackend: ApplicationsBackend;
  apiBaseUrl: string;
}

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8001/api/v1";

function normalizeApiBaseUrl(value: string): string {
  let normalized = value.trim();

  while (normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

function readConfiguredApiBaseUrl(): string {
  const envApiBaseUrl =
    typeof __ENV__ !== "undefined" ? __ENV__?.BACKEND_API_BASE_URL?.trim() : undefined;

  return normalizeApiBaseUrl(envApiBaseUrl || DEFAULT_API_BASE_URL);
}

const DEFAULT_CONFIG: BackendConfig = {
  // Flip to "rest" locally to route application mutations through the FastAPI backend.
  // Kept as "firestore" to preserve existing behaviour by default.
  applicationsBackend: "firestore",
  apiBaseUrl: readConfiguredApiBaseUrl(),
};

let _override: Partial<BackendConfig> | undefined;

export function getBackendConfig(): BackendConfig {
  if (_override) return { ...DEFAULT_CONFIG, ..._override };
  return DEFAULT_CONFIG;
}

/** Override individual config keys at runtime. Test-only. */
export function _overrideBackendConfig(override: Partial<BackendConfig>): void {
  _override = override;
}

/** Reset all overrides back to defaults. Test-only. */
export function _resetBackendConfig(): void {
  _override = undefined;
}
