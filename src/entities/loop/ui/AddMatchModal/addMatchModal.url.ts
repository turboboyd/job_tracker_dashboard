export function tryParseUrl(input: string): URL | null {
  const value = input.trim();
  if (!value) {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    try {
      return new URL(`https://${value}`);
    } catch {
      return null;
    }
  }
}

