export function sortByOrder<T extends { order: number }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => a.order - b.order);
}

export function resequence<T extends { order: number }>(
  arr: T[],
  step = 10,
): T[] {
  return arr.map((item, index) => ({ ...item, order: (index + 1) * step }));
}

export function moveItem<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const next = [...arr];
  const targetIndex = index + dir;
  if (targetIndex < 0 || targetIndex >= next.length) return next;

  const currentItem = next[index];
  const targetItem = next[targetIndex];
  if (currentItem === undefined || targetItem === undefined) {
    return next;
  }

  next[index] = targetItem;
  next[targetIndex] = currentItem;
  return next;
}

