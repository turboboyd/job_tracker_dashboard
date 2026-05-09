import {
  type BaseInputProps,
  type InputIntent,
  type InputPaddingX,
  type InputRadius,
  type InputSize,
  type InputWidth,
} from "./BaseInput";
import { SearchLeftSlot, type InputControlProps } from "./InputControl";

// Legacy state kept for compatibility with the old public API.
// New code should prefer the intent prop.
export type InputStateLegacy = "default" | "error";

// Ready-made presets configure variants and behavior in one place.
export type InputPreset =
  | "default"
  | "compact"
  | "comfortable"
  | "wide"
  | "search"
  | "password"
  | "table"
  | "auth";

type PresetVariants = Partial<
  Pick<
    BaseInputProps,
    "size" | "paddingX" | "radius" | "shadow" | "intent" | "width"
  >
>;

type PresetBehavior = Partial<
  Pick<
    InputControlProps,
    "clearable" | "loading" | "showPasswordToggle" | "leftSlot" | "type"
  >
>;

export interface PresetConfig {
  variants?: PresetVariants;
  behavior?: PresetBehavior;
}

const defaultVariants: PresetVariants = {
  size: "md",
  paddingX: "sm",
  radius: "xl",
  shadow: "sm",
  width: "full",
  intent: "default",
};

const presetMap: Record<InputPreset, PresetConfig> = {
  default: {
    variants: defaultVariants,
  },
  compact: {
    // Compact intentionally keeps medium horizontal padding for easier tapping.
    variants: { ...defaultVariants, size: "sm", paddingX: "md" },
  },
  comfortable: {
    variants: defaultVariants,
  },
  wide: {
    variants: { ...defaultVariants, size: "lg", paddingX: "md" },
  },
  search: {
    variants: { ...defaultVariants, paddingX: "md" },
    behavior: { type: "search", clearable: true, leftSlot: <SearchLeftSlot /> },
  },
  password: {
    variants: defaultVariants,
    behavior: { type: "password", showPasswordToggle: true },
  },
  table: {
    variants: {
      ...defaultVariants,
      size: "sm",
      radius: "md",
      shadow: "none",
    },
  },
  auth: {
    variants: { ...defaultVariants, paddingX: "md", shadow: "md" },
  },
};

export function getPresetConfig(preset: InputPreset): PresetConfig {
  return presetMap[preset] ?? presetMap.default;
}

export function resolveWidth(
  width: InputWidth | null | undefined,
  fullWidth: boolean | undefined,
  presetWidth: InputWidth | null | undefined,
): InputWidth {
  if (width) return width;
  if (fullWidth === false) return "auto";
  return presetWidth ?? "full";
}

export function resolveIntent(
  intent: InputIntent | null | undefined,
  state: InputStateLegacy | undefined,
  presetIntent: InputIntent | null | undefined,
): InputIntent {
  if (intent) return intent;
  if (state === "error") return "error";
  return presetIntent ?? "default";
}

export type {
  InputIntent,
  InputPaddingX,
  InputRadius,
  InputSize,
  InputWidth,
};

