import React from "react";

import { classNames } from "src/shared/lib/classNames";

import { Card } from "../Card/Card";
import { KpiCard } from "../KpiCard/KpiCard";

export interface SectionCardProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: SectionCardProps) {
  return (
    <Card padding="md" shadow="sm" className={classNames("space-y-5", className)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

export interface StatCardProps {
  title: React.ReactNode;
  value: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}

const statToneClassName: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: "text-foreground",
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-red-600",
  info: "text-sky-600",
};

export function StatCard({ title, value, tone = "default" }: StatCardProps) {
  return (
    <KpiCard title={title} value={value} valueClassName={statToneClassName[tone]} />
  );
}

export interface StatusBadgeProps {
  tone?: "default" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
  className?: string;
}

const badgeToneClassName: Record<NonNullable<StatusBadgeProps['tone']>, string> = {
  default: "border-border bg-muted text-foreground",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
};

export function StatusBadge({
  tone = 'default',
  children,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        badgeToneClassName[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export interface DataTableColumn<Row> {
  key: string;
  title: React.ReactNode;
  width?: string;
  render: (row: Row) => React.ReactNode;
}

export interface DataTableProps<Row> {
  ariaLabel: string;
  rows: readonly Row[];
  columns: readonly DataTableColumn<Row>[];
  getRowKey: (row: Row) => React.Key;
  emptyText?: React.ReactNode;
}

export function DataTable<Row>({
  ariaLabel,
  rows,
  columns,
  getRowKey,
  emptyText = "No data",
}: DataTableProps<Row>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full border-collapse text-sm" aria-label={ariaLabel}>
        <thead className="bg-muted/60 text-left text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="border-b border-border px-3 py-2 font-medium"
                style={column.width ? { width: column.width } : undefined}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-6 text-center text-muted-foreground"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getRowKey(row)} className="border-t border-border align-top">
                {columns.map((column) => (
                  <td key={column.key} className="px-3 py-2 text-foreground">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
