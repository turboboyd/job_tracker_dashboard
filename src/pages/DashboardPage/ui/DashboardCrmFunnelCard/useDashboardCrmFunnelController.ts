import { getDocs, limit, orderBy, query } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

import type { InteractionDoc } from "src/entities/contact";
import { createApplicationsRepo } from "src/features/applications";
import { useAuthSelectors } from "src/features/auth/model";
import { interactionsColRef } from "src/features/contacts/firestore/refs";
import { db } from "src/shared/config/firebase/firestore";

import {
  buildCrmFunnelMetricsEnriched,
  type CrmFunnelMetrics,
} from "./crmFunnel.metrics";

interface InteractionRow { id: string; data: InteractionDoc }

const repo = createApplicationsRepo(db);

async function fetchAllInteractions(
  userId: string,
): Promise<InteractionRow[]> {
  const colRef = interactionsColRef(db, userId);
  const q = query(colRef, orderBy("occurredAt", "desc"), limit(500));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    data: d.data() as InteractionDoc,
  }));
}

export function useDashboardCrmFunnelController() {
  const { userId, isAuthReady } = useAuthSelectors();

  const [metrics, setMetrics] = useState<CrmFunnelMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [appDocs, interactions] = await Promise.all([
        repo.queryAllActiveApplications(userId, 500),
        fetchAllInteractions(userId),
      ]);

      const nextMetrics = buildCrmFunnelMetricsEnriched(appDocs, interactions);
      setMetrics(nextMetrics);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load funnel data.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!isAuthReady || !userId) return;
    const id = window.setTimeout(() => { load().catch(() => undefined); }, 0);
    return () => window.clearTimeout(id);
  }, [isAuthReady, load, userId]);

  return { metrics, isLoading, error };
}
