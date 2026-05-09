import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useResourcesPage } from "./model/useResourcesPage";
import { ensureResourcesLocalesLoaded } from "./resourcesLocales";
import {
  ResourcesEmptyState,
  ResourcesFavoritesError,
  ResourcesList,
} from "./ResourcesPage.sections";
import { ResourcesFiltersCard } from "./ui/ResourcesFiltersCard";
import { ResourcesHeader } from "./ui/ResourcesHeader";

const ResourcesPage: React.FC = () => {
  const {
    uid,
    isPrivate,

    favIsFetching,
    favIsError,
    refetchFavorites,

    query,
    setQuery,
    category,
    setCategory,
    viewMode,
    setViewMode,

    filtered,
    categoryOptions,
    resultsText,
    favoritesCountText,

    onReset,
    onToggleFavorite,
    isFavorite,
    isPending,
  } = useResourcesPage();

  const { t } = useTranslation();

  useEffect(() => {
    void ensureResourcesLocalesLoaded();
  }, []);

  const suggestHref = React.useMemo(() => {
    const email = t("resources.actions.suggest.email", {
      defaultValue: "danivdenis1@gmail.com",
    });

    const subject = encodeURIComponent(
      t("resources.actions.suggest.subject", {
        defaultValue: "Resource suggestion",
      }),
    );

    return `mailto:${email}?subject=${subject}`;
  }, [t]);

  return (
    <div className="space-y-6">
      <ResourcesHeader
        title={t("resources.title", { defaultValue: "Resources" })}
        subtitle={t("resources.subtitle", {
          defaultValue:
            "Hand-picked links for CV, interviews, learning, and staying productive during the job search.",
        })}
        isPrivate={isPrivate}
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        suggestHref={suggestHref}
        suggestLabel={t("resources.actions.suggest.label", {
          defaultValue: "Suggest a resource",
        })}
        allLabel={t("resources.tabs.all", { defaultValue: "All" })}
        favoritesLabel={t("resources.tabs.favorites", {
          defaultValue: "Favorites",
        })}
      />

      {isPrivate && favIsError ? (
        <ResourcesFavoritesError
          message={t("resources.errors.loadFailed", {
            defaultValue:
              "Could not load favorites. Check Firestore rules/permissions.",
          })}
          onRetry={refetchFavorites}
          retryLabel={t("resources.actions.retry", { defaultValue: "Retry" })}
        />
      ) : null}

      <ResourcesFiltersCard
        resultsText={resultsText}
        isPrivate={isPrivate}
        favIsFetching={favIsFetching}
        favoritesCountText={favoritesCountText}
        query={query}
        onQueryChange={setQuery}
        onReset={onReset}
        category={category}
        onSelectCategory={setCategory}
        categoryOptions={categoryOptions}
      />

      <ResourcesList
        filtered={filtered}
        isFavorite={isFavorite}
        isPending={isPending}
        isPrivate={isPrivate}
        onToggleFavorite={onToggleFavorite}
        openLabel={t("resources.actions.open", { defaultValue: "Open" })}
        saveLabel={t("resources.actions.save", {
          defaultValue: "Save to favorites",
        })}
        uid={uid}
        unsaveLabel={t("resources.actions.unsave", {
          defaultValue: "Remove from favorites",
        })}
      />

      {filtered.length === 0 ? (
        <ResourcesEmptyState
          message={t("resources.empty", {
            defaultValue:
              "Try another keyword or switch the category filter.",
          })}
        />
      ) : null}
    </div>
  );
};

export default ResourcesPage;
