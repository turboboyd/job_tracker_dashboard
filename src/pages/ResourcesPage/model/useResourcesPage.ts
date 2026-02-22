import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useAppSelector } from "src/app/store/hooks";
import { selectUid } from "src/entities/auth";
import {
  useGetUserResourceFavoritesQuery,
  useToggleUserResourceFavoriteMutation,
} from "src/entities/resourceFavorites";

import { resourcesCatalog } from "./catalog";
import { CATEGORY_ORDER, categoryLabelKey } from "./constants";
import { ResourceCategory, ViewMode } from "./types";

export type CategoryOption = { key: ResourceCategory; label: string };

export type LocalizedResource = {
  id: string;
  title: string;
  description: string;
  href: string;
  category: Exclude<ResourceCategory, "all">;
  tags: string[];
};

export const useResourcesPage = () => {
  const { t } = useTranslation(undefined, { keyPrefix: "resources" });

  const tr = useCallback(
    (key: string, fallback?: string, options?: Record<string, unknown>) =>
      t(
        key,
        typeof fallback === "string"
          ? { defaultValue: fallback, ...(options ?? {}) }
          : undefined,
      ),
    [t],
  );

  const uid = useAppSelector(selectUid);
  const isPrivate = Boolean(uid);

  const {
    data: favoritesData,
    isFetching: favIsFetching,
    isError: favIsError,
    refetch: refetchFavorites,
  } = useGetUserResourceFavoritesQuery(
    { uid: uid ?? "" },
    {
      skip: !isPrivate,
      refetchOnMountOrArgChange: true,
      refetchOnReconnect: true,
      refetchOnFocus: true,
    },
  );

  const [toggleFavorite] = useToggleUserResourceFavoriteMutation();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ResourceCategory>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  useEffect(() => {
    if (!isPrivate && viewMode !== "all") {
      setViewMode("all");
    }
  }, [isPrivate, viewMode]);

  const resources: LocalizedResource[] = useMemo(() => {
    return resourcesCatalog.map((r) => {
      const title = t(`items.${r.i18nKey}.title`, { defaultValue: r.id });
      const description = t(`items.${r.i18nKey}.description`, {
        defaultValue: "",
      });

      const tags = r.tagKeys.map((key) => {
        if (!key.startsWith("tags.")) return key;
        return t(key, { defaultValue: key });
      });

      return {
        id: r.id,
        title,
        description,
        href: r.href,
        category: r.category,
        tags,
      };
    });
  }, [t]);

  const favoriteIds = useMemo(() => {
    if (!isPrivate) return new Set<string>();
    return new Set(favoritesData?.ids ?? []);
  }, [favoritesData?.ids, isPrivate]);

  const baseList = useMemo(() => {
    if (viewMode !== "favorites") return resources;
    return resources.filter((r) => favoriteIds.has(r.id));
  }, [resources, favoriteIds, viewMode]);

  const availableCategories = useMemo((): ResourceCategory[] => {
    if (viewMode !== "favorites") return ["all", ...CATEGORY_ORDER];

    const set = new Set<Exclude<ResourceCategory, "all">>();
    for (const r of baseList) set.add(r.category);

    const list: ResourceCategory[] = ["all"];
    for (const c of CATEGORY_ORDER) {
      if (set.has(c)) list.push(c);
    }

    return list;
  }, [baseList, viewMode]);

  useEffect(() => {
    if (viewMode === "favorites" && !availableCategories.includes(category)) {
      setCategory("all");
    }
  }, [availableCategories, viewMode, category]);

  const categoryOptions: CategoryOption[] = useMemo(() => {
    return availableCategories.map((key) => ({
      key,
      label: tr(categoryLabelKey[key], key),
    }));
  }, [availableCategories, tr]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return baseList
      .filter((r) => (category === "all" ? true : r.category === category))
      .filter((r) => {
        if (!q) return true;

        const hay = [r.title, r.description, r.tags.join(" ")]
          .join(" ")
          .toLowerCase();

        return hay.includes(q);
      });
  }, [baseList, category, query]);

  const resultsText = useMemo(() => {
    if (filtered.length === 0) {
      return tr("results.none", "No results");
    }

    return tr("results.count", "{{count}} resources", {
      count: filtered.length,
    });
  }, [filtered.length, tr]);

  const favoritesCountText = useMemo(() => {
    const count = isPrivate ? (favoritesData?.ids?.length ?? 0) : 0;
    return tr("favorites.count", "{{count}} saved", { count });
  }, [favoritesData?.ids?.length, isPrivate, tr]);

  const onReset = useCallback(() => {
    setQuery("");
    setCategory("all");
    setViewMode("all");
  }, []);

  const onToggleFavorite = useCallback(
    async (resourceId: string) => {
      if (!isPrivate || !uid) return;

      setPendingIds((prev) => {
        const next = new Set(prev);
        next.add(resourceId);
        return next;
      });

      try {
        await toggleFavorite({ uid, resourceId }).unwrap();
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(resourceId);
          return next;
        });
      }
    },
    [isPrivate, uid, toggleFavorite],
  );

  const isFavorite = useCallback(
    (resourceId: string) => {
      if (!isPrivate) return false;
      return favoriteIds.has(resourceId);
    },
    [favoriteIds, isPrivate],
  );

  const isPending = useCallback(
    (resourceId: string) => pendingIds.has(resourceId),
    [pendingIds],
  );

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