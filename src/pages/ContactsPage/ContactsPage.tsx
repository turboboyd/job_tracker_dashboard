import { ContactFormModal } from "src/features/contacts";
import { InlineError } from "src/shared/ui/InlineError";
import { PageHeader } from "src/shared/ui/PageHeaders";
import { PageShell } from "src/shared/ui/PageShell";

import { useContactsPageController } from "./model/useContactsPageController";
import { ContactsGrid } from "./ui/ContactsGrid";
import { ContactsStatsBar } from "./ui/ContactsStatsBar";
import { ContactsToolbar } from "./ui/ContactsToolbar";

export default function ContactsPage() {
  const {
    contacts,
    totalCount,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    activeTag,
    setActiveTag,
    allTags,
    createModalOpen,
    setCreateModalOpen,
    editModalOpen,
    setEditModalOpen,
    editingContact,
    setEditingContact,
    handleCreate,
    handleUpdate,
    handleArchive,
    openEdit,
  } = useContactsPageController();

  return (
    <PageShell paddingX="md" paddingY="sm">
      <div className="space-y-5">
        <PageHeader
          title="Contacts"
          subtitle="Recruiters, HR managers and hiring managers you've connected with."
        />

        {error ? <InlineError message={error} /> : null}

        <ContactsStatsBar contacts={contacts} />

        <ContactsToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddContact={() => setCreateModalOpen(true)}
          totalCount={totalCount}
          filteredCount={contacts.length}
          allTags={allTags}
          activeTag={activeTag}
          onTagChange={setActiveTag}
        />

        <ContactsGrid
          contacts={contacts}
          isLoading={isLoading}
          onEdit={openEdit}
          onArchive={handleArchive}
        />
      </div>

      {/* Create modal */}
      <ContactFormModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        contact={null}
        onSaveCreate={handleCreate}
        onSaveUpdate={async () => undefined}
      />

      {/* Edit modal */}
      <ContactFormModal
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) setEditingContact(null);
        }}
        contact={editingContact?.data ?? null}
        contactId={editingContact?.id}
        onSaveCreate={handleCreate}
        onSaveUpdate={handleUpdate}
      />
    </PageShell>
  );
}
