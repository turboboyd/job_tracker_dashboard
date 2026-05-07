import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import { useAuthActions, useAuthSelectors } from "src/entities/auth";
import { GoogleIcon } from "src/shared/ui/icons/GoogleIcon";

import {
  type AuthRedirectLocationState,
  getAuthRedirectFrom,
} from "../../lib/authRedirect";

export type GoogleSignInButtonProps = {
  onSuccess?: (from: string) => void;
  className?: string;
};

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
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex w-full items-center justify-center gap-2.5 rounded-[10px] border border-border bg-card px-4 py-2.5",
        "text-[13.5px] font-medium text-foreground",
        "transition-colors duration-100 hover:bg-muted",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {disabled ? (
        <svg className="h-4 w-4 animate-spin text-muted-foreground" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <GoogleIcon className="h-4 w-4 shrink-0" />
      )}
      <span>
        {disabled
          ? t("auth.google.opening", "Opening Google…")
          : t("auth.google.signIn", "Continue with Google")}
      </span>
    </button>
  );
};
