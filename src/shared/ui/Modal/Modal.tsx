import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import { classNames } from "src/shared/lib";

type ModalSize = "sm" | "md" | "lg";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: ModalSize;
  showClose?: boolean;
}

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
  const { t } = useTranslation();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={classNames(
            "fixed inset-0 z-modal",
            "bg-foreground/50 backdrop-blur-sm",
            "transition-opacity duration-normal ease-ease-out",
            "data-[state=open]:opacity-100 data-[state=closed]:opacity-0"
          )}
        />

        <Dialog.Content
          className={classNames(
            "fixed left-1/2 top-1/2 z-modal w-[92vw] -translate-x-1/2 -translate-y-1/2",
            "max-h-[92vh] overflow-hidden",
            "rounded-xl border border-border bg-card text-card-foreground",
            "shadow-md",
            "px-6 py-5 sm:px-8 sm:py-6",
            "flex flex-col",
            "focus:outline-none",
            "transition-transform transition-opacity duration-normal ease-ease-out",
            "data-[state=open]:opacity-100 data-[state=open]:scale-100",
            "data-[state=closed]:opacity-0 data-[state=closed]:scale-95",
            sizeMap[size],

            "max-[500px]:left-0 max-[500px]:top-0",
            "max-[500px]:w-screen max-[500px]:h-screen",
            "max-[500px]:max-h-screen",
            "max-[500px]:translate-x-0 max-[500px]:translate-y-0",
            "max-[500px]:rounded-none",
            "max-[500px]:border-0",
            "max-[500px]:px-6 max-[500px]:py-5",
            "max-[500px]:pt-[max(1.25rem,env(safe-area-inset-top))]",
            "max-[500px]:pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          )}
        >
          {title || description ? (
            <div className="mb-md pr-12">
              {title ? (
                <Dialog.Title className="text-lg font-semibold text-foreground leading-tight">
                  {title}
                </Dialog.Title>
              ) : null}

              {description ? (
                <Dialog.Description className="mt-1 text-sm text-muted-foreground leading-normal">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>

          {showClose ? (
            <Dialog.Close asChild>
              <button
                type="button"
                className={classNames(
                  "absolute right-sm top-sm",
                  "inline-flex h-9 w-9 items-center justify-center rounded-full",
                  "border border-border bg-card text-muted-foreground shadow-sm",
                  "transition-colors hover:bg-muted hover:text-foreground",
                  "max-[500px]:right-4 max-[500px]:top-4 max-[500px]:h-10 max-[500px]:w-10",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                )}
                aria-label={t("common.close", "Close")}
                title={t("common.close", "Close")}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </Dialog.Close>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
