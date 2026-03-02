/**
 * Stage = основной этап процесса.
 * Это поле должно быть стабильным (используется в фильтрах/запросах/графиках).
 */
export type Stage =
  | "ACTIVE"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED"
  | "NO_RESPONSE"
  | "ARCHIVED";

export const STAGES: readonly Stage[] = [
  "ACTIVE",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
  "NO_RESPONSE",
  "ARCHIVED",
] as const;

/**
 * “Статус” = конкретное состояние карточки (подстатус).
 * Stage используется для группировки/фильтров, но UI чаще работает со StatusKey.
 */
export type StatusKey =
  // ACTIVE (prep + applied + waiting)
  | "SAVED"
  | "REVIEWED"
  | "CV_ADAPTING"
  | "COVER_LETTER_WRITING"
  | "READY_TO_APPLY"
  | "APPLIED"
  | "REAPPLIED"
  | "WAITING_RESPONSE"
  | "AUTO_REPLY_RECEIVED"
  | "RESPONSE_RECEIVED"
  | "MORE_INFO_REQUESTED"
  | "FOLLOW_UP_REQUIRED"
  | "WONT_APPLY"
  // INTERVIEW
  | "HR_CALL_SCHEDULED"
  | "HR_PASSED"
  | "HR_FAILED"
  | "TECH_SCHEDULED"
  | "TECH_PASSED"
  | "TECH_FAILED"
  | "FINAL_INTERVIEW"
  | "TEST_TASK_RECEIVED"
  | "TEST_TASK_SUBMITTED"
  | "WAITING_DECISION"
  // OFFER
  | "OFFER_RECEIVED"
  | "OFFER_REVIEWING"
  | "NEGOTIATING"
  | "OFFER_ACCEPTED"
  | "OFFER_DECLINED"
  | "OFFER_RESCINDED"
  // HIRED
  | "START_PLANNED"
  | "STARTED"
  // REJECTED / NO_RESPONSE / ARCHIVED
  | "REJECTED_PRE_INTERVIEW"
  | "REJECTED_AFTER_INTERVIEW"
  | "ROLE_CLOSED"
  | "GHOSTING"
  | "ARCHIVED_GENERAL"
  | "KEEP_IN_TOUCH"
  | "WITHDREW_BEFORE_START";

export type StatusColor =
  | "neutral"
  | "info"
  | "warning"
  | "success"
  | "danger"
  | "purple";

export const STATUS_COLORS: readonly StatusColor[] = [
  "neutral",
  "info",
  "warning",
  "success",
  "danger",
  "purple",
] as const;

export type BoardColumnKey =
  | "ACTIVE"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED"
  | "NO_RESPONSE"
  | "ARCHIVED";


export const BOARD_COLUMN_KEYS: readonly BoardColumnKey[] = [
  "ACTIVE",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
  "NO_RESPONSE",
  "ARCHIVED",
] as const;

export interface StatusMeta {
  key: StatusKey;
  stage: Stage;
  labelKey: string;
  color: StatusColor;
  boardColumn: BoardColumnKey;
  order: number;
}

const STATUS_BASE: Record<StatusKey, StatusMeta> = {
  // =========================
  // ACTIVE
  // =========================
  SAVED: {
    key: "SAVED",
    stage: "ACTIVE",
    labelKey: "status.SAVED",
    color: "neutral",
    boardColumn: "ACTIVE",
    order: 10,
  },
  REVIEWED: {
    key: "REVIEWED",
    stage: "ACTIVE",
    labelKey: "status.REVIEWED",
    color: "neutral",
    boardColumn: "ACTIVE",
    order: 20,
  },
  CV_ADAPTING: {
    key: "CV_ADAPTING",
    stage: "ACTIVE",
    labelKey: "status.CV_ADAPTING",
    color: "info",
    boardColumn: "ACTIVE",
    order: 30,
  },
  COVER_LETTER_WRITING: {
    key: "COVER_LETTER_WRITING",
    stage: "ACTIVE",
    labelKey: "status.COVER_LETTER_WRITING",
    color: "info",
    boardColumn: "ACTIVE",
    order: 40,
  },
  READY_TO_APPLY: {
    key: "READY_TO_APPLY",
    stage: "ACTIVE",
    labelKey: "status.READY_TO_APPLY",
    color: "info",
    boardColumn: "ACTIVE",
    order: 50,
  },
  APPLIED: {
    key: "APPLIED",
    stage: "ACTIVE",
    labelKey: "status.APPLIED",
    color: "warning",
    boardColumn: "ACTIVE",
    order: 60,
  },
  REAPPLIED: {
    key: "REAPPLIED",
    stage: "ACTIVE",
    labelKey: "status.REAPPLIED",
    color: "warning",
    boardColumn: "ACTIVE",
    order: 70,
  },
  WAITING_RESPONSE: {
    key: "WAITING_RESPONSE",
    stage: "ACTIVE",
    labelKey: "status.WAITING_RESPONSE",
    color: "warning",
    boardColumn: "ACTIVE",
    order: 80,
  },
  AUTO_REPLY_RECEIVED: {
    key: "AUTO_REPLY_RECEIVED",
    stage: "ACTIVE",
    labelKey: "status.AUTO_REPLY_RECEIVED",
    color: "warning",
    boardColumn: "ACTIVE",
    order: 90,
  },
  RESPONSE_RECEIVED: {
    key: "RESPONSE_RECEIVED",
    stage: "ACTIVE",
    labelKey: "status.RESPONSE_RECEIVED",
    color: "info",
    boardColumn: "ACTIVE",
    order: 100,
  },
  MORE_INFO_REQUESTED: {
    key: "MORE_INFO_REQUESTED",
    stage: "ACTIVE",
    labelKey: "status.MORE_INFO_REQUESTED",
    color: "info",
    boardColumn: "ACTIVE",
    order: 110,
  },
  FOLLOW_UP_REQUIRED: {
    key: "FOLLOW_UP_REQUIRED",
    stage: "ACTIVE",
    labelKey: "status.FOLLOW_UP_REQUIRED",
    color: "warning",
    boardColumn: "ACTIVE",
    order: 120,
  },
  WONT_APPLY: {
    key: "WONT_APPLY",
    stage: "REJECTED",
    labelKey: "status.WONT_APPLY",
    color: "danger",
    boardColumn: "REJECTED",
    order: 900,
  },

  // =========================
  // INTERVIEW
  // =========================
  HR_CALL_SCHEDULED: {
    key: "HR_CALL_SCHEDULED",
    stage: "INTERVIEW",
    labelKey: "status.HR_CALL_SCHEDULED",
    color: "purple",
    boardColumn: "INTERVIEW",
    order: 200,
  },
  HR_PASSED: {
    key: "HR_PASSED",
    stage: "INTERVIEW",
    labelKey: "status.HR_PASSED",
    color: "purple",
    boardColumn: "INTERVIEW",
    order: 210,
  },
  HR_FAILED: {
    key: "HR_FAILED",
    stage: "REJECTED",
    labelKey: "status.HR_FAILED",
    color: "danger",
    boardColumn: "REJECTED",
    order: 910,
  },
  TECH_SCHEDULED: {
    key: "TECH_SCHEDULED",
    stage: "INTERVIEW",
    labelKey: "status.TECH_SCHEDULED",
    color: "purple",
    boardColumn: "INTERVIEW",
    order: 220,
  },
  TECH_PASSED: {
    key: "TECH_PASSED",
    stage: "INTERVIEW",
    labelKey: "status.TECH_PASSED",
    color: "purple",
    boardColumn: "INTERVIEW",
    order: 230,
  },
  TECH_FAILED: {
    key: "TECH_FAILED",
    stage: "REJECTED",
    labelKey: "status.TECH_FAILED",
    color: "danger",
    boardColumn: "REJECTED",
    order: 920,
  },
  FINAL_INTERVIEW: {
    key: "FINAL_INTERVIEW",
    stage: "INTERVIEW",
    labelKey: "status.FINAL_INTERVIEW",
    color: "purple",
    boardColumn: "INTERVIEW",
    order: 240,
  },
  TEST_TASK_RECEIVED: {
    key: "TEST_TASK_RECEIVED",
    stage: "INTERVIEW",
    labelKey: "status.TEST_TASK_RECEIVED",
    color: "purple",
    boardColumn: "INTERVIEW",
    order: 250,
  },
  TEST_TASK_SUBMITTED: {
    key: "TEST_TASK_SUBMITTED",
    stage: "INTERVIEW",
    labelKey: "status.TEST_TASK_SUBMITTED",
    color: "purple",
    boardColumn: "INTERVIEW",
    order: 260,
  },
  WAITING_DECISION: {
    key: "WAITING_DECISION",
    stage: "INTERVIEW",
    labelKey: "status.WAITING_DECISION",
    color: "purple",
    boardColumn: "INTERVIEW",
    order: 270,
  },

  // =========================
  // OFFER
  // =========================
  OFFER_RECEIVED: {
    key: "OFFER_RECEIVED",
    stage: "OFFER",
    labelKey: "status.OFFER_RECEIVED",
    color: "success",
    boardColumn: "OFFER",
    order: 300,
  },
  OFFER_REVIEWING: {
    key: "OFFER_REVIEWING",
    stage: "OFFER",
    labelKey: "status.OFFER_REVIEWING",
    color: "success",
    boardColumn: "OFFER",
    order: 310,
  },
  NEGOTIATING: {
    key: "NEGOTIATING",
    stage: "OFFER",
    labelKey: "status.NEGOTIATING",
    color: "success",
    boardColumn: "OFFER",
    order: 320,
  },
  OFFER_ACCEPTED: {
    key: "OFFER_ACCEPTED",
    stage: "HIRED",
    labelKey: "status.OFFER_ACCEPTED",
    color: "success",
    boardColumn: "OFFER",
    order: 330,
  },
  OFFER_DECLINED: {
    key: "OFFER_DECLINED",
    stage: "ARCHIVED",
    labelKey: "status.OFFER_DECLINED",
    color: "neutral",
    boardColumn: "REJECTED",
    order: 800,
  },
  OFFER_RESCINDED: {
    key: "OFFER_RESCINDED",
    stage: "REJECTED",
    labelKey: "status.OFFER_RESCINDED",
    color: "danger",
    boardColumn: "REJECTED",
    order: 930,
  },

  // =========================
  // HIRED
  // =========================
  START_PLANNED: {
    key: "START_PLANNED",
    stage: "HIRED",
    labelKey: "status.START_PLANNED",
    color: "success",
    boardColumn: "OFFER",
    order: 400,
  },
  STARTED: {
    key: "STARTED",
    stage: "HIRED",
    labelKey: "status.STARTED",
    color: "success",
    boardColumn: "OFFER",
    order: 410,
  },

  // =========================
  // REJECTED
  // =========================
  REJECTED_PRE_INTERVIEW: {
    key: "REJECTED_PRE_INTERVIEW",
    stage: "REJECTED",
    labelKey: "status.REJECTED_PRE_INTERVIEW",
    color: "danger",
    boardColumn: "REJECTED",
    order: 940,
  },
  REJECTED_AFTER_INTERVIEW: {
    key: "REJECTED_AFTER_INTERVIEW",
    stage: "REJECTED",
    labelKey: "status.REJECTED_AFTER_INTERVIEW",
    color: "danger",
    boardColumn: "REJECTED",
    order: 950,
  },
  ROLE_CLOSED: {
    key: "ROLE_CLOSED",
    stage: "REJECTED",
    labelKey: "status.ROLE_CLOSED",
    color: "danger",
    boardColumn: "REJECTED",
    order: 960,
  },

  // =========================
  // NO_RESPONSE
  // =========================
  GHOSTING: {
    key: "GHOSTING",
    stage: "NO_RESPONSE",
    labelKey: "status.GHOSTING",
    color: "danger",
    boardColumn: "REJECTED",
    order: 970,
  },

  // =========================
  // ARCHIVED
  // =========================
  ARCHIVED_GENERAL: {
    key: "ARCHIVED_GENERAL",
    stage: "ARCHIVED",
    labelKey: "status.ARCHIVED_GENERAL",
    color: "neutral",
    boardColumn: "REJECTED",
    order: 980,
  },
  KEEP_IN_TOUCH: {
    key: "KEEP_IN_TOUCH",
    stage: "ARCHIVED",
    labelKey: "status.KEEP_IN_TOUCH",
    color: "neutral",
    boardColumn: "REJECTED",
    order: 990,
  },
  WITHDREW_BEFORE_START: {
    key: "WITHDREW_BEFORE_START",
    stage: "ARCHIVED",
    labelKey: "status.WITHDREW_BEFORE_START",
    color: "neutral",
    boardColumn: "REJECTED",
    order: 995,
  },
};

export const STATUS: Record<StatusKey, StatusMeta> = Object.fromEntries(
  Object.entries(STATUS_BASE).map(([k, v]) => [k, { ...v, boardColumn: v.stage }]),
) as Record<StatusKey, StatusMeta>;

export const STATUS_KEYS: readonly StatusKey[] = Object.keys(STATUS) as StatusKey[];

export const BOARD_COLUMNS: Record<
  BoardColumnKey,
  { key: BoardColumnKey; labelKey: string; order: number }
> = {
  ACTIVE: { key: "ACTIVE", labelKey: "board.column.ACTIVE", order: 1 },
  INTERVIEW: { key: "INTERVIEW", labelKey: "board.column.INTERVIEW", order: 2 },
  OFFER: { key: "OFFER", labelKey: "board.column.OFFER", order: 3 },
  HIRED: { key: "HIRED", labelKey: "board.column.HIRED", order: 4 },
  REJECTED: { key: "REJECTED", labelKey: "board.column.REJECTED", order: 5 },
  NO_RESPONSE: { key: "NO_RESPONSE", labelKey: "board.column.NO_RESPONSE", order: 6 },
  ARCHIVED: { key: "ARCHIVED", labelKey: "board.column.ARCHIVED", order: 7 },
};

export const BOARD_COLUMNS_LIST: readonly { key: BoardColumnKey; labelKey: string; order: number }[] =
  BOARD_COLUMN_KEYS.map((k) => BOARD_COLUMNS[k]).sort((a, b) => a.order - b.order);

/**
 * Единственный mapping цветов для UI.
 * Badge/Board/Charts должны использовать ТОЛЬКО meta.color.
 */
export const STATUS_COLOR_CLASS: Record<StatusColor, string> = {
  neutral: "bg-muted text-foreground",
  info: "bg-blue-100 text-blue-900",
  warning: "bg-amber-100 text-amber-900",
  success: "bg-emerald-100 text-emerald-900",
  danger: "bg-red-100 text-red-900",
  purple: "bg-purple-100 text-purple-900",
};


/**
 * Dot variant (background only).
 *
 * Derived from StatusColor, so changing meta.color updates dots everywhere.
 */
export const STATUS_COLOR_DOT_CLASS: Record<StatusColor, string> = {
  // Unified status tokens (tailwind -> CSS vars in theme files)
  neutral: "bg-status-neutral",
  info: "bg-status-info",
  warning: "bg-status-warning",
  success: "bg-status-success",
  danger: "bg-status-danger",
  purple: "bg-status-purple",
};

/**
 * Никаких других источников цветов.
 */
export const STATUS_COLOR_HEX: Record<StatusColor, string> = {
  neutral: "#64748b",
  info: "#2563eb",
  warning: "#d97706",
  success: "#059669",
  danger: "#dc2626",
  purple: "#7c3aed",
};



/**
 * Stage colors: keep consistent across the whole UI (dots, charts, badges).
 * We intentionally map "stage" -> color, so HR_CALL_SCHEDULED and TECH_* share INTERVIEW color etc.
 */
export const STAGE_COLOR: Record<Stage, StatusColor> = {
  ACTIVE: "info",
  INTERVIEW: "purple",
  OFFER: "warning",
  HIRED: "success",
  REJECTED: "danger",
  NO_RESPONSE: "neutral",
  ARCHIVED: "neutral",
};

export function getStageColorForStatus(status: StatusKey): StatusColor {
  return STAGE_COLOR[getStatusMeta(status).stage];
}

/**
 * Column (board stage) colors for charts/legends.
 */
export const BOARD_COLUMN_COLOR: Record<BoardColumnKey, StatusColor> = {
  ACTIVE: "info",
  INTERVIEW: "purple",
  OFFER: "warning",
  HIRED: "success",
  REJECTED: "danger",
  NO_RESPONSE: "neutral",
  ARCHIVED: "neutral",
};

export const BOARD_COLUMN_COLOR_HEX: Record<BoardColumnKey, string> = {
  ACTIVE: STATUS_COLOR_HEX[BOARD_COLUMN_COLOR.ACTIVE],
  INTERVIEW: STATUS_COLOR_HEX[BOARD_COLUMN_COLOR.INTERVIEW],
  OFFER: STATUS_COLOR_HEX[BOARD_COLUMN_COLOR.OFFER],
  HIRED: STATUS_COLOR_HEX[BOARD_COLUMN_COLOR.HIRED],
  REJECTED: STATUS_COLOR_HEX[BOARD_COLUMN_COLOR.REJECTED],
  NO_RESPONSE: STATUS_COLOR_HEX[BOARD_COLUMN_COLOR.NO_RESPONSE],
  ARCHIVED: STATUS_COLOR_HEX[BOARD_COLUMN_COLOR.ARCHIVED],
};
export const ALL_STATUSES: StatusMeta[] = Object.values(STATUS).sort(
  (a, b) => a.order - b.order
);

export function isStatusKey(v: unknown): v is StatusKey {
  return typeof v === "string" && (v as StatusKey) in STATUS;
}

export function getStatusMeta(status: StatusKey): StatusMeta {
  return STATUS[status];
}

export function getStage(status: StatusKey): Stage {
  return STATUS[status].stage;
}

export function getBoardColumn(status: StatusKey): BoardColumnKey {
  const meta = STATUS[status];
  // Defensive: in case legacy/invalid data slipped through.
  return meta?.boardColumn ?? "ACTIVE";
}

export function defaultStatusForBoardColumn(col: BoardColumnKey): StatusKey {
  const first = ALL_STATUSES
    .filter((s) => s.boardColumn === col)
    .sort((a, b) => a.order - b.order)[0];
  return (first?.key ?? "SAVED");
}

export function statusesForStage(stage: Stage): StatusMeta[] {
  return ALL_STATUSES.filter((s) => s.stage === stage);
}

/**
 * Legacy process.status (старый enum) -> новый StatusKey.
 * Используется только при миграции/нормализации старых документов.
 */
export type LegacyProcessStatus =
  | "SAVED"
  | "PLANNED"
  | "APPLIED"
  | "VIEWED"
  | "INTERVIEW_1"
  | "INTERVIEW_2"
  | "TEST_TASK"
  | "OFFER"
  | "REJECTED"
  | "NO_RESPONSE";

const LEGACY_TO_STATUS: Record<LegacyProcessStatus, StatusKey> = {
  SAVED: "SAVED",
  PLANNED: "READY_TO_APPLY",
  APPLIED: "APPLIED",
  VIEWED: "RESPONSE_RECEIVED",
  INTERVIEW_1: "HR_CALL_SCHEDULED",
  INTERVIEW_2: "TECH_SCHEDULED",
  TEST_TASK: "TEST_TASK_RECEIVED",
  OFFER: "OFFER_RECEIVED",
  REJECTED: "REJECTED_PRE_INTERVIEW",
  NO_RESPONSE: "GHOSTING",
};

export function legacyStatusToStatusKey(v: unknown): StatusKey | null {
  if (typeof v !== "string") return null;
  const up = v.toUpperCase() as LegacyProcessStatus;
  return up in LEGACY_TO_STATUS ? LEGACY_TO_STATUS[up] : null;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

/**
 * Normalize a raw status value (legacy strings, any casing) into StatusKey.
 * Returns null if value is not recognized.
 */
export function normalizeStatusKey(v: unknown): StatusKey | null {
  // 1) Already a valid StatusKey
  if (isStatusKey(v)) return v;

  // 2) Legacy enum values (older versions)
  const legacy = legacyStatusToStatusKey(v);
  if (legacy) return legacy;

  // 3) Be tolerant to different casing / spaces / hyphens
  if (typeof v === "string") {
    const up = v.trim().toUpperCase();
    const normalized = up.replace(/[\s-]+/g, "_");
    if (isStatusKey(normalized)) return normalized;

    // 4) If someone accidentally stored a board column key instead of subStatus,
    // map it to the default StatusKey for that column so analytics/board stay consistent.
    if ((BOARD_COLUMN_KEYS as readonly string[]).includes(normalized)) {
      return defaultStatusForBoardColumn(normalized as BoardColumnKey);
    }
  }

  return null;
}

/**
 * Нормализация статуса приложения:
 * - если уже есть process.stage + process.subStatus (и subStatus валиден) — возвращаем как есть
 * - иначе пытаемся преобразовать legacy process.status
 * - иначе фоллбек на SAVED/ACTIVE
 */
export function normalizeAppStatus(app: unknown): { stage: Stage; subStatus: StatusKey; changed: boolean } {
  const obj = asRecord(app);
  const process = asRecord(obj?.process);

  const stageIn = process?.stage;
  const subIn = process?.subStatus;

  if (typeof stageIn === "string" && typeof subIn === "string" && isStatusKey(subIn)) {
    return {
      stage: STATUS[subIn].stage,
      subStatus: subIn,
      changed: stageIn !== STATUS[subIn].stage,
    };
  }

  const legacy = legacyStatusToStatusKey(process?.status);
  if (legacy) {
    return { stage: STATUS[legacy].stage, subStatus: legacy, changed: true };
  }

  return { stage: "ACTIVE", subStatus: "SAVED", changed: true };
}

/**
 * Back-compat alias: older code imported normalizeStatus() expecting app normalization.
 */
export const normalizeStatus = normalizeAppStatus;

export function getRepresentativeStatusForColumn(col: BoardColumnKey): StatusKey {
  // Pick the earliest status (by order) that belongs to this board column.
  const found = STATUS_KEYS.map((k) => STATUS[k])
    .filter((m) => m.boardColumn === col)
    .sort((a, b) => a.order - b.order)[0];
  // STATUS_KEYS is a constant non-empty list, but TS can't prove it.
  return found?.key ?? STATUS_KEYS[0]!;
}
