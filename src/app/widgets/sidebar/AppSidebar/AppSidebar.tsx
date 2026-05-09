import { X } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { sidebarItems } from "src/app/providers/router/layouts/navConfig";
import { useAppSelector } from "src/app/store/hooks";
import { selectLoopsResumeUrl } from "src/entities/loop/model";
import { AppRoutes, RoutePath } from "src/shared/config/routes";

interface AppSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

function itemClass(isActive: boolean) {
  return [
    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
    isActive
      ? "bg-primary/10 text-primary font-medium"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  ].join(" ");
}

function itemIconClass(isActive: boolean) {
  return isActive
    ? "text-primary"
    : "text-muted-foreground group-hover:text-foreground transition-colors duration-150";
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const loopsResumeUrl = useAppSelector(selectLoopsResumeUrl);

  const isLoopsActive =
    location.pathname === RoutePath[AppRoutes.LOOPS] ||
    location.pathname.startsWith(RoutePath[AppRoutes.LOOPS]);

  const handleLoopsClick = () => {
    void navigate(loopsResumeUrl);
    onClose?.();
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={[
          "fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden",
          isOpen ? "block" : "hidden",
        ].join(" ")}
      />

      <aside
        className={[
          "fixed left-0 top-0 z-50 h-screen w-72 md:w-64",
          "bg-card border-r border-border",
          "flex flex-col",
          "transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Brand header – same height as AppHeader */}
        <div className="h-16 shrink-0 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground text-xs font-bold leading-none select-none">J</span>
            </div>
            <span className="text-sm font-semibold text-foreground tracking-tight">
              Job Tracker
            </span>
          </div>

          {/* Mobile-only close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className={[
              "max-[760px]:inline-flex min-[761px]:hidden",
              "h-8 w-8 items-center justify-center rounded-md",
              "text-muted-foreground hover:bg-muted hover:text-foreground",
              "transition-colors",
            ].join(" ")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {sidebarItems.map(({ labelKey, labelDefault, path, Icon }) => {
            const label = t(labelKey, labelDefault);

            if (path === RoutePath[AppRoutes.LOOPS]) {
              return (
                <button
                  key={path}
                  type="button"
                  onClick={handleLoopsClick}
                  className={itemClass(isLoopsActive)}
                >
                  <Icon className={["h-4 w-4 shrink-0", itemIconClass(isLoopsActive)].join(" ")} />
                  <span className="truncate">{label}</span>
                </button>
              );
            }

            return (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => itemClass(isActive)}
                end={path === RoutePath[AppRoutes.DASHBOARD]}
                onClick={onClose}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={["h-4 w-4 shrink-0", itemIconClass(isActive)].join(" ")} />
                    <span className="truncate">{label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
