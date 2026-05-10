import React from "react";
import { Outlet } from "react-router-dom";

import { AppHeader, AppSidebar, useSidebar } from "src/app/widgets";
import { useAuthSelectors } from "src/entities/auth";

export const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuthSelectors();

  const sidebar = useSidebar({
    enabled: isAuthenticated,
    desktopQuery: "(min-width: 768px)",
    defaultDesktopOpen: true,
  });

  if (isAuthenticated) {
    return (
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        {/* Permanent sidebar */}
        <AppSidebar isOpen={sidebar.isOpen} onClose={sidebar.close} onToggle={sidebar.toggle} />

        {/* Content area: flex column, fills remaining width */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AppHeader />
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};
