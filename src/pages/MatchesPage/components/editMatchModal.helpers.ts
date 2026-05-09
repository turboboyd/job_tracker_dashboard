import type { TFunction } from "i18next";

import type { UpdateMatchInput } from "src/entities/loopMatch";

export interface EditMatchModalMatchLike {
  company: string;
  description?: string | null;
  id: string;
  location: string;
  matchedAt?: string | null;
  title: string;
  url: string;
}

export interface EditMatchModalFormValues {
  company: string;
  description: string;
  location: string;
  matchedAt: string;
  title: string;
  url: string;
}

export interface EditMatchModalLabels {
  cancel: string;
  company: string;
  description: string;
  editTitle: string;
  location: string;
  matchedAt: string;
  save: string;
  titleField: string;
  url: string;
}

export function createEmptyEditMatchModalFormValues(): EditMatchModalFormValues {
  return {
    company: "",
    description: "",
    location: "",
    matchedAt: "",
    title: "",
    url: "",
  };
}

function toDateInputValue(iso?: string | null): string {
  if (!iso) {
    return "";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function toIsoFromDateInput(value: string): string {
  return new Date(value).toISOString();
}

export function buildEditMatchModalLabels(t: TFunction): EditMatchModalLabels {
  return {
    cancel: t("matches.common.cancel"),
    company: t("matches.modal.fields.company"),
    description: t("matches.modal.fields.description"),
    editTitle: t("matches.modal.editTitle"),
    location: t("matches.modal.fields.location"),
    matchedAt: t("matches.modal.fields.matchedAt"),
    save: t("matches.common.save"),
    titleField: t("matches.modal.fields.title"),
    url: t("matches.modal.fields.url"),
  };
}

export function buildEditMatchModalDescription(
  t: TFunction,
  loopName: string,
): string | undefined {
  const safeLoopName = loopName.trim();
  if (!safeLoopName) {
    return undefined;
  }

  return t("matches.modal.loop", { name: safeLoopName });
}

export function createEditMatchModalFormValues(
  match: EditMatchModalMatchLike,
): EditMatchModalFormValues {
  return {
    company: match.company ?? "",
    description: String(match.description ?? ""),
    location: match.location ?? "",
    matchedAt: toDateInputValue(match.matchedAt ?? null),
    title: match.title ?? "",
    url: match.url ?? "",
  };
}

export function buildEditMatchPatch(
  values: EditMatchModalFormValues,
): UpdateMatchInput["patch"] {
  const patch: UpdateMatchInput["patch"] = {
    company: values.company.trim(),
    description: values.description.trim(),
    location: values.location.trim(),
    title: values.title.trim(),
    url: values.url.trim(),
  };

  if (values.matchedAt) {
    patch.matchedAt = toIsoFromDateInput(values.matchedAt);
  }

  return patch;
}
