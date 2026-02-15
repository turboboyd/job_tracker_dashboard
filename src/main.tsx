import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "src/shared/config/i18n/i18n";

import { App } from "./app/App";
import { StoreProvider } from "./app/providers/StoreProvider/StoreProvider";
import { ThemeProvider } from "./app/providers/ThemeProvider";
import { store } from "./app/store/store";
import { initAuthListener } from "./entities/auth";

import "./styles/globals.css";

declare const __IS_PROD__: boolean;

const container = document.getElementById("root");
if (!container) throw new Error("Root element #root not found");

store.dispatch(initAuthListener());

const basename = __IS_PROD__ ? "/job_tracker_dashboard" : "/";

createRoot(container).render(
  <React.StrictMode>
    <StoreProvider>
      <ThemeProvider>
        <BrowserRouter basename={basename}>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </StoreProvider>
  </React.StrictMode>,
);
