import { ContactCard } from "src/features/contacts";
import type { ContactRow } from "src/features/contacts";

interface ContactsGridProps {
  contacts: ContactRow[];
  isLoading: boolean;
  onEdit: (contactId: string) => void;
  onArchive: (contactId: string) => void;
}

function SkeletonCard() {
  return (
    <div className="h-40 animate-pulse rounded-lg border border-border bg-muted/30" />
  );
}

export function ContactsGrid({
  contacts,
  isLoading,
  onEdit,
  onArchive,
}: ContactsGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <div className="text-4xl mb-3">👤</div>
        <p className="text-base font-semibold text-foreground">No contacts yet</p>
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">
          Add recruiters, HR managers or hiring managers you have spoken with.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {contacts.map((row) => (
        <ContactCard
          key={row.id}
          contactId={row.id}
          contact={row.data}
          onEdit={onEdit}
          onDelete={onArchive}
        />
      ))}
    </div>
  );
}
