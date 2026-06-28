import type { Rect } from "../model/onboardingPositioning";

/**
 * The highlighted cutout. A box at the (padded) target rect whose huge spread
 * box-shadow dims the rest of the page, with a primary-colour ring as the glow.
 * Purely visual — `pointer-events: none` — the overlay behind it captures clicks.
 */
export function OnboardingSpotlight({ rect, radius = 10 }: { rect: Rect; radius?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute transition-all duration-200 ease-out"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        borderRadius: radius,
        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55), 0 0 0 2px rgb(var(--primary))",
      }}
    />
  );
}
