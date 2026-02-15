import React from "react";

import { Button } from "src/shared/ui/Button/Button";

export type AuthSubmitButtonProps = {
  disabled?: boolean;
  isSubmitting?: boolean;
  idleText: string;
  submittingText: string;
  className?: string;
};

export const AuthSubmitButton: React.FC<AuthSubmitButtonProps> = ({
  disabled,
  isSubmitting,
  idleText,
  submittingText,
  className,
}) => {
  const isBusy = Boolean(isSubmitting);
  return (
    <Button
      type="submit"
      variant="default"
      shadow="sm"
      shape="lg"
      disabled={disabled}
      className={["w-full", className].filter(Boolean).join(" ")}
    >
      {isBusy ? submittingText : idleText}
    </Button>
  );
};
