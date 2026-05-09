import { Moon, Sun } from "lucide-react";

import { useTheme } from "src/shared/lib/theme";

import { Button } from "../../Button/Button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const Icon = isDark ? Sun : Moon;

  return (
    <Button
      variant="secondary"
      size="icon"
      shape="pill"
      className="h-9 w-9 min-w-[2.25rem] shrink-0"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}
