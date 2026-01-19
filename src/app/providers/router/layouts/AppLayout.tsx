import React from "react";
import { Outlet } from "react-router-dom";

import { AppHeader, AppSidebar, useSidebar } from "src/app/widgets";
import { useAuth } from "src/shared/lib";
import { PageShell } from "src/shared/ui";

export const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const sidebar = useSidebar({
    enabled: isAuthenticated,
    desktopQuery: "(min-width: 768px)",
    defaultDesktopOpen: true,
  });

  const hasSidebar = isAuthenticated;
  const shiftClass = hasSidebar && sidebar.isOpen ? "md:ml-64" : "md:ml-0";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader
        sidebarOpen={sidebar.isOpen}
        onToggleSidebar={sidebar.toggle}
      />

      {hasSidebar && (
        <AppSidebar isOpen={sidebar.isOpen} onClose={sidebar.close} />
      )}

      <main >
        <div
          className={[
            shiftClass,
            "transition-[margin] duration-300 ease-out",
          ].join(" ")}
        >
          <PageShell paddingX="md" paddingY="sm">
            <Outlet />
          </PageShell>
        </div>
      </main>
    </div>
  );
};
