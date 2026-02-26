import {
  AnimatePresence,
  motion,
  useMotionValue,
  animate,
} from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type Slice = {
  label: string;
  value: number;
  /**
   * Tailwind / CSS classes applied to the segment.
   * If you pass `color`, this can be an empty string.
   */
  className: string;
  /** Optional direct stroke color (e.g. hex). */
  color?: string;
};

type Props = {
  title?: string;
  totalLabel?: string;
  centerTop: string;
  centerBottom: string;
  slices: Slice[];
  size?: number;
  stroke?: number;
  animateOnMount?: boolean;
  drawDuration?: number;
  stagger?: number;
  gapPx?: number;
  hitSlop?: number;
  padPx?: number;
  zOrderBySlices?: boolean;
};

type Segment = Slice & {
  idx: number;
  frac: number;
  rawDash: number;
  visibleDash: number;
  dasharray: string;
  dashoffset: number;

  baseZ: number;
};

export function DonutChart({
  title = "Applications",
  totalLabel = "Total",
  centerTop,
  centerBottom,
  slices,
  size = 180,
  stroke = 14,
  animateOnMount = true,
  drawDuration = 0.9,
  stagger = 0.12,
  gapPx = 6,
  hitSlop = 10,
  padPx,
  zOrderBySlices = true,
}: Props) {
  const pad = padPx ?? Math.ceil(hitSlop / 2 + 10);

  const outer = size + pad * 2;
  const cx = pad + size / 2;
  const cy = pad + size / 2;

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = useMemo(
    () => slices.reduce((acc, s) => acc + (s.value > 0 ? s.value : 0), 0),
    [slices]
  );

  const hasData = total > 0;

  const baseZByLabel = useMemo(() => {
    const m = new Map<string, number>();
    slices.forEach((s, i) => m.set(s.label, i));
    return m;
  }, [slices]);

  const segmentsArc = useMemo<Segment[]>(() => {
    const nonZero = slices.filter((s) => s.value > 0);
    const startFromTop = circumference * 0.25;

    const rawDashes = nonZero.map((s) => {
      const frac = total > 0 ? s.value / total : 0;
      return Math.max(0, frac * circumference);
    });

    const offsets = rawDashes.reduce<number[]>((acc, dash, i) => {
      if (i === 0) return [0];
      return [...acc, acc[i - 1] + rawDashes[i - 1]];
    }, []);

    return nonZero.map((s, arcIdx) => {
      const frac = total > 0 ? s.value / total : 0;
      const rawDash = rawDashes[arcIdx] ?? 0;

      const visibleDash = Math.max(0, rawDash - gapPx);
      const dasharray = `${visibleDash} ${Math.max(
        0,
        circumference - visibleDash
      )}`;

      const offsetAcc = offsets[arcIdx] ?? 0;
      const dashoffset = startFromTop - offsetAcc + gapPx / 2;

      const baseZ = baseZByLabel.get(s.label) ?? 0;

      return {
        ...s,
        idx: arcIdx,
        frac,
        rawDash,
        visibleDash,
        dasharray,
        dashoffset,
        baseZ,
      };
    });
  }, [slices, total, circumference, gapPx, baseZByLabel]);

  const [activeKey, setActiveKey] = useState<string | null>(null);

  const active = useMemo(() => {
    if (!activeKey) return null;
    return segmentsArc.find((s) => s.label === activeKey) ?? null;
  }, [activeKey, segmentsArc]);

  const segmentsForRender = useMemo(() => {
    const base = zOrderBySlices
      ? [...segmentsArc].sort((a, b) => a.baseZ - b.baseZ)
      : [...segmentsArc];

    if (!activeKey) return base;

    const activeSeg = base.find((s) => s.label === activeKey);
    if (!activeSeg) return base;

    const rest = base.filter((s) => s.label !== activeKey);
    return [...rest, activeSeg];
  }, [segmentsArc, activeKey, zOrderBySlices]);

  const centerTopMaybeNumber = toNumberOrNull(centerTop);

  return (
    <div className="w-full">
      <div className="text-sm font-semibold text-foreground leading-tight">
        {title}
      </div>
      <div className="mt-lg flex flex-col items-stretch gap-lg 2xl:flex-row 2xl:items-center">
        <motion.div
          className="relative shrink-0"
          style={{ width: outer, height: outer }}
          initial={animateOnMount ? { opacity: 0, scale: 0.96 } : undefined}
          animate={animateOnMount ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <svg width={outer} height={outer} viewBox={`0 0 ${outer} ${outer}`}>
            <defs>
              <filter
                id="donutGlow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="2.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="transparent"
              className="stroke-muted"
              strokeWidth={stroke}
              vectorEffect="non-scaling-stroke"
            />

            {hasData ? (
              segmentsForRender.map((seg) => {
                const isActive = activeKey === seg.label;

                // Prefer explicit segment color when provided (used by dashboards/status charts).
                const segStroke = seg.color ?? strokeColorFromClass(seg.className);

                let segOpacity = 1;
                if (!isActive && activeKey) {
                  segOpacity = 0.62;
                }

                const initialDasharray = `0 ${circumference}`;
                const targetDasharray = seg.dasharray;

                return (
                  <g key={`seg-${seg.label}`}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill="transparent"
                      stroke="transparent"
                      strokeWidth={stroke + hitSlop}
                      strokeLinecap="butt"
                      strokeDasharray={seg.dasharray}
                      strokeDashoffset={seg.dashoffset}
                      vectorEffect="non-scaling-stroke"
                      style={{ pointerEvents: "stroke", cursor: "pointer" }}
                      tabIndex={0}
                      role="img"
                      aria-label={`${seg.label}: ${seg.value}`}
                      onMouseEnter={() => setActiveKey(seg.label)}
                      onMouseLeave={() => setActiveKey(null)}
                      onFocus={() => setActiveKey(seg.label)}
                      onBlur={() => setActiveKey(null)}
                    />

                    <motion.circle
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill="transparent"
                      strokeLinecap="round"
                      stroke={segStroke}
                      strokeDashoffset={seg.dashoffset}
                      vectorEffect="non-scaling-stroke"
                      style={{
                        pointerEvents: "none",
                        transformOrigin: "50% 50%",
                      }}
                      initial={
                        animateOnMount
                          ? {
                              strokeDasharray: initialDasharray,
                              opacity: 0.92,
                              strokeWidth: stroke,
                              scale: 1,
                            }
                          : undefined
                      }
                      animate={{
                        strokeDasharray: targetDasharray,
                        opacity: segOpacity,
                        scale: isActive ? 1.012 : 1,
                        strokeWidth: isActive ? stroke + 2 : stroke,
                        filter: isActive ? "url(#donutGlow)" : "none",
                      }}
                      transition={{
                        strokeDasharray: {
                          duration: drawDuration,
                          delay: seg.baseZ * stagger,
                          ease: [0.2, 0.8, 0.2, 1],
                        },
                        opacity: { duration: 0.15, ease: "easeOut" },
                        scale: { duration: 0.16, ease: [0.2, 0.8, 0.2, 1] },
                        strokeWidth: { duration: 0.14, ease: "easeOut" },
                      }}
                    />
                  </g>
                );
              })
            ) : (
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="transparent"
                className="stroke-border"
                strokeWidth={stroke}
                strokeDasharray={`2 6`}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-2xl font-semibold text-foreground leading-none">
                {centerTopMaybeNumber == null ? (
                  centerTop
                ) : (
                  <AnimatedNumber value={centerTopMaybeNumber} />
                )}
              </div>

              <div className="mt-1 text-xs text-muted-foreground leading-normal">
                {centerBottom}
              </div>

              <AnimatePresence>
                {active && (
                  <motion.div
                    className="mt-md inline-flex max-w-[160px] flex-col rounded-lg border border-border bg-background/70 px-sm py-[6px] text-[11px] text-foreground shadow-sm backdrop-blur"
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{
                      duration: 0.16,
                      ease: [0.2, 0.8, 0.2, 1],
                    }}
                  >
                    <div className="flex items-center justify-center gap-sm">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor:
                            active.color ?? strokeColorFromClass(active.className),
                        }}
                      />
                      <span className="truncate font-medium">
                        {active.label}
                      </span>
                    </div>
                    <div className="mt-0.5 text-center text-muted-foreground">
                      {active.value} • {Math.round(active.frac * 100)}%
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Legend */}
        <div className="min-w-0 flex-1">
          {/*
            Mobile (<=sm): legend goes UNDER the chart and becomes a compact 2-col grid.
            Desktop (>=sm): legend is on the RIGHT side as a vertical list.
          */}
          <div className="grid grid-cols-2 gap-2 2xl:flex 2xl:flex-col 2xl:gap-2">
            {slices.map((s, idx) => {
              const isLegendActive = active?.label === s.label && s.value > 0;

              const dotColor = s.color ?? strokeColorFromClass(s.className);

              return (
                <div
                  key={s.label}
                  className={[
                    "flex items-center justify-between gap-sm rounded-md px-sm py-1",
                    "transition-colors duration-fast ease-ease-out",
                    isLegendActive ? "bg-muted/50" : "",
                  ].join(" ")}
                  style={
                    isLegendActive && dotColor && dotColor !== "currentColor"
                      ? { backgroundColor: withAlpha(dotColor, 0.1) }
                      : undefined
                  }
                  onMouseEnter={() => setActiveKey(s.value > 0 ? s.label : null)}
                  onMouseLeave={() => setActiveKey(null)}
                >
                  <div className="flex min-w-0 items-center gap-sm">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: dotColor }}
                    />
                    <span className="truncate text-sm text-foreground leading-normal">
                      {s.label}
                    </span>
                  </div>

                  <motion.span
                    className="text-sm text-muted-foreground leading-normal"
                    initial={animateOnMount ? { opacity: 0, y: 2 } : undefined}
                    animate={animateOnMount ? { opacity: 1, y: 0 } : undefined}
                    transition={{ duration: 0.25, delay: idx * 0.04 }}
                  >
                    {s.value}
                  </motion.span>
                </div>
              );
            })}

            <div className="col-span-2 pt-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground leading-normal">
                  {totalLabel}
                </span>
                <span className="text-xs text-muted-foreground leading-normal">
                  {total}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.7,
      ease: [0.2, 0.8, 0.2, 1],
    });

    const unsub = mv.on("change", (latest) => setDisplay(Math.round(latest)));
    return () => {
      unsub();
      controls.stop();
    };
  }, [value, mv]);

  return <span>{display}</span>;
}

function toNumberOrNull(s: string) {
  const n = Number(String(s).trim());
  return Number.isFinite(n) ? n : null;
}

function strokeColorFromClass(strokeClass: string) {
  // Use explicit colors to avoid relying on Tailwind generating stroke utilities.
  // These hex values match Tailwind's default *-500 palette.
  if (strokeClass.includes("stroke-blue")) return "#3b82f6";
  if (strokeClass.includes("stroke-indigo")) return "#6366f1";
  if (strokeClass.includes("stroke-violet")) return "#8b5cf6";
  if (strokeClass.includes("stroke-purple")) return "#a855f7";
  if (strokeClass.includes("stroke-amber")) return "#f59e0b";
  if (strokeClass.includes("stroke-emerald")) return "#10b981";
  if (strokeClass.includes("stroke-rose")) return "#f43f5e";
  if (strokeClass.includes("stroke-red")) return "#ef4444";
  if (strokeClass.includes("stroke-slate")) return "#64748b";
  return "currentColor";
}

/**
 * Applies alpha to a color.
 * Supports hex (#rrggbb / #rgb) and rgb()/rgba() strings. Falls back to the original value.
 */
function withAlpha(color: string, alpha: number) {
  const a = Math.max(0, Math.min(1, alpha));

  // rgb()/rgba()
  const rgbMatch = color
    .replace(/\s+/g, "")
    .match(/^rgba?\((\d+),(\d+),(\d+)(?:,([\d.]+))?\)$/i);
  if (rgbMatch) {
    const r = Number(rgbMatch[1]);
    const g = Number(rgbMatch[2]);
    const b = Number(rgbMatch[3]);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  // #rgb / #rrggbb
  const hex = color.trim();
  const hexMatch = hex.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const raw = hexMatch[1];
    const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  return color;
}
