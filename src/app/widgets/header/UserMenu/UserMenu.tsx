import React from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import {
  AppRoutes,
  RoutePath,
} from "src/app/providers/router/routeConfig/routeConfig";
import { useAuthSelectors } from "src/entities/auth";
import { LogoutButton } from "src/features/auth";
import { Button } from "src/shared/ui";

type UserMenuProps = {
  settingsPath?: string;
};

export const UserMenu: React.FC<UserMenuProps> = ({
  settingsPath = `${RoutePath[AppRoutes.SETTINGS_PROFILE]}`,
}) => {
  const { t } = useTranslation();
  const { user, isAuthReady } = useAuthSelectors();
  if (!isAuthReady) return null;
  if (!user) return null;

  const displayName = user.displayName ?? user.email ?? "User";

  return (
    <div className="relative group">
      <Button variant="outline" shape="pill" shadow="sm" className="gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
          {String(displayName).trim().slice(0, 1).toUpperCase()}
        </span>
        <span className="max-w-[140px] truncate">{displayName}</span>
        <svg
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </Button>

      <div className="absolute right-0 z-50 hidden w-40 group-hover:block">
        <div
          role="menu"
          className="
            mt-1 -translate-y-1
            overflow-hidden
            rounded-xl border border-border
            bg-card shadow-[var(--shadow-lg)]
          "
        >
          <NavLink
            to={settingsPath}
            className="
              block p-2 text-sm
              text-foreground
              hover:bg-muted
              transition-colors
            "
          >
            {t("header.accountSettings")}
          </NavLink>

          <div className="h-px bg-border" />

          <div className="p-2 hover:bg-muted transition-colors">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
};
