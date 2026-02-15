import React from "react";

import {
  BaseInput,
  type BaseInputProps,
  type InputIntent,
  type InputPaddingX,
  type InputRadius,
  type InputSize,
  type InputWidth,
} from "./BaseInput";
import { InputControl, SearchLeftSlot, type InputControlProps } from "./InputControl";

/**
 * Legacy state для совместимости со старым API.
 * Новая схема — intent.
 */
export type InputStateLegacy = "default" | "error";

/** @deprecated используйте intent */
/**
 * Готовые пресеты: задают варианты (size/padding/radius/shadow/intent) и поведение.
 */
export type InputPreset =
  | "default"
  | "compact"
  | "comfortable"
  | "wide"
  | "search"
  | "password"
  | "table"
  | "auth";

type PresetConfig = {
  variants?: Partial<Pick<BaseInputProps, "size" | "paddingX" | "radius" | "shadow" | "intent" | "width">>;
  behavior?: Partial<Pick<InputControlProps, "clearable" | "loading" | "showPasswordToggle" | "leftSlot" | "type">>;
};

const presetMap: Record<InputPreset, PresetConfig> = {
  default: {
    variants: { size: "md", paddingX: "sm", radius: "xl", shadow: "sm", width: "full", intent: "default" },
  },
  compact: {
    // по твоей логике: compact => paddingX md (16px)
    variants: { size: "sm", paddingX: "md", radius: "xl", shadow: "sm", width: "full", intent: "default" },
  },
  comfortable: {
    variants: { size: "md", paddingX: "sm", radius: "xl", shadow: "sm", width: "full", intent: "default" },
  },
  wide: {
    variants: { size: "lg", paddingX: "md", radius: "xl", shadow: "sm", width: "full", intent: "default" },
  },
  search: {
    variants: { size: "md", paddingX: "md", radius: "xl", shadow: "sm", width: "full", intent: "default" },
    behavior: { type: "search", clearable: true, leftSlot: <SearchLeftSlot /> },
  },
  password: {
    variants: { size: "md", paddingX: "sm", radius: "xl", shadow: "sm", width: "full", intent: "default" },
    behavior: { type: "password", showPasswordToggle: true },
  },
  table: {
    variants: { size: "sm", paddingX: "sm", radius: "md", shadow: "none", width: "full", intent: "default" },
  },
  auth: {
    variants: { size: "md", paddingX: "md", radius: "xl", shadow: "md", width: "full", intent: "default" },
  },
};

export type InputProps = Omit<InputControlProps, "size" | "paddingX" | "width" | "intent"> & {
  preset?: InputPreset;

  /** Новая схема */
  intent?: InputIntent;

  /** Legacy: старое state -> intent */
  state?: InputStateLegacy;

  /**
   * Legacy алиасы для твоего старого API.
   * inputSize/paddingX переопределяют preset.
   */
  inputSize?: InputSize;
  paddingX?: InputPaddingX;

  /** Варианты */
  size?: InputSize;
  radius?: InputRadius;
  width?: InputWidth;

  /** Legacy ширина */
  fullWidth?: boolean;
};

/**
 * Input — единый публичный компонент.
 *
 * Внутри использует InputControl (слоты/clear/loading/password toggle) и BaseInput вариативность.
 *
 * Приоритет:
 * 1) Явно переданные props
 * 2) preset
 * 3) default preset
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      preset = "default",
      size,
      inputSize,
      paddingX,
      radius,
      width,
      intent,
      state,
      shadow,
      fullWidth,
      clearable,
      loading,
      showPasswordToggle,
      leftSlot,
      type,
      ...props
    },
    ref
  ) => {
    const presetCfg = presetMap[preset] ?? presetMap.default;

    const resolvedSize = size ?? inputSize ?? presetCfg.variants?.size;
    const resolvedPaddingX = paddingX ?? presetCfg.variants?.paddingX;
    const resolvedRadius = radius ?? presetCfg.variants?.radius;
    const resolvedShadow = shadow ?? presetCfg.variants?.shadow;

    const resolvedWidth: InputWidth =
      width ??
      (fullWidth === false ? "auto" : presetCfg.variants?.width ?? "full");

    const resolvedIntent: InputIntent =
      intent ?? (state === "error" ? "error" : presetCfg.variants?.intent ?? "default");

    const resolvedType = type ?? presetCfg.behavior?.type;
    const resolvedClearable = clearable ?? presetCfg.behavior?.clearable;
    const resolvedLoading = loading ?? presetCfg.behavior?.loading;
    const resolvedShowPasswordToggle = showPasswordToggle ?? presetCfg.behavior?.showPasswordToggle;
    const resolvedLeftSlot = leftSlot ?? presetCfg.behavior?.leftSlot;

    return (
      <InputControl
        ref={ref}
        type={resolvedType}
        size={resolvedSize}
        paddingX={resolvedPaddingX}
        radius={resolvedRadius}
        shadow={resolvedShadow}
        width={resolvedWidth}
        intent={resolvedIntent}
        clearable={resolvedClearable}
        loading={resolvedLoading}
        showPasswordToggle={resolvedShowPasswordToggle}
        leftSlot={resolvedLeftSlot}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";


export type {
  InputIntent,
  InputPaddingX,
  InputRadius,
  InputSize,
  InputWidth,
  BaseInputProps,
};

export { BaseInput };
