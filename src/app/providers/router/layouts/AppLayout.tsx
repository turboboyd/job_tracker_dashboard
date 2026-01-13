import React from "react";
import { Outlet } from "react-router-dom";
import { AppHeader, AppSidebar, useSidebar } from "src/app/widgets";

import { useAuth } from "src/shared/lib";

export const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const sidebar = useSidebar({
    enabled: isAuthenticated,
    desktopQuery: "(min-width: 768px)",
    defaultDesktopOpen: true,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader
        sidebarOpen={sidebar.isOpen}
        onToggleSidebar={sidebar.toggle}
      />

      {isAuthenticated && (
        <AppSidebar isOpen={sidebar.isOpen} onClose={sidebar.close} />
      )}

      <main
        className={[
          "pt-16",
          isAuthenticated && sidebar.isOpen ? "md:pl-64" : "md:pl-0",
        ].join(" ")}
      >
        <div className="mx-auto max-w-6xl p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
