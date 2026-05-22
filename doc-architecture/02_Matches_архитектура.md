# Архитектура: Страница «Совпадения» (Matches / Discovery)

> **Маршруты:** `/dashboard/matches`, `/dashboard/matches/:matchId`
> **Этап в пользовательском пути:** 2 из 3 — после создания Loop пользователь запускает поиск и видит найденные вакансии до того, как сохранить их в заявки.
> **Статус:** discovery работает с 9 источниками + кеш + пагинация (по 20). Требуется ранжирование, фильтры по новизне, нормализация дубликатов между источниками и интеграция с Loopboard Redesign.

---

## 0. Контекст и место в продукте

**Что такое Match (совпадение):**

Match — это **вакансия, найденная backend-discovery из интернета** по фильтрам Loop. Это **ещё не заявка**: пользователь её не подавал, не сохранял в воронку, не общался с компанией.

**Жизненный цикл Match:**

```
[Discovery preview]    →    [VacancyMatch saved]    →    [Application created]
  (временное)              (сохранено в БД)             (заявка в воронке)

  Source: intercept REST     Source: vacancy_matches    Source: applications
  Status: только в превью    Status: new / saved /      Status: SAVED / APPLIED / ...
                             ignored / converted
```

**Принципиально:**
- **Discovery preview** — это **не сохранённые данные**, а ответ внешнего API в реальном времени. Backend опрашивает 9 источников, кеширует на 6 часов, отдаёт frontend.
- **VacancyMatch** — это **сохранённое совпадение** в нашей БД. Пользователь явно нажал «сохранить» → backend записал в таблицу `vacancy_matches` с привязкой к `loopId`.
- **Application** — это **заявка** (см. [03_Applications_архитектура.md](./03_Applications_архитектура.md)), создаётся ещё одним нажатием из VacancyMatch.

**Не путать с «Мои заявки» (Applications):** «Совпадения» — это вход. «Мои заявки» — это воронка после сохранения.

---

## 1. Текущее состояние

### 1.1 Frontend

| Файл | Назначение |
|---|---|
| [src/pages/MatchesPage/MatchesPage.tsx](../src/pages/MatchesPage/MatchesPage.tsx) | Основная страница с двумя секциями: discovery preview + сохранённые матчи |
| [src/pages/MatchesPage/components/MatchesDiscoveryPreviewPanel.tsx](../src/pages/MatchesPage/components/MatchesDiscoveryPreviewPanel.tsx) | Панель discovery: запуск, фильтры, превью |
| [src/pages/MatchesPage/components/MatchesSavedVacancyMatchesSection.tsx](../src/pages/MatchesPage/components/MatchesSavedVacancyMatchesSection.tsx) | Список сохранённых VacancyMatch с действиями |
| [src/pages/MatchesPage/components/MatchesFilters.tsx](../src/pages/MatchesPage/components/MatchesFilters.tsx) | Фильтры по loopId, статусу, источнику |
| [src/pages/MatchDetailsPage/MatchDetailsPage.tsx](../src/pages/MatchDetailsPage/MatchDetailsPage.tsx) | Страница деталей одного матча |
| [src/features/discoveryRuns/](../src/features/discoveryRuns/) | REST: `runDiscoveryPreviewViaRest`, `getDiscoverySourceRuntimeStatusViaRest` |
| [src/features/vacancyMatches/](../src/features/vacancyMatches/) | REST: list/save/patch/ignore/convert vacancy matches |

### 1.2 Backend (REST) — уже реализовано

| Метод | Эндпоинт | Назначение |
|---|---|---|
| `POST` | `/discovery-runs` | Запустить discovery (dry_run=true → превью; dry_run=false → авто-сохранение) |
| `GET` | `/discovery-sources/runtime-status` | Список 9 источников с их статусом готовности |
| `GET` | `/loops/{loopId}/matches?status=&limit=&offset=` | Список сохранённых VacancyMatch для Loop |
| `POST` | `/loops/{loopId}/matches` | Сохранить VacancyMatch вручную (например, по ссылке) |
| `PATCH` | `/loops/{loopId}/matches/{matchId}` | Изменить status: `new` → `saved` / `ignored` |
| `POST` | `/loops/{loopId}/matches/{matchId}/convert` | Превратить VacancyMatch в Application |
| `POST` | `/discovery-preview-saves` | Сохранить превью-вакансию как VacancyMatch (без полной формы) |
| `POST` | `/discovery-preview-ignores` | Скрыть превью-вакансию (не показывать снова) |
| `DELETE` | `/discovery-preview-ignores/{externalId}` | Вернуть скрытое превью |

### 1.3 Discovery: 9 runnable-источников

[Реестр источников](../src/pages/MatchesPage/components/matchesDiscoveryPreview.helpers.ts):

| Источник | Тип | Конфигурация |
|---|---|---|
| `arbeitsagentur` | Открытый API | Без ключа |
| `arbeitnow` | Открытый API | Без ключа |
| `remotive` | Открытый API | Без ключа |
| `remotejobs` | Открытый API | Без ключа |
| `himalayas` | Открытый API | Без ключа |
| `remoteok` | Открытый API | Без ключа |
| `adzuna` | API-ключ | `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` |
| `greenhouse` | Список boards | `GREENHOUSE_BOARD_TOKENS` |
| `lever` | Список sites | `LEVER_SITE_NAMES` |

### 1.4 Что ещё **не** реализовано (gaps)

1. **Нет ранжирования (score)** — все матчи выводятся в порядке прихода с источника. Нужен match-score 0-100 на основе фильтров Loop, ключевых слов, новизны.
2. **Нет дедупликации между источниками** — одна и та же вакансия (компания + роль + город) может прийти 3 раза с LinkedIn, Indeed, Stepstone. Сейчас дедуп только по `externalId+sourceId`.
3. **Нет фильтра «только новые с прошлого визита»** — пользователь не знает, что прибавилось со вчера.
4. **Нет дайджеста / email-уведомлений** при появлении новых интересных матчей.
5. **Нет «sentiment» по компании** — пользователь может уже сохранять заявки из этой компании и видит, что 3 раза получал отказ → стоит пометить.
6. **Кнопка «Save» одиночная, а нужно bulk-actions** — пользователь должен иметь возможность сохранить 10 матчей одним нажатием.

---

## 2. Целевая архитектура

### 2.1 Структура страницы (по Loopboard Redesign)

#### `/dashboard/matches` или `/dashboard/matches?loopId=...`

```
┌──────────────────────────────────────────────────────────────────┐
│  Loopboard / Совпадения                                          │
│  Совпадения                          [Запустить поиск]           │
│  24 новых · 12 сохранено · 8 скрыто                              │
├──────────────────────────────────────────────────────────────────┤
│  Направление: [Все ▼] [Frontend Berlin ▼]                        │
│  Источник:    [Все ▼] [Adzuna] [Remotive] [Arbeitsagentur] ...   │
│  Статус:      [Все] [Новые] [Сохранённые] [Скрытые]              │
│  Сортировка:  [По релевантности ▼] [Новизна ▼] [Зарплата ▼]      │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  [92]  Senior Frontend Engineer                          │    │
│  │        GitHub · Berlin · Remote                          │    │
│  │        React, TypeScript, GraphQL                        │    │
│  │        Источник: Adzuna · 2 ч назад                      │    │
│  │        ─────────────────────────────────────             │    │
│  │        [Сохранить]  [Открыть]  [⤵ Скрыть]                │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ...                                                             │
│  [Показать ещё 20 →]                                             │
└──────────────────────────────────────────────────────────────────┘
```

**Ключевые элементы карточки `MatchCard`:**
- **Score-бейдж** (квадрат слева): 0-100, цвет от красного к зелёному.
- **Заголовок:** `roleTitle` — крупно, кликабельно (открывает детали).
- **Метаданные:** `companyName · location · workMode`.
- **Skills/keywords:** до 5 чипов из `confidence.matched_skills`.
- **Источник + дата:** `Источник: Adzuna · 2 ч назад`.
- **Действия:** `Сохранить` (primary), `Открыть на сайте` (secondary), `Скрыть` (tertiary).

#### `/dashboard/matches/:matchId` — детали матча

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Назад        Senior Frontend Engineer                         │
│                 GitHub · Berlin · Remote                         │
│                                          [92] Score              │
├──────────────────────────────────────────────────────────────────┤
│  [Создать заявку]  [Открыть на сайте]  [Скрыть]                  │
├──────────────────────────────────────────────────────────────────┤
│  Описание:                                                       │
│  ...                                                             │
├──────────────────────────────────────────────────────────────────┤
│  Совпадение по фильтрам Loop:                                    │
│  ✓ React, TypeScript                                             │
│  ✓ Senior                                                        │
│  ✓ Remote                                                        │
│  ⚠ Зарплата не указана                                           │
├──────────────────────────────────────────────────────────────────┤
│  Метаданные:                                                     │
│  • Источник: Adzuna                                              │
│  • External ID: adzuna-12345                                     │
│  • Найдено: 2026-05-22 10:30                                     │
│  • Direction: Frontend Berlin Remote                             │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Модель данных

#### Discovery preview (НЕ хранится в БД)

[DiscoveryRunPreviewItem](../src/features/discoveryRuns/rest/types.ts):

```ts
interface DiscoveryRunPreviewItem {
  externalId: string | null;       // id в источнике
  sourceUrl: string;               // ссылка на вакансию
  title: string | null;            // название роли
  company: string | null;
  location: string | null;
  snippet: string | null;          // описание/превью
  postedAt: string | null;
  rawMetadata: Record<string, unknown>;
  confidence: Record<string, number>;  // matched_skills, source_quality, ...
}
```

#### VacancyMatch (хранится в БД)

```sql
CREATE TABLE vacancy_matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  loop_id         UUID NOT NULL REFERENCES loops(id) ON DELETE CASCADE,

  -- Идентификация вакансии
  source          VARCHAR(40) NOT NULL,    -- 'adzuna' | 'remotive' | ...
  external_id     VARCHAR(160),            -- id в источнике (может быть NULL)
  source_url      TEXT NOT NULL,           -- канонический URL

  -- Контент
  company_name    VARCHAR(160),
  role_title      VARCHAR(240),
  location_text   VARCHAR(160),
  vacancy_description TEXT,
  raw_metadata    JSONB DEFAULT '{}',

  -- Ранжирование
  confidence      JSONB DEFAULT '{}',
  -- Поля: { score: 0-100, matched_skills: [...], gaps: [...], source_quality: 0-1 }
  score           SMALLINT,                -- денормализованный score для индексов

  -- Состояние
  status          VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new','saved','ignored','converted')),
  application_id  UUID REFERENCES applications(id),  -- если уже создана заявка
  warnings        TEXT[] DEFAULT '{}',

  posted_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  -- Дедупликация
  CONSTRAINT vm_dedupe UNIQUE (user_id, loop_id, source, external_id),
  CONSTRAINT vm_url_dedupe UNIQUE (user_id, loop_id, source_url)
);

CREATE INDEX idx_vm_user_loop_status ON vacancy_matches (user_id, loop_id, status);
CREATE INDEX idx_vm_user_status_score ON vacancy_matches (user_id, status, score DESC NULLS LAST);
CREATE INDEX idx_vm_posted_at ON vacancy_matches (user_id, posted_at DESC NULLS LAST);
```

#### Discovery preview cache (Redis или Postgres)

```sql
CREATE TABLE discovery_preview_cache (
  cache_key       VARCHAR(200) PRIMARY KEY,
  -- ключ: hash(user_id + loop_id + source_id + page + search_scope)
  payload         JSONB NOT NULL,        -- сериализованный DiscoveryRunResponse
  expires_at      TIMESTAMPTZ NOT NULL,  -- now() + 6 hours
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_dpc_expires ON discovery_preview_cache (expires_at);
```

> **Текущая реализация:** кеш уже частично есть, см. `feat(backend): add discovery preview cache` в истории. Нужно стабилизировать и добавить инвалидацию при изменении Loop-фильтров.

### 2.3 Эндпоинты (целевой контракт)

#### `POST /api/v1/discovery-runs`

**Request body:**

```json
{
  "loop_id": "loop_abc123",
  "dry_run": true,
  "source_ids": ["arbeitsagentur", "remotive", "adzuna"],
  "search_scope": "normal",
  "page": 1,
  "page_size": 5
}
```

**Параметры:**
- `loop_id` — обязательно
- `dry_run: true` — только превью (без сохранения), `false` — записать в `vacancy_matches`
- `source_ids` — список из 9 runnable-источников (`getDefaultMatchesDiscoverySourceIds` если не передан)
- `search_scope`: `focused` (узкий, только точные совпадения), `normal` (по умолчанию), `broad` (расширенный, синонимы и т.п.)
- `page`: 1-20, `page_size`: 1-5 (макс 5 на источник за запрос)

**Response `200 OK`:** [DiscoveryRunResponseDto](../src/features/discoveryRuns/rest/types.ts):

```json
{
  "run_id": "run_xyz",
  "status": "completed_with_warnings",
  "dry_run": true,
  "page": 1,
  "page_size": 5,
  "loops_checked": 1,
  "sources_checked": 3,
  "matches_created": 0,
  "matches_previewed": 12,
  "warnings": ["loop-a:adzuna:rate_limited"],
  "items": [
    {
      "loop_id": "loop_abc123",
      "source_id": "arbeitsagentur",
      "status": "would_run",
      "reason": "adapter_preview_ready",
      "message": "ok",
      "items_previewed": 5,
      "has_more": true,
      "preview_items": [ ... ],
      "warnings": [],
      "errors": []
    }
  ]
}
```

> **Ключевые требования:**
> 1. `has_more` обязательно для пагинации.
> 2. Backend применяет кеш: если `(user, loop, source, page, scope)` запрашивался < 6 ч назад — отдаёт из кеша. Перезапуск (force refresh) — query param `?refresh=true`.
> 3. Источники опрашиваются **параллельно** (concurrency=9), таймаут на источник 8 с.

#### `GET /api/v1/loops/{loopId}/matches`

**Query parameters:**

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `status` | `enum` | — | `new` / `saved` / `ignored` / `converted` (через `,`) |
| `source` | `string[]` | — | Фильтр по источникам |
| `q` | `string` | — | Поиск по `role_title`, `company_name` |
| `posted_within` | `int` | — | Дней (1, 3, 7, 14, 30) |
| `min_score` | `int` | — | 0-100 |
| `sort` | `enum` | `score_desc` | `score_desc`, `posted_desc`, `created_desc` |
| `limit` | `int` | `20` | max 50 |
| `offset` | `int` | `0` |  |

**Response `200 OK`:**

```json
{
  "items": [ ... VacancyMatchDto ... ],
  "total": 24,
  "limit": 20,
  "offset": 0,
  "summary": {
    "new": 3,
    "saved": 12,
    "ignored": 8,
    "converted": 1
  }
}
```

#### `POST /api/v1/discovery-preview-saves` — сохранить превью

Когда пользователь видит preview-item и нажимает «Сохранить», frontend шлёт минимум данных:

```json
{
  "loop_id": "loop_abc123",
  "source": "adzuna",
  "external_id": "adzuna-12345",
  "source_url": "https://...",
  "title": "Senior Frontend Engineer",
  "company": "GitHub",
  "location": "Berlin",
  "snippet": "...",
  "raw_metadata": { ... },
  "confidence": { ... }
}
```

Backend:
1. Валидирует, что `loop_id` принадлежит user.
2. Дедуплицирует по `(user_id, loop_id, source, external_id)` — если уже есть, возвращает `409 conflict` с `existing_match_id`.
3. Иначе создаёт `VacancyMatch` со `status = 'saved'`.

**Response `201 Created`:** `VacancyMatchDto`.

#### `POST /api/v1/loops/{loopId}/matches/{matchId}/convert`

Превращает VacancyMatch в Application.

**Request body:**
```json
{
  "status": "SAVED",       // или APPLIED
  "notes": "Понравилась команда",
  "favorite": false
}
```

**Backend:**
1. Создаёт запись в `applications` с полями из VacancyMatch (`company_name`, `role_title`, `location_text`, `source_url`, `vacancy_description`, `loop_id`).
2. Сетит `vacancy_matches.status = 'converted'` и `application_id`.
3. Возвращает `{ application_id, match: VacancyMatchDto }`.

### 2.4 Score: формула ранжирования (backend) ⭐ NEW

```python
def compute_match_score(match: PreviewItem, loop: Loop) -> int:
    """0-100, чем больше — тем релевантнее."""
    score = 50  # baseline

    # +20 за совпадение по ключевым словам
    matched_keywords = count_matched_keywords(match.snippet, loop.filters.includeKeywords)
    score += min(20, matched_keywords * 5)

    # +15 за совпадение seniority
    if detect_seniority(match.title) == loop.filters.seniority:
        score += 15

    # +10 за свежесть
    if match.posted_at and (now() - match.posted_at).days <= 3:
        score += 10
    elif match.posted_at and (now() - match.posted_at).days <= 7:
        score += 5

    # +10 за работу в полностью remote, если loop требует remote_only
    if loop.remote_mode == "remote_only" and is_remote(match):
        score += 10

    # -20 за наличие исключённых слов
    excluded = count_matched_keywords(match.snippet, loop.filters.excludeKeywords)
    score -= min(20, excluded * 10)

    # -15 за агентство, если excludeAgencies=true
    if loop.filters.excludeAgencies and is_agency(match.company):
        score -= 15

    return max(0, min(100, score))
```

Score рассчитывается **при discovery-run** и записывается в `vacancy_matches.score` для индекса и сортировки.

### 2.5 Дедупликация между источниками ⭐ NEW

Если одна и та же вакансия пришла из 3 источников, нужно склеить:

```python
def dedupe_cross_source(items: list[VacancyMatch]) -> list[VacancyMatch]:
    """Группировать по нормализованному (company, role, location)."""
    groups = defaultdict(list)
    for item in items:
        key = normalize_dedupe_key(item.company, item.role, item.location)
        groups[key].append(item)

    result = []
    for group in groups.values():
        # Выбрать «канонический» из группы: max score, иначе старший по дате
        canonical = max(group, key=lambda x: (x.score or 0, x.created_at))
        canonical.duplicates = [x.id for x in group if x.id != canonical.id]
        result.append(canonical)
    return result

def normalize_dedupe_key(company: str, role: str, location: str) -> str:
    return f"{slugify(company)}::{slugify(role)}::{slugify(location)}"
```

Frontend получает «канонический» VacancyMatch и список `duplicates: [id, id, id]` — клик по «🔗 ещё 2 источника» раскрывает их.

---

## 3. Frontend: что и в каком порядке делать

### 3.1 Этап 1 — score и сортировка (1 день)

1. Добавить `confidence.score` в `VacancyMatchDto` адаптер.
2. В `MatchesPage`: дефолтная сортировка по `score_desc`.
3. В `MatchCard`: добавить квадратный бейдж со score-числом (цвет от красного к зелёному через CSS-переменные).

### 3.2 Этап 2 — фильтры по новизне и источнику (1 день)

1. В `MatchesFilters.tsx`: добавить chips для `posted_within` (24ч / 3д / неделя / 30д).
2. Multi-select источника (с подсказкой о ready/not_configured статусе).
3. Слайдер `min_score`.
4. Кнопка «Сбросить фильтры».

### 3.3 Этап 3 — bulk-actions (1 день)

1. В превью добавить checkbox-выбор на карточке.
2. При выбранных N items показать sticky-bar: `[N выбрано] [Сохранить все] [Скрыть все] [Отмена]`.
3. Bulk-save через `POST /discovery-preview-saves/bulk` (новый эндпоинт, см. 4.4).

### 3.4 Этап 4 — детали матча (1 день)

1. `/dashboard/matches/:matchId`: проверить, что текущая [MatchDetailsPage](../src/pages/MatchDetailsPage/MatchDetailsPage.tsx) показывает все поля.
2. Добавить блок «Совпадение по фильтрам Loop» с галочками/предупреждениями (вычислять на frontend из `confidence.matched_skills` + `gaps`).
3. Кнопка «Создать заявку» → `POST /loops/:loopId/matches/:matchId/convert` → редирект на `/dashboard/applications/:applicationId`.

### 3.5 Этап 5 — дедупликация UI (1 день)

1. При наличии `duplicates: [id, id]` показать чип «🔗 ещё N источников» под карточкой.
2. Клик раскрывает inline-список с URL каждого источника.

---

## 4. Backend: что и в каком порядке делать

### 4.1 Этап 1 — score в discovery-run (2 дня)

1. Реализовать `compute_match_score()` (см. 2.4) в `discovery_service/scoring.py`.
2. Применять при каждом `POST /discovery-runs`, перед формированием response.
3. При `dry_run=false` — писать в `vacancy_matches.score`.
4. Добавить `score` в `DiscoveryRunPreviewItemDto.confidence.score`.

### 4.2 Этап 2 — дедупликация (2 дня)

1. После сбора результатов от 9 источников — прогнать через `dedupe_cross_source()`.
2. В response добавить `duplicates: string[]` (массив id-источников).
3. Хранить `dedupe_key` в VacancyMatch для быстрого поиска.

### 4.3 Этап 3 — фильтры в `GET /loops/:loopId/matches` (1 день)

1. Добавить параметры `posted_within`, `min_score`, `q`, `source[]`.
2. SQL с динамическими WHERE-clauses.
3. Добавить `summary` (как в Loops listing).

### 4.4 Этап 4 — bulk-saves (1 день)

```
POST /api/v1/discovery-preview-saves/bulk
Body: { items: [ { ... }, { ... } ] }
Response: { saved: [VacancyMatchDto], failed: [{ index, error }] }
```

Транзакция: либо всё, либо ничего (rollback при любой ошибке). Для каждого item тот же flow, что в single-save.

### 4.5 Этап 5 — Email digest (опционально, 2 дня)

Cron каждое утро в 9:00 (timezone пользователя):
1. Найти всех users с `auto_discovery_enabled=true` Loop'ами.
2. Запустить discovery (со свежим кешем).
3. Отфильтровать `score >= 80` AND `posted_within <= 1 day`.
4. Если есть результат — отправить email с топ-5 вакансиями.

---

## 5. Acceptance criteria

### Список (`/dashboard/matches`)

- [ ] Карточка показывает score-бейдж с цветом.
- [ ] Дефолтная сортировка — по `score_desc`.
- [ ] Фильтры (loop, source, status, posted_within, min_score) работают в комбинации.
- [ ] Дубликаты сворачиваются с чипом «🔗 ещё N».
- [ ] Пагинация по 20: после загрузки 20 из буфера запрашивается следующая страница backend.
- [ ] Bulk-save: выбор N, нажатие «Сохранить все» — все сохраняются с одной transition-toast.

### Детали (`/dashboard/matches/:matchId`)

- [ ] Все поля из `VacancyMatch` отображаются.
- [ ] Блок «Совпадение по фильтрам» вычисляется и показывает ✓/⚠/✗.
- [ ] Кнопка «Создать заявку» работает и редиректит.
- [ ] Кнопка «Открыть на сайте» открывает `sourceUrl` в новой вкладке.

### Backend

- [ ] `POST /discovery-runs` укладывается в 10 с для 9 источников (с таймаутом на источник 8 с).
- [ ] Кеш работает: повторный запрос с теми же параметрами возвращается за < 100 мс.
- [ ] Score рассчитывается стабильно (один и тот же input → один и тот же output).
- [ ] Дедупликация склеивает группу из 3 источников в 1 канонический с `duplicates`.
- [ ] Bulk-save с 20 items работает атомарно.

---

## 6. Связь с другими этапами

**Из Loops (этап 1):** Match создаётся только в контексте Loop. Без `loopId` показывать «Создайте направление для начала поиска».

**В Applications (этап 3):** `POST /loops/:loopId/matches/:matchId/convert` создаёт Application и помечает Match как `converted`. После этого Match остаётся в БД для аналитики (откуда пришла заявка), но не показывается в списке «Новые».

**Активность:** каждый Match-save и Match-convert генерирует event в `activity_feed`, отображается на странице активности.
