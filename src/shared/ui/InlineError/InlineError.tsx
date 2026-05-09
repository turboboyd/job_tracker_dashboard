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
      className={["rounded-xl border border-red-300 bg-red-50 p-4", className]
        .filter(Boolean)
        .join(" ")}
    >
      {title && <div className="mb-1 font-semibold text-red-700">{title}</div>}

      <div className="text-sm text-red-600">{message}</div>
    </div>
  );
};
