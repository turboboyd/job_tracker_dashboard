# Бэкенд: Страница «Мои заявки» (`/dashboard/applications`)

> **Автор:** Senior Fullstack/Backend Engineer  
> **Статус:** Firebase → REST API migration spec  
> **Приоритет:** 🔴 Критический (основной рабочий экран)

---

## Обзор

Страница «Мои заявки» — ядро продукта. Здесь пользователь:
- Видит все свои отклики на вакансии
- Меняет статус заявок
- Фильтрует по статусу, компании, поисковому запросу
- Создаёт новые заявки
- Видит матч-скор каждой заявки

**Текущая реализация:** прямые Firestore-запросы с клиента (небезопасно, нет валидации, нет агрегаций).

**Цель:** полноценный REST API с серверной бизнес-логикой, агрегациями, безопасностью.

---

## 1. Эндпоинты

### 1.1 Получить список заявок

```
GET /api/v1/applications
```

**Назначение:** загрузить все заявки пользователя с поддержкой фильтрации, сортировки, пагинации и агрегации счётчиков по статусам.

**Query parameters:**

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `status` | `enum` | — | Фильтр по статусу: `SAVED`, `APPLIED`, `INTERVIEW_1`, `OFFER`, `REJECTED`, `NO_RESPONSE` |
| `q` | `string` | — | Полнотекстовый поиск по company, role, location |
| `company` | `string[]` | — | Фильтр по компаниям (может быть несколько: `?company=Google&company=Meta`) |
| `sortBy` | `enum` | `createdAt_desc` | `createdAt_desc`, `createdAt_asc`, `company_asc`, `score_desc` |
| `limit` | `int` | `50` | Кол-во записей (max 200) |
| `cursor` | `string` | — | Cursor для пагинации (ID последней записи) |
| `view` | `enum` | `pipeline` | `pipeline` / `today` / `followups` |

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": "app_abc123",
      "job": {
        "roleTitle": "Senior Frontend Engineer",
        "companyName": "GitHub",
        "locationText": "Berlin · Remote",
        "vacancyUrl": "https://jobs.github.com/...",
        "workMode": "REMOTE",
        "source": "linkedin"
      },
      "process": {
        "status": "APPLIED",
        "stage": 2,
        "subStatus": null,
        "appliedAt": "2026-05-01T10:00:00Z",
        "followUpAt": null
      },
      "matching": {
        "score": 92,
        "decision": "apply",
        "matchedSkills": ["React", "TypeScript"],
        "gaps": [],
        "confidence": 0.87,
        "computedAt": "2026-05-01T10:05:00Z"
      },
      "loopLinkage": {
        "loopId": "loop_eu_frontend",
        "loopName": "Frontend EU"
      },
      "notes": {
        "text": "Отличная команда, уточнить стек",
        "tags": ["priority", "remote"]
      },
      "createdAt": "2026-05-01T09:58:00Z",
      "updatedAt": "2026-05-03T14:20:00Z"
    }
  ],
  "meta": {
    "total": 24,
    "filtered": 24,
    "cursor": "app_xyz789",
    "hasMore": false
  },
  "statusCounts": {
    "ALL": 24,
    "SAVED": 1,
    "APPLIED": 1,
    "INTERVIEW_1": 5,
    "OFFER": 3,
    "REJECTED": 1,
    "NO_RESPONSE": 13
  }
}
```

> ⚠️ **Ключевое требование:** `statusCounts` должны возвращаться **всегда** в одном запросе, независимо от фильтра `status`. Это агрегация по всем заявкам пользователя, нужна для отображения счётчиков на табах. Сейчас на клиенте грузятся все 500 заявок и считаются в JS — это неэффективно.

**Серверная реализация агрегации (PostgreSQL):**

```sql
-- Один запрос: данные + счётчики
WITH counts AS (
  SELECT
    status,
    COUNT(*) as cnt
  FROM applications
  WHERE user_id = $1 AND deleted_at IS NULL
  GROUP BY status
)
SELECT
  -- основные данные (с пагинацией)
  a.*,
  -- агрегация
  json_object_agg(c.status, c.cnt) as status_counts
FROM applications a
CROSS JOIN counts c
WHERE a.user_id = $1
  AND ($2::text IS NULL OR a.status = $2)
  AND ($3::text IS NULL OR (
    a.role_title ILIKE '%' || $3 || '%'
    OR a.company_name ILIKE '%' || $3 || '%'
  ))
ORDER BY a.created_at DESC
LIMIT $4
```

---

### 1.2 Создать заявку

```
POST /api/v1/applications
```

**Request body:**

```json
{
  "companyName": "GitHub",
  "roleTitle": "Senior Frontend Engineer",
  "vacancyUrl": "https://jobs.github.com/123",
  "source": "linkedin",
  "rawDescription": "We are looking for a senior frontend...",
  "loopId": "loop_eu_frontend"
}
```

**Валидация на сервере:**
- `companyName` — required, max 200 chars
- `roleTitle` — required, max 200 chars
- `vacancyUrl` — optional, valid URL, max 2000 chars
- `source` — optional, enum: `linkedin`, `indeed`, `xing`, `stepstone`, `company_site`, `referral`, `other`
- `rawDescription` — optional, max 50000 chars (для AI matching)
- `loopId` — optional, FK → loops table, проверить что принадлежит пользователю

**Серверная логика при создании:**

```
1. Создать запись applications со статусом SAVED
2. Создать запись history: { type: CREATED, userId, appId, timestamp }
3. Если rawDescription передан → поставить задачу в очередь: job_matching_queue
   - Воркер: сравнить rawDescription с резюме пользователя → обновить matching.score
4. Если loopId передан → проверить что loop существует и принадлежит пользователю
5. Вернуть созданную заявку с matching: null (score придёт асинхронно)
```

**Response `201 Created`:**

```json
{
  "id": "app_new123",
  "job": { ... },
  "process": { "status": "SAVED", "stage": 1 },
  "matching": null,
  "createdAt": "2026-05-09T10:00:00Z"
}
```

---

### 1.3 Изменить статус заявки

```
PATCH /api/v1/applications/:id/status
```

**Request body:**

```json
{
  "status": "APPLIED",
  "comment": "Отправил резюме через LinkedIn"
}
```

**Допустимые переходы статусов (State Machine):**

```
SAVED → APPLIED → INTERVIEW_1 → INTERVIEW_2 → TEST_TASK → OFFER → HIRED
                                                                  ↘ REJECTED
ЛЮБОЙ → NO_RESPONSE  (автоматически после 30 дней без ответа)
ЛЮБОЙ → REJECTED
```

**Серверная логика:**

```
1. Загрузить заявку, проверить что принадлежит пользователю
2. Валидировать переход статуса (state machine)
3. Обновить process.status, process.stage
4. Если status = APPLIED → записать process.appliedAt = now()
5. Если status = OFFER → записать process.offeredAt = now()
6. Создать запись history: { type: STATUS_CHANGE, from: oldStatus, to: newStatus, comment }
7. Если status = APPLIED и followUpAt не задан → установить followUpAt = now() + 14 days
8. Вернуть обновлённую заявку
```

**Response `200 OK`:**

```json
{
  "id": "app_abc123",
  "process": {
    "status": "APPLIED",
    "stage": 2,
    "appliedAt": "2026-05-09T10:00:00Z",
    "followUpAt": "2026-05-23T10:00:00Z"
  },
  "updatedAt": "2026-05-09T10:00:00Z"
}
```

---

### 1.4 Обновить поля заявки (inline editing)

```
PATCH /api/v1/applications/:id
```

**Request body (patch — только изменяемые поля):**

```json
{
  "job.roleTitle": "Senior Frontend Engineer (React)",
  "job.locationText": "Berlin",
  "notes.text": "Уточнить стек на интервью",
  "notes.tags": ["priority", "german-required"]
}
```

**Серверная логика:**
- Принимать только whitelist полей (защита от mass assignment)
- Для каждого изменённого поля создавать `history` запись типа `FIELD_CHANGE`
- Обновлять `updatedAt`

**Whitelist редактируемых полей:**

```
job.roleTitle, job.companyName, job.locationText, job.vacancyUrl,
job.source, job.workMode, job.salary.min, job.salary.max, job.salary.currency,
notes.text, notes.tags
```

---

### 1.5 Удалить заявку

```
DELETE /api/v1/applications/:id
```

- Soft delete: выставить `deleted_at = now()`, не удалять физически
- Создать history запись: `{ type: DELETED }`
- Response: `204 No Content`

---

### 1.6 «Сегодня» — приоритетные заявки

```
GET /api/v1/applications?view=today
```

**Логика выборки (серверная):**

Показать заявки, требующие внимания сегодня:
1. Статус `INTERVIEW_1` / `INTERVIEW_2` / `TEST_TASK` — ближайшие события в `process.nextEventAt`
2. Статус `APPLIED` и `followUpAt <= today`
3. Статус `OFFER` и решение нужно принять до `process.decisionDeadline`
4. Сортировать по `priority_score DESC` (поле вычисляется на сервере)

**Алгоритм `priority_score`:**

```python
def compute_priority(app):
    score = 0
    
    # Близость события
    if app.next_event_at:
        days_until = (app.next_event_at - now()).days
        if days_until <= 1: score += 50
        elif days_until <= 3: score += 30
        elif days_until <= 7: score += 10
    
    # Follow-up просрочен
    if app.follow_up_at and app.follow_up_at < now():
        score += 40
    
    # Высокий матч
    if app.matching_score >= 85:
        score += 20
    elif app.matching_score >= 70:
        score += 10
    
    # Оффер — всегда высокий приоритет
    if app.status == 'OFFER':
        score += 60
    
    return score
```

---

### 1.7 «Follow-ups» — требуют напоминания

```
GET /api/v1/applications?view=followups
```

**Логика:**

```sql
SELECT * FROM applications
WHERE user_id = $1
  AND deleted_at IS NULL
  AND follow_up_at IS NOT NULL
  AND follow_up_at <= NOW() + INTERVAL '7 days'
  AND status IN ('APPLIED', 'INTERVIEW_1', 'INTERVIEW_2')
ORDER BY follow_up_at ASC
```

---

## 2. Автоматизация: Ghosting Detection

**Текущая реализация:** `autoMarkGhosting()` вызывается **на клиенте** при каждой загрузке страницы. Это неприемлемо — клиент не должен изменять данные при чтении.

**Правильная реализация: серверный cron-job**

```
Cron: каждый день в 03:00 UTC
Job: ghosting_detector

Логика:
  FOR EACH application WHERE:
    - status = 'APPLIED'
    - applied_at < NOW() - INTERVAL '30 days'
    - status != 'NO_RESPONSE'
    - deleted_at IS NULL
  DO:
    UPDATE status = 'NO_RESPONSE'
    INSERT history { type: AUTO_GHOSTING, reason: '30 days without response' }
    
  // Уведомить пользователя (если включены push-уведомления)
  EMIT notification { type: GHOSTING_DETECTED, count: N }
```

---

## 3. AI Matching — архитектура

**Текущая реализация:** поле `matching.score` существует в Firestore, но чем и как вычисляется — неизвестно (вероятно Cloud Function или вручную).

**Правильная архитектура:**

```
Триггер: POST /api/v1/applications (создание заявки с rawDescription)
    ↓
Job Queue (BullMQ): matching_job { appId, userId, rawDescription }
    ↓
Worker: matching_worker
    1. Загрузить профиль пользователя (CV, skills, preferences)
    2. Извлечь требования из rawDescription (LLM или NLP)
    3. Вычислить score (cosine similarity векторов + rule-based поверх)
    4. Вычислить gaps (что есть в требованиях, чего нет в профиле)
    5. decision = score >= threshold ? 'apply' : 'skip'
    6. UPDATE applications SET matching = { score, gaps, decision, computedAt }
    7. WebSocket / SSE → push клиенту: { type: 'MATCHING_READY', appId, score }
```

**Score расчёт (упрощённая модель):**

```
score = (
  skills_match_pct * 0.40 +     // % совпадений навыков
  seniority_match   * 0.25 +    // совпадение уровня
  location_match    * 0.20 +    // remote/hybrid/onsite preference
  salary_match      * 0.15      // зарплатные ожидания vs вилка
) * 100

decision = 'apply'  if score >= 65
           'review' if score >= 45
           'skip'   if score < 45
```

---

## 4. Схема базы данных

### Таблица `applications`

```sql
CREATE TABLE applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  loop_id         UUID REFERENCES loops(id) ON DELETE SET NULL,

  -- Job info
  role_title      TEXT NOT NULL,
  company_name    TEXT NOT NULL,
  location_text   TEXT,
  vacancy_url     TEXT,
  work_mode       TEXT CHECK (work_mode IN ('REMOTE', 'HYBRID', 'ONSITE', 'ANY')),
  source          TEXT,
  raw_description TEXT,

  -- Process
  status          TEXT NOT NULL DEFAULT 'SAVED'
                    CHECK (status IN ('SAVED','APPLIED','INTERVIEW_1','INTERVIEW_2',
                                      'TEST_TASK','OFFER','HIRED','REJECTED','NO_RESPONSE')),
  stage           INT NOT NULL DEFAULT 1,
  sub_status      TEXT,
  applied_at      TIMESTAMPTZ,
  follow_up_at    TIMESTAMPTZ,
  next_event_at   TIMESTAMPTZ,
  decision_deadline TIMESTAMPTZ,
  offered_at      TIMESTAMPTZ,
  hired_at        TIMESTAMPTZ,

  -- Salary
  salary_min      INT,
  salary_max      INT,
  salary_currency TEXT DEFAULT 'EUR',

  -- Notes
  note_text       TEXT,
  tags            TEXT[] DEFAULT '{}',

  -- Matching (вычисляется асинхронно)
  match_score     INT CHECK (match_score BETWEEN 0 AND 100),
  match_decision  TEXT CHECK (match_decision IN ('apply', 'review', 'skip')),
  match_gaps      JSONB DEFAULT '[]',
  match_skills    JSONB DEFAULT '[]',
  match_confidence FLOAT,
  match_computed_at TIMESTAMPTZ,

  -- Priority (вычисляется cron'ом)
  priority_score  INT DEFAULT 0,

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ  -- soft delete
);

-- Индексы
CREATE INDEX idx_applications_user_id       ON applications(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_applications_user_status   ON applications(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_applications_follow_up     ON applications(user_id, follow_up_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_applications_created_at    ON applications(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_applications_match_score   ON applications(user_id, match_score DESC) WHERE deleted_at IS NULL;

-- Полнотекстовый поиск
CREATE INDEX idx_applications_fts ON applications
  USING GIN(to_tsvector('english', role_title || ' ' || company_name || ' ' || COALESCE(location_text, '')));
```

### Таблица `application_history`

```sql
CREATE TABLE application_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id      UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  type        TEXT NOT NULL CHECK (type IN (
                'CREATED', 'STATUS_CHANGE', 'FIELD_CHANGE',
                'COMMENT', 'AUTO_GHOSTING', 'DELETED',
                'MATCHING_COMPUTED'
              )),
  payload     JSONB NOT NULL DEFAULT '{}',
  -- Примеры payload:
  -- STATUS_CHANGE: { "from": "SAVED", "to": "APPLIED", "comment": "..." }
  -- FIELD_CHANGE:  { "field": "job.roleTitle", "from": "...", "to": "..." }
  -- COMMENT:       { "text": "Перезвонили через 3 дня" }
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_history_app_id ON application_history(app_id, created_at DESC);
```

---

## 5. Авторизация и безопасность

```
Все эндпоинты требуют:
  Authorization: Bearer <jwt>

Middleware проверяет:
  1. JWT подпись (RS256)
  2. Срок действия токена
  3. user_id извлекается из токена, НЕ из query/body
  4. Каждый запрос к applications проверяет: applications.user_id = jwt.sub
  
Rate limiting:
  POST /applications: 60 req/hour per user
  GET  /applications: 300 req/hour per user
  PATCH /applications/:id/status: 120 req/hour per user
```

---

## 6. Fulltext Search

**Текущая реализация:** клиентская фильтрация по строке в JS (медленно, не scalable).

**Серверная реализация:**

```sql
-- PostgreSQL fulltext search
SELECT * FROM applications
WHERE user_id = $1
  AND deleted_at IS NULL
  AND to_tsvector('english', role_title || ' ' || company_name || ' ' || COALESCE(location_text, ''))
      @@ plainto_tsquery('english', $2)
ORDER BY ts_rank(...) DESC, created_at DESC
```

**Для production:** рассмотреть **Meilisearch** или **Typesense** — они дают:
- Опечатки (typo tolerance)
- Подсветку совпадений
- Фасетную фильтрацию по company/status
- <10ms latency

---

## 7. Realtime обновления

**Проблема:** сейчас после изменения статуса (`onChangeStatus`) клиент делает `load()` — отдельный Firestore-запрос. Это лишний round-trip.

**Решение — Server-Sent Events (SSE):**

```
GET /api/v1/applications/stream
Authorization: Bearer <jwt>

← event: application_updated
   data: { "id": "app_123", "process": { "status": "INTERVIEW_1" }, "updatedAt": "..." }

← event: matching_ready
   data: { "id": "app_123", "matching": { "score": 88 } }

← event: ghosting_detected
   data: { "count": 3, "appIds": ["...", "..."] }
```

Клиент обновляет только изменившиеся записи в локальном state — без полного перезагрузки списка.

---

## 8. Миграция с Firebase → REST API

### Текущие TODO(backend-migration) в коде

| Файл | Строка | Что нужно заменить |
|---|---|---|
| `applicationsRepo.ts` | `ensureUserDoc` | `POST /api/v1/users/me/init` |
| `applicationsRepo.ts` | `queryAllActiveApplications` | `GET /api/v1/applications` |
| `applicationsRepo.ts` | `queryPipelineByStatus` | `GET /api/v1/applications?status=X` |
| `applicationsRepo.ts` | `queryTodayTopPriority` | `GET /api/v1/applications?view=today` |
| `applicationsRepo.ts` | `queryFollowUpsDue` | `GET /api/v1/applications?view=followups` |
| `applicationsRepo.ts` | `createApplication` | `POST /api/v1/applications` |
| `applicationsRepo.ts` | `changeStatus` | `PATCH /api/v1/applications/:id/status` |
| `applicationsRepo.ts` | `autoMarkGhosting` | ❌ Убрать с клиента → серверный cron |
| `ApplicationDetailsPage` | `updateApplicationWithHistory` | `PATCH /api/v1/applications/:id` |

### Стратегия миграции (рекомендуется Strangler Fig pattern)

```
Этап 1: Поднять API-сервер, проксировать через него Firebase-запросы
Этап 2: Перенести по одному эндпоинту (начать с GET /applications)
Этап 3: Переключить клиент на новый API (заменить applicationsRepo.ts)
Этап 4: Отключить прямой доступ клиента к Firestore (Firestore Rules)
Этап 5: Мигрировать данные из Firestore → PostgreSQL
```

---

## 9. Оценка трудозатрат

| Задача | Сложность | Оценка |
|---|---|---|
| GET /applications с агрегацией statusCounts | Medium | 3 дня |
| POST /applications + history | Medium | 2 дня |
| PATCH /applications/:id/status + state machine | Medium | 2 дня |
| PATCH /applications/:id (inline editing) | Low | 1 день |
| AI Matching worker + queue | High | 5–7 дней |
| Ghosting detector cron | Low | 1 день |
| Fulltext search (PostgreSQL) | Medium | 2 дня |
| SSE realtime stream | Medium | 3 дня |
| **Итого** | | **~3 недели** |

---

*Документ будет обновляться по мере появления новых требований.*
