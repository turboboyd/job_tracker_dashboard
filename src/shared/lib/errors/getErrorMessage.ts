function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function pickFirstString(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    if (isNonEmptyString(c)) return c;
  }
  return null;
}

function messageFromErrorsArray(errors: unknown): string | null {
  if (!Array.isArray(errors) || errors.length === 0) return null;

  const first = errors[0];
  if (isNonEmptyString(first)) return first;

  const firstObj = asRecord(first);
  if (!firstObj) return null;
  return pickFirstString(firstObj["message"], firstObj["error"], firstObj["detail"]);
}

export function getErrorMessage(err: unknown): string {
  if (!err) return "Unknown error";
  if (isNonEmptyString(err)) return err;
  if (err instanceof Error) return err.message;

  const rec = asRecord(err);
  if (!rec) return "Unknown error";

  const data = asRecord(rec["data"]);

  const fromData = data
    ? pickFirstString(data["message"], data["error"], data["detail"], data["title"])
    : null;
  if (fromData) return fromData;

  const direct = pickFirstString(rec["error"], rec["message"]);
  if (direct) return direct;

  const fromArray = messageFromErrorsArray(data?.["errors"]);
  if (fromArray) return fromArray;

  return "Unknown error";
}
