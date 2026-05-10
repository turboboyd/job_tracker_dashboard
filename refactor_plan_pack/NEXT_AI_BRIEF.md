# NEXT AI BRIEF — Job Tracker Dashboard

## Mission
Сделать staged architectural cleanup без rewrite продукта.

## Non-negotiable rules
- Не делать big bang rewrite.
- Не трогать сразу несколько доменов в одном PR.
- Не писать тесты до стабилизации контрактов и public API.
- Не добавлять новые deep imports.
- Не импортировать route composition из pages.
- Не тянуть `app/store/hooks` в `entities`.
- Не тянуть `entities` в `shared`.

## Current repo truths
- `typecheck` green.
- `dependency-cruiser` показывает 134 violations.
- `jscpd` показывает 3.32% duplication при пороге 2%.
- `madge` сейчас даёт ложный зелёный статус: processed 0 files.
- `entities/application` не имеет `index.ts`.
- `app/store/rootReducer.ts` импортирует `pages/LoopsPage/model/loopsUiSlice.ts`.
- `shared/api/rtk/requireUid.ts` зависит от `entities/auth`.
- `shared/config/i18n/i18n.ts` импортирует локали из `app/widgets/header`.
- `entities/userSettings/api/userSettingsApi.ts` зависит от `RootState`.
- `entities/loopMatch/api/loopMatchesApi.ts` зависит от `features/applications/firestoreApplications.ts`.

## First task to execute

### Task 1
Починить truth layer.

#### Do
- Настроить `madge` так, чтобы он реально анализировал `src` и понимал alias.
- Добавить `check:arch`.
- Зафиксировать baseline нарушений в docs.

#### Do not
- Не начинать с loops, dashboard или forms.
- Не делать косметические rename.

## Second task
Разрезать router cycle.

#### Do
- Вынести `AppRoutes` и `RoutePath` в `shared/config/routes`.
- Оставить `routeConfig` только для композиции маршрутов.
- Перевести pages на импорт route constants, а не route composition.

## Expected working style
- Один шаг — один PR.
- После каждого PR обновить `PROGRESS.md`.
- После каждого PR написать короткий GitHub update.
- Коммиты только scoped.

## Exit criteria for any task
- `typecheck` green
- architecture checks not worse
- no new deep imports
- doc updated
- GitHub update prepared
