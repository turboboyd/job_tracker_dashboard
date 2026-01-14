import React from "react";

import { JOB_STATUSES } from "src/entities/job/model/constants";
import type { JobStatus } from "src/entities/job/model/types";
import { Button } from "src/shared/ui";

type FilterValue = JobStatus | "all";

type Props = {
  value: FilterValue;
  onChange: (v: FilterValue) => void;
};

function labelFor(v: FilterValue) {
  return v === "all" ? "All" : v.toUpperCase();
}

export function StatusFilter({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-3">
      {/* Mobile: dropdown */}
      <div className="block md:hidden">
        <label className="sr-only" htmlFor="status-filter">
          Status
        </label>
        <select
          id="status-filter"
          value={value}
          onChange={(e) => onChange(e.target.value as FilterValue)}
          className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All</option>
          {JOB_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: pills */}
      <div className="hidden flex-wrap gap-2 md:flex">
        <Button
          variant={value === "all" ? "default" : "outline"}
          size="sm"
          shape="pill"
          onClick={() => onChange("all")}
        >
          {labelFor("all")}
        </Button>

        {JOB_STATUSES.map((s) => (
          <Button
            key={s}
            variant={value === s ? "default" : "outline"}
            size="sm"
            shape="pill"
            onClick={() => onChange(s)}
          >
            {labelFor(s)}
          </Button>
        ))}
      </div>
    </div>
  );
}
