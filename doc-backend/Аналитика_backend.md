# Backend — Аналитика (`/dashboard/analytics`)

> Автор: senior fullstack/backend engineer  
> Статус: **черновик** · Firebase → REST migration

---

## Обзор страницы

Дашборд аналитики показывает агрегированные метрики поиска работы: KPI-карточки со спарклайнами, воронка конверсии, источники вакансий, недельная активность и анализ причин отказов. Данные фильтруются по диапазону дат (7д / 30д / 90д / всё) и по поисковым циклам.

---

## Текущее состояние (клиент)

Часть метрик уже вычисляется на клиенте из Firebase без бэкенда:

| Метрика | Источник | Точность |
|---|---|---|
| Заявок отправлено | `matchesAll` (Firestore) | ✅ точно |
| % ответов (HR-скрин) | `pipelineSummary.byColumn` | ✅ точно |
| % оффер | `pipelineSummary.byColumn` | ✅ точно |
| Медианное время цикла | `updatedAt − createdAt` | ⚠️ приближение |
| Воронка (4 этапа) | `pipelineSummary.byColumn` | ✅ точно |
| Недельная активность | `matchesAll` grouped | ✅ точно |
| Loss breakdown | `statusHistory` + `byColumn` | ⚠️ приближение |
| Спарклайны | client-side бакеты | ⚠️ приближение |

**Что требует бэкенда:**
- Источники заявок (нет поля `platform` в Firebase — всегда `null`)
- Дельта показателей (нужно сравнение с прошлым периодом)
- Точные спарклайны по всем метрикам (оффер-рейт, время цикла)
- Экспорт CSV
- Кэшированные агрегаты для больших объёмов данных (> 500 заявок)

---

## 1. KPI — сводные метрики

### `GET /api/v1/analytics/kpi`

Возвращает агрегированные показатели за указанный диапазон + исторические ряды для спарклайнов.

**Query params:**

| Param     | Тип    | Default | Описание |
|-----------|--------|---------|----------|
| `range`   | string | `30d`   | `7d` / `30d` / `90d` / `all` |
| `loopId`  | UUID   | —       | Фильтр по циклу |

#### Response `200`

```json
{
  "range": "30d",
  "kpi": {
    "totalApplied": 36,
    "replyRate": 58,
    "interviewRate": 39,
    "medianDaysInPipeline": 19
  },
  "sparklines": {
    "totalApplied":          [2, 3, 1, 4, 2, 5, 3, 6, 4, 2, 3, 1],
    "replyRate":             [45, 50, 55, 52, 58, 60, 57, 58, 62, 58, 55, 58],
    "interviewRate":         [30, 35, 32, 38, 36, 40, 37, 39, 41, 39, 37, 39],
    "medianDaysInPipeline":  [22, 21, 20, 19, 18, 20, 19, 19, 18, 19, 20, 19]
  }
}
```

**Бизнес-логика:**

- `totalApplied` — кол-во матчей со статусом ≠ `SAVED` за период
- `replyRate` — (`INTERVIEW_1` + выше) / `totalApplied` × 100
- `interviewRate` — (`TEST_TASK` + выше) / `totalApplied` × 100
- `medianDaysInPipeline` — медиана разности `hired_at` / `rejected_at` − `matched_at` по закрытым матчам
- `sparklines` — дневные бакеты по 1 точке на каждый N дней (12 точек в окне `range`)

**БД-запрос (sparklines — ежедневные бакеты):**

```sql
SELECT
  date_trunc('day', matched_at) AS bucket,
  COUNT(*) FILTER (WHERE status <> 'SAVED')                                AS applied,
  COUNT(*) FILTER (WHERE status IN ('INTERVIEW_1','INTERVIEW_2','TEST_TASK','OFFER','HIRED')) AS replied,
  PERCENTILE_CONT(0.5) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (COALESCE(hired_at, updated_at) - matched_at)) / 86400
  ) AS median_days
FROM loop_matches
WHERE user_id = $1
  AND matched_at >= now() - $2::interval
  AND deleted_at IS NULL
GROUP BY bucket
ORDER BY bucket;
```

---

## 2. Воронка конверсии

### `GET /api/v1/analytics/funnel`

Возвращает количество на каждом этапе воронки.

**Query params:** `range`, `loopId` (те же, что у KPI)

#### Response `200`

```json
{
  "steps": [
    { "stage": "applied",     "label": "Отклики",       "count": 36, "pct": 100 },
    { "stage": "hr_screen",   "label": "HR-скрин",      "count": 21, "pct": 58  },
    { "stage": "technical",   "label": "Технический",   "count": 14, "pct": 39  },
    { "stage": "final",       "label": "Финал",         "count": 8,  "pct": 22  },
    { "stage": "offer",       "label": "Оффер",         "count": 3,  "pct": 8   }
  ]
}
```

**Маппинг статусов → этапы:**

| Этап воронки | Статусы loop_matches |
|---|---|
| `applied`   | все кроме `SAVED` |
| `hr_screen` | `INTERVIEW_1`, `INTERVIEW_2`, `TEST_TASK`, `OFFER`, `HIRED` |
| `technical` | `INTERVIEW_2`, `TEST_TASK`, `OFFER`, `HIRED` |
| `final`     | `TEST_TASK`, `OFFER`, `HIRED` |
| `offer`     | `OFFER`, `HIRED` |

```sql
SELECT
  COUNT(*) FILTER (WHERE status <> 'SAVED')                                                        AS applied,
  COUNT(*) FILTER (WHERE status IN ('INTERVIEW_1','INTERVIEW_2','TEST_TASK','OFFER','HIRED'))       AS hr_screen,
  COUNT(*) FILTER (WHERE status IN ('INTERVIEW_2','TEST_TASK','OFFER','HIRED'))                    AS technical,
  COUNT(*) FILTER (WHERE status IN ('TEST_TASK','OFFER','HIRED'))                                  AS final_round,
  COUNT(*) FILTER (WHERE status IN ('OFFER','HIRED'))                                              AS offer
FROM loop_matches
WHERE user_id = $1
  AND ($2::interval IS NULL OR matched_at >= now() - $2::interval)
  AND deleted_at IS NULL;
```

---

## 3. Источники вакансий

### `GET /api/v1/analytics/sources`

Разбивка отликов и ответов по платформам.

**Query params:** `range`, `loopId`

#### Response `200`

```json
{
  "sources": [
    { "platform": "LinkedIn",       "applied": 14, "replied": 8,  "pct": 39 },
    { "platform": "Сайты компаний", "applied": 9,  "replied": 5,  "pct": 25 },
    { "platform": "AngelList",      "applied": 6,  "replied": 3,  "pct": 17 },
    { "platform": "Реферал",        "applied": 5,  "replied": 4,  "pct": 14 },
    { "platform": "Hacker News",    "applied": 2,  "replied": 1,  "pct": 5  }
  ]
}
```

```sql
SELECT
  COALESCE(platform, 'Other') AS platform,
  COUNT(*)                                                             AS applied,
  COUNT(*) FILTER (WHERE status NOT IN ('ACTIVE','SAVED','NO_RESPONSE','REJECTED')) AS replied,
  ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0))         AS pct
FROM loop_matches
WHERE user_id = $1
  AND status <> 'SAVED'
  AND deleted_at IS NULL
GROUP BY platform
ORDER BY applied DESC
LIMIT 10;
```

**Требования к данным:**
- Поле `platform` на `loop_matches` заполняется AI-воркером при матчинге (источник вакансии)
- Значения: `'linkedin'` / `'indeed'` / `'xing'` / `'stepstone'` / `'company_site'` / `'referral'` / `'hn'` / `null`

---

## 4. Недельная активность

### `GET /api/v1/analytics/weekly`

Агрегация отликов по неделям для bar-chart.

**Query params:** `weeks` (int, default `12`), `loopId`

#### Response `200`

```json
{
  "weeks": [
    { "week": "2026-W07", "label": "17 фев", "applied": 2, "replied": 1, "hired": 0 },
    { "week": "2026-W08", "label": "24 фев", "applied": 5, "replied": 3, "hired": 0 },
    { "week": "2026-W09", "label": "3 мар",  "applied": 3, "replied": 1, "hired": 0 },
    { "week": "2026-W18", "label": "4 май",  "applied": 6, "replied": 4, "hired": 1 }
  ]
}
```

```sql
SELECT
  TO_CHAR(date_trunc('week', matched_at), 'IYYY"-W"IW') AS week,
  MIN(matched_at)::date                                  AS week_start,
  COUNT(*)                                               AS applied,
  COUNT(*) FILTER (WHERE status NOT IN ('ACTIVE','SAVED','NO_RESPONSE','REJECTED')) AS replied,
  COUNT(*) FILTER (WHERE status = 'HIRED')               AS hired
FROM loop_matches
WHERE user_id = $1
  AND matched_at >= now() - ($2 || ' weeks')::interval
  AND deleted_at IS NULL
GROUP BY week
ORDER BY week;
```

---

## 5. Анализ причин отказов (Loss Breakdown)

### `GET /api/v1/analytics/loss-reasons`

Разбивка закрытых без оффера этапов — причины dropout.

**Query params:** `range`, `loopId`

#### Response `200`

```json
{
  "total_rejected": 18,
  "by_stage": [
    { "stage": "no_response",  "label": "Нет ответа",         "count": 8,  "pct": 44 },
    { "stage": "after_hr",     "label": "После HR-скрина",     "count": 5,  "pct": 28 },
    { "stage": "after_tech",   "label": "После технического",  "count": 3,  "pct": 17 },
    { "stage": "after_final",  "label": "После финала",        "count": 2,  "pct": 11 }
  ],
  "top_insight": "44% заявок не получили ответа — попробуй добавить follow-up через 7 дней"
}
```

**Маппинг статусов → потери:**

| Причина | Условие |
|---|---|
| `no_response` | `status = 'NO_RESPONSE'` |
| `after_hr`   | `status = 'REJECTED'` AND имел `INTERVIEW_1` в истории |
| `after_tech` | `status = 'REJECTED'` AND имел `INTERVIEW_2` в истории |
| `after_final`| `status = 'REJECTED'` AND имел `TEST_TASK` в истории |

> **Примечание:** для точного маппинга нужна таблица `loop_match_history` (переходы статусов). На первой итерации можно приближать: `REJECTED` без истории → `after_hr`.

---

## 6. Экспорт аналитики

### `GET /api/v1/analytics/export`

Генерирует CSV-файл с полными данными за период.

**Query params:** `range`, `loopId`, `format` (`csv` | `xlsx`)

#### Response `200`

```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="loopboard-analytics-2026-05.csv"

date,company,role,platform,status,days_in_pipeline
2026-04-01,GitHub,Senior FE,linkedin,HIRED,28
...
```

---

## 7. PostgreSQL — вспомогательные таблицы

### `analytics_daily_snapshots` (необязательно — оптимизация)

Для больших объёмов (> 10 000 матчей) предварительно агрегировать метрики по дням:

```sql
CREATE TABLE analytics_daily_snapshots (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id),
  date       DATE NOT NULL,
  applied    INT NOT NULL DEFAULT 0,
  replied    INT NOT NULL DEFAULT 0,
  hired      INT NOT NULL DEFAULT 0,
  rejected   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX idx_ads_user_date ON analytics_daily_snapshots(user_id, date);
```

Заполняется cron-задачей ежедневно в 02:00 UTC или через BullMQ после каждого изменения статуса.

### `loop_match_history` (переходы статусов)

Требуется для точного loss-breakdown:

```sql
CREATE TABLE loop_match_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id   UUID NOT NULL REFERENCES loop_matches(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL,
  from_status TEXT,
  to_status   TEXT NOT NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lmh_match ON loop_match_history(match_id);
CREATE INDEX idx_lmh_user  ON loop_match_history(user_id, changed_at);
```

Триггер или application-layer — при каждом `PATCH /loop-matches/:id/status`:

```sql
INSERT INTO loop_match_history (match_id, user_id, from_status, to_status)
VALUES ($1, $2, $3, $4);
```

---

## 8. Кэширование

| Эндпоинт | Стратегия | TTL |
|---|---|---|
| `GET /analytics/kpi` | Redis cache by `(userId, range, loopId)` | 5 мин |
| `GET /analytics/funnel` | Redis cache | 5 мин |
| `GET /analytics/sources` | Redis cache | 15 мин |
| `GET /analytics/weekly` | Redis cache | 15 мин |
| `GET /analytics/loss-reasons` | Redis cache | 15 мин |
| `GET /analytics/export` | Генерация по запросу | — |

Инвалидация: при `PATCH /loop-matches/:id/status` → `DEL analytics:*:userId` через BullMQ.

---

## 9. Миграция Firebase → REST

| Текущий код (клиент) | Целевой эндпоинт |
|---|---|
| `matchesAll.filter(...)` по range | `GET /api/v1/analytics/kpi?range=30d` |
| `pipelineSummary.byColumn` | `GET /api/v1/analytics/funnel` |
| Placeholder data (sources, weekly) | `GET /api/v1/analytics/sources`, `GET /api/v1/analytics/weekly` |
| Нет loss-breakdown | `GET /api/v1/analytics/loss-reasons` |
| `DashboardTrendsCard` — `chartMatches` | постепенно → `GET /api/v1/analytics/weekly` |

---

## 10. Оценка трудозатрат

| Задача | Оценка |
|---|---|
| GET /analytics/kpi + sparklines | 1.5 дня |
| GET /analytics/funnel | 0.5 дня |
| GET /analytics/sources | 1 день |
| GET /analytics/weekly | 0.5 дня |
| GET /analytics/loss-reasons | 1 день |
| loop_match_history триггер | 0.5 дня |
| Redis кэш + инвалидация | 1 день |
| analytics_daily_snapshots cron | 1 день |
| GET /analytics/export (CSV) | 1 день |
| **Итого** | **~8 рабочих дней** |
