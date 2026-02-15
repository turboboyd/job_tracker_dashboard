import type { FormikErrors, FormikTouched } from "formik";

function getIn(obj: unknown, path: string): unknown {
  if (!obj || typeof path !== "string" || path.length === 0) return undefined;

  const parts = path.split(".").filter(Boolean);

  let cur: unknown = obj;

  for (const p of parts) {
    if (cur == null) return undefined;

    if (typeof cur !== "object") return undefined;

    const rec = cur as Record<string, unknown>;
    cur = rec[p];
  }

  return cur;
}

export function getFieldError<T>(
  name: string,
  touched: FormikTouched<T>,
  errors: FormikErrors<T>
): string | undefined {
  const isTouched = Boolean(getIn(touched, name));
  if (!isTouched) return undefined;

  const err = getIn(errors, name);
  return typeof err === "string" ? err : undefined;
}
