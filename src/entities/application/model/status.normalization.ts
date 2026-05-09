import {
  BOARD_COLUMN_KEYS,
  STATUS,
  defaultStatusForBoardColumn,
  isStatusKey,
  legacyStatusToStatusKey,
  type BoardColumnKey,
  type Stage,
  type StatusKey,
} from './status.constants';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

export function normalizeStatusKey(value: unknown): StatusKey | null {
  if (isStatusKey(value)) return value;

  const legacy = legacyStatusToStatusKey(value);
  if (legacy) return legacy;

  if (typeof value === 'string') {
    const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, '_');
    if (isStatusKey(normalized)) return normalized;

    if ((BOARD_COLUMN_KEYS as readonly string[]).includes(normalized)) {
      return defaultStatusForBoardColumn(normalized as BoardColumnKey);
    }
  }

  return null;
}

export function normalizeAppStatus(app: unknown): { stage: Stage; subStatus: StatusKey; changed: boolean } {
  const appRecord = asRecord(app);
  const process = asRecord(appRecord?.process);

  const stageIn = process?.stage;
  const subStatusIn = process?.subStatus;

  if (typeof stageIn === 'string' && typeof subStatusIn === 'string' && isStatusKey(subStatusIn)) {
    return {
      stage: STATUS[subStatusIn].stage,
      subStatus: subStatusIn,
      changed: stageIn !== STATUS[subStatusIn].stage,
    };
  }

  const legacy = legacyStatusToStatusKey(process?.status);
  if (legacy) {
    return { stage: STATUS[legacy].stage, subStatus: legacy, changed: true };
  }

  return { stage: 'ACTIVE', subStatus: 'SAVED', changed: true };
}

export const normalizeStatus = normalizeAppStatus;
