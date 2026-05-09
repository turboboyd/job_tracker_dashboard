import React from "react";

import { classNames } from "src/shared/lib";

export const inputIconSizeClass = "h-4 w-4";

function FormIcon({
  className,
  children,
  spin,
}: {
  className?: string | undefined;
  children: React.ReactNode;
  spin?: boolean | undefined;
}) {
  return (
    <svg
      className={classNames(spin ? "animate-spin" : undefined, className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function IconPath(props: React.SVGProps<SVGPathElement>) {
  return <path stroke="currentColor" strokeWidth="2" {...props} />;
}

export function MagnifierIcon({ className }: { className?: string }) {
  return (
    <FormIcon className={className}>
      <IconPath d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
      <IconPath d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </FormIcon>
  );
}

export function XIcon({ className }: { className?: string }) {
  return (
    <FormIcon className={className}>
      <IconPath d="M18 6 6 18" strokeLinecap="round" />
      <IconPath d="M6 6l12 12" strokeLinecap="round" />
    </FormIcon>
  );
}

export function EyeIcon({ className }: { className?: string }) {
  return (
    <FormIcon className={className}>
      <IconPath
        d="M2.5 12S6.5 5.5 12 5.5 21.5 12 21.5 12 17.5 18.5 12 18.5 2.5 12 2.5 12Z"
        strokeLinejoin="round"
      />
      <IconPath d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </FormIcon>
  );
}

export function EyeOffIcon({ className }: { className?: string }) {
  return (
    <FormIcon className={className}>
      <IconPath d="M3 3l18 18" strokeLinecap="round" />
      <IconPath
        d="M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5"
        strokeLinecap="round"
      />
      <IconPath
        d="M6.3 6.7C4.2 8.5 2.5 12 2.5 12S6.5 18.5 12 18.5c2 0 3.8-.8 5.3-1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <IconPath
        d="M9.3 5.8A8.9 8.9 0 0 1 12 5.5C17.5 5.5 21.5 12 21.5 12s-1.1 1.8-2.8 3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </FormIcon>
  );
}

export function SpinnerIcon({ className }: { className?: string }) {
  return (
    <FormIcon className={className} spin>
      <IconPath d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" />
    </FormIcon>
  );
}

