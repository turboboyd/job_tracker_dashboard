import React from "react";

import { Card } from "src/shared/ui";

import { StatusPill } from "../StatusPill";

import type { PreviewModel } from "./types";

function MiniArrow() {
  return (
    <span className="text-xs text-muted-foreground transition-transform duration-normal ease-out group-hover:translate-x-0.5">
      →
    </span>
  );
}

export function PreviewCard({ model }: { model: PreviewModel }) {
  return (
    <div className="w-full max-w-xl">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground break-words [hyphens:auto]">
              {model.header.title}
            </div>
            <div className="mt-1 text-xs text-muted-foreground break-words [hyphens:auto]">
              {model.header.subtitle}
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center gap-sm sm:w-auto sm:justify-end">
            <StatusPill
              label={model.header.liveLabel}
              tone="info"
              className="border border-border"
            />
            <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
              {model.header.demoLabel}
            </span>
          </div>
        </div>
        <div className="mt-4 space-y-md">
          <div className="rounded-2xl border border-border bg-background p-lg">
            <div className="flex flex-wrap items-center justify-between gap-sm">
              <div className="text-xs text-muted-foreground">
                {model.loop.label}
              </div>
              <StatusPill
                label={model.loop.statusLabel}
                tone="info"
                className="border border-border"
              />
            </div>
            <div className="mt-2 text-sm font-semibold text-foreground break-words [hyphens:auto]">
              {model.loop.title}
            </div>
            <div className="mt-2 flex flex-wrap gap-sm">
              {model.loop.badges.map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-border bg-card px-sm py-1 text-xs text-muted-foreground"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-background p-lg">
            <div className="flex flex-wrap items-center justify-between gap-sm">
              <div className="text-xs text-muted-foreground">
                {model.links.title}
              </div>
              <span className="text-xs text-muted-foreground">
                {model.links.openLabel}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-sm sm:grid-cols-2">
              {model.links.items.map((x) => (
                <div
                  key={x}
                  className={[
                    "group flex items-center justify-between rounded-xl border border-border bg-card px-md py-sm",
                    "transition-colors duration-normal ease-out",
                    "hover:bg-muted",
                  ].join(" ")}
                >
                  <div className="text-sm text-foreground break-words [hyphens:auto]">
                    {x}
                  </div>
                  <MiniArrow />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-background p-lg">
            <div className="flex items-center justify-between gap-md">
              <div className="text-xs text-muted-foreground">
                {model.pipeline.title}
              </div>
              <div className="flex flex-wrap gap-sm">
                {model.pipeline.pills.map((p) => (
                  <StatusPill
                    key={p.label}
                    label={p.label}
                    tone={p.tone}
                    className="border border-border"
                  />
                ))}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-sm text-center sm:grid-cols-3">
              {model.pipeline.stats.map((s) => (
                <div
                  key={s.k}
                  className="rounded-xl border border-border bg-card p-md"
                >
                  <div className="text-lg font-semibold text-foreground">
                    {s.v}
                  </div>
                  <div className="text-xs text-muted-foreground">{s.k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}