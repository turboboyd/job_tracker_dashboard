import React from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";

import { UserMenu } from "src/app/widgets";
import { useAuth } from "src/shared/lib";
import { Button, ThemeToggle } from "src/shared/ui";
import { LanguageSelect } from "src/shared/ui/molecules/LanguageSelect/LanguageSelect";

type AppHeaderProps = {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
};

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

export const AppHeader: React.FC<AppHeaderProps> = ({
  sidebarOpen,
  onToggleSidebar,
}) => {
  const { isAuthenticated } = useAuth();
  const navItems = isAuthenticated ? authNavItems : guestNavItems;

  return (
    <header className="h-16 bg-card shadow-[var(--shadow-sm)]">
      <div className="mx-auto flex h-full max-w-container items-center justify-between pl-12 pr-4 ">
        <div className="flex items-center gap-3">
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
            <div className="text-sm font-semibold">Job Tracker</div>
          )}

          <nav className="hidden md:flex items-center gap-4">
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
          <LanguageSelect />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
