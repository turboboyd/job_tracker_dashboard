export type NotifyKind = "success" | "error" | "info";

export function notify(kind: NotifyKind, message: string) {
  if (kind === "error") {
    console.error(message);
  } else {
    console.log(message);
  }
}
