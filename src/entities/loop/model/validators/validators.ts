export type ValidationResult = { ok: true } | { ok: false; message: string };

export function validateRequiredText(
  value: string,
  fieldLabel: string
): ValidationResult {
  const v = value.trim();
  if (!v) return { ok: false, message: `${fieldLabel} is required.` };
  return { ok: true };
}
