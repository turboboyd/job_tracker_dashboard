import React from "react";
import { Route, Routes } from "react-router-dom";

import AppLayout from "../layouts/AppLayout";
import { RequireAuth } from "../RequireAuth/RequireAuth";
import {
  publicRoutes,
  privateRoutes,
  notFoundRoute,
} from "../routeConfig/routeConfig";

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {publicRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}

        <Route element={<RequireAuth />}>
          {privateRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Route>
        <Route path={notFoundRoute.path} element={notFoundRoute.element} />
      </Route>
    </Routes>
  );
};
