import type { TFunction } from "i18next";

import { resourcesCatalog } from "./catalog";
import {
  CATEGORY_ORDER,
  categoryLabelKey,
} from "./constants";
import type {
  CategoryOption,
  LocalizedResource,
  ResourcesTranslator,
} from "./resourcesPage.types";
import type { ResourceCategory, ViewMode } from "./types";

export function localizeResources(t: TFunction): LocalizedResource[] {
  return resourcesCatalog.map((resource) => {
    const title = t(`items.${resource.i18nKey}.title`, {
      defaultValue: resource.id,
    });
    const description = t(`items.${resource.i18nKey}.description`, {
      defaultValue: "",
    });

    const tags = resource.tagKeys.map((key) => {
      if (!key.startsWith("tags.")) return key;
      return t(key, { defaultValue: key });
    });

    return {
      id: resource.id,
      title,
      description,
      href: resource.href,
      category: resource.category,
      tags,
    };
  });
}

export function getBaseResources(args: {
  favoriteIds: ReadonlySet<string>;
  resources: LocalizedResource[];
  viewMode: ViewMode;
}): LocalizedResource[] {
  const { favoriteIds, resources, viewMode } = args;

  if (viewMode !== "favorites") return resources;
  return resources.filter((resource) => favoriteIds.has(resource.id));
}

export function getAvailableResourceCategories(args: {
  baseList: LocalizedResource[];
  viewMode: ViewMode;
}): ResourceCategory[] {
  const { baseList, viewMode } = args;

  if (viewMode !== "favorites") return ["all", ...CATEGORY_ORDER];

  const set = new Set<Exclude<ResourceCategory, "all">>();
  for (const resource of baseList) set.add(resource.category);

  const list: ResourceCategory[] = ["all"];
  for (const category of CATEGORY_ORDER) {
    if (set.has(category)) list.push(category);
  }

  return list;
}

export function buildCategoryOptions(
  availableCategories: ResourceCategory[],
  tr: ResourcesTranslator,
): CategoryOption[] {
  return availableCategories.map((key) => ({
    key,
    label: tr(categoryLabelKey[key], key),
  }));
}

export function filterResources(args: {
  baseList: LocalizedResource[];
  category: ResourceCategory;
  query: string;
}): LocalizedResource[] {
  const { baseList, category, query } = args;
  const normalizedQuery = query.trim().toLowerCase();

  return baseList
    .filter((resource) =>
      category === "all" ? true : resource.category === category,
    )
    .filter((resource) => {
      if (!normalizedQuery) return true;

      const haystack = [
        resource.title,
        resource.description,
        resource.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
}

export function buildResultsText(
  count: number,
  tr: ResourcesTranslator,
): string {
  if (count === 0) {
    return tr("results.none", "No results");
  }

  return tr("results.count", "{{count}} resources", { count });
}

export function buildFavoritesCountText(
  count: number,
  tr: ResourcesTranslator,
): string {
  return tr("favorites.count", "{{count}} saved", { count });
}

