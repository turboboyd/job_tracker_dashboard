export function requireStateValue<T>(
  state: unknown,
  readValue: (state: unknown) => T | null | undefined,
  errorMessage: string,
): NonNullable<T> {
  const value = readValue(state);

  if (value == null || value === "") {
    throw new Error(errorMessage);
  }

  return value;
}
