import React from "react";

import type { AuthMode } from "./emailPasswordAuthForm.helpers";

interface AuthModeSwitchProps {
  mode: AuthMode;
  noAccountText: string;
  haveAccountText: string;
  switchToSignUpText: string;
  switchToSignInText: string;
  onSwitchToSignup: () => void;
  onSwitchToSignin: () => void;
}

export const AuthModeSwitch: React.FC<AuthModeSwitchProps> = ({
  mode,
  noAccountText,
  haveAccountText,
  switchToSignUpText,
  switchToSignInText,
  onSwitchToSignup,
  onSwitchToSignin,
}) => (
  <div className="text-center text-sm text-muted-foreground">
    {mode === "signin" ? (
      <>
        {noAccountText}{" "}
        <button
          type="button"
          className="underline underline-offset-4 hover:no-underline"
          onClick={onSwitchToSignup}
        >
          {switchToSignUpText}
        </button>
      </>
    ) : (
      <>
        {haveAccountText}{" "}
        <button
          type="button"
          className="underline underline-offset-4 hover:no-underline"
          onClick={onSwitchToSignin}
        >
          {switchToSignInText}
        </button>
      </>
    )}
  </div>
);
