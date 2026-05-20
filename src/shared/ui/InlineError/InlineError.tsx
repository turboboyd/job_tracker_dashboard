import { AlertCircle } from "lucide-react";
import React from "react";

interface InlineErrorProps {
  title?: string;
  message: string;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({
  title,
  message,
  className,
}) => {
  return (
    <div
      className={[
        "flex gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" aria-hidden="true" />
      <div className="min-w-0">
        {title && (
          <div className="mb-0.5 text-sm font-semibold text-destructive">{title}</div>
        )}
        <div className="text-sm text-destructive/80">{message}</div>
      </div>
    </div>
  );
};
