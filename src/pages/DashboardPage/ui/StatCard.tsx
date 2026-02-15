import React from "react";

type StatCardProps = {
  label: string;
  value: number;
};

export const StatCard: React.FC<StatCardProps> = ({ label, value }) => {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
};
