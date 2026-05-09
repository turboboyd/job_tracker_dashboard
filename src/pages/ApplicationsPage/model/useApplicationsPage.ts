import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import type { ApplicationsRepo } from "src/features/applications";
import type { ContactRole } from "src/entities/contact";
import { createContact } from "src/features/contacts";
import { db } from "src/shared/config/firebase/firestore";

import {
  buildCreateApplicationPayload,
  canSubmitApplicationForm,
  getApplicationsPageErrorMessage,
  loadApplicationsList,
  subscribeApplicationsList,
} from "./applicationsPage.helpers";
import { EMPTY_CREATE_FORM } from "./types";
import type { AppRow, CreateFormState, PipelineFilterStatus, ViewMode } from "./types";

export type { AppRow } from "./types";

/**
 * Optional contact attached when creating an application.
 * If `firstName` is empty, the contact is silently skipped.
 */
export interface NewApplicationContactInput {
  firstName: string;
  lastName: string;
  role: ContactRole;
  phone: string;
  email: string;
}

export function useApplicationsPage(params: {
  userId: string | null;
  isAuthReady: boolean;
  repo: ApplicationsRepo;
}) {
  const { userId, isAuthReady, repo } = params;

  const [view, setView] = useState<ViewMode>("pipeline");
  const [activeStatus, setActiveStatus] = useState<PipelineFilterStatus>("ALL");
  const [form, setForm] = useState<CreateFormState>(EMPTY_CREATE_FORM);

  const [isEnsuringUser, setIsEnsuringUser] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const [list, setList] = useState<AppRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => canSubmitApplicationForm(form), [form]);

  useEffect(() => {
    const currentUserId = userId;
    if (!isAuthReady || !currentUserId) return;
    const userIdForRequest: string = currentUserId;

    let cancelled = false;

    async function ensureUserDocument() {
      try {
        setIsEnsuringUser(true);
        await repo.ensureUserDoc(userIdForRequest);
      } catch (error_: unknown) {
        if (!cancelled) setError(getApplicationsPageErrorMessage(error_));
      } finally {
        if (!cancelled) setIsEnsuringUser(false);
      }
    }

    void ensureUserDocument();

    return () => {
      cancelled = true;
    };
  }, [isAuthReady, repo, userId]);

  /**
   * One-shot loader. Kept as the manual fallback used by `onCreate` and as a
   * recovery path when subscription has a transient error.
   */
  const load = useCallback(async () => {
    const currentUserId = userId;
    if (!currentUserId) return;
    const userIdForRequest: string = currentUserId;

    setIsLoadingList(true);
    setError(null);

    try {
      const rows = await loadApplicationsList({
        activeStatus,
        repo,
        userId: userIdForRequest,
        view,
      });
      setList(rows);
    } catch (error_: unknown) {
      setError(getApplicationsPageErrorMessage(error_));
    } finally {
      setIsLoadingList(false);
    }
  }, [activeStatus, repo, userId, view]);

  const location = useLocation();

  /**
   * Real-time list subscription via Firestore onSnapshot.
   *
   * This is the primary data source — any mutation in any other tab/page
   * (e.g. status change on details page) propagates here automatically.
   *
   * Auto-ghosting (a one-shot client-side maintenance write) runs once per
   * (userId, view, activeStatus) so it doesn't fire on every snapshot tick.
   */
  useEffect(() => {
    const currentUserId = userId;
    if (!isAuthReady || !currentUserId) return undefined;

    setIsLoadingList(true);
    let cancelled = false;
    let didAutoGhost = false;

    const unsubscribe = subscribeApplicationsList({
      activeStatus,
      repo,
      userId: currentUserId,
      view,
      onUpdate: (rows) => {
        if (cancelled) return;
        setList(rows);
        setIsLoadingList(false);

        // Run ghosting check once after first snapshot. The subscription will
        // pick up any writes the check makes.
        if (!didAutoGhost) {
          didAutoGhost = true;
          repo.autoMarkGhosting(currentUserId, rows).catch(() => undefined);
        }
      },
      onError: (e) => {
        if (cancelled) return;
        setError(getApplicationsPageErrorMessage(e));
        setIsLoadingList(false);
      },
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [activeStatus, isAuthReady, repo, userId, view]);

  /**
   * Belt-and-suspenders: if for any reason the listener is paused (offline,
   * network blip), trigger a one-shot refetch when:
   *   - the user navigates back to this route,
   *   - the tab regains focus or becomes visible.
   * No-op when the listener is healthy.
   */
  useEffect(() => {
    if (!isAuthReady || !userId) return;
    void load();
  }, [isAuthReady, load, userId, location.key]);

  useEffect(() => {
    if (!isAuthReady || !userId) return undefined;

    const refetch = () => {
      if (document.visibilityState === "visible") {
        void load();
      }
    };

    document.addEventListener("visibilitychange", refetch);
    window.addEventListener("focus", refetch);
    return () => {
      document.removeEventListener("visibilitychange", refetch);
      window.removeEventListener("focus", refetch);
    };
  }, [isAuthReady, load, userId]);

  const updateForm = useCallback(
    <K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) => {
      setForm((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    setForm(EMPTY_CREATE_FORM);
  }, []);

  /**
   * Create a new application and optionally attach a primary contact.
   *
   * Returns `true` on success so callers (e.g. the modal) can close.
   * The contact is created in a separate write — failure to create the
   * contact does NOT roll back the application; we surface the error so
   * the user can retry the contact step from the application page.
   */
  const onCreate = useCallback(
    async (contactInput?: NewApplicationContactInput): Promise<boolean> => {
      const currentUserId = userId;
      if (!currentUserId || !canSubmit) return false;
      const userIdForRequest: string = currentUserId;

      setIsCreating(true);
      setError(null);

      try {
        const newAppId = await repo.createApplication(
          userIdForRequest,
          buildCreateApplicationPayload(form),
        );

        // Optional contact attachment — only when a name was filled.
        if (contactInput && contactInput.firstName.trim().length > 0) {
          const companyName = form.companyName.trim();
          const phone = contactInput.phone.trim();
          const email = contactInput.email.trim();
          await createContact(db, userIdForRequest, {
            firstName: contactInput.firstName.trim(),
            lastName: contactInput.lastName.trim(),
            role: contactInput.role,
            applicationIds: [newAppId],
            ...(companyName ? { companyName } : {}),
            ...(phone ? { phones: [{ number: phone, label: "mobile" as const }] } : {}),
            ...(email ? { emails: [{ address: email, label: "work" as const }] } : {}),
          });
        }

        resetForm();
        setView("pipeline");
        setActiveStatus("ALL");

        await load();
        return true;
      } catch (error_: unknown) {
        setError(getApplicationsPageErrorMessage(error_));
        return false;
      } finally {
        setIsCreating(false);
      }
    },
    [canSubmit, form, load, repo, resetForm, userId],
  );

  return {
    activeStatus,
    canSubmit,
    error,
    form,
    isCreating,
    isEnsuringUser,
    isLoadingList,
    list,
    load,
    onCreate,
    resetForm,
    setActiveStatus,
    setError,
    setView,
    updateForm,
    view,
  };
}
