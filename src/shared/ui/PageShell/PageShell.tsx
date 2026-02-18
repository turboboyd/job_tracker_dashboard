import { cva, type VariantProps } from "class-variance-authority";
import React from "react";

import { classNames } from "src/shared/lib";

const pageShellVariants = cva("w-full", {
  variants: {
    paddingX: {
      none: "px-0",
      sm: "px-4",
      md: "px-4 sm:px-6",
    },
    paddingY: {
      none: "py-0",
      sm: "py-4",
      md: "py-4 sm:py-6",
    },
    fullHeight: {
      false: "",
      true: "h-full min-h-0",
    },
    layout: {
      block: "",
      flexCol: "flex flex-col",
    },
    overflow: {
      visible: "",
      hidden: "overflow-hidden",
    },
  },
  defaultVariants: {
    paddingX: "md",
    paddingY: "sm",
    fullHeight: false,
    layout: "block",
    overflow: "visible",
  },
});

export interface PageShellProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageShellVariants> {}

export const PageShell = React.forwardRef<HTMLDivElement, PageShellProps>(
  (
    { className, paddingX, paddingY, fullHeight, layout, overflow, ...props },
    ref
  ) => (
    <div
      ref={ref}
      className={classNames(
        pageShellVariants({ paddingX, paddingY, fullHeight, layout, overflow }),
        className
      )}
      {...props}
    />
  )
);

PageShell.displayName = "PageShell";