import type { LoopPlatform, ValidationResult } from "src/entities/loop/model/";

function ok(): ValidationResult {
  return { ok: true };
}

function fail(message: string): ValidationResult {
  return { ok: false, message };
}

export function validateLoopName(name: string): ValidationResult {
  const v = (name ?? "").trim();
  if (!v) return fail("Loop name is required.");
  if (v.length < 2) return fail("Loop name is too short.");
  if (v.length > 60) return fail("Loop name is too long (max 60 chars).");
  return ok();
}

export function validateRole(role: string): ValidationResult {
  const v = (role ?? "").trim();
  if (!v) return fail("Position / role is required.");
  if (v.length > 120) return fail("Role is too long (max 120 chars).");
  return ok();
}

export function validateLocation(location: string): ValidationResult {
  const v = (location ?? "").trim();
  // location можно сделать optional (если remote-only), поэтому не required
  if (v.length > 80) return fail("Location is too long (max 80 chars).");
  return ok();
}

export function validateRadiusKm(radiusKm: number): ValidationResult {
  const n = Number(radiusKm);
  if (!Number.isFinite(n)) return fail("Radius must be a number.");
  if (n < 0) return fail("Radius must be >= 0.");
  if (n > 200) return fail("Radius must be <= 200.");
  return ok();
}

export function validatePlatforms(platforms: LoopPlatform[]): ValidationResult {
  if (!Array.isArray(platforms)) return fail("Platforms must be an array.");
  if (platforms.length === 0) return fail("Select at least one platform.");
  if (platforms.length > 40) return fail("Too many platforms selected.");
  return ok();
}
