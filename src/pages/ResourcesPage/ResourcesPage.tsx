import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { loadTranslations } from "src/shared/config/i18n/loadTranslations";
import { Button, Card } from "src/shared/ui";

import { useResourcesPage } from "./model/useResourcesPage";
import { ResourceCard } from "./ui/ResourceCard";
import { ResourcesFiltersCard } from "./ui/ResourcesFiltersCard";

let resourcesLocalesLoaded = false;

async function ensureResourcesLocalesLoaded() {
  if (resourcesLocalesLoaded) return;

  const [en, ru, de] = await Promise.all([
    import("./locales/en.json"),
    import("./locales/ru.json"),
    import("./locales/de.json"),
  ]);

  loadTranslations("resources", {
    en: en.default,
    ru: ru.default,
    de: de.default,
    uk: {},
  });

  resourcesLocalesLoaded = true;
}

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
    <div className="flex h-full flex-col overflow-hidden">
      {/* Page header */}
      <div className="shrink-0 border-b border-border bg-background px-7 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11.5px] text-subtle-foreground mb-1">
              <span>Loopboard</span>
              <span>/</span>
              <span className="text-muted-foreground">
                {t("resources.title", { defaultValue: "Resources" })}
              </span>
            </div>
            <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
              {t("resources.title", { defaultValue: "Resources" })}
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {t("resources.subtitle", {
                defaultValue:
                  "Hand-picked links for CV, interviews, learning, and staying productive during the job search.",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isPrivate ? (
              <>
                <button
                  type="button"
                  className={[
                    "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                    viewMode === "all"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-muted",
                  ].join(" ")}
                  onClick={() => setViewMode("all")}
                >
                  {t("resources.tabs.all", { defaultValue: "All" })}
                </button>
                <button
                  type="button"
                  className={[
                    "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                    viewMode === "favorites"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:bg-muted",
                  ].join(" ")}
                  onClick={() => setViewMode("favorites")}
                >
                  {t("resources.tabs.favorites", { defaultValue: "Favorites" })}
                </button>
              </>
            ) : null}
            <a
              href={suggestHref}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
            >
              {t("resources.actions.suggest.label", { defaultValue: "Suggest a resource" })}
            </a>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-background">
        <div className="p-7 space-y-6">
          {isPrivate && favIsError ? (
            <Card padding="md" shadow="sm">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-destructive">
                  {t("resources.errors.loadFailed", {
                    defaultValue:
                      "Could not load favorites. Check Firestore rules/permissions.",
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  shadow="none"
                  onClick={() => refetchFavorites()}
                >
                  {t("resources.actions.retry", { defaultValue: "Retry" })}
                </Button>
              </div>
            </Card>
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

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => {
              const isFav = isFavorite(r.id);
              const pending = isPending(r.id);

              return (
                <ResourceCard
                  key={r.id}
                  title={r.title}
                  description={r.description}
                  href={r.href}
                  tags={r.tags}
                  showFavorite={isPrivate}
                  isFav={isFav}
                  isPending={!uid || pending}
                  ariaLabel={
                    isFav
                      ? t("resources.actions.unsave", {
                          defaultValue: "Remove from favorites",
                        })
                      : t("resources.actions.save", {
                          defaultValue: "Save to favorites",
                        })
                  }
                  onToggleFavorite={() => onToggleFavorite(r.id)}
                  openLabel={t("resources.actions.open", { defaultValue: "Open" })}
                />
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <Card padding="md" shadow="sm">
              <div className="text-sm text-muted-foreground">
                {t("resources.empty", {
                  defaultValue:
                    "Try another keyword or switch the category filter.",
                })}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;
