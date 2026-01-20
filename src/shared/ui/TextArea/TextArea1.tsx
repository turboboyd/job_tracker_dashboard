import React from "react";

import { classNames } from "src/shared/lib";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  state?: "default" | "error";
};

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, state = "default", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={classNames(
          "min-h-[96px] w-full rounded-xl border bg-background p-3 text-sm text-foreground",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          state === "error" ? "border-destructive" : "border-border",
          className
        )}
        {...props}
      />
    );
  }
);

TextArea.displayName = "TextArea";
