import { Calendar } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { toMillis } from "src/shared/lib/firestore/toMillis";
import { Button, Card, Modal } from "src/shared/ui";

import type { MatchTimestampsLike } from "../../model/dashboardTimeSeries";

import type { ModeKey, RangeKey, SeriesKey, VisibleMap } from "./trends.types";
import { TrendsChart } from "./TrendsChart";
import { TrendsLegend } from "./TrendsLegend";
import { useTrendsBuckets, useTrendsChartData, useTrendsTotal } from "./useTrendsData";

type CustomRange = { from: Date; to: Date } | null;

function SegButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      variant={active ? "secondary" : "ghost"}
      size="sm"
      shape="pill"
      shadow="none"
      className={[
        "h-9 px-3 text-xs",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </Button>
  );
}

function SegGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-1 rounded-full border bg-background p-1">{children}</div>;
}

function formatShort(d: Date, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit" }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

function parseDateInput(v: string): Date | null {
  const ms = Date.parse(v);
  return Number.isFinite(ms) ? new Date(ms) : null;
}

export function DashboardTrendsCard({
  matches,
  range,
  mode,
  customRange,
  onRangeChange,
  onModeChange,
  onCustomRangeChange,
}: {
  matches: MatchTimestampsLike[];
  range: RangeKey;
  mode: ModeKey;
  customRange: CustomRange;
  onRangeChange: (r: RangeKey) => void;
  onModeChange: (m: ModeKey) => void;
  onCustomRangeChange: (r: CustomRange) => void;
}) {
  const { t, i18n } = useTranslation(undefined, { keyPrefix: "dashboard" });

  const [visible, setVisible] = useState<VisibleMap>({
    ACTIVE: true,
    INTERVIEW: true,
    OFFER: true,
    HIRED: true,
    REJECTED: true,
    NO_RESPONSE: false,
  });
  const [hoverKey, setHoverKey] = useState<SeriesKey | null>(null);

  const [customOpen, setCustomOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState<string>(() => (customRange ? customRange.from.toISOString().slice(0, 10) : ""));
  const [draftTo, setDraftTo] = useState<string>(() => (customRange ? customRange.to.toISOString().slice(0, 10) : ""));

  const safeMatches = useMemo(() => {
    return matches
      .map((m) => {
        const createdAt = toMillis(m.createdAt);
        const updatedAt = toMillis(m.updatedAt) || createdAt;
        return { status: m.status, createdAt, updatedAt };
      })
      .filter((m) => m.createdAt > 0);
  }, [matches]);

  const customMs = useMemo(() => {
    if (range !== "custom" || !customRange) return null;
    return { fromMs: customRange.from.getTime(), toMs: customRange.to.getTime() };
  }, [range, customRange]);

  const buckets = useTrendsBuckets(safeMatches, range, mode, customMs);
  const chartData = useTrendsChartData(buckets, i18n.language);
  const totalInRange = useTrendsTotal(buckets);

  const subtitle = useMemo(() => {
    const modeLabel =
      mode === "updated"
        ? String(t("trends.mode.updated", { defaultValue: "By last update" }))
        : String(t("trends.mode.created", { defaultValue: "By creation date" }));

    if (range === "custom" && customRange) {
      return `${modeLabel} · ${formatShort(customRange.from, i18n.language)}–${formatShort(customRange.to, i18n.language)}`;
    }

    const rangeLabel = String(t(`range.${range}`, { defaultValue: range }));
    return `${modeLabel} · ${rangeLabel}`;
  }, [mode, range, t, customRange, i18n.language]);

  function toggleSeries(key: SeriesKey) {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function openCustom() {
    const now = new Date();
    const to = customRange?.to ?? now;
    const from = customRange?.from ?? new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

    setDraftFrom(from.toISOString().slice(0, 10));
    setDraftTo(to.toISOString().slice(0, 10));
    setCustomOpen(true);
  }

  function applyCustom() {
    const from = parseDateInput(draftFrom);
    const to = parseDateInput(draftTo);
    if (!from || !to) return;

    const a = from.getTime();
    const b = to.getTime();
    const rr = a <= b ? { from, to } : { from: to, to: from };

    onCustomRangeChange(rr);
    onRangeChange("custom");
    setCustomOpen(false);
  }

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-foreground">{String(t("trends.title", { defaultValue: "Trends" }))}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SegGroup>
            {(["7d", "30d", "90d", "12m"] as const).map((k) => (
              <SegButton key={k} active={range === k} onClick={() => onRangeChange(k)}>
                {String(t(`range.${k}`, { defaultValue: k }))}
              </SegButton>
            ))}

            <Button
              onClick={openCustom}
              variant={range === "custom" ? "secondary" : "ghost"}
              size="sm"
              shape="pill"
              shadow="none"
              className={[
                "h-9 gap-2 px-3 text-xs",
                range === "custom" ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              <Calendar className="h-4 w-4" />
              {String(t("range.custom", { defaultValue: "Custom" }))}
            </Button>
          </SegGroup>

          <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

          <SegGroup>
            <SegButton active={mode === "created"} onClick={() => onModeChange("created")}>
              {String(t("trends.created", { defaultValue: "Created" }))}
            </SegButton>
            <SegButton active={mode === "updated"} onClick={() => onModeChange("updated")}>
              {String(t("trends.updated", { defaultValue: "Updated" }))}
            </SegButton>
          </SegGroup>
        </div>
      </div>

      <Modal open={customOpen} onOpenChange={setCustomOpen} title={String(t("range.customTitle", { defaultValue: "Custom period" }))}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <div className="text-xs text-muted-foreground">{String(t("range.from", { defaultValue: "From" }))}</div>
              <input
                type="date"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>

            <label className="space-y-1 text-sm">
              <div className="text-xs text-muted-foreground">{String(t("range.to", { defaultValue: "To" }))}</div>
              <input
                type="date"
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCustomOpen(false)}>
              {String(t("common.cancel", { defaultValue: "Cancel" }))}</Button>
            <Button onClick={applyCustom}>{String(t("common.apply", { defaultValue: "Apply" }))}</Button>
          </div>
        </div>
      </Modal>

      <div className="mt-6">
        {totalInRange === 0 ? (
          <div className="flex min-h-[260px] items-center justify-center rounded-2xl border bg-muted/20 px-6 py-10 text-center">
            <div className="space-y-1">
              <div className="text-sm font-medium text-foreground">{String(t("trends.emptyTitle", { defaultValue: "No data yet" }))}</div>
              <div className="text-xs text-muted-foreground">
                {String(
                  t("trends.emptySubtitle", {
                    defaultValue: "Add jobs and update statuses to see trends here.",
                  }),
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-background p-3">
            <TrendsChart points={chartData.points} mode={mode} visible={visible} hoverKey={hoverKey} />
          </div>
        )}
      </div>

      {totalInRange > 0 && <TrendsLegend visible={visible} hoverKey={hoverKey} onToggle={toggleSeries} onHover={setHoverKey} />}
    </Card>
  );
}
