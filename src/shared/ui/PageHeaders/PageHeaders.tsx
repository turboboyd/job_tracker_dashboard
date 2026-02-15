import React from "react";

type HeaderProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export function PageHeader({ title, subtitle, right }: HeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-2xl font-semibold text-foreground">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div> : null}
      </div>
      {right}
    </div>
  );
}

export function SectionHeader({ title, subtitle, right }: HeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-base font-semibold text-foreground">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div> : null}
      </div>
      {right}
    </div>
  );
}

export function PageMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
