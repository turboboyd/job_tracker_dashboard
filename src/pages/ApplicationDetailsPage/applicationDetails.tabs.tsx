import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { classNames } from "src/shared/lib";

export interface TabDescriptor<TKey extends string> {
  key: TKey;
  label: string;
  icon?: LucideIcon;
  count?: number | undefined;
  /** Optional suffix appended to the count (e.g. "+" when capped at a limit). */
  countSuffix?: string | undefined;
}

interface DetailsTabsProps<TKey extends string> {
  active: TKey;
  onChange: (next: TKey) => void;
  tabs: TabDescriptor<TKey>[];
  children: ReactNode;
}

export function DetailsTabs<TKey extends string>({
  active,
  onChange,
  tabs,
  children,
}: DetailsTabsProps<TKey>) {
  return (
    <div className="space-y-md">
      <div
        role="tablist"
        aria-label="Application sections"
        className="flex flex-wrap gap-1 border-b border-border"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              role="tab"
              type="button"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.key)}
              className={classNames(
                "relative inline-flex items-center gap-2 px-4 py-2 -mb-px text-sm font-medium transition-colors",
                "rounded-t-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "border-b-2 border-primary text-foreground"
                  : "border-b-2 border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 ? (
                <span
                  className={classNames(
                    "ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {tab.count}
                  {tab.countSuffix ?? ""}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">{children}</div>
    </div>
  );
}
