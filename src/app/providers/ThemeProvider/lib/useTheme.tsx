import { useCallback, useContext } from "react";

import { Theme, ThemeContext } from "../lib/ThemeContext";

export function useTheme() {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  const { theme, setTheme } = ctx;

  const toggleTheme = useCallback(() => {
    setTheme(theme === Theme.DARK ? Theme.LIGHT : Theme.DARK);
  }, [theme, setTheme]);

  return { theme, toggleTheme };
}
