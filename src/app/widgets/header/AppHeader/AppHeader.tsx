import React from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "src/shared/lib";
import { ThemeToggle } from "src/shared/ui/molecules/ThemeToggle/ThemeToggle";
import { UserMenu } from "src/app/widgets/header/UserMenu/UserMenu";

type NavItem = {
  label: string;
  path: string;
};

const guestNavItems: NavItem[] = [
  { label: "Home", path: "/" },
  { label: "Resources", path: "/resources" },
  { label: "About", path: "/about" },
];

const authNavItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Jobs", path: "/dashboard/jobs" },
];

function linkClass(isActive: boolean) {
  return [
    "text-sm transition-colors",
    isActive
      ? "text-foreground"
      : "text-muted-foreground hover:text-foreground",
  ].join(" ");
}

export const AppHeader: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const navItems = isAuthenticated ? authNavItems : guestNavItems;

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <div className="flex items-center gap-6">
          <div className="text-sm font-semibold">Job Tracker</div>

          <nav className="flex items-center gap-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => linkClass(isActive)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <UserMenu settingsPath="/account" />
          ) : (
            <NavLink
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Login
            </NavLink>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
