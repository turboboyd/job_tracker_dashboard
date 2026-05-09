import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  buildCategoryOptions,
  buildFavoritesCountText,
  buildResultsText,
  filterResources,
  getAvailableResourceCategories,
  getBaseResources,
  localizeResources,
} from "./resourcesPage.helpers";
import type {
  CategoryOption,
  LocalizedResource,
} from "./resourcesPage.types";
import type { ResourceCategory, ViewMode } from "./types";
import { useResourceFavoritesState } from "./useResourceFavoritesState";

export type { CategoryOption, LocalizedResource } from "./resourcesPage.types";

export const useResourcesPage = () => {
  const { t } = useTranslation(undefined, { keyPrefix: "resources" });

  const tr = useCallback(
    (key: string, fallback?: string, options?: Record<string, unknown>) => {
      if (typeof fallback === "string") {
        return t(key, { defaultValue: fallback, ...(options ?? {}) });
      }
      return t(key);
    },
    [t],
  );

  const {
    favoriteIds,
    favIsError,
    favIsFetching,
    isFavorite,
    isPending,
    isPrivate,
    onToggleFavorite,
    refetchFavorites,
    uid,
  } = useResourceFavoritesState();

  const [query, setQuery] = useState("");
  const [categoryState, setCategory] = useState<ResourceCategory>("all");
  const [viewModeState, setViewMode] = useState<ViewMode>("all");
  const viewMode: ViewMode = isPrivate ? viewModeState : "all";

  const resources: LocalizedResource[] = useMemo(() => {
    return localizeResources(t);
  }, [t]);

  const baseList = useMemo(() => {
    return getBaseResources({ favoriteIds, resources, viewMode });
  }, [resources, favoriteIds, viewMode]);

  const availableCategories = useMemo((): ResourceCategory[] => {
    return getAvailableResourceCategories({ baseList, viewMode });
  }, [baseList, viewMode]);

  const category: ResourceCategory =
    viewMode === "favorites" && !availableCategories.includes(categoryState)
      ? "all"
      : categoryState;

  const categoryOptions: CategoryOption[] = useMemo(() => {
    return buildCategoryOptions(availableCategories, tr);
  }, [availableCategories, tr]);

  const filtered = useMemo(() => {
    return filterResources({ baseList, category, query });
  }, [baseList, category, query]);

  const resultsText = useMemo(() => {
    return buildResultsText(filtered.length, tr);
  }, [filtered.length, tr]);

  const favoritesCountText = useMemo(() => {
    const count = isPrivate ? favoriteIds.size : 0;
    return buildFavoritesCountText(count, tr);
  }, [favoriteIds.size, isPrivate, tr]);

  const onReset = useCallback(() => {
    setQuery("");
    setCategory("all");
    setViewMode("all");
  }, []);

  return {
    t,
    tr,

    uid,
    isPrivate,

    favIsFetching,
    favIsError,
    refetchFavorites,
    favoriteIds,

    query,
    setQuery,
    category,
    setCategory,
    viewMode,
    setViewMode,

    resources,
    baseList,
    filtered,
    categoryOptions,
    resultsText,
    favoritesCountText,

    onReset,
    onToggleFavorite,
    isFavorite,
    isPending,
  };
};
