import type { ReactNode } from "react";

import type { InputSize } from "./BaseInput";

export { MagnifierIcon } from "./inputControl.icons";
export { buildRightItems } from "./inputControl.rightItems";

export function hasSlot(node: ReactNode) {
  return node !== null && node !== undefined && node !== false;
}

export function sizeToInlinePadding(size: InputSize | null | undefined) {
  switch (size) {
    case "sm":
      return { left: "pl-9", right: "pr-9" };
    case "lg":
      return { left: "pl-11", right: "pr-11" };
    case "md":
    default:
      return { left: "pl-10", right: "pr-10" };
  }
}

export function toStringValue(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

export function getPaddingClasses(args: {
  size: InputSize | null | undefined;
  withLeft: boolean;
  hasRightDecorations: boolean;
}) {
  const { size, withLeft, hasRightDecorations } = args;
  const iconPadding = sizeToInlinePadding(size);

  return {
    left: withLeft ? iconPadding.left : "",
    right: hasRightDecorations ? iconPadding.right : "",
  };
}
