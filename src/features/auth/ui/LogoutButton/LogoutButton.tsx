import React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "src/shared/ui/Button";

import { useAuthActions, useAuthSelectors } from "../../model";

export interface LogoutButtonProps {
  className?: string;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ className }) => {
  const { t } = useTranslation();
  const { signOut } = useAuthActions();
  const { isLoading } = useAuthSelectors();

  const onLogout = async () => {
    await signOut();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={onLogout}
      disabled={isLoading}
    >
      {isLoading ? t("auth.logout.signingOut") : t("auth.logout.logout")}
    </Button>
  );
};
