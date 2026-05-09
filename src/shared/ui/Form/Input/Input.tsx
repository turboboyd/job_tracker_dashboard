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
import {
  getPresetConfig,
  resolveIntent,
  resolveWidth,
  type InputPreset,
  type InputStateLegacy,
} from "./input.presets";
import { InputControl, type InputControlProps } from "./InputControl";

export type InputProps = Omit<
  InputControlProps,
  "size" | "paddingX" | "width" | "intent"
> & {
  preset?: InputPreset;

  /** Preferred visual state API. */
  intent?: InputIntent;

  /** Legacy state mapped to intent. */
  state?: InputStateLegacy;

  // Legacy aliases from the old API. Explicit values override preset values.
  inputSize?: InputSize;
  paddingX?: InputPaddingX;

  /** Visual variants. */
  size?: InputSize;
  radius?: InputRadius;
  width?: InputWidth;

  /** Legacy width flag. */
  fullWidth?: boolean;
};

// Public Input component. Resolution order: explicit props, preset, defaults.
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
    ref,
  ) => {
    const presetCfg = getPresetConfig(preset);

    const resolvedSize = size ?? inputSize ?? presetCfg.variants?.size;
    const resolvedPaddingX = paddingX ?? presetCfg.variants?.paddingX;
    const resolvedRadius = radius ?? presetCfg.variants?.radius;
    const resolvedShadow = shadow ?? presetCfg.variants?.shadow;
    const resolvedWidth = resolveWidth(width, fullWidth, presetCfg.variants?.width);
    const resolvedIntent = resolveIntent(
      intent,
      state,
      presetCfg.variants?.intent,
    );

    const resolvedType = type ?? presetCfg.behavior?.type;
    const resolvedClearable = clearable ?? presetCfg.behavior?.clearable;
    const resolvedLoading = loading ?? presetCfg.behavior?.loading;
    const resolvedShowPasswordToggle =
      showPasswordToggle ?? presetCfg.behavior?.showPasswordToggle;
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
        {...(resolvedClearable !== undefined ? { clearable: resolvedClearable } : {})}
        {...(resolvedLoading !== undefined ? { loading: resolvedLoading } : {})}
        {...(resolvedShowPasswordToggle !== undefined
          ? { showPasswordToggle: resolvedShowPasswordToggle }
          : {})}
        leftSlot={resolvedLeftSlot}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export type {
  BaseInputProps,
  InputIntent,
  InputPaddingX,
  InputRadius,
  InputSize,
  InputWidth,
};

export { BaseInput };
export type { InputPreset, InputStateLegacy };
