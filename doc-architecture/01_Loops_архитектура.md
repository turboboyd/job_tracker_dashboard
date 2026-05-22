# Архитектура: Страница «Направления» (Loops)

> **Маршруты:** `/dashboard/loops`, `/dashboard/loops/:loopId`
> **Этап в пользовательском пути:** 1 из 3 — пользователь сначала создаёт направление поиска (Loop), потом находит вакансии (Matches), потом сохраняет их как заявки (Applications).
> **Статус:** базовая функциональность реализована, требуется доведение до прод-готовности по дизайну Loopboard Redesign и стабилизация контракта бэкенда.

---

## 0. Контекст и место в продукте

**Что такое Loop (направление поиска):**

Loop — это **сохранённый поисковый профиль**. Это не «найденные вакансии» и не «заявки». Это **набор фильтров и предпочтений**, который пользователь один раз заполняет, а потом использует для:

1. **Discovery** — автоматического поиска вакансий из 9 источников ([src/pages/MatchesPage](../src/pages/MatchesPage)).
2. **Manual search links** — генерации ссылок на внешние job-сайты (LinkedIn, Indeed, StepStone и т.д.) с предзаполненными фильтрами.
3. **Группировки заявок** — все заявки, созданные из вакансий этого направления, привязаны к нему через `loopId`.

**Пример сценария:**
- Пользователь создаёт Loop «Frontend Berlin Remote» с фильтрами: роль = `Frontend Engineer`, город = `Berlin`, радиус = 30 км, режим = `remote_only`, языки = `de + en`, платформы = LinkedIn, StepStone, Remotive, Adzuna.
- На странице `/dashboard/matches?loopId=...` запускает discovery — backend опрашивает 9 источников и возвращает превью.
- Из превью пользователь выбирает интересные вакансии и сохраняет в `/dashboard/applications` — они автоматически наследуют `loopId`.
- В дашборде видит: «По направлению *Frontend Berlin Remote* — 12 заявок, из них 3 интервью».

---

## 1. Текущее состояние (что уже реализовано)

### 1.1 Frontend

| Файл | Назначение |
|---|---|
| [src/pages/LoopsPage/LoopsPage.tsx](../src/pages/LoopsPage/LoopsPage.tsx) | Роутер-обёртка: показывает `LoopsListView` или `LoopDetailsView` в зависимости от `:loopId` |
| [src/pages/LoopsPage/components/LoopsListView.tsx](../src/pages/LoopsPage/components/LoopsListView.tsx) | Список направлений: карточки `LoopListCard` + кнопка «Создать» |
| [src/pages/LoopsPage/components/LoopDetailsView.tsx](../src/pages/LoopsPage/components/LoopDetailsView.tsx) | Детали Loop: 3 вкладки (Overview / Matches / Settings) |
| [src/pages/LoopsPage/components/LoopSettingsPanel.tsx](../src/pages/LoopsPage/components/LoopSettingsPanel.tsx) | Inline-редактор настроек (без модалки) |
| [src/pages/LoopsPage/components/VacancyMatchesSection.tsx](../src/pages/LoopsPage/components/VacancyMatchesSection.tsx) | Список сохранённых матчей по этому Loop |
| [src/entities/loop/](../src/entities/loop/) | Entity: типы, валидаторы, CreateLoopModal, LoopSearchLinks, реестр платформ |
| [src/features/loops/rest/](../src/features/loops/rest/) | REST-клиент: `listLoopsViaRest`, `createLoopViaRest`, `getLoopViaRest`, `updateLoopViaRest`, `archiveLoopViaRest` |

### 1.2 Backend (REST)

Базовый префикс: `/api/v1/loops`

| Метод | Эндпоинт | Назначение |
|---|---|---|
| `GET` | `/loops?include_archived=&limit=&offset=` | Список направлений пользователя |
| `POST` | `/loops` | Создать направление |
| `GET` | `/loops/{loopId}` | Получить одно направление |
| `PATCH` | `/loops/{loopId}` | Обновить направление (частичное) |
| `DELETE` | `/loops/{loopId}` | Архивировать (soft delete, не физическое удаление) |

**Контракт DTO (snake_case):** [src/features/loops/rest/adapter.ts](../src/features/loops/rest/adapter.ts) — `BackendLoopDto`.

### 1.3 Что ещё **не** реализовано (gaps)

1. **Нет дублирования Loop** (clone) — частый сценарий: «Frontend Berlin» → «Frontend Munich», когда нужно сменить только город.
2. **Нет paused-состояния в UI** — статус `paused` есть в типе, но кнопки «Поставить на паузу / возобновить» нет.
3. **Нет агрегаций в `GET /loops`** — счётчики matches/applications считаются на клиенте отдельным запросом, а должны приходить вместе со списком.
4. **Нет webhook-уведомлений** при появлении новых матчей по Loop (даже email-дайджеста).
5. **Нет копирования из шаблона** — пустой Loop пугает нового пользователя; нужны 3-5 готовых шаблонов («Junior Frontend EU», «Senior Backend Remote», «DevOps Berlin» и т.д.).

---

## 2. Целевая архитектура

### 2.1 Структура страницы (по Loopboard Redesign)

#### `/dashboard/loops` — список направлений

```
┌─────────────────────────────────────────────────────────────┐
│  Loopboard / Направления                       [+ Создать]  │
│  Направления                                                │
│  3 активных · 1 на паузе                                    │
├─────────────────────────────────────────────────────────────┤
│  [Active] [Paused] [Archived]              [🔎 Поиск...]    │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Frontend Berlin Remote        [active]               │  │
│  │  React · TypeScript · Senior · Berlin · 30km · Remote │  │
│  │  ────────────────────────────────────────────────     │  │
│  │  Matches: 24    Applied: 12    Today: 3               │  │
│  │  ────────────────────────────────────────────────     │  │
│  │  [Open Matches]              [Pause]   [Archive]      │  │
│  └───────────────────────────────────────────────────────┘  │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

**Ключевые элементы карточки `LoopCard`:**
- Заголовок: `loop.name` + статус-чип (`active` / `paused` / `archived`)
- Тэги: `targetRole`, `titles[0..3]`, `location`, `radiusKm`, `remoteMode`
- Метрики (3 в строку): `Matches` / `Applied` / `Today` — числа из агрегаций backend
- Кнопки: `Open Matches` (главная), `Pause/Resume` (вторичная), `Archive` (вторичная)

#### `/dashboard/loops/:loopId` — детали направления

```
┌──────────────────────────────────────────────────────────┐
│  ← Назад        Frontend Berlin Remote     [active]      │
│                 React · Berlin · Remote                  │
├──────────────────────────────────────────────────────────┤
│  [Обзор]  [Совпадения 24]  [Настройки]                   │
├──────────────────────────────────────────────────────────┤
│  Вкладка «Обзор»:                                        │
│  • Manual search links (LinkedIn, StepStone, Indeed, …)  │
│  • Сводка: 12 заявок, 3 интервью, 1 оффер                │
│  • Последняя активность: 2 ч назад                       │
│                                                          │
│  Вкладка «Совпадения»:                                   │
│  • Кнопка [Запустить discovery]                          │
│  • Список сохранённых VacancyMatch для этого Loop        │
│                                                          │
│  Вкладка «Настройки»:                                    │
│  • Inline-форма редактирования: titles, location,        │
│    radiusKm, remoteMode, platforms, filters              │
│  • Кнопки: [Сохранить] [Duplicate] [Archive]             │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Модель данных (Loop)

**TypeScript (frontend):** [src/entities/loop/model/types.ts](../src/entities/loop/model/types.ts) — `Loop`, `CanonicalFilters`, `LoopPlatform`.

**PostgreSQL schema (целевая):**

```sql
CREATE TABLE loops (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Идентификация
  name            VARCHAR(120) NOT NULL,
  target_role     VARCHAR(160),
  titles          TEXT[] DEFAULT '{}',  -- альтернативные названия роли

  -- Локация
  location        VARCHAR(120),
  radius_km       SMALLINT DEFAULT 30 CHECK (radius_km IN (5, 10, 20, 30, 50, 100)),
  remote_mode     VARCHAR(20) DEFAULT 'any' CHECK (remote_mode IN ('any', 'remote_only')),

  -- Источники и платформы
  platforms       TEXT[] DEFAULT '{}',        -- внешние линки: linkedin, indeed, ...
  selected_sources TEXT[] DEFAULT '{}',       -- discovery-источники: arbeitsagentur, adzuna, ...
  auto_discovery_enabled BOOLEAN DEFAULT true,

  -- Canonical-фильтры (jsonb для гибкости)
  filters         JSONB DEFAULT '{}',
  -- Структура filters: { workMode, seniority, employmentType, postedWithin,
  --                      includeKeywords, excludeKeywords, excludeAgencies, language }

  -- Состояние
  status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  last_discovery_at TIMESTAMPTZ,

  -- Audit
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  archived_at     TIMESTAMPTZ,

  UNIQUE (user_id, name)  -- название уникально в пределах пользователя
);

CREATE INDEX idx_loops_user_status ON loops (user_id, status) WHERE archived_at IS NULL;
CREATE INDEX idx_loops_last_discovery ON loops (user_id, last_discovery_at DESC NULLS LAST);
```

### 2.3 Эндпоинты (целевой контракт)

#### `GET /api/v1/loops`

**Query parameters:**

| Параметр | Тип | По умолчанию | Описание |
|---|---|---|---|
| `status` | `enum` | — | `active` / `paused` / `archived` (можно несколько через `,`) |
| `q` | `string` | — | Поиск по `name`, `target_role`, `titles` |
| `sort` | `enum` | `created_at_desc` | `created_at_desc`, `name_asc`, `last_discovery_desc`, `matches_count_desc` |
| `limit` | `int` | `100` | Кол-во (max 200) |
| `offset` | `int` | `0` | Пагинация |
| `include_metrics` | `bool` | `true` | Включать ли счётчики matches/applications в ответ |

**Response `200 OK`:**

```json
{
  "items": [
    {
      "id": "loop_abc123",
      "user_id": "usr_xyz",
      "name": "Frontend Berlin Remote",
      "target_role": "Frontend Engineer",
      "titles": ["Frontend Engineer", "React Developer"],
      "location": "Berlin",
      "radius_km": 30,
      "remote_mode": "remote_only",
      "platforms": ["linkedin", "stepstone", "indeed"],
      "selected_sources": ["arbeitsagentur", "remotive", "adzuna"],
      "auto_discovery_enabled": true,
      "filters": {
        "workMode": "remote",
        "seniority": "senior",
        "employmentType": "full_time",
        "postedWithin": 30,
        "includeKeywords": "react,typescript",
        "excludeKeywords": "wordpress",
        "excludeAgencies": true,
        "language": "any"
      },
      "status": "active",
      "last_discovery_at": "2026-05-22T08:30:00Z",
      "created_at": "2026-04-15T12:00:00Z",
      "updated_at": "2026-05-22T08:30:00Z",
      "metrics": {
        "matches_total": 24,
        "matches_new": 3,
        "applications_total": 12,
        "applications_active": 5,
        "applications_today": 3
      }
    }
  ],
  "total": 4,
  "limit": 100,
  "offset": 0,
  "summary": {
    "active": 3,
    "paused": 1,
    "archived": 8
  }
}
```

> **Ключевое требование:** `metrics` приходит в одном запросе. Без этого UI вынужден делать N+1 запросов (по одному на каждый Loop) для счётчиков на карточке.

#### `POST /api/v1/loops` — создать направление

**Request body:**

```json
{
  "name": "Frontend Berlin Remote",
  "target_role": "Frontend Engineer",
  "titles": ["Frontend Engineer", "React Developer"],
  "location": "Berlin",
  "radius_km": 30,
  "remote_mode": "remote_only",
  "platforms": ["linkedin", "stepstone"],
  "selected_sources": ["arbeitsagentur", "remotive"],
  "filters": { ... },
  "auto_discovery_enabled": true
}
```

**Валидация (backend):**
- `name`: 2–60 символов, уникально для user
- `target_role`: 2–160 символов
- `titles`: 0–10 элементов, каждый 2–160 символов
- `location`: 0–120 символов
- `radius_km`: одно из `[5, 10, 20, 30, 50, 100]`
- `platforms[]`: только из `LOOP_PLATFORM_VALUES` ([types.ts:4](../src/entities/loop/model/types.ts#L4))
- `selected_sources[]`: только из 9 runnable-источников
- `filters.workMode`: `any` / `onsite` / `hybrid` / `remote` / `remote_only`

**Response `201 Created`:** полный `BackendLoopDto`.

**Ошибки:**
- `400` — невалидные данные (с детализацией по полю)
- `409` — `name` уже занято: `{ "type": "/errors/loop-name-conflict", "title": "Loop name already exists" }`

#### `PATCH /api/v1/loops/{loopId}` — обновить

Все поля опциональны. Доп. правила:
- Смена `status: active → paused` — НЕ удаляет данные, но останавливает auto-discovery.
- Смена `status: * → archived` — то же, что `DELETE` (soft delete).
- При обновлении `selected_sources` — backend проверяет, что все источники существуют и runnable.

#### `DELETE /api/v1/loops/{loopId}` — soft delete

Ставит `status = 'archived'` и `archived_at = now()`. Связанные `vacancy_matches` и `applications` **не** удаляются, но при listing скрываются по умолчанию.

#### `POST /api/v1/loops/{loopId}/duplicate` — клонировать ⭐ NEW

**Назначение:** скопировать все настройки в новый Loop с именем `{original_name} (copy)`. Полезно для вариаций (Berlin → Munich, Junior → Senior).

**Request body (опционально):**
```json
{ "name": "Frontend Munich Remote" }
```

**Response `201 Created`:** новый `BackendLoopDto`.

#### `POST /api/v1/loops/{loopId}/pause` и `/resume` ⭐ NEW

Семантические шорткаты для `PATCH { status }`. Дополнительно `resume` запускает discovery сразу же.

---

## 3. Frontend: что и в каком порядке делать

### 3.1 Этап 1 — стабилизация контракта (1-2 дня)

1. **Уточнить адаптер** [src/features/loops/rest/adapter.ts](../src/features/loops/rest/adapter.ts): добавить mapping для `metrics`, `summary`, `archived_at`.
2. **Расширить `useBackendLoopsQuery`** для приёма параметров `status`, `q`, `sort`, `include_metrics`.
3. **Убрать клиентские агрегации**: удалить из `LoopListCard` любые `useMemo`, которые сейчас считают `matchesCount` из отдельных запросов — взять из `loop.metrics`.

### 3.2 Этап 2 — редизайн списка (2-3 дня)

1. Переписать [LoopListCard.tsx](../src/pages/LoopsPage/components/LoopListCard.tsx) под 3-колоночный layout из Loopboard Redesign:
   - Колонка 1: name + status chip
   - Колонка 2: tags (titles, location, radius, remoteMode)
   - Колонка 3: метрики (Matches/Applied/Today)
   - Действия: 2 кнопки (`Matches` + `Pause/Archive`)
2. Добавить фильтр-табы `[Active] [Paused] [Archived]` с агрегатами из `summary`.
3. Добавить поиск по `name` / `target_role`.

### 3.3 Этап 3 — детали и редактирование (2 дня)

1. Очистить [LoopDetailsView.tsx](../src/pages/LoopsPage/components/LoopDetailsView.tsx) — 3 вкладки уже есть, но нужно:
   - Вкладка «Обзор»: добавить сводку метрик (вместо «Loading…»)
   - Вкладка «Совпадения»: проверить интеграцию с discovery-кнопкой
   - Вкладка «Настройки»: inline-форма уже работает, добавить кнопки `Duplicate` / `Archive`
2. Реализовать `Duplicate` через новый эндпоинт `POST /loops/:id/duplicate`.
3. Реализовать `Pause/Resume` через `POST /loops/:id/pause` и `/resume`.

### 3.4 Этап 4 — шаблоны (1 день)

Добавить в `CreateLoopModal` шаг «Выбрать шаблон или начать с нуля». Шаблоны хранятся на frontend как константы:
- «Junior Frontend EU»: `titles: ["Frontend Engineer", "Junior Frontend"]`, `seniority: junior`, `location: ""`, `remote_only`
- «Senior Backend Remote»: `titles: ["Backend Engineer", "Senior Backend"]`, `seniority: senior`, `remote_only`, `language: en`
- «DevOps Berlin»: `titles: ["DevOps Engineer", "SRE"]`, `location: Berlin`, `radius: 30`
- «Data Engineer EU»: `titles: ["Data Engineer", "Analytics Engineer"]`, `remote_mode: any`, `language: en`
- «Свой шаблон»: пустая форма

---

## 4. Backend: что и в каком порядке делать

### 4.1 Этап 1 — миграция схемы (1 день)

1. Применить `loops` schema из 2.2 в Postgres.
2. Перенести данные из Firestore: `users/{uid}/loops/{loopId}` → `loops`.
3. Добавить триггер `updated_at` на каждый UPDATE.

### 4.2 Этап 2 — listing с агрегациями (2 дня)

Запрос `GET /loops?include_metrics=true` должен возвращать данные одним SQL:

```sql
SELECT
  l.*,
  jsonb_build_object(
    'matches_total',     COALESCE(m.matches_total, 0),
    'matches_new',       COALESCE(m.matches_new, 0),
    'applications_total', COALESCE(a.app_total, 0),
    'applications_active', COALESCE(a.app_active, 0),
    'applications_today', COALESCE(a.app_today, 0)
  ) AS metrics
FROM loops l
LEFT JOIN (
  SELECT loop_id,
         COUNT(*) AS matches_total,
         COUNT(*) FILTER (WHERE status = 'new') AS matches_new
  FROM vacancy_matches
  WHERE user_id = $1
  GROUP BY loop_id
) m ON m.loop_id = l.id
LEFT JOIN (
  SELECT loop_id,
         COUNT(*) AS app_total,
         COUNT(*) FILTER (WHERE archived = false) AS app_active,
         COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS app_today
  FROM applications
  WHERE user_id = $1
  GROUP BY loop_id
) a ON a.loop_id = l.id
WHERE l.user_id = $1
  AND ($2::text IS NULL OR l.status = ANY($2::text[]))
  AND ($3::text IS NULL OR (
    l.name ILIKE '%' || $3 || '%' OR
    l.target_role ILIKE '%' || $3 || '%' OR
    EXISTS (SELECT 1 FROM unnest(l.titles) AS t WHERE t ILIKE '%' || $3 || '%')
  ))
ORDER BY ...
LIMIT $4 OFFSET $5;
```

> **Производительность:** один запрос вместо N+1. Для пользователя с 20 направлениями — 1 запрос вместо 21.

### 4.3 Этап 3 — duplicate/pause/resume (1 день)

```python
# POST /loops/{id}/duplicate
async def duplicate_loop(user_id: str, source_loop_id: str, new_name: str | None):
    source = await loops_repo.get(user_id, source_loop_id)
    if not source: raise NotFound()
    name = new_name or f"{source.name} (copy)"
    # обеспечить уникальность имени
    name = await ensure_unique_name(user_id, name)
    new_loop = LoopDto(
        **source.dict(exclude={"id", "created_at", "updated_at", "archived_at", "last_discovery_at"}),
        name=name,
        status="active",  # копия активна
    )
    return await loops_repo.insert(user_id, new_loop)
```

### 4.4 Этап 4 — discovery-интеграция (1 день)

При `status: active → paused`: остановить cron `auto_discovery`. При `paused → active`: возобновить и опционально запустить сразу.

---

## 5. Acceptance criteria

### Список (`/dashboard/loops`)

- [ ] Карточка показывает 3 метрики (Matches/Applied/Today) **без дополнительных запросов**.
- [ ] Фильтр-табы Active/Paused/Archived работают с агрегатом сверху.
- [ ] Поиск по имени и роли работает с дебаунсом 300 мс.
- [ ] Кнопка «Создать» открывает модалку с выбором шаблона.
- [ ] Кнопка «Pause» на карточке меняет статус без перехода на детали.
- [ ] Архивированные направления скрыты по умолчанию.

### Детали (`/dashboard/loops/:loopId`)

- [ ] 3 вкладки переключаются без перезагрузки данных.
- [ ] Inline-настройки сохраняются и показывают toast.
- [ ] Кнопка «Duplicate» создаёт копию и редиректит на её детали.
- [ ] Кнопка «Archive» возвращает на список с toast «Архивировано».
- [ ] Уникальность имени проверяется на сервере с user-friendly ошибкой.

### Backend

- [ ] `GET /loops` с метриками укладывается в 200 мс для пользователя с 50 направлениями (load test).
- [ ] `POST /loops` создаёт запись с валидацией всех ограничений из 2.3.
- [ ] `PATCH /loops/:id` поддерживает частичное обновление без затирания других полей.
- [ ] `DELETE /loops/:id` — soft delete, связанные данные не теряются.
- [ ] `POST /loops/:id/duplicate` копирует всё, кроме истории.

---

## 6. Связь со следующими этапами

После того как Loop создан и имеет `loopId`:

1. **Matches (этап 2):** `/dashboard/matches?loopId=...` — пользователь видит результаты discovery именно по этому Loop. Документ: [02_Matches_архитектура.md](./02_Matches_архитектура.md).
2. **Applications (этап 3):** `/dashboard/applications?loopId=...` — фильтр по `loopId` показывает заявки, созданные из вакансий этого Loop. Документ: [03_Applications_архитектура.md](./03_Applications_архитектура.md).

`loopId` — единый ключ, связывающий все три страницы.
