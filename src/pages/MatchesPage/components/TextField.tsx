// import React from "react";

// import { FormField } from "src/shared/ui";
// import { Input } from "src/shared/ui";
// import {
//   type InputProps,
//   type InputSize,
//   type InputRadius,
//   type InputState,
//   type InputPreset,
//   type InputWidth,
// } from "src/shared/ui/Form/Input/Input";

// type TextFieldProps = {
//   label: string;
//   required?: boolean;
//   hint?: string;
//   error?: string;
//   htmlFor?: string;

//   value: string;
//   onChange: (next: string) => void;

//   placeholder?: string;
//   type?: React.HTMLInputTypeAttribute;
//   disabled?: boolean;
//   autoComplete?: string;

//   /** Старые пропы — можно оставить */
//   inputSize?: InputSize;
//   radius?: InputRadius;
//   state?: InputState;

//   /** Новые “готовые варианты” */
//   preset?: InputPreset; // "default" | "compact" | "comfortable" | "wide"
//   width?: InputWidth;   // "full" | "auto"

//   className?: string;

//   inputProps?: Omit<
//     InputProps,
//     | "value"
//     | "onChange"
//     | "placeholder"
//     | "type"
//     | "disabled"
//     | "inputSize"
//     | "radius"
//     | "state"
//     | "className"
//     | "preset"
//     | "width"
//   >;
// };

// export function TextField({
//   label,
//   required,
//   hint,
//   error,
//   htmlFor,

//   value,
//   onChange,

//   placeholder,
//   type = "text",
//   disabled,
//   autoComplete,

//   inputSize,
//   radius = "xl",
//   state,

//   preset = "default",
//   width,

//   className,
//   inputProps,
// }: TextFieldProps) {
//   const computedState: InputState = state ?? (error ? "error" : "default");

//   return (
//     <FormField
//       label={label}
//       required={required}
//       hint={hint}
//       error={error}
//       htmlFor={htmlFor}
//     >
//       {({ id, describedBy, invalid }) => (
//         <Input
//           id={id}
//           aria-describedby={describedBy}
//           aria-invalid={invalid}
//           value={value}
//           onChange={(e) => onChange(e.target.value)}
//           placeholder={placeholder}
//           type={type}
//           disabled={disabled}
//           autoComplete={autoComplete}
//           state={computedState}
//           radius={radius}
//           preset={preset}
//           width={width}
//           // если inputSize передали — он переопределит preset (как и задумано)
//           {...(inputSize ? { inputSize } : {})}
//           className={className}
//           {...(inputProps ?? {})}
//         />
//       )}
//     </FormField>
//   );
// }
