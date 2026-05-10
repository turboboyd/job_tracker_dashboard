import { MessageSquarePlus, Plus, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import { useAuthSelectors } from "src/features/auth/model";
import {
  clearInteractionNextStep,
  createContact,
  createInteraction,
  deleteInteraction,
  getContactsByApplication,
  getInteractionsByApplication,
  linkContactToApplication,
  updateContact,
  type ContactRow,
  type CreateContactInput,
  type CreateInteractionInput,
  type InteractionRow,
  type UpdateContactInput,
} from "src/features/contacts";
import { db } from "src/shared/config/firebase/firestore";
import { Button } from "src/shared/ui/Button";
import { Card } from "src/shared/ui/Card";

import { ContactCard } from "../ContactCard/ContactCard";
import { ContactFormModal } from "../ContactFormModal/ContactFormModal";
import { InteractionTimeline } from "../InteractionTimeline/InteractionTimeline";
import { QuickLogModal } from "../QuickLogModal/QuickLogModal";

interface ApplicationContactsCardProps {
  appId: string;
  /** Denormalised title for quick log context */
  appDisplayTitle?: string | undefined;
  /** Company name from the parent application — used to auto-fill new contacts */
  appCompanyName?: string | undefined;
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {action}
    </div>
  );
}

export function ApplicationContactsCard({
  appId,
  appDisplayTitle,
  appCompanyName,
}: ApplicationContactsCardProps) {
  const { userId } = useAuthSelectors();

  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [interactions, setInteractions] = useState<InteractionRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInteractionsLoading, setIsInteractionsLoading] = useState(false);

  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactRow | null>(null);
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [quickLogContact, setQuickLogContact] = useState<ContactRow | null>(null);

  // ─── Data loading ──────────────────────────────────────────────────────────

  const loadContacts = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const rows = await getContactsByApplication(db, userId, appId);
      setContacts(rows);
    } finally {
      setIsLoading(false);
    }
  }, [appId, userId]);

  const loadInteractions = useCallback(async () => {
    if (!userId) return;
    setIsInteractionsLoading(true);
    try {
      const rows = await getInteractionsByApplication(db, userId, appId);
      setInteractions(rows);
    } finally {
      setIsInteractionsLoading(false);
    }
  }, [appId, userId]);

  useEffect(() => {
    loadContacts().catch(() => undefined);
    loadInteractions().catch(() => undefined);
  }, [loadContacts, loadInteractions]);

  // ─── Contact mutations ─────────────────────────────────────────────────────

  const handleCreateContact = useCallback(
    async (input: CreateContactInput) => {
      if (!userId) return;
      const id = await createContact(db, userId, input);
      // Link to this application if not already in input
      if (!input.applicationIds?.includes(appId)) {
        await linkContactToApplication(db, userId, id, appId);
      }
      await loadContacts();
    },
    [appId, loadContacts, userId],
  );

  const handleUpdateContact = useCallback(
    async (contactId: string, input: UpdateContactInput) => {
      if (!userId) return;
      await updateContact(db, userId, contactId, input);
      setEditingContact(null);
      await loadContacts();
    },
    [loadContacts, userId],
  );

  const handleUnlinkContact = useCallback(
    async (contactId: string) => {
      if (!userId) return;
      // We archive the linkage, not the contact itself
      await updateContact(db, userId, contactId, {
        applicationIds: contacts
          .find((c) => c.id === contactId)
          ?.data.applicationIds?.filter((id) => id !== appId) ?? [],
      });
      await loadContacts();
    },
    [appId, contacts, loadContacts, userId],
  );

  const handleEditContact = useCallback((contactId: string) => {
    const row = contacts.find((c) => c.id === contactId);
    if (row) setEditingContact(row);
    setContactFormOpen(true);
  }, [contacts]);

  // ─── Interaction mutations ─────────────────────────────────────────────────

  const handleSaveInteraction = useCallback(
    async (input: CreateInteractionInput) => {
      if (!userId) return;
      await createInteraction(db, userId, input);
      await loadInteractions();
    },
    [loadInteractions, userId],
  );

  const handleDeleteInteraction = useCallback(
    async (interactionId: string) => {
      if (!userId) return;
      await deleteInteraction(db, userId, interactionId);
      setInteractions((prev) => prev.filter((r) => r.id !== interactionId));
    },
    [userId],
  );

  const handleClearNextStep = useCallback(
    async (interactionId: string) => {
      if (!userId) return;
      await clearInteractionNextStep(db, userId, interactionId);
      await loadInteractions();
    },
    [loadInteractions, userId],
  );

  const openQuickLogForContact = useCallback((contactId: string) => {
    const row = contacts.find((c) => c.id === contactId);
    setQuickLogContact(row ?? null);
    setQuickLogOpen(true);
  }, [contacts]);

  let contactsContent: ReactNode;

  if (isLoading) {
    contactsContent = (
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-muted/50" />
        ))}
      </div>
    );
  } else if (contacts.length === 0) {
    contactsContent = (
      <p className="py-2 text-sm text-muted-foreground">
        No contacts linked. Add a recruiter or hiring manager.
      </p>
    );
  } else {
    contactsContent = (
      <div className="grid gap-3 sm:grid-cols-2">
        {contacts.map((row) => (
          <div key={row.id} className="space-y-1">
            <ContactCard
              contactId={row.id}
              contact={row.data}
              onEdit={handleEditContact}
              onUnlink={handleUnlinkContact}
            />
            <Button
              size="sm"
              variant="ghost"
              className="w-full gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => openQuickLogForContact(row.id)}
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              Log interaction with {row.data.firstName}
            </Button>
          </div>
        ))}
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Card padding="md" shadow="sm" className="space-y-5">
        {/* Contacts section */}
        <div className="space-y-3">
          <SectionHeader
            title="Contacts"
            action={
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  shape="pill"
                  className="gap-1.5"
                  onClick={() => {
                    setEditingContact(null);
                    setContactFormOpen(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add contact
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  shape="pill"
                  className="gap-1.5 text-muted-foreground"
                  onClick={() => loadContacts()}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            }
          />

          {contactsContent}
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Interactions timeline */}
        <div className="space-y-3">
          <SectionHeader
            title="Interaction history"
            action={
              <Button
                size="sm"
                variant="outline"
                shape="pill"
                className="gap-1.5"
                onClick={() => {
                  setQuickLogContact(null);
                  setQuickLogOpen(true);
                }}
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                Log interaction
              </Button>
            }
          />

          <InteractionTimeline
            interactions={interactions}
            isLoading={isInteractionsLoading}
            onDelete={handleDeleteInteraction}
            onClearNextStep={handleClearNextStep}
          />
        </div>
      </Card>

      {/* Contact form modal */}
      <ContactFormModal
        open={contactFormOpen}
        onOpenChange={(open) => {
          setContactFormOpen(open);
          if (!open) setEditingContact(null);
        }}
        contact={editingContact?.data ?? null}
        contactId={editingContact?.id}
        applicationId={appId}
        defaultCompanyName={appCompanyName}
        hideCompanyField={Boolean(appCompanyName)}
        onSaveCreate={handleCreateContact}
        onSaveUpdate={handleUpdateContact}
      />

      {/* Quick log modal */}
      <QuickLogModal
        open={quickLogOpen}
        onOpenChange={(open) => {
          setQuickLogOpen(open);
          if (!open) setQuickLogContact(null);
        }}
        preselectedContact={quickLogContact ?? undefined}
        applicationId={appId}
        applicationDisplayTitle={appDisplayTitle}
        contacts={contacts}
        onSave={handleSaveInteraction}
      />
    </>
  );
}
