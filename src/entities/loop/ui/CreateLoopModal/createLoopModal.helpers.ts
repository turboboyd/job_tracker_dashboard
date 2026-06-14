import {
  DEFAULT_CANONICAL_FILTERS,
  DEFAULT_SELECTED_PLATFORMS,
  clampRadiusKm,
  normalizeRoleToTitles,
  type CanonicalFilters,
  type CreateLoopInput,
} from "../../model";

import type { CreateLoopForm } from "./createLoopModal.types";

const CANONICAL_RADIUS_STEPS: readonly CanonicalFilters["radiusKm"][] = [
  5, 10, 20, 30, 50, 100,
];

/** Snap a free-form radius to the nearest canonical filter step. The loop's
 * own radius keeps the exact value; only the URL-builder filters are stepped. */
function toCanonicalRadius(radiusKm: number): CanonicalFilters["radiusKm"] {
  let best = CANONICAL_RADIUS_STEPS[0];
  for (const step of CANONICAL_RADIUS_STEPS) {
    if (Math.abs(step - radiusKm) < Math.abs(best - radiusKm)) best = step;
  }
  return best;
}

export function createInitialLoopForm(): CreateLoopForm {
  return {
    name: "",
    role: "",
    location: "Berlin",
    // LinkedIn stays available in the source chips but is not pre-selected —
    // defaults prefer the legal/easier job boards (see DEFAULT_SELECTED_PLATFORMS).
    platforms: [...DEFAULT_SELECTED_PLATFORMS],
    radiusKm: "30",
    workMode: "any",
    includeKeywords: "",
    excludeKeywords: "",
  };
}

export function validateCreateLoopForm(form: CreateLoopForm): string | null {
  const name = form.name.trim();
  const role = form.role.trim();
  const location = form.location.trim();
  const radiusText = form.radiusKm.trim();

  if (!name) return "Name is required";
  if (name.length < 2) return "Name is too short";
  if (name.length > 60) return "Name is too long";

  if (!role) return "Position / Role is required";
  if (role.length < 2) return "Role is too short";
  if (role.length > 120) return "Role is too long";

  if (!location) return "City / Location is required";
  if (location.length > 80) return "Location is too long";

  if (radiusText !== "") {
    const radius = Number(radiusText);
    if (!Number.isFinite(radius) || radius < 0 || radius > 200) {
      return "Radius must be a number between 0 and 200";
    }
  }

  return null;
}

export function buildCreateLoopInput(form: CreateLoopForm): CreateLoopInput {
  const name = form.name.trim();
  const role = form.role.trim();
  const location = form.location.trim();
  const platforms =
    form.platforms.length > 0 ? form.platforms : [...DEFAULT_SELECTED_PLATFORMS];
  const radiusText = form.radiusKm.trim();
  const radiusKm = clampRadiusKm(radiusText === "" ? 30 : Number(radiusText));

  return {
    name,
    titles: normalizeRoleToTitles(role),
    location,
    radiusKm,
    remoteMode: form.workMode === "remote_only" ? "remote_only" : "any",
    platforms: platforms as typeof DEFAULT_SELECTED_PLATFORMS,
    filters: {
      ...DEFAULT_CANONICAL_FILTERS,
      role,
      location,
      radiusKm: toCanonicalRadius(radiusKm),
      workMode: form.workMode,
      includeKeywords: form.includeKeywords.trim(),
      excludeKeywords: form.excludeKeywords.trim(),
    },
  };
}
