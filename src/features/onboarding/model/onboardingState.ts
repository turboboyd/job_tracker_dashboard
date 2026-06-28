// Versioned, per-device onboarding persistence. Pure and storage-injectable so
// the helpers are unit-testable without a DOM. No backend, no account sync.

export const ONBOARDING_VERSION = 1;

export type OnboardingStatus = "pending" | "completed" | "skipped";

export interface OnboardingState {
  status: OnboardingStatus;
  version: number;
  updatedAt: string;
}

const STORAGE_KEY = "loopboard.onboarding.v1";
const HINTS_STORAGE_KEY = "loopboard.onboarding.hints.v1";

/** Minimal subset of the Web Storage API the helpers depend on. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** localStorage when available; null in SSR/node/private-mode (access can throw). */
export function getDefaultStorage(): StorageLike | null {
  try {
    const candidate = (globalThis as { localStorage?: StorageLike }).localStorage;
    return candidate ?? null;
  } catch {
    return null;
  }
}

const DEFAULT_STATE: OnboardingState = {
  status: "pending",
  version: ONBOARDING_VERSION,
  updatedAt: "",
};

export function readOnboardingState(
  storage: StorageLike | null = getDefaultStorage(),
): OnboardingState {
  if (!storage) return { ...DEFAULT_STATE };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    const status: OnboardingStatus =
      parsed.status === "completed" || parsed.status === "skipped" ? parsed.status : "pending";
    return {
      status,
      version: typeof parsed.version === "number" ? parsed.version : 0,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function writeOnboardingState(
  state: OnboardingState,
  storage: StorageLike | null = getDefaultStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage can be full or unavailable — onboarding state is non-critical */
  }
}

/**
 * Onboarding should be shown when it was never completed/skipped for the current
 * content version. A stored version older than ONBOARDING_VERSION re-onboards the
 * user after a future onboarding revision.
 */
export function isOnboardingPending(state: OnboardingState): boolean {
  if (state.version < ONBOARDING_VERSION) return true;
  return state.status === "pending";
}

function persistStatus(status: OnboardingStatus, storage: StorageLike | null): void {
  writeOnboardingState(
    { status, version: ONBOARDING_VERSION, updatedAt: new Date().toISOString() },
    storage,
  );
}

export function markOnboardingCompleted(
  storage: StorageLike | null = getDefaultStorage(),
): void {
  persistStatus("completed", storage);
}

export function markOnboardingSkipped(
  storage: StorageLike | null = getDefaultStorage(),
): void {
  persistStatus("skipped", storage);
}

/** Clears persisted onboarding state so the tour can be shown again (restart). */
export function resetOnboarding(storage: StorageLike | null = getDefaultStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// ── Contextual hints (foundation; one-time, per-id dismissal) ────────────────

export function isHintDismissed(
  id: string,
  storage: StorageLike | null = getDefaultStorage(),
): boolean {
  if (!storage) return false;
  try {
    const raw = storage.getItem(HINTS_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Boolean(parsed[id]);
  } catch {
    return false;
  }
}

export function dismissHint(
  id: string,
  storage: StorageLike | null = getDefaultStorage(),
): void {
  if (!storage) return;
  try {
    const raw = storage.getItem(HINTS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    parsed[id] = new Date().toISOString();
    storage.setItem(HINTS_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    /* ignore */
  }
}

export function resetHints(storage: StorageLike | null = getDefaultStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(HINTS_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
