
import { classNames } from "src/shared/lib";

type Props = {
  title?: string;
  message: string;
  className?: string;
};

export function InlineError({ title = "Error", message, className }: Props) {
  return (
    <div
      className={classNames(
        "rounded-xl border border-border bg-card p-md shadow-sm",
        "text-foreground",
        className
      )}
      role="alert"
    >
      <div className="text-sm font-semibold text-foreground leading-tight">
        {title}
      </div>
      <div className="mt-1 text-sm text-muted-foreground leading-normal">
        {message}
      </div>
    </div>
  );
}
