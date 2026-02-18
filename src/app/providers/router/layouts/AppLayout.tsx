import React from "react";
import { Outlet } from "react-router-dom";

import { AppHeader, AppSidebar, useSidebar } from "src/app/widgets";
import { useAuthSelectors } from "src/entities/auth";
import { PageShell } from "src/shared/ui";

export const AppLayout: React.FC = () => {
  const { isAuthenticated } = useAuthSelectors();

  const sidebar = useSidebar({
    enabled: isAuthenticated,
    desktopQuery: "(min-width: 768px)",
    defaultDesktopOpen: true,
  });

  const hasSidebar = isAuthenticated;
  const shiftClass = hasSidebar && sidebar.isOpen ? "md:ml-64" : "md:ml-0";

  return (
    <div className="h-screen min-h-0 bg-background text-foreground flex flex-col overflow-hidden">
      <div className="shrink-0">
        <AppHeader
          sidebarOpen={sidebar.isOpen}
          onToggleSidebar={sidebar.toggle}
        />
      </div>

      {hasSidebar && (
        <AppSidebar isOpen={sidebar.isOpen} onClose={sidebar.close} />
      )}

      {/* Main content scroll lives here */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div
          className={[
            shiftClass,
            "min-h-full",
            "transition-[margin] duration-300 ease-out",
          ].join(" ")}
        >
          <PageShell paddingX="md" paddingY="sm" fullHeight layout="flexCol">
            <Outlet />
          </PageShell>
        </div>
      </main>
    </div>
  );
};