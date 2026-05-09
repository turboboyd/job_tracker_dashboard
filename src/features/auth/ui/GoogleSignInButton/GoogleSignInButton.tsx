import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import { Button, GoogleIcon } from "src/shared/ui";

import {
  type AuthRedirectLocationState,
  getAuthRedirectFrom,
} from "../../lib/authRedirect";
import { useAuthActions, useAuthSelectors } from "../../model";

export interface GoogleSignInButtonProps {
  onSuccess?: (from: string) => void;
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  className,
}) => {
  const { t } = useTranslation();
  const { signInWithGoogle, clearAuthError } = useAuthActions();
  const { isLoading } = useAuthSelectors();

  const location = useLocation();

  const onClick = async () => {
    clearAuthError();

    try {
      await signInWithGoogle();
      const from = getAuthRedirectFrom(
        location.state as AuthRedirectLocationState | null,
      );
      onSuccess?.(from);
    } catch {
      // ignore
    }
  };

  const disabled = isLoading;

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className={["w-full justify-center gap-2", className]
          .filter(Boolean)
          .join(" ")}
        onClick={onClick}
        disabled={disabled}
      >
        <GoogleIcon className="h-4 w-4" />
        {disabled ? t("auth.google.opening") : t("auth.google.signIn")}
      </Button>
    </div>
  );
};
