import type React from 'react';

export interface MultiSelectOption<T extends string> {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
}

export function hasNode(value: React.ReactNode) {
  return value !== null && value !== undefined && value !== false && value !== '';
}

export function normalizeText(value: React.ReactNode): string {
  if (typeof value === 'string') return value.toLowerCase();
  if (typeof value === 'number') return String(value).toLowerCase();
  return '';
}

export function toggle<T extends string>(items: T[], value: T): T[] {
  return items.includes(value)
    ? items.filter((item) => item !== value)
    : [...items, value];
}
