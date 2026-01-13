import React, { ReactNode, useEffect, useMemo, useState } from "react";

import {
  LOCAL_STORAGE_THEME_KEY,
  Theme,
  ThemeContext,
} from "../lib/ThemeContext";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return Theme.LIGHT;

  const saved = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
  if (saved === Theme.DARK || saved === Theme.LIGHT) return saved;

  return Theme.LIGHT;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("theme-light", "theme-dark");
    root.classList.add(theme === Theme.DARK ? "theme-dark" : "theme-light");

    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
