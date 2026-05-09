import { joinTitles, type Loop } from "src/entities/loop";

export function LoopListCard({
  loop,
  onOpen,
  remoteText,
  emptyTitlesLabel,
}: {
  loop: Loop;
  onOpen: (id: string) => void;
  remoteText: string;
  emptyTitlesLabel: string;
}) {
  const titlesText =
    joinTitles(Array.isArray(loop.titles) ? loop.titles : []) ?? emptyTitlesLabel;

  return (
    <div
      tabIndex={0}
      onClick={() => onOpen(loop.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(loop.id);
        }
      }}
      className={[
        "w-full",
        "rounded-xl border border-border bg-background",
        "px-4 py-4",
        "hover:bg-muted transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-border",
        "cursor-pointer",
        "select-none",
      ].join(" ")}
    >
      <div className="text-sm font-semibold text-foreground">{loop.name}</div>
      <div className="mt-1 text-xs text-muted-foreground">
        {loop.location} · {titlesText} · {remoteText}
      </div>
    </div>
  );
}
