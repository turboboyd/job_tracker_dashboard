import React from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import {
  AppRoutes,
  RoutePath,
} from "src/app/providers/router/routeConfig/routeConfig";
import { useAuthSelectors } from "src/entities/auth";
import { ThemeToggle } from "src/shared/ui";
import { LanguageSelectConnected } from "src/shared/ui/molecules/LanguageSelect/LanguageSelectConnected";

const guestNavItems = [
  { labelKey: "header.home", labelDefault: "Home", path: "/" },
  { labelKey: "header.resources", labelDefault: "Resources", path: "/resources" },
  { labelKey: "header.about", labelDefault: "About", path: "/about" },
];

function linkClass(isActive: boolean) {
  return [
    "text-[13px] transition-colors rounded-md px-2.5 py-1.5",
    isActive
      ? "bg-muted text-foreground font-medium"
      : "text-muted-foreground hover:text-foreground",
  ].join(" ");
}

export const AppHeader: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthSelectors();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-[12px]">
      <div className="mx-auto flex h-[60px] max-w-[1280px] items-center justify-between gap-6 px-6">
        {/* Logo + nav */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="grid h-6 w-6 shrink-0 place-items-center rounded-[6px] bg-foreground text-[13px] font-bold tracking-tighter text-background">
              L
            </div>
            <span className="text-[14.5px] font-semibold tracking-tight">Loopboard</span>
            <span className="ml-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide border border-border bg-muted text-subtle-foreground">
              BETA
            </span>
          </div>

          {!isAuthenticated && (
            <nav className="hidden items-center gap-1 md:flex">
              {guestNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) => linkClass(isActive)}
                >
                  {t(item.labelKey, item.labelDefault)}
                </NavLink>
              ))}
            </nav>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <LanguageSelectConnected labelMode="short" />
          <ThemeToggle />

          {!isAuthenticated && (
            <>
              <NavLink
                to={RoutePath[AppRoutes.LOGIN]}
                className="rounded-md border border-border-strong px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
              >
                {t("auth.signIn", "Sign in")}
              </NavLink>
              <NavLink
                to={RoutePath[AppRoutes.REGISTER]}
                className="rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground transition-all hover:opacity-90"
              >
                {t("auth.createAccount", "Sign up")}
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
