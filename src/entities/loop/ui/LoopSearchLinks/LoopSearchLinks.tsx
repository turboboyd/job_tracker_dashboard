import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { clampPage } from "src/shared/lib";
import { getErrorMessage } from "src/shared/lib/errors";
import { Button, Pagination } from "src/shared/ui";

import { useUpdateLoopMutation } from "../../api/loopApi";
import { mapWorkModeToRemoteMode, openUrl } from "../../lib";
import { normalizeRoleToTitles, type CanonicalFilters, type Loop, type LoopPlatform } from "../../model";
import { AddMatchModal } from "../AddMatchModal/AddMatchModal";
import { EditSourcesModal } from "../EditSourcesModal/EditSourcesModal";
import { LoopSettingsModal } from "../LoopSettingsModal/LoopSettingsModal";

import { PlatformLinkCard } from "./components/PlatformLinkCard";
import type { LoopForLinks } from "./types";
import { useLoopSearchLinksState } from "./useLoopSearchLinksState";

type Props = {
  loop: Pick<
    Loop,
    | "id"
    | "name"
    | "titles"
    | "location"
    | "radiusKm"
    | "platforms"
    | "remoteMode"
    | "filters"
  >;
  userId: string | null;
  page: number;
  onPageChange: (page: number) => void;
};



function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

function getSafeFilterString(
  f: CanonicalFilters,
  key: "role" | "location"
): string {
  const v = (f as unknown as Record<string, unknown>)[key];
  return typeof v === "string" ? v : "";
}

function getSafeFilterNumber(f: CanonicalFilters, key: "radiusKm" | "postedWithin"): number {
  const v = (f as unknown as Record<string, unknown>)[key];
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function getSafeFilterWorkMode(f: CanonicalFilters): string {
  const v = (f as unknown as Record<string, unknown>)["workMode"];
  return typeof v === "string" ? v : "any";
}

export function LoopSearchLinks({ loop, userId, page, onPageChange }: Props) {
  const { t } = useTranslation();
  const [updateLoop, updateState] = useUpdateLoopMutation();

  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddMatchModalOpen, setIsAddMatchModalOpen] = useState(false);
  const [defaultPlatform, setDefaultPlatform] = useState<LoopPlatform | undefined>(
    undefined
  );


  const loopForState: LoopForLinks = {
    id: loop.id,
    titles: loop.titles,
    location: loop.location ?? null,
    radiusKm: loop.radiusKm ?? null,
    platforms: loop.platforms,
    remoteMode: loop.remoteMode,
    filters: loop.filters, 
  };

  const {
    draftFilters,
    setDraftFilters,
    applyDraftFilters,
    resetFilters,
    appliedFilters,
    activeLink,
    setActive,
    links,
  } = useLoopSearchLinksState(loopForState);

  const isSaving = updateState.isLoading;
  const canEditSources = Boolean(userId) && !isSaving;

  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(links.length / pageSize));
  const safePage = Math.max(1, Math.min(totalPages, clampPage(page)));
  const offset = (safePage - 1) * pageSize;

  const info = useMemo(() => {
    if (links.length === 0) return { from: 0, to: 0 };
    const from = offset + 1;
    const to = Math.min(links.length, offset + pageSize);
    return { from, to };
  }, [links.length, offset, pageSize]);

  const pagedLinks = useMemo(() => {
    return links.slice(offset, offset + pageSize);
  }, [links, offset, pageSize]);

  const handleApply = async () => {
    applyDraftFilters();
    onPageChange(1);

    if (!userId) return;

    try {
      await updateLoop({
        loopId: loop.id,
        name: loop.name,
        titles: normalizeRoleToTitles(draftFilters.role),
        location: draftFilters.location,
        radiusKm: draftFilters.radiusKm,
        remoteMode: mapWorkModeToRemoteMode(draftFilters.workMode),
        filters: draftFilters,
      }).unwrap();

      setIsSettingsOpen(false);
    } catch (err) {
      console.error("Failed to save filters:", getErrorMessage(err));
    }
  };

  const appliedBadges = useMemo(() => {
    const out: string[] = [];

    const role = getSafeFilterString(appliedFilters, "role").trim();
    const location = getSafeFilterString(appliedFilters, "location").trim();
    const radiusKm = getSafeFilterNumber(appliedFilters, "radiusKm");
    const workMode = getSafeFilterWorkMode(appliedFilters);
    const postedWithin = getSafeFilterNumber(appliedFilters, "postedWithin");

    if (isNonEmptyString(role)) out.push(t("loops.badgeRole", "Role: {{value}}", { value: role }));
    if (isNonEmptyString(location))
      out.push(t("loops.badgeLoc", "Loc: {{value}}", { value: location }));

    out.push(
      t("loops.badgeRadius", "Radius: {{value}}km", {
        value: radiusKm,
      })
    );

    if (workMode !== "any")
      out.push(
        t("loops.badgeMode", "Mode: {{value}}", {
          value: workMode,
        })
      );

    out.push(
      t("loops.badgePosted", "Posted: {{value}}d", {
        value: postedWithin,
      })
    );

    return out;
  }, [appliedFilters, t]);

  const openAddModal = (platform?: LoopPlatform) => {
    setDefaultPlatform(platform);
    setIsAddMatchModalOpen(true);
  };

  const handleOpenLink = (platform: LoopPlatform, url: string) => {
    setActive(platform, url);
    openUrl(url);
  };

  return (
    <div className="space-y-4">
      <LoopSettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        value={draftFilters}
        onChange={setDraftFilters}
        disabled={isSaving}
        onApply={handleApply}
        onReset={() => {
          resetFilters();
          onPageChange(1);
        }}
      />

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">
                {t("loops.searchLinksTitle", "Search links")}
              </h3>

              <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {t("loops.showing", "Showing {{from}}–{{to}} of {{total}}", {
                  from: info.from,
                  to: info.to,
                  total: links.length,
                })}
              </span>
            </div>

            <p className="text-sm text-muted-foreground">
              {t(
                "loops.searchLinksSubtitle",
                "Apply filters → open platform → pick a job → paste URL → save match."
              )}
            </p>

            {appliedBadges.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {appliedBadges.map((b) => (
                  <span
                    key={b}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground"
                  >
                    {b}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              shape="lg"
              onClick={() => setIsSettingsOpen(true)}
              disabled={isSaving}
            >
              {t("loops.myLoopSettings", "My Loop settings")}
            </Button>

            <Button
              variant="outline"
              shape="lg"
              onClick={() => setIsSourcesModalOpen(true)}
              disabled={!canEditSources}
            >
              {t("loops.editSources", "Edit sources")}
            </Button>

            <Button
              variant="default"
              shape="lg"
              shadow="sm"
              onClick={() => openAddModal(undefined)}
              disabled={!userId}
            >
              {t("loops.addMatch", "Add match")}
            </Button>
          </div>

          <EditSourcesModal
            open={isSourcesModalOpen}
            onOpenChange={setIsSourcesModalOpen}
            value={loop.platforms}
            disabled={!canEditSources}
            onSave={async (nextPlatforms) => {
              if (!userId) return;
              try {
                await updateLoop({
                  loopId: loop.id,
                  platforms: nextPlatforms,
                }).unwrap();
              } catch (err) {
                console.error("Failed to update sources:", getErrorMessage(err));
              }
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {pagedLinks.map((link) => {
            const isActive =
              activeLink?.platform === link.platform && activeLink?.url === link.url;

            return (
              <PlatformLinkCard
                key={`${link.platform}:${link.url}`}
                platform={link.platform}
                url={link.url}
                isActive={isActive}
                onOpen={() => handleOpenLink(link.platform, link.url)}
                onAdd={() => openAddModal(link.platform)}
                addDisabled={!userId}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-center">
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            disabled={isSaving}
          />
        </div>

        <AddMatchModal
          open={isAddMatchModalOpen}
          onOpenChange={setIsAddMatchModalOpen}
          loopId={loop.id}
          defaultPlatform={defaultPlatform}
        />
      </div>
    </div>
  );
}
