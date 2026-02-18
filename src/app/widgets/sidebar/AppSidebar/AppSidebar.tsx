import { X } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { sidebarItems } from "src/app/providers/router/layouts/navConfig";
import { useAppSelector } from "src/app/store/hooks";
import { selectLoopsResumeUrl } from "src/entities/loop";

type AppSidebarProps = {
  isOpen: boolean;
  onClose?: () => void;
};

function itemClass(isActive: boolean) {
  return [
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
    isActive
      ? "bg-muted text-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  ].join(" ");
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const loopsResumeUrl = useAppSelector(selectLoopsResumeUrl);

  const isLoopsActive =
    location.pathname === "/dashboard/loops" ||
    location.pathname.startsWith("/dashboard/loops/");

  return (
    <>
      <div
        onClick={onClose}
        className={[
          "fixed inset-0 z-40 bg-foreground/30 md:hidden",
          isOpen ? "block" : "hidden",
        ].join(" ")}
      />

      <aside
        className={[
          "fixed left-0 top-0 z-50 h-screen w-72 md:w-64",
          "bg-card",
          "shadow-[var(--shadow-md)]",
          "transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="h-16 flex items-center justify-between px-4">
          <div className="text-base font-semibold text-foreground">
            Job Tracker
          </div>

          {/* Mobile-only close button (<= 760px) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className={[
              "max-[760px]:inline-flex min-[761px]:hidden",
              "h-9 w-9 items-center justify-center rounded-md",
              "text-muted-foreground hover:bg-muted hover:text-foreground",
              "transition-colors",
            ].join(" ")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-3 flex flex-col gap-1">
          {sidebarItems.map(({ labelKey, labelDefault, path, Icon }) => {
            const label = t(labelKey, labelDefault);

            if (path === "/dashboard/loops") {
              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => {
                    navigate(loopsResumeUrl);
                    onClose?.();
                  }}
                  className={itemClass(isLoopsActive)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="truncate">{label}</span>
                </button>
              );
            }

            return (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => itemClass(isActive)}
                end={path === "/dashboard"}
                onClick={onClose}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
