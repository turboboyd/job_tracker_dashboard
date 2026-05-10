# Backend — Доска заявок (`/dashboard/board`)

> Автор: senior fullstack/backend engineer  
> Статус: **черновик** · Firebase → REST migration

---

## Обзор страницы

Kanban-доска с колонками по статусам. Пользователь перетаскивает карточки между колонками — это обновляет статус заявки. Доска работает на **LoopMatch** (матчи из поисковых циклов), а не на `applications`.

**Колонки:**

| Ключ | Название | Цвет |
|------|----------|------|
| `ACTIVE` | Активные | Оранжевый |
| `INTERVIEW` | Интервью | Фиолетовый |
| `OFFER` | Предложение | Жёлтый |
| `HIRED` | Принят | Зелёный |
| `REJECTED` | Отказ | Красный |
| `NO_RESPONSE` | Нет ответа | Серый |

---

## 1. Получить матчи для доски

### `GET /api/v1/board`

Возвращает все матчи пользователя, сгруппированные по статусу колонки.

**Query params:**

| Param | Тип | Default | Описание |
|-------|-----|---------|----------|
| `loopId` | UUID | — | Фильтр по конкретному циклу |
| `q` | string | — | Fulltext-поиск (title, company) |

#### Response `200`

```json
{
  "columns": {
    "ACTIVE": [
      {
        "id": "match_001",
        "loopId": "loop_fe_eu",
        "loopName": "Frontend EU",
        "title": "Senior Frontend Engineer",
        "company": "GitHub",
        "location": "Berlin · Remote",
        "platform": "LinkedIn",
        "url": "https://linkedin.com/jobs/...",
        "matchedAt": "2026-05-06T10:00:00Z",
        "status": "ACTIVE",
        "boardOrder": 0
      }
    ],
    "INTERVIEW": [ ... ],
    "OFFER": [ ... ],
    "HIRED": [],
    "REJECTED": [ ... ],
    "NO_RESPONSE": [ ... ]
  },
  "total": 12
}
```

#### Альтернатива — плоский список с группировкой на клиенте

```
GET /api/v1/loop-matches?limit=200
```

Клиент группирует по `status`. Подходит для небольших объёмов (< 500 матчей).

#### БД-запрос (PostgreSQL)

```sql
SELECT lm.*, l.name AS loop_name
FROM loop_matches lm
JOIN loops l ON l.id = lm.loop_id
WHERE lm.user_id = $1
  AND ($2::uuid IS NULL OR lm.loop_id = $2)
  AND lm.deleted_at IS NULL
ORDER BY lm.board_order ASC, lm.matched_at DESC;
```

---

## 2. Изменить статус карточки (drag & drop)

### `PATCH /api/v1/loop-matches/:matchId/status`

Вызывается при отпускании карточки в новую колонку.

```json
{
  "status": "INTERVIEW",
  "boardOrder": 2
}
```

**Бизнес-логика сервера:**
1. Проверить, что `matchId` принадлежит userId
2. Обновить `status` и `board_order`
3. Перенумеровать `board_order` соседних карточек в целевой колонке (gap-стратегия: step 1000 с fractional rank)
4. Если статус `INTERVIEW` — опционально создать черновик Application:  
   `POST /api/v1/applications` с данными матча (см. Strangler Fig)
5. Если статус `HIRED` — проставить `hired_at = now()`
6. Если статус `REJECTED/NO_RESPONSE` — остановить ghosting-таймер

#### Response `200`

```json
{
  "id": "match_001",
  "status": "INTERVIEW",
  "boardOrder": 2000,
  "updatedAt": "2026-05-09T11:00:00Z"
}
```

#### Rate limit

- 60 req/min/user (drag-drop может генерировать пакеты запросов)
- Debounce рекомендован на клиенте: 300ms после окончания анимации

---

## 3. Переупорядочить карточки внутри колонки

### `PATCH /api/v1/board/reorder`

Batch-операция — пересортировка без смены статуса.

```json
{
  "items": [
    { "matchId": "match_001", "boardOrder": 1000 },
    { "matchId": "match_003", "boardOrder": 2000 },
    { "matchId": "match_007", "boardOrder": 3000 }
  ]
}
```

**Стратегия `boardOrder`:**
- Использовать `REAL` (float) с шагом 1000 → можно вставить между двумя элементами без перезаписи всего списка
- При значениях < 1 или разрыве < 0.001 — провести полную перенумерацию колонки

#### Response `204 No Content`

---

## 4. Удалить матч с доски

### `DELETE /api/v1/loop-matches/:matchId`

Soft-delete: `deleted_at = now()`.

**Сервер:**
1. Проверить владение
2. Установить `deleted_at`
3. Убрать из результатов доски

#### Response `204 No Content`

---

## 5. Счётчики по колонкам (summary)

### `GET /api/v1/board/summary`

Быстрый запрос только с агрегатами — используется для stats-bar в хедере.

```json
{
  "total": 12,
  "columns": {
    "ACTIVE":      4,
    "INTERVIEW":   3,
    "OFFER":       1,
    "HIRED":       0,
    "REJECTED":    2,
    "NO_RESPONSE": 2
  }
}
```

```sql
SELECT status, COUNT(*) AS cnt
FROM loop_matches
WHERE user_id = $1 AND deleted_at IS NULL
GROUP BY status;
```

---

## 6. SSE — realtime обновления доски

### `GET /api/v1/board/stream`

Клиент подписывается при открытии доски.

**Эмитируемые события:**

```
event: card_moved
data: {"matchId":"match_001","fromStatus":"ACTIVE","toStatus":"INTERVIEW","boardOrder":2000}

event: card_added
data: {"matchId":"match_009","status":"ACTIVE","title":"...","company":"..."}

event: card_deleted
data: {"matchId":"match_001"}
```

**Сценарий использования:**
- Несколько вкладок или устройств открыто одновременно → SSE синхронизирует состояние без перезагрузки
- AI-worker добавил новый матч из цикла → событие `card_added` появляется мгновенно

---

## 7. PostgreSQL — схема `loop_matches`

```sql
CREATE TABLE loop_matches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id),
  loop_id      UUID NOT NULL REFERENCES loops(id) ON DELETE CASCADE,

  -- Job info
  title        TEXT NOT NULL,
  company      TEXT NOT NULL,
  location     TEXT,
  url          TEXT,
  description  TEXT,
  platform     TEXT,  -- 'linkedin' | 'indeed' | 'xing' | 'stepstone' | ...
  external_id  TEXT,  -- platform-specific job ID (dedup)

  -- Board state
  status       TEXT NOT NULL DEFAULT 'ACTIVE'
                 CHECK (status IN ('ACTIVE','INTERVIEW','OFFER','HIRED','REJECTED','NO_RESPONSE')),
  board_order  REAL NOT NULL DEFAULT 1000,
  hired_at     TIMESTAMPTZ,

  -- AI matching
  match_score  SMALLINT CHECK (match_score BETWEEN 0 AND 100),

  -- Meta
  matched_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ  -- soft delete

  UNIQUE (user_id, loop_id, external_id)  -- prevent duplicates from same source
);

-- Indexes
CREATE INDEX idx_lm_user_status    ON loop_matches(user_id, status)      WHERE deleted_at IS NULL;
CREATE INDEX idx_lm_user_loop      ON loop_matches(user_id, loop_id)     WHERE deleted_at IS NULL;
CREATE INDEX idx_lm_board_order    ON loop_matches(user_id, status, board_order) WHERE deleted_at IS NULL;
CREATE INDEX idx_lm_external_dedup ON loop_matches(loop_id, external_id) WHERE deleted_at IS NULL;
```

---

## 8. Ghosting-детектор для матчей

Аналогично заявкам — если матч в статусе `ACTIVE` > 14 дней без изменений:

```sql
-- Cron: ежедневно 03:00 UTC
UPDATE loop_matches
SET status = 'NO_RESPONSE', updated_at = now()
WHERE status = 'ACTIVE'
  AND matched_at < now() - INTERVAL '14 days'
  AND deleted_at IS NULL;
```

При переводе в `NO_RESPONSE` → SSE `card_moved` эмитируется всем подписчикам.

---

## 9. Фильтр по циклу (client-side vs server-side)

**Текущий подход (клиент):**
- Загрузить все матчи → фильтровать по `loopId` в памяти

**Рекомендуемый подход (сервер):**
```
GET /api/v1/board?loopId=loop_fe_eu
```

При > 200 матчей клиентская фильтрация начинает тормозить → переключиться на серверный фильтр.

---

## 10. Интеграция с Applications (Strangler Fig)

При переводе матча в статус `INTERVIEW` сервер **автоматически** создаёт заявку:

```sql
-- Trigger or application-layer logic
INSERT INTO applications (user_id, loop_id, role_title, company_name, vacancy_url, process_status)
SELECT user_id, loop_id, title, company, url, 'INTERVIEW_1'
FROM loop_matches
WHERE id = $1 AND status = 'INTERVIEW'
ON CONFLICT DO NOTHING;
```

Это позволяет доске и странице заявок работать на одних данных.

---

## 11. Миграция Firebase → REST

| Текущий код | Целевой эндпоинт |
|-------------|-----------------|
| Firestore query `loopMatches` по `userId` | `GET /api/v1/board` |
| Firestore `update(matchId, {status})` | `PATCH /api/v1/loop-matches/:id/status` |
| Firestore `delete(matchId)` | `DELETE /api/v1/loop-matches/:id` |
| Client-side reorder (local state only) | `PATCH /api/v1/board/reorder` |

---

## 12. Оценка трудозатрат

| Задача | Оценка |
|--------|--------|
| GET /board (с группировкой) | 1 день |
| PATCH /status (drag-drop) | 1.5 дня |
| PATCH /reorder (fractional ranking) | 1 день |
| DELETE + soft delete | 0.5 дня |
| GET /summary | 0.5 дня |
| SSE stream (board events) | 1 день |
| Ghosting cron | 0.5 дня |
| Application auto-create on INTERVIEW | 1 день |
| **Итого** | **~7 рабочих дней** |
