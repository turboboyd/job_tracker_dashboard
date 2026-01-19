import * as Dialog from "@radix-ui/react-dialog";
import React from "react";

import { classNames } from "src/shared/lib";
import { Button } from "src/shared/ui"; 

type ModalSize = "sm" | "md" | "lg";

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: ModalSize;
  showClose?: boolean;
};

const sizeMap: Record<ModalSize, string> = {
  sm: "max-w-[420px]",
  md: "max-w-[640px]",
  lg: "max-w-[860px]",
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "md",
  showClose = true,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />

        <Dialog.Content
          className={classNames(
            "fixed left-1/2 top-1/2 z-50 w-[92vw] -translate-x-1/2 -translate-y-1/2",
            // Make modal usable on small screens: limit height and allow internal scrolling.
            "max-h-[92vh] overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-[var(--shadow-md)]",
            "flex flex-col",
            "focus:outline-none",
            sizeMap[size]
          )}
        >
          {title || description ? (
            <div className="mb-4 pr-20">
              {title ? (
                <Dialog.Title className="text-lg font-semibold text-foreground">
                  {title}
                </Dialog.Title>
              ) : null}
              {description ? (
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {children}
          </div>

          {showClose ? (
            <Dialog.Close asChild>
              <Button
                variant="outline"
                size="sm"
                shape="pill"
                className="absolute right-3 top-3"
                aria-label="Close"
              >
                Close
              </Button>
            </Dialog.Close>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
