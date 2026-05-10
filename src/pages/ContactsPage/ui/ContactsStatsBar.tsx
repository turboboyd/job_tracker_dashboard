import type { ContactDoc } from "src/entities/contact";
import { CONTACT_ROLE_LABELS } from "src/entities/contact";
import type { ContactRow } from "src/features/contacts";

interface ContactsStatsBarProps {
  contacts: ContactRow[];
}

interface KpiItem {
  label: string;
  value: string | number;
  sub?: string;
}

function KpiCell({ label, value, sub }: KpiItem) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-foreground tabular-nums">
        {value}
      </p>
      {sub ? (
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      ) : null}
    </div>
  );
}

function topRole(contacts: ContactRow[]): string {
  const counts: Partial<Record<ContactDoc["role"], number>> = {};
  for (const { data } of contacts) {
    counts[data.role] = (counts[data.role] ?? 0) + 1;
  }
  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
  if (!sorted[0]) return "—";
  const [role] = sorted[0];
  return CONTACT_ROLE_LABELS[role as ContactDoc["role"]] ?? role;
}

function recentlyContacted(contacts: ContactRow[], days = 7): number {
  const cutoff = Date.now() - days * 86_400_000;
  return contacts.filter((c) => {
    const ts = c.data.lastContactedAt as
      | { toMillis?: () => number; seconds?: number }
      | null
      | undefined;
    if (!ts) return false;
    let ms = 0;
    if (typeof ts.toMillis === "function") {
      ms = ts.toMillis();
    } else if (ts.seconds) {
      ms = ts.seconds * 1000;
    }
    return ms > cutoff;
  }).length;
}

export function ContactsStatsBar({ contacts }: ContactsStatsBarProps) {
  if (contacts.length === 0) return null;

  const withPhone = contacts.filter((c) => c.data.phones.length > 0).length;
  const withEmail = contacts.filter((c) => c.data.emails.length > 0).length;
  const active7d = recentlyContacted(contacts, 7);
  const top = topRole(contacts);

  const kpis: KpiItem[] = [
    {
      label: "Total contacts",
      value: contacts.length,
      sub: `Top role: ${top}`,
    },
    {
      label: "Active (7 days)",
      value: active7d,
      sub: "recently contacted",
    },
    {
      label: "With phone",
      value: withPhone,
      sub: `${contacts.length > 0 ? Math.round((withPhone / contacts.length) * 100) : 0}% of contacts`,
    },
    {
      label: "With email",
      value: withEmail,
      sub: `${contacts.length > 0 ? Math.round((withEmail / contacts.length) * 100) : 0}% of contacts`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map((kpi) => (
        <KpiCell key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
