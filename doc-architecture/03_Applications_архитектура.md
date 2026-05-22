# Архитектура: Страница «Мои заявки» (Applications)

> **Маршруты:** `/dashboard/applications`, `/dashboard/applications/:applicationId`
> **Этап в пользовательском пути:** 3 из 3 — финальный этап. Пользователь работает с воронкой заявок: подача → интервью → оффер.
> **Статус:** ядро функциональности есть, требуется доведение до прод-готовности по дизайну Loopboard Redesign, server-side агрегации, унификация контракта.
> **Связанные документы:** [doc-backend/Мои заявки_backend.md](../doc-backend/Мои%20заявки_backend.md), [doc-backend/Детали заявки_backend.md](../doc-backend/Детали%20заявки_backend.md).

---

## 0. Контекст и место в продукте

**Что такое Application (заявка):**

Application — это **отклик пользователя на вакансию**, который проходит через воронку: `SAVED → APPLIED → INTERVIEW → OFFER → HIRED` (или `REJECTED` / `NO_RESPONSE` / `WITHDREW`).

В отличие от Match (этап 2), Application:
- **Создаётся пользователем явно** (либо из Match через convert, либо вручную через форму, либо импортом по URL).
- **Хранит full state**: статус, история изменений, заметки, напоминания, документы (CV, cover letter), даты ключевых событий.
- **Привязан к Loop** через `loopId` (опционально) для группировки и аналитики.

**Связь с другими экранами:**

| Откуда / Куда | Поток |
|---|---|
| Match → Application | `POST /loops/:id/matches/:mid/convert` → создаёт application с источником = vacancy_match |
| Manual create | `POST /applications` с формой (company, role, location, ...) |
| URL import | `POST /applications/import-preview` (парсит URL → preview → user подтверждает) |
| Application → Board | `/dashboard/board` показывает те же applications в Kanban |
| Application → Calendar | `process.followUpAt`, `process.interviewAt` появляются в календаре |
| Application → Analytics | агрегации по статусам / источникам / loop'ам |

---

## 1. Текущее состояние

### 1.1 Frontend

| Файл | Назначение |
|---|---|
| [src/pages/ApplicationsPage/ApplicationsPage.tsx](../src/pages/ApplicationsPage/ApplicationsPage.tsx) | Главный экран: header + toolbar + список/доска |
| [src/pages/ApplicationsPage/ui/ApplicationsListCard.tsx](../src/pages/ApplicationsPage/ui/ApplicationsListCard.tsx) | Карточка списка заявок |
| [src/pages/ApplicationsPage/ui/ApplicationsToolbar.tsx](../src/pages/ApplicationsPage/ui/ApplicationsToolbar.tsx) | Тулбар: поиск, сортировка, фильтры |
| [src/pages/ApplicationsPage/ui/PipelineStatusTabs.tsx](../src/pages/ApplicationsPage/ui/PipelineStatusTabs.tsx) | Табы статусов (All / Active / Interview / Offer / Rejected) |
| [src/pages/ApplicationsPage/ui/CreateApplicationDialog.tsx](../src/pages/ApplicationsPage/ui/CreateApplicationDialog.tsx) | Модалка создания (manual / import) |
| [src/pages/ApplicationsPage/model/useApplicationsPage.ts](../src/pages/ApplicationsPage/model/useApplicationsPage.ts) | Главный контроллер страницы |
| [src/pages/ApplicationDetailsPage/](../src/pages/ApplicationDetailsPage/) | Страница деталей: header, hero, summary, sections, history, plan, outcomes |
| [src/features/applications/](../src/features/applications/) | REST: list/get/create/update/delete + history |
| [src/entities/application/](../src/entities/application/) | Типы, статусы (`ProcessStatus`, `ProcessStage`), board-колонки |

### 1.2 Backend (REST)

Существующий контракт описан в [doc-backend/Мои заявки_backend.md](../doc-backend/Мои%20заявки_backend.md). Здесь — текущая реализация:

| Метод | Эндпоинт | Назначение |
|---|---|---|
| `GET` | `/applications?archived=&status=&limit=&offset=&sort=&loopId=&q=&isFavorite=` | Список заявок |
| `POST` | `/applications` | Создать |
| `GET` | `/applications/{id}` | Получить детали |
| `PATCH` | `/applications/{id}` | Обновить (частично) |
| `DELETE` | `/applications/{id}` | Архивировать (soft delete) |
| `POST` | `/applications/{id}/history` | Добавить запись истории (комментарий, smene status) |
| `GET` | `/applications/{id}/history?limit=&offset=` | Список истории |
| `POST` | `/applications/import-preview` | Превью по URL |
| `GET` | `/applications/{id}/documents/{docId}` | Скачать документ (CV, cover letter) |

### 1.3 Модель статусов

[Statuses](../src/entities/application/model/primitive.types.ts):

```ts
type ProcessStatus =
  | "SAVED"        // ещё не подавал
  | "PLANNED"      // запланировал на конкретную дату
  | "APPLIED"      // отправил отклик
  | "VIEWED"       // компания просмотрела
  | "INTERVIEW_1"  // первое интервью
  | "INTERVIEW_2"  // второе интервью
  | "TEST_TASK"    // тестовое задание
  | "OFFER"        // получил оффер
  | "REJECTED"     // компания отказала
  | "NO_RESPONSE"  // нет ответа > 14 дней
  | "WITHDREW";    // сам отозвал
```

`ProcessStage` — крупная группировка для Kanban: `ACTIVE`, `INTERVIEW`, `OFFER`, `HIRED`, `REJECTED`, `NO_RESPONSE`, `ARCHIVED`.

### 1.4 Что ещё **не** реализовано (gaps)

1. **Server-side `statusCounts`** — сейчас на клиенте делается `GET /applications?limit=500`, потом `useMemo` считает счётчики. Нужно вернуть один запрос с агрегацией.
2. **Bulk-actions** — выбрать N заявок, поменять статус всем сразу.
3. **Auto-detect `NO_RESPONSE`** — заявка в `APPLIED` > 14 дней без обновления → cron меняет на `NO_RESPONSE` с notification.
4. **CV-matching per application** — какое из загруженных CV использовать (с матч-score).
5. **Smart reminders** — после интервью cron создаёт reminder «спросить фидбек через 5 дней».
6. **Email parsing** — opt-in интеграция: пользователь подключает gmail, мы парсим письма от компаний и автоматически обновляем статусы.

---

## 2. Целевая архитектура

### 2.1 Структура страницы (по Loopboard Redesign)

#### `/dashboard/applications`

```
┌────────────────────────────────────────────────────────────────────┐
│  Loopboard / Мои заявки                                            │
│  Мои заявки                  [📥 Импорт URL]  [+ Новая заявка]     │
│  24 активных · 3 интервью · 1 оффер                                │
├────────────────────────────────────────────────────────────────────┤
│  [Список 📋] [Доска 🗂]                                            │
├────────────────────────────────────────────────────────────────────┤
│  [Все 24] [Активные 18] [Интервью 3] [Оффер 1] [Отказы 2]          │
├────────────────────────────────────────────────────────────────────┤
│  🔎 Поиск...    Loop:[Все ▼]  Компания:[Все ▼]  Сортировка:[▼]    │
├────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  ⭐ [92] GitHub                                            │   │
│  │      Senior Frontend Engineer · Berlin · Remote            │   │
│  │      [APPLIED]    3 дня назад    Frontend Berlin Remote    │   │
│  │      Followup: завтра 09:00                                │   │
│  └────────────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  [78] Meta                                                 │   │
│  │      React Engineer · London · Hybrid                      │   │
│  │      [INTERVIEW_1]    вчера    Frontend EU                 │   │
│  └────────────────────────────────────────────────────────────┘   │
│  ...                                                               │
│  [Загрузить ещё 20 →]                                              │
└────────────────────────────────────────────────────────────────────┘
```

**Ключевые элементы карточки `ApplicationListItem`:**
- Star (favorite toggle)
- Score-бейдж (если есть)
- Заголовок: `companyName` крупно, `roleTitle` мелким
- Локация + workMode + employmentType
- Status chip (цветной): `APPLIED` / `INTERVIEW_1` / ...
- Время с последнего изменения (`relativeTime(updatedAt)`)
- Имя Loop (если привязан)
- Опциональный action-hint: `Followup: завтра 09:00` (если `process.followUpAt` < now+24h)

#### `/dashboard/applications/:applicationId` — детали заявки

```
┌────────────────────────────────────────────────────────────────────┐
│  ← Назад    GitHub                                       ⭐ 92     │
│             Senior Frontend Engineer · Berlin · Remote             │
├────────────────────────────────────────────────────────────────────┤
│  Status: [APPLIED ▼]    Stage: ACTIVE                              │
│  [Отметить как интервью]  [Получил оффер]  [Отказ]                 │
├────────────────────────────────────────────────────────────────────┤
│  [Обзор] [Совпадение] [История] [План] [Заметки]                   │
├────────────────────────────────────────────────────────────────────┤
│  Вкладка «Обзор»:                                                  │
│  Компания: GitHub                                                  │
│  Роль: Senior Frontend Engineer                                    │
│  Локация: Berlin · Remote                                          │
│  Зарплата: €80k–€110k                                              │
│  Источник: Adzuna · LinkedIn                                       │
│  URL: github.com/jobs/...                                          │
│  Loop: Frontend Berlin Remote                                      │
│                                                                    │
│  Вкладка «История»:                                                │
│  ↪ 22 мая: Создано из совпадения (Adzuna)                          │
│  ↪ 23 мая: Подал отклик                                            │
│  ↪ 25 мая: HR ответил                                              │
│  ↪ 27 мая: Запланировано интервью на 30 мая 14:00                  │
│                                                                    │
│  Вкладка «План»:                                                   │
│  • 30 мая 14:00 — Интервью с HR                                    │
│  • 2 июня — Followup (если нет ответа)                             │
│  [+ Добавить напоминание]                                          │
└────────────────────────────────────────────────────────────────────┘
```

### 2.2 Модель данных

#### `applications` table (PostgreSQL)

```sql
CREATE TABLE applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  loop_id         UUID REFERENCES loops(id) ON DELETE SET NULL,

  -- ВАКАНСИЯ (job)
  company_name    VARCHAR(160) NOT NULL,
  role_title      VARCHAR(240) NOT NULL,
  location_text   VARCHAR(160),
  work_mode       VARCHAR(20)   CHECK (work_mode IN ('REMOTE','HYBRID','ON_SITE')),
  employment_type VARCHAR(20)   CHECK (employment_type IN ('FULL_TIME','PART_TIME','CONTRACT')),
  source          VARCHAR(40),  -- adzuna | linkedin | manual | ...
  source_url      TEXT,
  vacancy_description TEXT,
  vacancy_match_id UUID REFERENCES vacancy_matches(id),  -- откуда пришла

  -- ПРОЦЕСС (process)
  status          VARCHAR(20) DEFAULT 'SAVED' CHECK (status IN (
    'SAVED','PLANNED','APPLIED','VIEWED','INTERVIEW_1','INTERVIEW_2',
    'TEST_TASK','OFFER','REJECTED','NO_RESPONSE','WITHDREW'
  )),
  sub_status      VARCHAR(40),
  stage           VARCHAR(20),  -- denormalised: ACTIVE | INTERVIEW | OFFER | HIRED | REJECTED | NO_RESPONSE | ARCHIVED
  applied_at      TIMESTAMPTZ,
  follow_up_at    TIMESTAMPTZ,
  interview_at    TIMESTAMPTZ,
  last_status_change_at TIMESTAMPTZ DEFAULT now(),
  applied_via     VARCHAR(40),

  -- ЗАМЕТКИ
  notes_text      TEXT,
  notes_tags      TEXT[] DEFAULT '{}',
  is_favorite     BOOLEAN DEFAULT false,

  -- ЗАРПЛАТА
  salary_currency VARCHAR(3),
  salary_min      INTEGER,
  salary_max      INTEGER,

  -- МАТЧИНГ
  match_score     SMALLINT,    -- 0-100, от Match или manual
  matched_skills  TEXT[] DEFAULT '{}',
  gaps            TEXT[] DEFAULT '{}',

  -- ОТКАЗ
  rejection_reason_code VARCHAR(40),
  rejection_note  TEXT,

  -- Audit
  archived        BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_apps_user_status_updated  ON applications (user_id, status, updated_at DESC) WHERE archived = false;
CREATE INDEX idx_apps_user_followup        ON applications (user_id, follow_up_at) WHERE follow_up_at IS NOT NULL;
CREATE INDEX idx_apps_user_loop            ON applications (user_id, loop_id);
CREATE INDEX idx_apps_user_company         ON applications (user_id, company_name);
CREATE INDEX idx_apps_search_trgm          ON applications USING gin (
  (company_name || ' ' || role_title || ' ' || COALESCE(location_text,'')) gin_trgm_ops
);
```

#### `application_history` table

```sql
CREATE TABLE application_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL,

  type            VARCHAR(20) CHECK (type IN ('STATUS_CHANGE','FIELD_CHANGE','COMMENT','SYSTEM')),
  actor           VARCHAR(10) CHECK (actor IN ('user','system')),

  -- Для STATUS_CHANGE
  from_status     VARCHAR(20),
  to_status       VARCHAR(20),

  -- Для FIELD_CHANGE
  field_name      VARCHAR(60),
  old_value       JSONB,
  new_value       JSONB,

  -- Общее
  comment         TEXT,
  metadata        JSONB DEFAULT '{}',

  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_history_app_created ON application_history (application_id, created_at DESC);
```

#### `application_reminders` table

```sql
CREATE TABLE application_reminders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL,
  remind_at       TIMESTAMPTZ NOT NULL,
  text            TEXT,
  done            BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reminders_user_remind ON application_reminders (user_id, remind_at) WHERE done = false;
```

### 2.3 Эндпоинты

> Большая часть контракта уже описана в [doc-backend/Мои заявки_backend.md](../doc-backend/Мои%20заявки_backend.md). Здесь — дельта и уточнения по Loopboard Redesign.

#### `GET /api/v1/applications` — server-side агрегации ⭐

**Должно прийти в одном запросе:**

```json
{
  "items": [ ApplicationReadDto, ... ],
  "total": 24,
  "limit": 20,
  "offset": 0,
  "status_counts": {
    "ALL": 24,
    "SAVED": 1, "PLANNED": 0, "APPLIED": 18, "VIEWED": 2,
    "INTERVIEW_1": 2, "INTERVIEW_2": 1, "TEST_TASK": 0,
    "OFFER": 1, "REJECTED": 1, "NO_RESPONSE": 0, "WITHDREW": 0
  },
  "stage_counts": {
    "ACTIVE": 21, "INTERVIEW": 3, "OFFER": 1, "HIRED": 0,
    "REJECTED": 1, "NO_RESPONSE": 0, "ARCHIVED": 0
  },
  "view_counts": {
    "today": 3,         // applied_at в сегодня
    "this_week": 7,
    "followups_due": 2  // follow_up_at < now + 24h
  }
}
```

> **Важно:** `status_counts` и `stage_counts` — это **глобальные** агрегации по всем нефильтрованным заявкам пользователя, нужны для счётчиков на табах. Они **не зависят** от текущего `?status=` фильтра.

#### `PATCH /api/v1/applications/{id}` — частичное обновление

Дополнительные правила:
- При смене `status` backend автоматически:
  1. Обновляет `last_status_change_at`.
  2. Создаёт запись в `application_history` с `type='STATUS_CHANGE'`.
  3. Обновляет `stage` (derived from status).
  4. Если новый статус — `INTERVIEW_1` или `INTERVIEW_2` и пришло поле `interview_at` — создаёт reminder за 1 час до интервью.
  5. Если новый статус — `APPLIED` и `applied_at` не передано — ставит `applied_at = now()`.

#### `POST /api/v1/applications/bulk-update` ⭐ NEW

**Назначение:** обновить статус N заявок одной транзакцией.

**Request body:**

```json
{
  "application_ids": ["app_1", "app_2", "app_3"],
  "patch": { "status": "NO_RESPONSE" }
}
```

**Response:**

```json
{
  "updated": ["app_1", "app_2", "app_3"],
  "failed": []
}
```

#### `POST /api/v1/applications/import-preview` — импорт по URL

Уже описан в [Мои заявки_backend.md](../doc-backend/Мои%20заявки_backend.md). Уточнение: backend должен парсить URL через тот же adapter, что использует discovery (если URL — известный источник), иначе fallback на HTML-парсинг.

#### `POST /api/v1/applications/auto-detect-no-response` ⭐ Cron

Cron-задача каждый день в 03:00 UTC:

```sql
UPDATE applications
SET status = 'NO_RESPONSE',
    stage = 'NO_RESPONSE',
    last_status_change_at = now()
WHERE status IN ('APPLIED', 'VIEWED')
  AND applied_at < now() - interval '14 days'
  AND last_status_change_at < now() - interval '14 days';
```

И для каждой такой application создать `application_history` запись + push-notification пользователю (если включено).

### 2.4 Match → Application flow (детально)

```
1. User в /dashboard/matches видит превью.
2. User нажимает [Сохранить] на превью-карточке.
   → POST /discovery-preview-saves
   → backend создаёт VacancyMatch со status=saved
3. User в /dashboard/matches?status=saved открывает VacancyMatch.
4. User нажимает [Создать заявку].
   → POST /loops/:loopId/matches/:matchId/convert
   → backend:
     a. Создаёт Application со status=SAVED, source='vacancy_match',
        vacancy_match_id=:matchId, loop_id=:loopId
     b. Копирует поля: company_name, role_title, location_text,
        source_url, vacancy_description, match_score, matched_skills, gaps
     c. Обновляет VacancyMatch.status='converted', application_id=<new>
     d. Создаёт application_history запись 'SYSTEM: created from match'
     e. Возвращает { application_id, match: VacancyMatchDto }
5. Frontend редиректит на /dashboard/applications/:applicationId
```

---

## 3. Frontend: что и в каком порядке делать

### 3.1 Этап 1 — server-side counts (1 день)

1. Расширить [adapter.ts](../src/features/applications/rest/adapter.ts) для `status_counts`, `stage_counts`, `view_counts` в response.
2. В [useApplicationsPage.ts](../src/pages/ApplicationsPage/model/useApplicationsPage.ts) убрать клиентский `useMemo` для счётчиков — взять из `response.status_counts`.
3. Тулбар-табы используют новые counts (не пересчёт по filtered list).

### 3.2 Этап 2 — редизайн списка (2-3 дня)

1. Переписать [ApplicationListItem](../src/pages/ApplicationsPage/ui/ApplicationListItem.tsx) под layout из 2.1:
   - Score-бейдж (если `match_score` есть)
   - Star (favorite toggle, optimistic UI)
   - Status chip с цветом
   - Followup hint (если `follow_up_at` < now+24h)
2. Pipeline tabs: показывать counts из server.
3. Sort/filter dropdown: вынести в shared `ApplicationsToolbar`.

### 3.3 Этап 3 — bulk-actions (1 день)

1. Checkbox на каждой карточке + select-all в toolbar.
2. Sticky-bar при N > 0: `[N выбрано] [Изменить статус ▼] [Архивировать] [Отмена]`.
3. Bulk через `POST /applications/bulk-update`.

### 3.4 Этап 4 — детали заявки (3 дня)

1. Проверить [ApplicationDetailsPage](../src/pages/ApplicationDetailsPage/ApplicationDetailsPage.tsx): 5 вкладок (Обзор / Совпадение / История / План / Заметки).
2. Быстрые actions в header: `[Отметить как интервью] [Получил оффер] [Отказ]` — каждая открывает `OutcomeWizard` с пред-заполненными полями.
3. Вкладка «История» — показывать все события, включая системные.
4. Вкладка «План» — все reminders + ical-export.

### 3.5 Этап 5 — импорт по URL (1 день)

1. Кнопка `[📥 Импорт URL]` в header.
2. Модалка с textarea для URL (можно несколько через newline).
3. Для каждого URL вызвать `POST /applications/import-preview` параллельно.
4. Показать список превью с галочками — пользователь выбирает, что создать.
5. Bulk-create через `POST /applications/bulk-create`.

---

## 4. Backend: что и в каком порядке делать

### 4.1 Этап 1 — server counts в `GET /applications` (1 день)

Один SQL с агрегациями:

```sql
WITH user_apps AS (
  SELECT * FROM applications
  WHERE user_id = $1 AND archived = false
),
status_agg AS (
  SELECT
    jsonb_object_agg(status, cnt) AS status_counts
  FROM (
    SELECT status, COUNT(*) AS cnt
    FROM user_apps
    GROUP BY status
  ) s
),
stage_agg AS (
  SELECT
    jsonb_object_agg(stage, cnt) AS stage_counts
  FROM (
    SELECT stage, COUNT(*) AS cnt
    FROM user_apps
    GROUP BY stage
  ) s
),
view_agg AS (
  SELECT jsonb_build_object(
    'today',         COUNT(*) FILTER (WHERE DATE(applied_at) = CURRENT_DATE),
    'this_week',     COUNT(*) FILTER (WHERE applied_at >= date_trunc('week', now())),
    'followups_due', COUNT(*) FILTER (WHERE follow_up_at < now() + interval '24 hours')
  ) AS view_counts
  FROM user_apps
)
SELECT
  -- paginated items
  (SELECT json_agg(row_to_json(a)) FROM (
    SELECT * FROM user_apps
    WHERE ($2::text IS NULL OR status = $2)
      AND ($3::uuid IS NULL OR loop_id = $3)
    ORDER BY updated_at DESC
    LIMIT $4 OFFSET $5
  ) a) AS items,
  (SELECT COUNT(*) FROM user_apps) AS total,
  status_agg.status_counts,
  stage_agg.stage_counts,
  view_agg.view_counts
FROM status_agg, stage_agg, view_agg;
```

### 4.2 Этап 2 — PATCH + history triggers (1 день)

Backend в `update_application_service`:

```python
async def update_application(user_id, app_id, patch):
    async with db.transaction():
        old = await applications_repo.get(user_id, app_id)
        new = await applications_repo.update(app_id, patch)

        # Status change → history
        if 'status' in patch and patch['status'] != old.status:
            await history_repo.insert(History(
                application_id=app_id,
                type='STATUS_CHANGE',
                actor='user',
                from_status=old.status,
                to_status=patch['status'],
            ))
            # Update derived stage
            new.stage = STATUS_TO_STAGE[patch['status']]
            # Auto-set applied_at on first APPLIED
            if patch['status'] == 'APPLIED' and not old.applied_at:
                new.applied_at = utcnow()
            # Auto-create reminder for interviews
            if patch['status'] in ('INTERVIEW_1', 'INTERVIEW_2') and patch.get('interview_at'):
                await reminders_repo.insert(Reminder(
                    application_id=app_id,
                    remind_at=patch['interview_at'] - timedelta(hours=1),
                    text=f"Интервью через час: {old.company_name}",
                ))
        return new
```

### 4.3 Этап 3 — bulk-update (1 день)

```python
async def bulk_update_applications(user_id, ids, patch):
    updated, failed = [], []
    async with db.transaction():
        for aid in ids:
            try:
                await update_application(user_id, aid, patch)
                updated.append(aid)
            except Exception as e:
                failed.append({'id': aid, 'error': str(e)})
    return {'updated': updated, 'failed': failed}
```

### 4.4 Этап 4 — convert from match (1 день)

```python
async def convert_match_to_application(user_id, loop_id, match_id, payload):
    async with db.transaction():
        match = await matches_repo.get(user_id, loop_id, match_id)
        if not match: raise NotFound()
        if match.status == 'converted': raise Conflict(existing=match.application_id)

        app = Application(
            user_id=user_id,
            loop_id=loop_id,
            company_name=match.company_name,
            role_title=match.role_title,
            location_text=match.location_text,
            source=match.source,
            source_url=match.source_url,
            vacancy_description=match.vacancy_description,
            vacancy_match_id=match.id,
            match_score=match.score,
            matched_skills=match.confidence.get('matched_skills', []),
            gaps=match.confidence.get('gaps', []),
            status=payload.status or 'SAVED',
            notes_text=payload.notes,
            is_favorite=payload.favorite or False,
            applied_at=utcnow() if payload.status == 'APPLIED' else None,
        )
        await applications_repo.insert(app)

        match.status = 'converted'
        match.application_id = app.id
        await matches_repo.update(match)

        await history_repo.insert(History(
            application_id=app.id,
            type='SYSTEM',
            actor='system',
            comment=f'Создано из совпадения ({match.source})',
        ))

        return {'application_id': app.id, 'match': match}
```

### 4.5 Этап 5 — auto-detect NO_RESPONSE cron (1 день)

См. 2.3. Запускать каждый день в 03:00 UTC.

### 4.6 Этап 6 — smart reminders cron (1 день)

После каждого интервью (status `INTERVIEW_1/2/TEST_TASK`) + 5 дней без status change:
- Создать reminder «Запросить фидбек у HR»
- Push-уведомление пользователю

---

## 5. Acceptance criteria

### Список (`/dashboard/applications`)

- [ ] Server возвращает `status_counts` + `stage_counts` + `view_counts` в одном запросе.
- [ ] Табы показывают server counts (не клиентский пересчёт).
- [ ] Карточка показывает score-бейдж, star, status chip с цветом, followup hint.
- [ ] Bulk-select работает: чекбоксы + sticky-bar с действиями.
- [ ] Поиск с дебаунсом 300 мс по company, role, location.
- [ ] Сортировка: newest / oldest / company / score.
- [ ] Фильтры loop и company объединяются по AND.
- [ ] Кнопка `[📥 Импорт URL]` открывает модалку, парсит несколько URL за раз.

### Детали (`/dashboard/applications/:applicationId`)

- [ ] 5 вкладок (Обзор / Совпадение / История / План / Заметки) переключаются без перезагрузки.
- [ ] Quick actions меняют статус и пишут в history.
- [ ] При смене статуса на `INTERVIEW_*` с `interview_at` — автоматически создаётся reminder за 1 час.
- [ ] Кнопка `Archive` ставит `archived=true`, возвращает на список.

### Backend

- [ ] `GET /applications` с агрегациями укладывается в 200 мс для пользователя с 500 заявок.
- [ ] `PATCH /applications/:id` обновляет `last_status_change_at` и пишет в `application_history`.
- [ ] `POST /applications/bulk-update` транзакционно (rollback при ошибке).
- [ ] `POST /loops/:lid/matches/:mid/convert` идемпотентен (повторный вызов возвращает existing `application_id`).
- [ ] Cron `auto-detect-no-response` работает каждую ночь.
- [ ] Cron `smart-reminders` создаёт reminder через 5 дней после интервью.

---

## 6. Связь с другими этапами

**Из Loops (этап 1):** `?loopId=...` фильтрует список и пред-заполняет форму создания.

**Из Matches (этап 2):** `convert` создаёт Application и помечает Match как `converted`. Application наследует `match_score`, `matched_skills`, `gaps`.

**В Board (`/dashboard/board`):** те же applications показываются в Kanban с drag-and-drop.

**В Calendar (`/dashboard/calendar`):** `follow_up_at`, `interview_at`, `reminders` — события на календаре.

**В Analytics (`/dashboard/analytics`):** агрегации по статусам, источникам, loop'ам — для воронки, конверсий, top loops.

**В Activity (`/dashboard/activity`):** каждое создание / смена статуса / комментарий — event в `activity_feed`.

---

## 7. Минимальный план релиза (срез по приоритетам)

**P0 (release-blocker):**
1. Server-side `status_counts` в `GET /applications`.
2. Server-side `PATCH` с history-триггером.
3. Convert from match с правильной транзакцией.

**P1 (важно для UX):**
4. Редизайн списка (карточки по Loopboard Redesign).
5. Quick actions в деталях.
6. Bulk-update.

**P2 (nice to have):**
7. URL import.
8. Smart reminders cron.
9. Auto-detect no-response cron.
10. Email parsing (opt-in).
