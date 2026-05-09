import { classNames } from "src/shared/lib";

export function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6.5 11.2 3.6 8.3l-1 1 3.9 3.9L13.4 6.3l-1-1z" fill="currentColor" />
    </svg>
  );
}

export function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={classNames("transition-transform", open ? "rotate-180" : "rotate-0")}
    >
      <path
        d="M5.3 7.7a1 1 0 0 1 1.4 0L10 11l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z"
        fill="currentColor"
      />
    </svg>
  );
}
