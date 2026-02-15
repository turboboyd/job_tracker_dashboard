import type { Location, NavigateFunction } from "react-router-dom";

type Updates = Record<string, string | number | boolean | null | undefined>;

type Options = {
  replace?: boolean;
};

/**
 * Small helper for manipulating query params without manually building strings.
 *
 * Rules:
 * - null/undefined/false => remove param
 * - true => set "1"
 * - number/string => set as string
 */
export function updateURLParams(
  navigate: NavigateFunction,
  location: Location,
  updates: Updates,
  options: Options = { replace: true }
) {
  const sp = new URLSearchParams(location.search);

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === false) {
      sp.delete(key);
      continue;
    }

    if (value === true) {
      sp.set(key, "1");
      continue;
    }

    sp.set(key, String(value));
  }

  const nextSearch = sp.toString();
  navigate(
    {
      pathname: location.pathname,
      search: nextSearch ? `?${nextSearch}` : "",
    },
    { replace: options.replace ?? true }
  );
}
