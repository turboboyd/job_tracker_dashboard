# Backend — Страница «Активность» (`/dashboard/activity`)

## Текущее состояние (Firebase)

Данные активности **не хранятся отдельно**. Страница использует `matchesAll` (коллекция `applications`) как прокси:
- Поле `updatedAt` каждой заявки интерпретируется как момент последнего события.
- Тип события определяется по текущему статусу заявки (`status`).
- Реальные события (нажатие кнопок, заметки, прикрепление файлов) **не логируются**.

Весь код помечен:
```ts
// TODO(backend-migration): Real activity log needs GET /api/v1/activity/feed
```

---

## Целевой API

### `GET /api/v1/activity/feed`

Возвращает хронологическую ленту событий пользователя.

**Query params:**

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `cursor` | string | — | ID последнего полученного события (cursor-based paging) |
| `limit` | number | 50 | Число записей |
| `type` | string | — | Фильтр по типу: `apply`, `interview`, `match`, `loop`, `note` |
| `from` | ISO 8601 | — | Начало периода |
| `to` | ISO 8601 | — | Конец периода |

**Response 200:**
```json
{
  "items": [
    {
      "id": "evt_01",
      "type": "apply",
      "occurredAt": "2026-05-09T14:32:00Z",
      "who": "user",
      "action": "обновил статус в",
      "targetLabel": "Yandex · Backend Engineer",
      "targetId": "app_123",
      "targetType": "application",
      "metadata": {}
    }
  ],
  "nextCursor": "evt_00",
  "total": 142
}
```

**Event types:**
- `view` — просмотр вакансии
- `apply` — создание / обновление статуса заявки
- `interview` — переход в статус INTERVIEW
- `match` — получен оффер
- `system` — автоматическое событие (отказ, нет ответа)
- `note` — добавлена заметка
- `message` — входящее сообщение
- `file` — прикреплён файл
- `loop` — создано / обновлено направление поиска
- `contact` — добавлен контакт

---

## PostgreSQL — таблица `activity_events`

```sql
CREATE TABLE activity_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         VARCHAR(32) NOT NULL,            -- 'apply', 'interview', ...
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  target_id    UUID,                            -- FK to applications/loops/etc.
  target_type  VARCHAR(32),                     -- 'application', 'loop', 'note'
  target_label TEXT,                            -- denormalized display string
  who          VARCHAR(16) NOT NULL DEFAULT 'user',  -- 'user' | 'system'
  action       TEXT,                            -- human-readable verb phrase
  metadata     JSONB DEFAULT '{}'::jsonb,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_user_time    ON activity_events (user_id, occurred_at DESC);
CREATE INDEX idx_activity_user_type    ON activity_events (user_id, type, occurred_at DESC);
CREATE INDEX idx_activity_target       ON activity_events (target_id, target_type);
```

Партиционирование по `occurred_at` (monthly) рекомендуется при > 1M строк.

---

## Генерация событий (серверная логика)

События создаются через хуки/триггеры при изменении данных:

| Источник изменения | Событие | Тип |
|---|---|---|
| `PATCH /applications/:id` → смена статуса | INSERT activity_events | `apply` / `interview` / `match` / `system` |
| `POST /applications/:id/notes` | INSERT | `note` |
| `POST /applications/:id/files` | INSERT | `file` |
| `POST /loops` | INSERT | `loop` |
| AI matcher → новый матч | INSERT | `match` |
| Нет ответа 14 дней (cron) | INSERT | `system` |

---

## Оценка трудозатрат

| Задача | Дней |
|---|---|
| Схема БД + миграции | 0.5 |
| API эндпоинт `/activity/feed` | 1 |
| Хуки генерации событий (статусы, заметки, файлы) | 1.5 |
| Cron — `system` события (нет ответа, устарела) | 0.5 |
| Фронтенд — подключение к реальному API | 0.5 |
| Тесты + QA | 1 |
| **Итого** | **~5 дней** |
