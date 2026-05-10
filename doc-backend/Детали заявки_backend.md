# Backend — Детали заявки (`/dashboard/applications/:id`)

> Автор: senior fullstack/backend engineer  
> Статус: **черновик** · Firebase → REST migration

---

## Обзор страницы

Страница показывает полную карточку одной заявки. Включает:
- Заголовок с логотипом компании, статусом, зарплатой, количеством дней в воронке
- Вкладки: Обзор · Описание · Хронология · Подготовка · Контакты · Файлы · Заметки
- Воронка этапов (stage ribbon)
- Quick stats (match-скор, дней в воронке, интервью, событий)
- AI-бриф (анализ JD vs. CV)
- Следующее действие
- Inline-редактирование полей
- Хронология событий
- Контакты и файлы (вложения)

---

## 1. Получение заявки

### `GET /api/v1/applications/:appId`

**Auth:** `Authorization: Bearer <jwt>`

#### Response `200`

```json
{
  "id": "MxTKVyojRsMxp1wdcHls",
  "userId": "uid_123",
  "job": {
    "roleTitle": "Senior Product Engineer",
    "companyName": "Notion",
    "locationText": "Munich · Hybrid",
    "vacancyUrl": "https://notion.so/careers/...",
    "source": "LinkedIn",
    "workMode": "HYBRID",
    "salary": { "currency": "EUR", "min": 95000, "max": 130000 },
    "description": "We're looking for a product-minded engineer..."
  },
  "process": {
    "status": "INTERVIEW_1",
    "ghostingAt": null
  },
  "matching": {
    "score": 88,
    "decision": "match",
    "matchedSkillsTop": ["React", "TypeScript", "ProseMirror"],
    "gapsTop": ["Y.js", "CRDT"],
    "confidence": 0.91,
    "computedAt": "2026-05-09T10:00:00Z"
  },
  "loopLinkage": {
    "loopId": "loop_fe_eu",
    "loopName": "Frontend EU"
  },
  "notes": {
    "currentNote": "Уточнить стек на следующем звонке",
    "tags": ["React", "TypeScript", "Berlin"]
  },
  "priority": {
    "score": 87,
    "computedAt": "2026-05-09T10:00:00Z"
  },
  "createdAt": "2026-05-02T14:00:00Z",
  "updatedAt": "2026-05-09T10:00:00Z"
}
```

#### Errors

| Status | Случай |
|--------|--------|
| 401 | Нет токена |
| 403 | appId принадлежит другому пользователю |
| 404 | Заявка не найдена |

#### БД-запрос (PostgreSQL)

```sql
SELECT a.*, m.score, m.decision, m.matched_skills_top, m.gaps_top,
       m.confidence, m.computed_at AS matching_computed_at
FROM applications a
LEFT JOIN application_matching m ON m.application_id = a.id
WHERE a.id = $1 AND a.user_id = $2 AND a.deleted_at IS NULL;
```

---

## 2. Хронология событий

### `GET /api/v1/applications/:appId/history`

**Query params:**

| Param | Тип | Default | Описание |
|-------|-----|---------|----------|
| `limit` | int | 50 | Макс. записей |
| `cursor` | string | — | Cursor-пагинация |
| `type` | `STATUS_CHANGE\|COMMENT\|FIELD_CHANGE` | все | Фильтр по типу |

#### Response `200`

```json
{
  "items": [
    {
      "id": "evt_001",
      "applicationId": "MxTKVyojRsMxp1wdcHls",
      "type": "STATUS_CHANGE",
      "actor": "user",
      "fromStatus": "APPLIED",
      "toStatus": "INTERVIEW_1",
      "comment": null,
      "fieldPath": null,
      "createdAt": "2026-05-05T10:30:00Z"
    },
    {
      "id": "evt_002",
      "type": "COMMENT",
      "actor": "user",
      "fromStatus": null,
      "toStatus": null,
      "comment": "Уточнить стек перед следующим звонком",
      "createdAt": "2026-05-04T09:15:00Z"
    }
  ],
  "nextCursor": null,
  "total": 7
}
```

#### PostgreSQL schema — `application_history`

```sql
CREATE TABLE application_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id),
  type          TEXT NOT NULL CHECK (type IN ('STATUS_CHANGE','COMMENT','FIELD_CHANGE','SYSTEM')),
  actor         TEXT NOT NULL DEFAULT 'user',   -- 'user' | 'system' | 'ai'
  from_status   TEXT,
  to_status     TEXT,
  field_path    TEXT,
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_history_app_id   ON application_history(application_id, created_at DESC);
CREATE INDEX idx_history_user_type ON application_history(user_id, type);
```

---

## 3. Добавить комментарий / заметку

### `POST /api/v1/applications/:appId/history`

```json
{
  "type": "COMMENT",
  "comment": "Встреча перенесена на пятницу"
}
```

#### Response `201`

```json
{
  "id": "evt_003",
  "type": "COMMENT",
  "actor": "user",
  "comment": "Встреча перенесена на пятницу",
  "createdAt": "2026-05-09T11:00:00Z"
}
```

**Валидация сервера:**
- `type` ∈ `["COMMENT"]` (пользователь может добавлять только комментарии)
- `comment` — не пустой, max 2000 символов
- `SYSTEM`/`AI` события пишутся только внутренним кодом/worker

---

## 4. Изменить статус

### `PATCH /api/v1/applications/:appId/status`

```json
{ "status": "INTERVIEW_1" }
```

#### Допустимые переходы (state machine)

```
SAVED → APPLIED → INTERVIEW_1 → INTERVIEW_2 → TEST_TASK → OFFER
                                                          ↘ REJECTED
любой → NO_RESPONSE   (ghosting detector или вручную)
любой → REJECTED      (вручную)
```

**Сервер должен:**
1. Проверить допустимость перехода
2. Обновить `applications.process_status`
3. Записать событие в `application_history` (type=STATUS_CHANGE)
4. Обновить `updated_at`
5. Если `status IN (OFFER, REJECTED)` — остановить ghosting-таймер
6. Опционально: эмитировать SSE-событие `status_changed`

#### Response `200`

```json
{
  "id": "MxTKVyojRsMxp1wdcHls",
  "process": { "status": "INTERVIEW_1" },
  "updatedAt": "2026-05-09T11:05:00Z"
}
```

#### Errors

| Status | Случай |
|--------|--------|
| 400 | Недопустимый переход |
| 409 | Оптимистичный конфликт версий (если используется ETag) |

---

## 5. Inline-редактирование полей

### `PATCH /api/v1/applications/:appId`

Частичное обновление — только whitelist полей:

```json
{
  "job": {
    "roleTitle": "Senior Engineer",
    "companyName": "Notion",
    "locationText": "Munich · Hybrid",
    "vacancyUrl": "https://...",
    "source": "LinkedIn",
    "workMode": "HYBRID",
    "salary": { "currency": "EUR", "min": 95000, "max": 130000 },
    "description": "We're looking for..."
  },
  "notes": {
    "currentNote": "Уточнить стек",
    "tags": ["React", "TypeScript"]
  }
}
```

**Сервер должен:**
1. Принять только поля из whitelist (игнорировать `process`, `matching`, `loopLinkage`, `userId`)
2. Записать `FIELD_CHANGE` события в историю для каждого изменённого поля
3. Если изменился `job.description` или `job.vacancyUrl` — поставить задачу в AI matching queue (`bullmq.add('match', { appId })`)
4. Обновить `updated_at`

#### Response `200` — полный обновлённый объект заявки

---

## 6. AI-бриф

### `GET /api/v1/applications/:appId/ai-brief`

Возвращает сгенерированный AI-анализ JD vs. CV.

```json
{
  "applicationId": "MxTKVyojRsMxp1wdcHls",
  "summary": "Команда Notion ищет инженера в редактор — упор на real-time коллаборацию...",
  "weaknesses": "У тебя меньше опыта с Y.js и CRDT.",
  "likelyQuestions": [
    { "category": "System design", "question": "Как бы ты спроектировал real-time коллаборацию?", "estimatedTime": "15 мин" },
    { "category": "Технический",   "question": "Разница между OT и CRDT?", "estimatedTime": "10 мин" }
  ],
  "keywords": {
    "matched": ["React", "TypeScript", "ProseMirror"],
    "gaps": ["Y.js", "CRDT"]
  },
  "generatedAt": "2026-05-09T10:00:00Z"
}
```

### `POST /api/v1/applications/:appId/ai-brief/regenerate`

Форсирует перегенерацию брифа.

**Worker-логика:**
1. Загрузить `job.description` + пользовательский профиль (CV, навыки)
2. Вызвать OpenAI с промптом-анализатором
3. Распарсить JSON-ответ
4. Сохранить в `application_ai_briefs`
5. Обновить `matching.score` / `matching.gapsTop` / `matching.matchedSkillsTop`

```sql
CREATE TABLE application_ai_briefs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  summary        TEXT,
  weaknesses     TEXT,
  likely_questions JSONB,
  keywords_matched TEXT[],
  keywords_gaps    TEXT[],
  model          TEXT,          -- 'gpt-4o', 'claude-3-5-sonnet' etc.
  prompt_tokens  INT,
  generated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_briefs_app ON application_ai_briefs(application_id, generated_at DESC);
```

---

## 7. Следующее действие

### `GET /api/v1/applications/:appId/next-action`

```json
{
  "type": "interview",
  "title": "Финальное интервью · 14:30",
  "scheduledAt": "2026-05-06T14:30:00Z",
  "durationMinutes": 60,
  "meetingUrl": "https://meet.google.com/...",
  "interviewers": [
    { "name": "Ivan Z.", "role": "CTO" },
    { "name": "Anna L.", "role": "Product Lead" }
  ],
  "calendarIcsUrl": "/api/v1/applications/MxTKVyojRsMxp1wdcHls/calendar.ics"
}
```

**Логика:**
- Если статус `APPLIED` и прошло 7+ дней → рекомендовать follow-up
- Если статус `INTERVIEW_1` → ближайшее интервью из `application_events`
- Если статус `TEST_TASK` → дедлайн тестового
- Иначе → общий призыв к действию

---

## 8. Контакты по заявке

### `GET /api/v1/applications/:appId/contacts`

```json
{
  "items": [
    {
      "id": "cnt_001",
      "firstName": "Anna",
      "lastName": "Petrova",
      "role": "HR · первая линия",
      "email": "anna@notion.so",
      "channel": "LinkedIn",
      "touchCount": 5,
      "lastContactedAt": "2026-05-06T09:00:00Z",
      "isFavorite": true
    }
  ]
}
```

### `POST /api/v1/applications/:appId/contacts`

```json
{
  "firstName": "Tom",
  "lastName": "Becker",
  "role": "Tech Lead",
  "email": "tom@notion.so",
  "channel": "Email"
}
```

### `DELETE /api/v1/applications/:appId/contacts/:contactId`

```sql
CREATE TABLE application_contacts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id),
  first_name     TEXT NOT NULL,
  last_name      TEXT,
  role           TEXT,
  email          TEXT,
  phone          TEXT,
  channel        TEXT,     -- 'LinkedIn' | 'Email' | 'Telegram' | ...
  touch_count    INT NOT NULL DEFAULT 0,
  last_contacted_at TIMESTAMPTZ,
  is_favorite    BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 9. Файлы (вложения)

### `GET /api/v1/applications/:appId/files`

```json
{
  "items": [
    {
      "id": "file_001",
      "name": "maria-2026.pdf",
      "type": "CV",
      "sizeBytes": 188416,
      "ext": "pdf",
      "version": "v3",
      "uploadedAt": "2026-05-04T10:00:00Z",
      "downloadUrl": "https://s3.../signed-url?..."
    }
  ]
}
```

### `POST /api/v1/applications/:appId/files`

`Content-Type: multipart/form-data`

| Field | Тип |
|-------|-----|
| `file` | binary |
| `type` | `CV\|Cover\|TestTask\|Portfolio\|Other` |
| `version` | string (optional) |

**Сервер:**
1. Валидация: max 20 MB, allowed MIME types (pdf, doc, docx, txt, zip, png, jpg)
2. Загрузить в S3 по пути `{userId}/{appId}/{fileId}.{ext}`
3. Сохранить метаданные в `application_files`
4. Вернуть подписанный download URL (TTL 15 min)

### `DELETE /api/v1/applications/:appId/files/:fileId`

Удаляет из S3 и DB.

```sql
CREATE TABLE application_files (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id),
  name           TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'Other',
  s3_key         TEXT NOT NULL,
  mime_type      TEXT,
  size_bytes     INT,
  version        TEXT,
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 10. Подготовка к интервью (AI checklist)

### `GET /api/v1/applications/:appId/prep`

```json
{
  "checklist": [
    { "id": "chk_1", "label": "Прочитать описание роли",   "done": true,  "note": "5 мин" },
    { "id": "chk_2", "label": "Освежить CRDT и Y.js",     "done": false, "note": "слабая зона",  "hot": true },
    { "id": "chk_3", "label": "Тест звука и камеры",      "done": false, "note": "за день до" }
  ],
  "progress": { "done": 5, "total": 8 },
  "resources": [
    { "title": "Гайд: CRDT для frontend", "url": "...", "estimatedTime": "15 мин" }
  ],
  "interviewers": [
    { "name": "Ivan Z.", "role": "CTO", "note": "Любит конкретику" }
  ],
  "generatedAt": "2026-05-09T10:00:00Z"
}
```

### `PATCH /api/v1/applications/:appId/prep/checklist/:checkId`

```json
{ "done": true }
```

```sql
CREATE TABLE application_prep (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  checklist      JSONB NOT NULL DEFAULT '[]',
  resources      JSONB NOT NULL DEFAULT '[]',
  interviewers   JSONB NOT NULL DEFAULT '[]',
  generated_at   TIMESTAMPTZ
);
```

---

## 11. SSE — realtime обновления карточки

### `GET /api/v1/applications/:appId/stream`

Клиент подписывается при открытии страницы.

**Эмитируемые события:**

```
event: status_changed
data: {"status":"INTERVIEW_1","updatedAt":"..."}

event: matching_updated
data: {"score":88,"decision":"match","matchedSkillsTop":["React"],"gapsTop":["Y.js"]}

event: history_added
data: {"id":"evt_005","type":"COMMENT","comment":"...","createdAt":"..."}

event: ai_brief_ready
data: {"summary":"...","generatedAt":"..."}
```

---

## 12. PostgreSQL — основная таблица заявки

```sql
CREATE TABLE applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  loop_id         UUID REFERENCES loops(id),

  -- Job
  role_title      TEXT NOT NULL,
  company_name    TEXT NOT NULL,
  location_text   TEXT,
  vacancy_url     TEXT,
  source          TEXT,
  work_mode       TEXT CHECK (work_mode IN ('REMOTE','HYBRID','ON_SITE')),
  salary_currency TEXT,
  salary_min      INT,
  salary_max      INT,
  description     TEXT,
  description_tsv TSVECTOR GENERATED ALWAYS AS (
                    to_tsvector('russian', coalesce(role_title,'') || ' ' ||
                                          coalesce(company_name,'') || ' ' ||
                                          coalesce(description,''))
                  ) STORED,

  -- Process
  process_status  TEXT NOT NULL DEFAULT 'SAVED'
                    CHECK (process_status IN ('SAVED','PLANNED','APPLIED','VIEWED',
                                             'INTERVIEW_1','INTERVIEW_2','TEST_TASK',
                                             'OFFER','REJECTED','NO_RESPONSE')),
  ghosting_at     TIMESTAMPTZ,

  -- Notes
  current_note    TEXT,
  tags            TEXT[] NOT NULL DEFAULT '{}',

  -- Priority (server-computed)
  priority_score  REAL,
  priority_at     TIMESTAMPTZ,

  -- Meta
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ   -- soft delete
);

-- Indexes
CREATE INDEX idx_app_user_status   ON applications(user_id, process_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_app_user_created  ON applications(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_app_company       ON applications(user_id, company_name)   WHERE deleted_at IS NULL;
CREATE INDEX idx_app_fts           ON applications USING GIN(description_tsv);
CREATE INDEX idx_app_tags          ON applications USING GIN(tags);
```

---

## 13. Matching — таблица

```sql
CREATE TABLE application_matching (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
  score           SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  decision        TEXT NOT NULL CHECK (decision IN ('match','maybe','skip')),
  matched_skills_top TEXT[] NOT NULL DEFAULT '{}',
  gaps_top           TEXT[] NOT NULL DEFAULT '{}',
  confidence      REAL,
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  model           TEXT,
  prompt_tokens   INT,
  completion_tokens INT
);
```

---

## 14. Безопасность

- Все эндпоинты требуют `Authorization: Bearer <jwt>` (RS256)
- Сервер **всегда** фильтрует по `user_id` из токена — прямой доступ по `appId` без владения → 403
- Rate limit:
  - `GET` — 200 req/min/user
  - `PATCH` (inline edit) — 60 req/min/user
  - `POST /ai-brief/regenerate` — 10 req/hour/user (дорого по токенам)
  - `POST /files` — 20 req/hour/user

---

## 15. Миграция Firebase → REST

| Текущий вызов Firebase | Целевой REST-эндпоинт |
|------------------------|----------------------|
| `getApplication(db, uid, appId)` | `GET /api/v1/applications/:appId` |
| `getApplicationHistory(db, uid, appId, 50)` | `GET /api/v1/applications/:appId/history` |
| `changeStatus(db, uid, appId, next)` | `PATCH /api/v1/applications/:appId/status` |
| `addComment(db, uid, appId, {text})` | `POST /api/v1/applications/:appId/history` |
| `updateApplicationWithHistory(db, uid, appId, patch, ...)` | `PATCH /api/v1/applications/:appId` |

Код помечен: `// TODO(backend-migration): ...`

---

## 16. Оценка трудозатрат (details page)

| Задача | Оценка |
|--------|--------|
| GET /applications/:appId | 1 день |
| GET + POST /history | 1 день |
| PATCH /status (state machine) | 1 день |
| PATCH (inline edit + history) | 2 дня |
| GET /contacts + POST + DELETE | 1.5 дня |
| GET /files + POST (S3) + DELETE | 2 дня |
| AI-бриф (worker + эндпоинт) | 3 дня |
| Prep checklist (AI + CRUD) | 2 дня |
| Next-action logic | 1 день |
| SSE stream | 1 день |
| **Итого** | **~15 рабочих дней** |
