import React from "react";

import { Input, type InputProps } from "./Input";

export type DebouncedInputProps = Omit<InputProps, "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
  delay?: number;
};


export function DebouncedInput({ value, onValueChange, delay = 300, ...props }: DebouncedInputProps) {
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  React.useEffect(() => {
    const t = window.setTimeout(() => {
      if (localValue !== value) onValueChange(localValue);
    }, delay);

    return () => window.clearTimeout(t);
  }, [delay, localValue, onValueChange, value]);

  return (
    <Input
      {...props}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
    />
  );
}
