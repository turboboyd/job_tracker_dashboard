import type { ReactNode } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string | undefined;
  right?: ReactNode | undefined;
}

interface HeaderLayoutProps extends HeaderProps {
  rootClassName: string;
  titleClassName: string;
}

function HeaderLayout({
  title,
  subtitle,
  right,
  rootClassName,
  titleClassName,
}: HeaderLayoutProps) {
  return (
    <div className={rootClassName}>
      <div>
        <div className={titleClassName}>{title}</div>
        {subtitle ? (
          <div className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{subtitle}</div>
        ) : null}
      </div>
      {right ? <div className="w-full sm:w-auto shrink-0">{right}</div> : null}
    </div>
  );
}

export function PageHeader(props: HeaderProps) {
  return (
    <HeaderLayout
      {...props}
      rootClassName="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      titleClassName="text-2xl font-semibold text-foreground tracking-tight break-words [hyphens:auto]"
    />
  );
}

export function SectionHeader(props: HeaderProps) {
  return (
    <HeaderLayout
      {...props}
      rootClassName="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      titleClassName="text-base font-semibold text-foreground break-words [hyphens:auto]"
    />
  );
}

export function PageMessage({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground leading-relaxed">
      {children}
    </div>
  );
}
