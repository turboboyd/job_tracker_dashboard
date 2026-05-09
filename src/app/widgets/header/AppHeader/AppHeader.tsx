import { LogIn, Menu, UserPlus, X } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { useAuthSelectors } from "src/features/auth/model";
import { LanguageSelectConnected } from "src/features/i18n";
import { AppRoutes, RoutePath } from "src/shared/config/routes";
import { Button } from "src/shared/ui/Button";
import { ThemeToggle } from "src/shared/ui/molecules/ThemeToggle";

import { NotificationsBell } from "../NotificationsBell/NotificationsBell";
import { UserMenu } from "../UserMenu/UserMenu";

interface AppHeaderProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

interface NavItem {
  label: string;
  path: string;
}

const guestNavItems: NavItem[] = [
  { label: "header.home", path: "/" },
  { label: "header.resources", path: "/resources" },
  { label: "header.about", path: "/about" },
];

const authNavItems: NavItem[] = [
  { label: "header.dashboard", path: "/dashboard" },
];

function linkClass(isActive: boolean) {
  return [
    "text-sm font-medium transition-colors",
    isActive
      ? "text-foreground"
      : "text-muted-foreground hover:text-foreground",
  ].join(" ");
}

const guestActionClass =
  "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-3";

export const AppHeader: React.FC<AppHeaderProps> = ({
  sidebarOpen,
  onToggleSidebar,
}) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthSelectors();

  const navItems = isAuthenticated ? authNavItems : guestNavItems;

  const leftShiftClass =
    isAuthenticated && sidebarOpen ? "md:translate-x-64" : "md:translate-x-0";

  return (
    <header className="h-16 bg-card border-b border-border">
      <div className="mx-auto flex h-full max-w-container items-center justify-between gap-3 px-3 sm:px-4">
        {/* Left group */}
        <div
          className={[
            "flex items-center gap-2",
            "transition-transform duration-300 ease-out",
            leftShiftClass,
          ].join(" ")}
        >
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          )}

          {!isAuthenticated && (
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground text-xs font-bold leading-none select-none">J</span>
              </div>
              <span className="text-sm font-semibold text-foreground tracking-tight">
                {t("header.appName")}
              </span>
            </div>
          )}

          <nav className="hidden md:flex items-center gap-5 ml-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => linkClass(isActive)}
              >
                {t(item.label)}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right group */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {isAuthenticated ? (
            <>
              <NotificationsBell />
              <UserMenu
                settingsPath={`${RoutePath[AppRoutes.SETTINGS_PROFILE]}`}
              />
            </>
          ) : (
            <div className="flex items-center gap-1">
              <NavLink
                to={RoutePath[AppRoutes.LOGIN]}
                className={guestActionClass}
              >
                <LogIn className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t("auth.signIn")}</span>
              </NavLink>
              <NavLink
                to={RoutePath[AppRoutes.REGISTER]}
                className={[guestActionClass, "bg-primary text-primary-foreground hover:bg-primary/90"].join(" ")}
              >
                <UserPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t("auth.createAccount")}</span>
              </NavLink>
            </div>
          )}
          <LanguageSelectConnected
            labelMode="short"
            width="auto"
            className="h-9 w-[4.75rem] text-xs"
          />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
