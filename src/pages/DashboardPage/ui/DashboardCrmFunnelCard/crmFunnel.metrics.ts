import type { InteractionDoc } from "src/entities/contact";
import type { ApplicationDoc } from "src/features/applications";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FunnelStage {
  id: string;
  label: string;
  count: number;
  /** Conversion from previous stage, null for first */
  conversionRate: number | null;
  color: string;
}

export interface ChannelStat {
  type: InteractionDoc["type"];
  label: string;
  count: number;
  /** How many led to an interview (based on subsequent application status) */
  interviewCount: number;
  conversionRate: number;
}

export interface CrmFunnelMetrics {
  stages: FunnelStage[];
  channels: ChannelStat[];
  totalApplications: number;
  totalInteractions: number;
  avgInteractionsPerApp: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

function isInterviewStatus(status: string): boolean {
  return status.startsWith("INTERVIEW") || status === "OFFER";
}

function isOfferStatus(status: string): boolean {
  return status === "OFFER";
}

const TYPE_LABELS: Record<InteractionDoc["type"], string> = {
  CALL: "Phone calls",
  EMAIL: "Emails",
  MESSAGE: "Messages",
  MEETING: "Meetings",
  OTHER: "Other",
};

const TYPE_COLORS: Record<InteractionDoc["type"], string> = {
  CALL: "#3b82f6",
  EMAIL: "#8b5cf6",
  MESSAGE: "#10b981",
  MEETING: "#f59e0b",
  OTHER: "#6b7280",
};

// ─── Main builder ─────────────────────────────────────────────────────────────

export function buildCrmFunnelMetrics(
  applications: ApplicationDoc[],
  interactions: { id: string; data: InteractionDoc }[],
): CrmFunnelMetrics {
  const total = applications.length;

  // Count applications by pipeline stage
  const applied = applications.filter((a) => {
    const s = a.process?.status ?? "";
    const stage = a.process?.stage ?? "";
    return s !== "SAVED" && stage !== "ARCHIVED";
  }).length;

  const interviewed = applications.filter((a) =>
    isInterviewStatus(a.process?.status ?? ""),
  ).length;

  const offered = applications.filter((a) =>
    isOfferStatus(a.process?.status ?? ""),
  ).length;

  const hired = applications.filter(
    (a) => a.process?.stage === "HIRED",
  ).length;

  // Build funnel stages
  const stages: FunnelStage[] = [
    {
      id: "applications",
      label: "Applications",
      count: total,
      conversionRate: null,
      color: "#6366f1",
    },
    {
      id: "applied",
      label: "Sent / Active",
      count: applied,
      conversionRate: pct(applied, total),
      color: "#3b82f6",
    },
    {
      id: "interviewed",
      label: "Interviews",
      count: interviewed,
      conversionRate: pct(interviewed, applied),
      color: "#10b981",
    },
    {
      id: "offered",
      label: "Offers",
      count: offered,
      conversionRate: pct(offered, interviewed),
      color: "#f59e0b",
    },
    {
      id: "hired",
      label: "Hired",
      count: hired,
      conversionRate: pct(hired, offered),
      color: "#22c55e",
    },
  ];

  // Channel analysis — group interactions by type
  const byType = new Map<InteractionDoc["type"], { count: number; appIds: Set<string> }>();

  for (const { data } of interactions) {
    if (!data.type) continue;
    if (!byType.has(data.type)) {
      byType.set(data.type, { count: 0, appIds: new Set() });
    }
    const entry = byType.get(data.type)!;
    entry.count += 1;
    if (data.applicationId) entry.appIds.add(data.applicationId);
  }

  const channels: ChannelStat[] = Array.from(byType.entries())
    .map(([type, { count }]) => ({
      type,
      label: TYPE_LABELS[type],
      count,
      interviewCount: 0, // enriched in controller with real app data
      conversionRate: 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    stages,
    channels,
    totalApplications: total,
    totalInteractions: interactions.length,
    avgInteractionsPerApp:
      total > 0 ? Math.round((interactions.length / total) * 10) / 10 : 0,
  };
}

/**
 * Enriched builder that receives interaction rows WITH app ids,
 * enabling per-channel interview conversion.
 */
export function buildCrmFunnelMetricsEnriched(
  appRows: { id: string; data: ApplicationDoc }[],
  interactions: { id: string; data: InteractionDoc }[],
): CrmFunnelMetrics {
  const total = appRows.length;

  const appStatusById = new Map<string, string>(
    appRows.map(({ id, data }) => [id, data.process?.status ?? ""]),
  );

  const applied = appRows.filter(({ data }) => {
    const s = data.process?.status ?? "";
    const stage = data.process?.stage ?? "";
    return s !== "SAVED" && stage !== "ARCHIVED";
  }).length;

  const interviewed = appRows.filter(({ data }) =>
    isInterviewStatus(data.process?.status ?? ""),
  ).length;

  const offered = appRows.filter(({ data }) =>
    isOfferStatus(data.process?.status ?? ""),
  ).length;

  const hired = appRows.filter(
    ({ data }) => data.process?.stage === "HIRED",
  ).length;

  const stages: FunnelStage[] = [
    {
      id: "applications",
      label: "Applications",
      count: total,
      conversionRate: null,
      color: "#6366f1",
    },
    {
      id: "applied",
      label: "Sent / Active",
      count: applied,
      conversionRate: pct(applied, total),
      color: "#3b82f6",
    },
    {
      id: "interviewed",
      label: "Interviews",
      count: interviewed,
      conversionRate: pct(interviewed, applied),
      color: "#10b981",
    },
    {
      id: "offered",
      label: "Offers",
      count: offered,
      conversionRate: pct(offered, interviewed),
      color: "#f59e0b",
    },
    {
      id: "hired",
      label: "Hired",
      count: hired,
      conversionRate: pct(hired, offered),
      color: "#22c55e",
    },
  ];

  // Channel stats — group by interaction type, check app interview status
  const byType = new Map<
    InteractionDoc["type"],
    { count: number; interviewCount: number; seen: Set<string> }
  >();

  for (const { data } of interactions) {
    if (!data.type) continue;
    if (!byType.has(data.type)) {
      byType.set(data.type, { count: 0, interviewCount: 0, seen: new Set() });
    }
    const entry = byType.get(data.type)!;
    entry.count += 1;

    if (data.applicationId && !entry.seen.has(data.applicationId)) {
      const status = appStatusById.get(data.applicationId) ?? "";
      if (isInterviewStatus(status)) {
        entry.interviewCount += 1;
      }
      entry.seen.add(data.applicationId);
    }
  }

  const channels: ChannelStat[] = Array.from(byType.entries())
    .map(([type, { count, interviewCount }]) => ({
      type,
      label: TYPE_LABELS[type],
      count,
      interviewCount,
      conversionRate: pct(interviewCount, count),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    stages,
    channels,
    totalApplications: total,
    totalInteractions: interactions.length,
    avgInteractionsPerApp:
      total > 0 ? Math.round((interactions.length / total) * 10) / 10 : 0,
  };
}

export { TYPE_COLORS, TYPE_LABELS };
