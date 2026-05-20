# Backend — Календарь (`/dashboard/calendar`)

> Автор: senior fullstack/backend engineer  
> Статус: **черновик** · Firebase → REST migration

---

## Обзор страницы

Календарь показывает все интервью, дедлайны и встречи по заявкам в виде месячной сетки. Справа — «Сегодня» и список ближайших событий. Поддерживает переключение вид (день/неделя/месяц) и синхронизацию с iCal.

---

## Текущее состояние (клиент)

Часть данных уже извлекается из Firebase без бэкенда:

| Источник данных | Что отображается | Точность |
|---|---|---|
| `process.nextActionAt` + `process.nextActionText` | Запланированные действия | ✅ точно |
| `process.followUpDueAt` | Дедлайны follow-up | ✅ точно |
| `process.lastStatusChangeAt` + `status = INTERVIEW_1` | HR-интервью (дата входа в статус) | ⚠️ приближение |
| `process.lastStatusChangeAt` + `status = INTERVIEW_2` | Тех. интервью | ⚠️ приближение |
| `process.lastStatusChangeAt` + `status = TEST_TASK` | Тестовые задания | ⚠️ приближение |

**Что требует бэкенда:**
- Ручное создание событий (не привязанных к заявке)
- Синхронизация с Google Calendar / iCal
- Вид по дням и неделям (требует более точных временны́х меток)
- Точные даты и время интервью (сейчас используется `lastStatusChangeAt` как прокси)
- Уведомления/напоминания за N часов до события
- Общий ical-feed для подписки из внешних календарей

---

## 1. Получить события

### `GET /api/v1/calendar/events`

Все события пользователя за указанный период.

**Query params:**

| Param     | Тип    | Default | Описание |
|-----------|--------|---------|----------|
| `from`    | date   | начало текущего месяца | `YYYY-MM-DD` |
| `to`      | date   | конец текущего месяца  | `YYYY-MM-DD` |
| `loopId`  | UUID   | — | Фильтр по направлению поиска |

#### Response `200`

```json
{
  "events": [
    {
      "id": "evt_001",
      "dateKey": "2026-05-12",
      "time": "15:00",
      "label": "HR · Klarna",
      "tone": "accent",
      "appId": "app_001",
      "source": "application",
      "title": "HR-интервью — Klarna",
      "notes": null,
      "reminderMinutes": 30
    },
    {
      "id": "evt_002",
      "dateKey": "2026-05-14",
      "time": null,
      "label": "Дедлайн: тестовое GitHub",
      "tone": "warning",
      "appId": "app_002",
      "source": "deadline",
      "title": "Сдать тестовое задание — GitHub",
      "notes": "Задание на 4 часа, TypeScript + React",
      "reminderMinutes": 1440
    }
  ]
}
```

**Типы источников (`source`):**

| Значение | Описание |
|---|---|
| `application` | Привязано к заявке (интервью из pipeline) |
| `deadline` | Дедлайн (тестовое, follow-up) |
| `manual` | Создано вручную пользователем |
| `ical` | Импортировано из внешнего календаря |

**Tone → тип события:**

| Tone | Значение | Цвет |
|---|---|---|
| `accent` | Интервью (HR, финал) | Primary (фиолетовый) |
| `info` | Технический этап | `#6366f1` (индиго) |
| `warning` | Дедлайн / тестовое | `rgb(218,113,38)` (оранжевый) |
| `neutral` | Прочее | серый |

```sql
SELECT
  ce.*,
  a.job->>'roleTitle'   AS role_title,
  a.job->>'companyName' AS company_name
FROM calendar_events ce
LEFT JOIN applications a ON a.id = ce.app_id
WHERE ce.user_id = $1
  AND ce.date_key BETWEEN $2 AND $3
  AND ce.deleted_at IS NULL
ORDER BY ce.date_key, ce.time_str NULLS LAST;
```

---

## 2. Создать событие вручную

### `POST /api/v1/calendar/events`

Создание пользовательского события (не привязанного к заявке).

```json
{
  "dateKey": "2026-05-22",
  "time": "14:00",
  "title": "Созвон с рекрутером — Stripe",
  "tone": "accent",
  "appId": "app_005",
  "notes": "Уточнить стек и условия",
  "reminderMinutes": 60
}
```

#### Response `201`

```json
{
  "id": "evt_010",
  "dateKey": "2026-05-22",
  "time": "14:00",
  "label": "Созвон с рекрутером — Stripe",
  "tone": "accent",
  "source": "manual"
}
```

---

## 3. Обновить / удалить событие

### `PATCH /api/v1/calendar/events/:eventId`

```json
{
  "time": "15:30",
  "notes": "Перенесли на час позже"
}
```

#### Response `200` — обновлённый объект события

### `DELETE /api/v1/calendar/events/:eventId`

Soft-delete: `deleted_at = now()`.

#### Response `204 No Content`

---

## 4. iCal feed (подписка)

### `GET /api/v1/calendar/ical-feed`

Возвращает `.ics` файл для подписки из Google Calendar / Apple Calendar / Outlook.

```
Content-Type: text/calendar; charset=utf-8
Content-Disposition: attachment; filename="loopboard.ics"
```

**Формат:** стандартный RFC 5545 iCalendar.

Ссылка для подписки уникальна для пользователя:
```
webcal://api.loopboard.app/api/v1/calendar/ical-feed?token=<user_ical_token>
```

Токен генерируется при первой активации подписки и доступен через:

### `POST /api/v1/calendar/ical-token`

Генерирует или перегенерирует iCal-токен пользователя.

#### Response `200`

```json
{
  "token": "ical_abc123",
  "feedUrl": "webcal://api.loopboard.app/api/v1/calendar/ical-feed?token=ical_abc123"
}
```

---

## 5. Синхронизация с Google Calendar

### `POST /api/v1/calendar/google/connect`

OAuth 2.0 authorization flow. Redirect URL → Google consent screen.

### `GET /api/v1/calendar/google/callback`

OAuth callback. Сохраняет `access_token` / `refresh_token`.

### `POST /api/v1/calendar/google/sync`

Bidirectional sync:
- События из Loopboard → Google Calendar (новые / обновлённые)
- Конфликты (занятое время) → подсвечивать в UI

---

## 6. Напоминания

### `POST /api/v1/calendar/events/:eventId/reminder`

Создаёт напоминание (email/push) за N минут до события.

```json
{
  "minutesBefore": 60,
  "channel": "email"
}
```

**Реализация через BullMQ:**
```typescript
// При создании события:
await queue.add("reminder", {
  userId, eventId, channel: "email",
}, {
  delay: eventStartMs - Date.now() - minutesBefore * 60_000,
});
```

---

## 7. PostgreSQL — схема `calendar_events`

```sql
CREATE TABLE calendar_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id),

  -- Event data
  date_key         DATE NOT NULL,           -- "2026-05-12"
  time_str         TIME,                    -- NULL = all-day
  title            TEXT NOT NULL,
  notes            TEXT,
  tone             TEXT NOT NULL DEFAULT 'neutral'
                     CHECK (tone IN ('accent','info','warning','neutral')),

  -- Linkage
  source           TEXT NOT NULL DEFAULT 'manual'
                     CHECK (source IN ('application','deadline','manual','ical')),
  app_id           UUID REFERENCES applications(id) ON DELETE SET NULL,
  external_id      TEXT,                    -- Google Calendar event ID / iCal UID

  -- Reminders
  reminder_minutes INT,                     -- minutes before event

  -- Meta
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_ce_user_date   ON calendar_events(user_id, date_key) WHERE deleted_at IS NULL;
CREATE INDEX idx_ce_app         ON calendar_events(app_id)            WHERE deleted_at IS NULL;
CREATE INDEX idx_ce_external    ON calendar_events(user_id, external_id) WHERE external_id IS NOT NULL;
```

### `user_ical_tokens`

```sql
CREATE TABLE user_ical_tokens (
  user_id    UUID PRIMARY KEY REFERENCES users(id),
  token      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rotated_at TIMESTAMPTZ
);
```

---

## 8. Автоматическое создание событий из Application pipeline

При изменении статуса заявки (через `PATCH /api/v1/applications/:id/status`), сервер **автоматически** создаёт или обновляет событие в календаре:

```typescript
// application-layer trigger (Strangler Fig)
if (toStatus === "INTERVIEW_1" && payload.scheduledAt) {
  await db.query(
    `INSERT INTO calendar_events (user_id, date_key, time_str, title, tone, source, app_id)
     VALUES ($1, $2, $3, $4, 'accent', 'application', $5)
     ON CONFLICT (user_id, app_id, source)
     DO UPDATE SET date_key=$2, time_str=$3, updated_at=now()`,
    [userId, payload.scheduledAt.split("T")[0], ..., appId]
  );
}
```

---

## 9. Миграция Firebase → REST

| Текущий код (клиент) | Целевой эндпоинт |
|---|---|
| `queryAllActiveApplications` + derive events client-side | `GET /api/v1/calendar/events?from=&to=` |
| `process.nextActionAt` прокси | Явное событие в `calendar_events` с `source='application'` |
| Нет ручных событий | `POST /api/v1/calendar/events` |
| Нет iCal | `GET /api/v1/calendar/ical-feed` |
| Нет напоминаний | `POST /api/v1/calendar/events/:id/reminder` |

---

## 10. Оценка трудозатрат

| Задача | Оценка |
|---|---|
| CRUD calendar_events | 1 день |
| Auto-create events from status change | 0.5 дня |
| GET /calendar/events (с фильтрацией) | 1 день |
| iCal feed (RFC 5545) | 1.5 дня |
| Google Calendar OAuth + sync | 3 дня |
| Напоминания (BullMQ) | 1.5 дня |
| **Итого** | **~8.5 рабочих дней** |
