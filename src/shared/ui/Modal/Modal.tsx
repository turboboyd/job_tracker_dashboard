import * as Dialog from "@radix-ui/react-dialog";
import React from "react";
import { useTranslation } from "react-i18next";

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
            "p-md sm:p-lg",
            "flex flex-col",
            "focus:outline-none",
            "transition-transform transition-opacity duration-normal ease-ease-out",
            "data-[state=open]:opacity-100 data-[state=open]:scale-100",
            "data-[state=closed]:opacity-0 data-[state=closed]:scale-95",
            sizeMap[size]
          )}
        >
          {title || description ? (
            <div className="mb-md pr-20">
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
              <Button
                variant="outline"
                size="sm"
                shape="pill"
                className={classNames(
                  "absolute right-sm top-sm",
                  "border-border bg-card text-foreground",
                  "shadow-sm",
                  "hover:bg-muted",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                )}
                aria-label={t("common.close", "Close")}
              >
                {t("common.close", "Close")}
              </Button>
            </Dialog.Close>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
