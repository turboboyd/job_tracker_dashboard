# Backend Documentation — Loopboard

Этот раздел описывает **требования к серверной части** для каждой страницы приложения.

Документы написаны с точки зрения **senior fullstack/backend engineer** и содержат:
- Описание всех необходимых API-эндпоинтов
- Структуры запросов и ответов (Request / Response)
- Бизнес-логику на сервере
- Требования к базе данных (индексы, схемы)
- Авторизацию и валидацию
- Фоновые задачи и события

---

## Текущее состояние

Бэкенд реализован на **Firebase / Firestore** (прямые SDK-вызовы из клиента).
Весь код, который нужно перенести, помечен комментарием:

```ts
// TODO(backend-migration): ...
```

---

## Стек целевого бэкенда (рекомендация)

| Слой | Технология |
|---|---|
| Runtime | Node.js 20+ / Bun |
| Framework | Fastify или NestJS |
| ORM | Prisma (PostgreSQL) или Drizzle |
| Auth | JWT + Refresh Token / Auth0 / Clerk |
| Queue / Jobs | BullMQ (Redis) |
| AI / Matching | OpenAI API / собственная модель |
| Storage | S3-compatible (PDF резюме) |
| Realtime | WebSocket или SSE (для уведомлений) |

---

## Файлы документации

| Файл | Страница |
|---|---|
| `Мои заявки_backend.md` | `/dashboard/applications` — список и управление заявками |
| *(скоро)* `Детали заявки_backend.md` | `/dashboard/applications/:id` — детальная карточка |
| *(скоро)* `Доска_backend.md` | `/dashboard/board` — Kanban |
| *(скоро)* `Мои циклы_backend.md` | `/dashboard/loops` — поисковые циклы |
| *(скоро)* `Дашборд_backend.md` | `/dashboard` — обзор и аналитика |
| *(скоро)* `Матчинг_backend.md` | AI matching engine |
| *(скоро)* `Авторизация_backend.md` | Auth / пользователи |

---

## Соглашения по API

- Базовый префикс: `/api/v1/`
- Аутентификация: `Authorization: Bearer <jwt>`
- Формат дат: ISO 8601 (`2026-05-09T10:00:00Z`)
- Пагинация: cursor-based (`?cursor=<id>&limit=50`)
- Ошибки: RFC 7807 Problem Details

```json
{
  "type": "https://loopboard.app/errors/not-found",
  "title": "Application not found",
  "status": 404,
  "detail": "Application demoApp_01 does not exist for this user",
  "instance": "/api/v1/applications/demoApp_01"
}
```
