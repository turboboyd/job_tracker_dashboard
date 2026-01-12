import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./layout/AppLayout";
import { DashboardPage, JobsPage } from "../pages";


export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/jobs" element={<JobsPage />} />
      </Route>
      <Route path="*" element={<div className="p-6">Not found</div>} />
    </Routes>
  );
}
