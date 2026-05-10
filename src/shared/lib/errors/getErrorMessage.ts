function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function pickFirstString(...candidates: readonly unknown[]): string | null {
  for (const candidate of candidates) {
    if (isNonEmptyString(candidate)) {
      return candidate;
    }
  }

  return null;
}

function messageFromErrorsArray(errors: unknown): string | null {
  if (!Array.isArray(errors) || errors.length === 0) {
    return null;
  }

  const [firstError] = errors as readonly unknown[];

  if (isNonEmptyString(firstError)) {
    return firstError;
  }

  const firstErrorRecord = asRecord(firstError);
  if (!firstErrorRecord) {
    return null;
  }

  return pickFirstString(
    firstErrorRecord.message,
    firstErrorRecord.error,
    firstErrorRecord.detail,
  );
}

export function getErrorMessage(error: unknown, fallback = "Unknown error"): string {
  if (!error) {
    return fallback;
  }

  if (isNonEmptyString(error)) {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  const errorRecord = asRecord(error);
  if (!errorRecord) {
    return fallback;
  }

  const dataRecord = asRecord(errorRecord.data);
  const dataMessage = dataRecord
    ? pickFirstString(
        dataRecord.message,
        dataRecord.error,
        dataRecord.detail,
        dataRecord.title,
      )
    : null;

  if (dataMessage) {
    return dataMessage;
  }

  const directMessage = pickFirstString(errorRecord.error, errorRecord.message);
  if (directMessage) {
    return directMessage;
  }

  const arrayMessage = messageFromErrorsArray(dataRecord?.errors);
  if (arrayMessage) {
    return arrayMessage;
  }

  return fallback;
}
