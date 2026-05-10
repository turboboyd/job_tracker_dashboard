# Refactor Roadmap — Job Tracker Dashboard

## Executive verdict

Полный rewrite сейчас запрещён как инженерное решение.

Причина простая:
- проект уже имеет рабочий каркас: `React + TypeScript`, `strict` типизацию, FSD-намерение, Firebase/Auth, Dashboard, Loops, Matches, Board, Settings;
- `typecheck` проходит;
- большая часть проблем — это **границы слоёв, public API, циклы и дублирование**, а не сломанная продуктовая модель.

Значит стратегия одна:

**не переписывать продукт, а провести жёсткий staged refactor с архитектурными воротами.**

---

## Current facts from the repo

### 1. Static architecture is broken, not the product

`dependency-cruiser` показывает **134 нарушения**:
- `50` нарушений `entities-public-api-only`
- `15` нарушений `no-pages-dep-on-app`
- `8` нарушений `features-public-api-only`
- `7` нарушений `no-entities-dep-on-higher`
- `6` нарушений `no-shared-dep-on-higher`
- множество циклов, особенно вокруг `pages/index.ts`, `routeConfig`, `loop`, `loopMatch`, `auth`, `shared/ui`

### 2. Tooling is partially lying

- `typecheck` проходит.
- `jscpd` падает: **3.32% duplication** при пороге `2%`.
- `madge --circular src` даёт ложный зелёный результат: `Processed 0 files`.

Вывод: **архитектурный контроль сейчас не полностью достоверный**, его надо чинить первым же этапом.

### 3. Concrete structural issues

Критичные точки:
- `src/app/store/rootReducer.ts` импортирует `src/pages/LoopsPage/model/loopsUiSlice.ts`
- `src/shared/api/rtk/requireUid.ts` зависит от `src/entities/auth`
- `src/shared/config/i18n/i18n.ts` импортирует локали из `src/app/widgets/header/...`
- `src/entities/userSettings/api/userSettingsApi.ts` зависит от `RootState`
- `src/entities/loopMatch/api/loopMatchesApi.ts` зависит от `src/features/applications/firestoreApplications.ts`
- `src/entities/auth/model/hooks/*` зависит от `src/app/store/hooks.ts`
- `src/pages/*` массово завязаны на `src/app/providers/router/routeConfig/routeConfig.tsx`
- `src/entities/application` вообще **не имеет `index.ts`**, поэтому любой consumer неизбежно лезет во внутренности

### 4. Duplication hotspots

Наиболее грязные зоны:
- `LanguageSelectConnected` продублирован в `features/i18n` и `shared/ui/molecules`
- Form fields (`Input`, `TextArea`, `Select`) имеют повторяющиеся обвязки
- `loop/lib/links/urlBuilders.ts` содержит внутренние повторы
- `MatchCard` / `MatchDetailsModal` / `MatchDetailsSummaryCard` содержат общие куски форматирования
- локали `LoginPage` / `RegisterPage` во многом дублируются

---

## Refactor goal

Довести проект до состояния, где:
- внешний импорт всегда идёт только через public API slice;
- `shared` не знает о бизнес-домене;
- `entities` не знают о `app`, `pages`, `features`;
- роутинг и store bootstrap не протекают в страницы;
- циклы отсутствуют;
- дублирование опущено ниже порога;
- после этого можно писать тесты по стабильным контрактам, а не по текущему хаосу.

---

## Target architecture

### Layer rules

**app**
- bootstrap
- providers
- store wiring
- router composition
- app shell
- никаких доменных helper'ов наружу

**pages**
- только composition screen-level
- page hooks/controller
- без знания о store bootstrap и без знания о route internals

**features**
- user actions / use cases
- orchestration
- можно импортировать `entities` и `shared`
- нельзя импортировать `pages` и `app`

**entities**
- domain types
- domain selectors
- pure mappers
- domain UI kit
- entity API contracts
- нельзя импортировать `app`, `pages`, `features`

**shared**
- ui kit
- config
- utils
- infra
- api base
- no business imports ever

---

## Hard architectural laws

Эти правила обязательны. Без исключений.

1. **Внутри slice — только relative imports.**
2. **Между slice — только public API (`index.ts`).**
3. **`shared` не импортирует `entities`, `features`, `pages`, `app`.**
4. **`entities` не импортирует `features`, `pages`, `app`.**
5. **`pages` не импортируют `app/store` и `app/router` internals.**
6. **Barrel file не должен импортироваться изнутри собственного slice.**
7. **Route constants живут отдельно от route composition.**
8. **Redux hooks не живут внутри domain entities.**
9. **Firestore-specific code не должен протекать в UI и pure domain helpers.**
10. **Одна фича = один scoped refactor = один PR = один GitHub update.**

---

## Program of work

Ниже порядок не для красоты. Он выстроен так, чтобы не плодить новые циклы во время чистки.

# Phase 0 — Establish truth and guardrails

## Goal
Сначала надо сделать так, чтобы проект перестал врать о своём состоянии.

## Tasks
- Починить `madge`, чтобы он реально видел файлы и alias `src/*`.
- Вынести отдельный скрипт `check:arch`.
- Ужесточить CI:
  - `typecheck`
  - `lint`
  - `check:deps`
  - `check:cycles`
  - `check:dup`
- Зафиксировать baseline нарушений в `docs/refactor/PROGRESS.md`.
- Создать `docs/refactor/DECISIONS.md` для архитектурных решений.

## Deliverable
Инженер видит реальную картину, а не ложный зелёный статус.

## Definition of Done
- `madge` анализирует реальные файлы, а не `0 files`
- baseline зафиксирован документально
- CI не пропускает новый архитектурный мусор

---

# Phase 1 — Router and app boundary cleanup

## Goal
Разрезать главный цикл: `pages -> app/router -> pages/index -> page`.

## Tasks
- Вынести `AppRoutes` и `RoutePath` из `app/providers/router/routeConfig/routeConfig.tsx` в `shared/config/routes`.
- Оставить в `routeConfig.tsx` только композицию маршрутов.
- Страницы должны импортировать только route constants, а не route composition.
- Убрать любые page imports из `routeConfig` через промежуточные barrels, если они создают цикл.
- Пересмотреть `src/pages/index.ts`:
  - оставить его только как lazy entry registry;
  - запретить страницам ходить назад через него.

## Why this first
Пока роутинг связан с pages через barrel, любая чистка ниже будет размазывать циклы по всему проекту.

## Deliverable
Route constants и route composition разделены.

## Definition of Done
- у `pages/*` нет импорта `app/providers/router/routeConfig/routeConfig.tsx`
- route cycles исчезают

---

# Phase 2 — Store boundary cleanup

## Goal
`app/store` должен зависеть только от reducers/features/entities, но не от `pages`.

## Tasks
- Убрать `loopsUiSlice` из `pages/LoopsPage/model`.
- Переместить это состояние в одно из мест:
  - `features/loopsUi`
  - или `entities/loop/model/ui`
  - или `shared/model/navigationState` — только если это не доменная логика.
- `app/store/rootReducer.ts` не должен импортировать `pages/*` вообще.
- Пересмотреть все `useAppSelector/useAppDispatch` зависимости из lower layers.

## Deliverable
Store bootstrap больше не зависит от экранов.

## Definition of Done
- `rootReducer.ts` не импортирует `pages/*`
- page-local UI state не живёт в `pages`, если его подключают в global store

---

# Phase 3 — Auth slice decoupling

## Goal
Убрать цикл `app/store -> entities/auth -> app/store`.

## Tasks
- Убрать `useAuthSelectors` и `useAuthActions` из `entities/auth/model/hooks`, если они тянут `app/store/hooks`.
- Разделить:
  - **domain selectors / thunks / reducer** — в `entities/auth`
  - **react-redux hook adapters** — в `features/auth` или `shared/lib/store`
- `entities/auth` должен экспортировать чистые селекторы и action creators.
- UI-ориентированные auth hooks перенести в consumer-oriented слой.

## Deliverable
`entities/auth` становится настоящим entity slice, а не смесью domain + store binding.

## Definition of Done
- `entities/auth` не импортирует `app/store/hooks.ts`
- hooks уровня React не живут в domain slice без крайней необходимости

---

# Phase 4 — Shared detox

## Goal
`shared` должен снова стать shared.

## Tasks
- Убрать `requireUidFromState` зависимость от `entities/auth`.
  - Вариант: передавать selector/uid getter снаружи.
  - Вариант: вынести auth-специфичный helper в `entities/auth/lib`.
- Убрать локали header из `shared/config/i18n/i18n.ts`.
  - shared не должен импортировать `app/widgets/header/...`
- Удалить дублирующий `LanguageSelectConnected` из `shared`, оставить connected-версию только в одном слое.
- В `shared` оставить только dumb UI и infra helpers.

## Deliverable
`shared` не знает, кто такой auth, userSettings и app header.

## Definition of Done
- `shared -> higher layers` = 0

---

# Phase 5 — Public API normalization

## Goal
Закрыть внутренности slices и заставить consumers работать по контракту.

## Tasks
- Создать отсутствующие `index.ts` в slices:
  - обязательно `src/entities/application/index.ts`
  - обязательно missing public APIs в `features/applications`, `features/cv-checker`, `features/cvVersions`
- Для каждого slice определить, что является public contract:
  - types
  - hooks
  - selectors
  - ui kit
  - api methods
- В consumers заменить deep imports на public API imports.
- Запретить self-import через собственный barrel.

## Deliverable
У каждого slice есть публичный контракт.

## Definition of Done
- `entities-public-api-only` = 0
- `features-public-api-only` = 0

---

# Phase 6 — Applications domain split

## Goal
Развести domain model applications и firestore use cases.

## Tasks
- Разделить `features/applications/firestore/api.ts` на:
  - `queries.ts`
  - `mutations.ts`
  - `history.ts`
  - `mappers.ts`
  - `sanitizers.ts`
- Оставить `firestoreApplications.ts` как тонкий public facade.
- Вынести domain status helpers из consumers в `entities/application` public API.
- Разделить types:
  - domain types
  - firestore document types
  - DTO / mapper boundary

## Deliverable
Слой applications перестаёт быть большим monolithic service file.

## Definition of Done
- consumers не знают о внутренних firestore файлах
- status model экспортируется через entity public API

---

# Phase 7 — Loop and LoopMatch decycling

## Goal
Это один из самых грязных узлов. Его надо разрезать отдельно и жёстко.

## Tasks
- Разделить `loop` на:
  - `model/types.ts`
  - `model/constants.ts`
  - `model/platforms.ts`
  - `model/filters.ts`
  - `lib/links/*`
  - `api/*`
  - `ui/*`
- Запретить `model/index.ts` быть свалкой взаимных реэкспортов.
- Убрать зависимость `loop constants -> loopMatch` и обратную зависимость, если она есть через barrel.
- Для `loopMatch` отделить:
  - types
  - formatting
  - ui card parts
  - api
- `matchFormat` не должен замыкать цикл через `loop/model/index.ts`.
- `entities/loopMatch/api/loopMatchesApi.ts` не должен зависеть от `features/applications/firestoreApplications.ts`.
  - нужен либо mapper boundary, либо domain adapter layer.

## Deliverable
`loop` и `loopMatch` перестают быть взаимно сцепленными через barrels.

## Definition of Done
- нет циклов в `entities/loop*`
- `entities/loopMatch -> features/applications` = 0

---

# Phase 8 — Dashboard / Board / Matches cleanup

## Goal
После стабилизации entity contracts перевести consumers на нормальные публичные контракты.

## Tasks
- `DashboardPage`, `BoardPage`, `MatchesPage`, `ApplicationsPage` переставить на imports только из public APIs.
- Вынести page-specific controller hooks отдельно от pure aggregation logic.
- Все pure aggregations (`dashboardSummary`, `dashboardTimeSeries`, grouping/order helpers) сделать полностью test-ready.
- Перенести reusable UI blocks вверх или вниз по слоям осознанно, а не “где оказалось удобнее”.

## Deliverable
Pages становятся тонкими экранами-компоновщиками.

## Definition of Done
- page model не содержит infra-зависимостей, которые ей не принадлежат
- business computations вынесены в pure modules

---

# Phase 9 — Settings and i18n cleanup

## Goal
Убрать протечки между settings, auth, i18n и UI.

## Tasks
- Вынести типы `DateFormat`, `UserSettings`, `PipelineConfig` в стабильный контрактный модуль slice.
- Перестать импортировать их из глубины `api/userSettingsApi.ts`.
- Убрать связку connected components одновременно в `features` и `shared`.
- Свести translation ownership к ясному правилу:
  - page locales — в page
  - feature locales — в feature
  - shared locales — только truly shared keys

## Deliverable
Settings и i18n перестают быть размазанными по нескольким слоям.

## Definition of Done
- UI не тянет типы из deep api modules
- i18n ownership понятен и документирован

---

# Phase 10 — Duplication cleanup

## Goal
Сбить дублирование ниже порога без фанатизма и без абстракций ради абстракций.

## Tasks
- Свести формы к общим полевым примитивам.
- Убрать duplicate `LanguageSelectConnected`.
- Вынести повторяющиеся match summary/meta fragments.
- Привести `urlBuilders.ts` к data-driven конфигурации вместо копипаста веток.
- Убрать дубли в `LoginPage` / `RegisterPage` locales.

## Deliverable
Меньше повторов, меньше поддержки, меньше риска разъезда поведения.

## Definition of Done
- `jscpd` ниже порога
- нет дублирования connected containers

---

# Phase 11 — Testing phase

## Rule
Тесты начинаются **после стабилизации контрактов**, а не до неё.

## First mandatory test targets
- `entities/application/status`
- `entities/loop` filter/URL builders
- `entities/loopMatch` mappers/formatters
- `pages/DashboardPage/model/dashboardSummary.ts`
- `pages/DashboardPage/model/dashboardTimeSeries.ts`
- board grouping/order helpers
- firestore sanitizers/mappers

## Testing order
1. pure functions
2. selectors
3. hook-level logic
4. integration of critical flows

---

## Refactor unit of work

Каждая единица работы должна быть маленькой и замкнутой.

### Allowed scope for one PR
- один слой
- один slice
- один архитектурный шов

### Forbidden scope
- auth + loops + routing одновременно
- массовые косметические rename без смысла
- “починил по пути ещё 14 файлов” без плана

---

## Definition of Done for every feature rewrite

Каждая переписанная фича считается завершённой только если:
- `typecheck` green
- `lint` green
- `check:deps` не ухудшился
- `check:cycles` не ухудшился
- `check:dup` не ухудшился
- нет новых deep imports
- обновлён `docs/refactor/PROGRESS.md`
- написан короткий GitHub update
- коммиты имеют нормальные scoped names

---

## Business-facing explanation by phase

### Why business should support this

**Phase 0–2**
- уменьшают риск регрессий при любом новом релизе
- ускоряют вход новых разработчиков
- делают сроки задач предсказуемее

**Phase 3–7**
- сокращают стоимость изменений в auth / applications / loops / matches
- снижают цену багов в аналитике и статусах
- позволяют быстрее выпускать новые product flows

**Phase 8–10**
- повышают скорость UI-изменений
- уменьшают дубли и стоимость поддержки
- готовят код к тестированию и CI quality gates

**Phase 11**
- стабилизирует продукт и даёт безопасную основу для масштабирования

---

## Final command decision

### We do NOT do
- полный rewrite
- массовый перенос файлов без архитектурной цели
- тесты до стабилизации контрактов
- создание новых абстракций “на вырост” без реального потребителя

### We DO
- маленькие осмысленные refactor-итерации
- документируем архитектурные решения
- режем циклы и deep imports первыми
- пишем тесты после очистки контрактов

---

## First execution order

Начинать надо строго так:

1. Phase 0 — truth + guardrails
2. Phase 1 — router cleanup
3. Phase 2 — store cleanup
4. Phase 3 — auth decoupling
5. Phase 4 — shared detox
6. Phase 5 — public API normalization
7. Phase 6 — applications split
8. Phase 7 — loop / loopMatch decycling
9. Phase 8 — dashboard / board / matches cleanup
10. Phase 9 — settings / i18n cleanup
11. Phase 10 — duplication cleanup
12. Phase 11 — tests

Именно в таком порядке. Не наоборот.
