import {
  LoopSearchAddMatchSection,
  LoopSearchHeader,
  LoopSearchResultsSection,
  LoopSearchSettingsSection,
  LoopSearchSourcesSection,
} from "./loopSearchLinks.sections";
import type { LoopSearchLinksProps } from "./loopSearchLinks.types";
import { useLoopSearchLinksController } from "./useLoopSearchLinksController";

export function LoopSearchLinks(props: LoopSearchLinksProps) {
  const {
    activeLink,
    appliedBadges,
    canEditSources,
    defaultPlatform,
    draftFilters,
    handleApply,
    handleOpenLink,
    handleReset,
    handleSaveSources,
    info,
    isAddMatchModalOpen,
    isSaving,
    isSettingsOpen,
    isSourcesModalOpen,
    links,
    loop,
    onAddLink,
    onOpenAdd,
    onPageChange,
    pagedLinks,
    safePage,
    setDraftFilters,
    setIsAddMatchModalOpen,
    setIsSettingsOpen,
    setIsSourcesModalOpen,
    t,
    totalPages,
    userId,
  } = useLoopSearchLinksController(props);

  return (
    <div className="space-y-4">
      <LoopSearchSettingsSection
        draftFilters={draftFilters}
        setDraftFilters={setDraftFilters}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        isSaving={isSaving}
        onApply={handleApply}
        onReset={handleReset}
      />

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 space-y-4">
        <LoopSearchHeader
          t={t}
          info={info}
          total={links.length}
          appliedBadges={appliedBadges}
          canEditSources={canEditSources}
          isSaving={isSaving}
          userId={userId}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenSources={() => setIsSourcesModalOpen(true)}
          onOpenAdd={onOpenAdd}
        />

        <LoopSearchSourcesSection
          loopPlatforms={loop.platforms}
          open={isSourcesModalOpen}
          onOpenChange={setIsSourcesModalOpen}
          disabled={!canEditSources}
          onSave={handleSaveSources}
        />

        <LoopSearchResultsSection
          links={pagedLinks}
          activeLink={activeLink}
          onOpenLink={handleOpenLink}
          onAddLink={onAddLink}
          addDisabled={!userId}
          page={safePage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          disabled={isSaving}
        />

        <LoopSearchAddMatchSection
          open={isAddMatchModalOpen}
          onOpenChange={setIsAddMatchModalOpen}
          loopId={loop.id}
          {...(defaultPlatform !== undefined ? { defaultPlatform } : {})}
        />
      </div>
    </div>
  );
}
