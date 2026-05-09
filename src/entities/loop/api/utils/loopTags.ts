import type { Loop } from "../../model";

export function provideLoopListTags(items?: Loop[]) {
  return items
    ? [
        ...items.map((l) => ({ type: "Loops" as const, id: l.id })),
        { type: "Loops" as const, id: "LIST" },
      ]
    : [{ type: "Loops" as const, id: "LIST" }];
}

export function provideLoopPageTags(res?: { items: Loop[] }) {
  return res
    ? [
        ...res.items.map((l) => ({ type: "Loops" as const, id: l.id })),
        { type: "Loops" as const, id: "LIST" },
      ]
    : [{ type: "Loops" as const, id: "LIST" }];
}
