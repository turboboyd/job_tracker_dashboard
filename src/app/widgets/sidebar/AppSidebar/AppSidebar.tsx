import React from "react";
import { NavLink } from "react-router-dom";

import { sidebarItems } from "src/app/providers/router/layouts/navConfig";

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
  return (
    <>
      <div
        onClick={onClose}
        className={[
          "fixed inset-0 z-40 bg-black/30 md:hidden",
          isOpen ? "block" : "hidden",
        ].join(" ")}
      />

      <aside
        className={[
          "fixed left-0 top-0 z-50 h-screen w-72 md:w-64",
          "bg-card ",
          "shadow-[var(--shadow-md)]",
          "transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="h-16 flex items-center px-4">
          <div className="text-base font-semibold text-foreground">
            Job Tracker
          </div>
        </div>

        <nav className="p-3 flex flex-col gap-1">
          {sidebarItems.map(({ label, path, Icon }) => (
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
          ))}
        </nav>
      </aside>
    </>
  );
};
