import * as React from "react";

type UseSidebarOptions = {
  enabled: boolean; 
  desktopQuery?: string; 
  defaultDesktopOpen?: boolean; 
};

export function useSidebar({
  enabled,
  desktopQuery = "(min-width: 768px)",
  defaultDesktopOpen = true,
}: UseSidebarOptions) {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) {
      setIsOpen(false);
      return;
    }

    const mq = window.matchMedia(desktopQuery);

    setIsOpen(defaultDesktopOpen ? mq.matches : false);

    const onChange = (e: MediaQueryListEvent) => {
      setIsOpen(defaultDesktopOpen ? e.matches : false);
    };

    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [enabled, desktopQuery, defaultDesktopOpen]);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen((v) => !v), []);

  return { isOpen, setIsOpen, open, close, toggle };
}
