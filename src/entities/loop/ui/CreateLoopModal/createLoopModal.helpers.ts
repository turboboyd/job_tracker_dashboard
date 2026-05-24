import {
  DEFAULT_CANONICAL_FILTERS,
  RECOMMENDED_PLATFORMS,
  normalizeRoleToTitles,
  type CreateLoopInput,
} from "../../model";

import type { CreateLoopForm } from "./createLoopModal.types";

export function createInitialLoopForm(): CreateLoopForm {
  return { name: "", role: "", location: "Berlin", platforms: [...RECOMMENDED_PLATFORMS] };
}

export function validateCreateLoopForm(form: CreateLoopForm): string | null {
  const name = form.name.trim();
  const role = form.role.trim();
  const location = form.location.trim();

  if (!name) return "Name is required";
  if (name.length < 2) return "Name is too short";
  if (name.length > 60) return "Name is too long";

  if (!role) return "Position / Role is required";
  if (role.length < 2) return "Role is too short";
  if (role.length > 120) return "Role is too long";

  if (!location) return "City / Location is required";
  if (location.length > 80) return "Location is too long";

  return null;
}

export function buildCreateLoopInput(form: CreateLoopForm): CreateLoopInput {
  const name = form.name.trim();
  const role = form.role.trim();
  const location = form.location.trim();
  const platforms = form.platforms.length > 0 ? form.platforms : [...RECOMMENDED_PLATFORMS];

  return {
    name,
    titles: normalizeRoleToTitles(role),
    location,
    radiusKm: 30,
    remoteMode: "any",
    platforms: platforms as typeof RECOMMENDED_PLATFORMS,
    filters: {
      ...DEFAULT_CANONICAL_FILTERS,
      role,
      location,
      radiusKm: 30,
      workMode: "any",
    },
  };
}
