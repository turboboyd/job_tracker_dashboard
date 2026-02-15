import { createContext } from "react";

/* eslint no-unused-vars: ["off", { "varsIgnorePattern": "^[A-Z_]+$" }] */

export enum Theme {
  LIGHT = "light",
  DARK = "dark",
}

export const LOCAL_STORAGE_THEME_KEY = "theme";

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
