import React from "react";

import { Card } from "src/shared/ui";

export type AuthPageShellProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export const AuthPageShell: React.FC<AuthPageShellProps> = ({
  title,
  subtitle,
  children,
  footer,
  className,
}) => {
  return (
    <div className="bg-background text-foreground flex items-center justify-center py-12">
      <Card
        className={["w-full max-w-md p-6", className].filter(Boolean).join(" ")}
      >
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>

        <div className="mt-6">{children}</div>

        {footer ? (
          <div className="pt-6 text-center text-sm text-muted-foreground space-y-2">
            {footer}
          </div>
        ) : null}
      </Card>
    </div>
  );
};
