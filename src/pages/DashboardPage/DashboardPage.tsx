import React from "react";

import { LogoutButton } from "src/features/auth/ui/LogoutButton/LogoutButton";
import { useAuth } from "src/shared/lib/auth/useAuth";

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="rounded-lg border border-border bg-card p-4 text-sm">
        <div>
          Signed in as: <b>{user?.displayName ?? user?.email ?? "User"}</b>
        </div>

        <LogoutButton />
      </div>
    </div>
  );
};

export default DashboardPage;
