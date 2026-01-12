import React from "react";
import { NavLink, Outlet } from "react-router-dom";

function NavItem({ to, label }: { to: string; label: string }) {
  const base =
    "rounded-md px-3 py-2 text-sm font-medium transition-colors";
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        isActive
          ? `${base} bg-slate-900 text-white`
          : `${base} text-slate-700 hover:bg-slate-100`
      }
    >
      {label}
    </NavLink>
  );
}

export function AppLayout() {
  return (
     <div className="theme-light min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold">Job Tracker Dashboard</div>
          <nav className="flex gap-2">
            <NavItem to="/dashboard" label="Dashboard" />
            <NavItem to="/jobs" label="Jobs" />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
