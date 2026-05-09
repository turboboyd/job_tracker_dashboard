import { useCallback, useEffect, useMemo, useState } from "react";

import { getContactFullName } from "src/entities/contact";
import { useAuthSelectors } from "src/features/auth/model";
import {
  archiveContact,
  createContact,
  getContacts,
  updateContact,
  type ContactRow,
  type CreateContactInput,
  type UpdateContactInput,
} from "src/features/contacts";
import { db } from "src/shared/config/firebase/firestore";

export function useContactsPageController() {
  const { userId, isAuthReady } = useAuthSelectors();

  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactRow | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // ─── Load ──────────────────────────────────────────────────────────────────

  const loadContacts = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const rows = await getContacts(db, userId);
      setContacts(rows);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load contacts.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!isAuthReady || !userId) return;
    const id = window.setTimeout(() => {
      loadContacts().catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(id);
  }, [isAuthReady, loadContacts, userId]);

  // ─── Derived: all unique tags across contacts ──────────────────────────────

  const allTags = useMemo<string[]>(() => {
    const set = new Set<string>();
    for (const { data } of contacts) {
      for (const tag of data.tags ?? []) {
        if (tag.trim()) set.add(tag.trim());
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [contacts]);

  // ─── Filter — search + tag ─────────────────────────────────────────────────

  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return contacts.filter((row) => {
      // Tag filter
      if (activeTag) {
        const tags = row.data.tags ?? [];
        if (!tags.includes(activeTag)) return false;
      }

      // Text search
      if (q) {
        const name = getContactFullName(row.data).toLowerCase();
        const company = (row.data.companyName ?? "").toLowerCase();
        const email = (row.data.emails[0]?.address ?? "").toLowerCase();
        const tags = (row.data.tags ?? []).join(" ").toLowerCase();
        if (
          !name.includes(q) &&
          !company.includes(q) &&
          !email.includes(q) &&
          !tags.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [contacts, searchQuery, activeTag]);

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const handleCreate = useCallback(
    async (input: CreateContactInput) => {
      if (!userId) return;
      await createContact(db, userId, input);
      setCreateModalOpen(false);
      await loadContacts();
    },
    [loadContacts, userId],
  );

  const handleUpdate = useCallback(
    async (contactId: string, input: UpdateContactInput) => {
      if (!userId) return;
      await updateContact(db, userId, contactId, input);
      setEditingContact(null);
      setEditModalOpen(false);
      await loadContacts();
    },
    [loadContacts, userId],
  );

  const handleArchive = useCallback(
    async (contactId: string) => {
      if (!userId) return;
      await archiveContact(db, userId, contactId);
      setContacts((prev) => prev.filter((r) => r.id !== contactId));
    },
    [userId],
  );

  const openEdit = useCallback(
    (contactId: string) => {
      const row = contacts.find((c) => c.id === contactId);
      if (!row) return;
      setEditingContact(row);
      setEditModalOpen(true);
    },
    [contacts],
  );

  // Clear active tag if it disappears from data
  useEffect(() => {
    if (activeTag && !allTags.includes(activeTag)) {
      setActiveTag(null);
    }
  }, [activeTag, allTags]);

  return {
    contacts: filteredContacts,
    totalCount: contacts.length,
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
    reload: loadContacts,
  };
}
