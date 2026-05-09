import {
  CustomRangeButton,
  SegmentButton,
  SegmentGroup,
} from "./DashboardTrendsCard.segmentedControl";
import type { ModeKey, RangeKey } from "./trends.types";
import type {
  DashboardTrendsCardViewModel,
  DashboardTrendsLabels,
} from "./useDashboardTrendsCardController";

const PRESET_RANGES: Exclude<RangeKey, "custom">[] = [
  "7d",
  "30d",
  "90d",
  "12m",
];

type TrendsHeaderProps = Pick<
  DashboardTrendsCardViewModel,
  | "labels"
  | "mode"
  | "onModeChange"
  | "onOpenCustom"
  | "onRangeChange"
  | "range"
  | "subtitle"
>;

interface TrendsTitleProps {
  subtitle: string;
  title: string;
}

interface TrendsControlsProps {
  labels: DashboardTrendsLabels;
  mode: ModeKey;
  onModeChange: (mode: ModeKey) => void;
  onOpenCustom: () => void;
  onRangeChange: (range: RangeKey) => void;
  range: RangeKey;
}

interface TrendsPresetRangesProps {
  labels: DashboardTrendsLabels;
  onOpenCustom: () => void;
  onRangeChange: (range: RangeKey) => void;
  range: RangeKey;
}

interface TrendsModeToggleProps {
  createdLabel: string;
  mode: ModeKey;
  onModeChange: (mode: ModeKey) => void;
  updatedLabel: string;
}

function TrendsTitle({ subtitle, title }: TrendsTitleProps) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
    </div>
  );
}

function TrendsPresetRanges({
  labels,
  onOpenCustom,
  onRangeChange,
  range,
}: TrendsPresetRangesProps) {
  return (
    <SegmentGroup>
      {PRESET_RANGES.map((key) => (
        <SegmentButton
          key={key}
          active={range === key}
          onClick={() => onRangeChange(key)}
        >
          {labels.ranges[key]}
        </SegmentButton>
      ))}

      <CustomRangeButton
        active={range === "custom"}
        label={labels.customRange}
        onClick={onOpenCustom}
      />
    </SegmentGroup>
  );
}

function TrendsModeToggle({
  createdLabel,
  mode,
  onModeChange,
  updatedLabel,
}: TrendsModeToggleProps) {
  return (
    <SegmentGroup>
      <SegmentButton
        active={mode === "created"}
        onClick={() => onModeChange("created")}
      >
        {createdLabel}
      </SegmentButton>
      <SegmentButton
        active={mode === "updated"}
        onClick={() => onModeChange("updated")}
      >
        {updatedLabel}
      </SegmentButton>
    </SegmentGroup>
  );
}

function TrendsControls({
  labels,
  mode,
  onModeChange,
  onOpenCustom,
  onRangeChange,
  range,
}: TrendsControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <TrendsPresetRanges
        labels={labels}
        onOpenCustom={onOpenCustom}
        onRangeChange={onRangeChange}
        range={range}
      />
      <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
      <TrendsModeToggle
        createdLabel={labels.created}
        mode={mode}
        onModeChange={onModeChange}
        updatedLabel={labels.updated}
      />
    </div>
  );
}

export function TrendsHeader({
  labels,
  mode,
  onModeChange,
  onOpenCustom,
  onRangeChange,
  range,
  subtitle,
}: TrendsHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <TrendsTitle subtitle={subtitle} title={labels.title} />
      <TrendsControls
        labels={labels}
        mode={mode}
        onModeChange={onModeChange}
        onOpenCustom={onOpenCustom}
        onRangeChange={onRangeChange}
        range={range}
      />
    </div>
  );
}
