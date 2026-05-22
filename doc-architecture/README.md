# Архитектура трёх ключевых экранов

> **Назначение:** общая архитектурная спецификация для пользовательского флоу Loop → Matches → Applications. Документы пишутся параллельно для frontend и backend, чтобы и Claude, и Codex могли работать по единому контракту.
>
> **Дизайн:** Loopboard Redesign — `https://api.anthropic.com/v1/design/h/v2BYckGXzsl1-EqugnACwg?open_file=Loopboard+Redesign.html`. Применять только релевантные аспекты, не делать слепое копирование HTML.

---

## Пользовательский флоу

```
[1. Loop]                [2. Matches]             [3. Applications]
─────────                ─────────────             ──────────────────
Создать                  Найти вакансии            Подать → Интервью
направление  ──── Loop ──→ через discovery   ─── → Оффер / Отказ
поиска       loopId       (9 источников)            (воронка)

route: /dashboard/loops    /dashboard/matches      /dashboard/applications
```

| Сущность | Где живёт | Источник | Что хранит |
|---|---|---|---|
| **Loop** | таблица `loops` | пользователь создаёт вручную | фильтры поиска: роль, локация, радиус, платформы, ключевые слова |
| **VacancyMatch** | таблица `vacancy_matches` | discovery + явное «Сохранить» | вакансия из интернета, сохранённая для Loop |
| **Application** | таблица `applications` | конвертация из Match или manual | заявка в воронке со статусом, историей, заметками |

**Связь:** `Loop → 1:N → VacancyMatch → 0..1 → Application`. Application всегда имеет `loop_id` (если создана из Match) и опциональный `vacancy_match_id`.

---

## Документы

| Файл | Этап | Маршруты |
|---|---|---|
| [01_Loops_архитектура.md](./01_Loops_архитектура.md) | 1 — направление поиска | `/dashboard/loops`, `/dashboard/loops/:loopId` |
| [02_Matches_архитектура.md](./02_Matches_архитектура.md) | 2 — discovery и сохранённые матчи | `/dashboard/matches`, `/dashboard/matches/:matchId` |
| [03_Applications_архитектура.md](./03_Applications_архитектура.md) | 3 — воронка заявок | `/dashboard/applications`, `/dashboard/applications/:applicationId` |

Каждый документ содержит:
1. **Контекст** — что это, как связано с другими этапами.
2. **Текущее состояние** — что уже реализовано (файлы frontend, эндпоинты backend, gaps).
3. **Целевая архитектура** — структура экрана, модель данных (SQL), эндпоинты, контракты DTO.
4. **Frontend план** — этапы внедрения (1-5 дней каждый).
5. **Backend план** — этапы внедрения (1-2 дня каждый).
6. **Acceptance criteria** — что должно работать, чтобы этап считался готовым.
7. **Связь со следующими этапами** — как соединяется с другими экранами.

---

## Принципы

1. **Один source of truth — REST.** Никаких прямых Firebase-вызовов из новых страниц. Всё через `/api/v1/...`.
2. **Server-side агрегации.** Счётчики статусов / метрики / суммы — считаются на сервере одним запросом, не на клиенте через `useMemo`.
3. **Идемпотентность POST.** Convert-from-match при повторном вызове возвращает existing `application_id`, не создаёт дубликат.
4. **Soft delete.** Loops и Applications → `archived=true` или `status='archived'`, физически не удаляются. История сохраняется.
5. **Дедупликация на стыке.** Между источниками discovery, между сохранёнными match'ами одного Loop, между applications с одинаковым `source_url`.
6. **Привязка к Loop опциональна, но рекомендуема.** Application можно создать без Loop (manual), но тогда не работают агрегации по Loop в дашборде.

---

## Глоссарий

- **Loop / Направление** — сохранённый поисковый профиль.
- **Match / Совпадение** — найденная вакансия (превью или сохранённая).
- **Application / Заявка** — отклик пользователя в воронке.
- **Discovery** — backend-процесс опроса 9 источников по фильтрам Loop.
- **Convert** — преобразование сохранённого Match в Application.
- **Stage** — крупная группировка статуса для Kanban: ACTIVE / INTERVIEW / OFFER / HIRED / REJECTED / NO_RESPONSE / ARCHIVED.

---

## Куда дальше

После того как эти три экрана доведены до прод-готовности, открываются следующие шаги:

1. **Board** (`/dashboard/board`) — Kanban по applications, drag-and-drop между статусами.
2. **Calendar** (`/dashboard/calendar`) — события из applications (interviews, follow-ups).
3. **Analytics** (`/dashboard/dashboard/analytics`) — воронка, top loops, sources, weekly activity.
4. **Activity feed** (`/dashboard/activity`) — лента всех событий из 3 экранов.

Все они **читают** данные из тех же трёх таблиц (`loops`, `vacancy_matches`, `applications`) — поэтому правильный контракт ниже критичен.
