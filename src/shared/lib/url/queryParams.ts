export type QueryValue = string | number | boolean | null | undefined;

export function toQueryString(params: Record<string, QueryValue>): string {
  const sp = new URLSearchParams();

  for (const [key, val] of Object.entries(params)) {
    if (val === null || val === undefined || val === "") continue;
    sp.set(key, String(val));
  }

  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function readQuery(search: string): URLSearchParams {
  const s = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(s);
}

export function getQueryParam(search: string, key: string): string | null {
  return readQuery(search).get(key);
}

export function setQueryParam(search: string, key: string, value: QueryValue): string {
  const sp = readQuery(search);

  if (value === null || value === undefined || value === "") sp.delete(key);
  else sp.set(key, String(value));

  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function deleteQueryParam(search: string, key: string): string {
  const sp = readQuery(search);
  sp.delete(key);
  const s = sp.toString();
  return s ? `?${s}` : "";
}
