import React from "react";
import { Outlet } from "react-router-dom";

import { AppHeader } from "src/app/widgets/header/AppHeader/AppHeader";


const AppLayout: React.FC = () => {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <AppHeader />
      <main className="min-h-dvh mx-auto max-w-5xl p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
