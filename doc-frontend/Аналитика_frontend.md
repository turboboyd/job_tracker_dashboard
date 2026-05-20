# Frontend — Аналитика (`/dashboard/analytics`)

> Автор: senior fullstack engineer  
> Статус: **актуально** · частично подключены реальные данные Firebase

---

## Текущее состояние

Страница аналитики (`DashboardAnalyticsPage.tsx`) переработана: большинство KPI и секций теперь используют реальные данные из Firebase через хук `useDashboardData()`. Источники заявок остаются плейсхолдером (нет поля `platform` в схеме).

---

## Что уже работает на клиенте (без бэкенда)

| Функция | Источник данных | Статус |
|---|---|---|
| KPI: заявок отправлено | `matchesAll` filtered by range | ✅ реально |
| KPI: ответы от компаний % | `pipelineSummary.byColumn` | ✅ реально |
| KPI: дошли до оффера % | `pipelineSummary.byColumn` | ✅ реально |
| KPI: среднее время в воронке | `updatedAt − createdAt` (median) | ✅ реально |
| Воронка (4 шага) | `pipelineSummary.byColumn` | ✅ реально |
| Спарклайн — заявки | `bucketByPeriod(matchesAll)` | ✅ реально (приближение) |
| Спарклайн — ответы | `bucketByPeriod(matchesAll)` | ✅ реально (приближение) |
| Спарклайн — оффер/воронка | — | ❌ нужен бэкенд |
| Недельная активность | `matchesAll` grouped by ISO week | ✅ реально |
| Loss breakdown — нет ответа | `byColumn.NO_RESPONSE` | ✅ реально |
| Loss breakdown — после HR/тех | `statusHistory` analysis | ✅ реально (приближение) |
| Инсайт по потерям | computed from lossBreakdown | ✅ реально |
| Источники заявок | — | ❌ нет поля `platform` в Firebase |
| Дельта KPI (+18% и т.д.) | — | ❌ нужен бэкенд (сравнение периодов) |
| Экспорт CSV | — | ❌ нужен бэкенд |

---

## Как вычисляются реальные метрики

### KPI

```typescript
// Из matchesAll, отфильтрованных по выбранному временному диапазону:
totalApplied = rangeMatches.filter(m => m.status !== "SAVED").length

// Из pipelineSummary (все время, не только range):
hrScreenCount = byColumn["INTERVIEW"] + byColumn["OFFER"] + byColumn["HIRED"]
offerCount    = byColumn["OFFER"] + byColumn["HIRED"]
replyRate     = Math.round(hrScreenCount / pipelineSummary.total * 100)
interviewRate = Math.round(offerCount / pipelineSummary.total * 100)

// Медиана времени в воронке — по закрытым матчам (REJECTED, HIRED, NO_RESPONSE):
pipelineDays = median(matchesAll
  .filter(m => ["REJECTED","HIRED","NO_RESPONSE"].includes(m.status))
  .map(m => (updatedAt - createdAt) / 86400000))
```

### Воронка

Четыре реальных шага (вместо пяти с фейковым «Техническим»):
- **Отклики** = `pipelineSummary.total`
- **HR-скрин** = INTERVIEW + OFFER + HIRED
- **Оффер** = OFFER + HIRED
- **Принят** = HIRED

### Недельная активность

`matchesAll` группируется по ISO-неделям через `getISOWeek()`. Показывает последние N недель:
- 7д → 2 недели, 30д → 5 недель, 90д → 13 недель, всё → 26 недель.

### Loss breakdown

- «Нет ответа > 14д» = `byColumn["NO_RESPONSE"]` (точно)
- «Отказ после HR» = REJECTED с `maxStage >= INTERVIEW_1` в `statusHistory` (приближение)
- «Отказ после тех.» = REJECTED с `maxStage >= INTERVIEW_2/TEST_TASK` (приближение)
- «Другой отказ» = `byColumn["REJECTED"]` − прочие категории

---

## Что нужно сделать на фронтенде

1. **Подключить фильтр по направлениям поиска (`loopsFilter`)** — `setLoopsFilter` есть в хуке, но `matchesAll` сейчас не фильтруется по `loopId`. Нужно добавить фильтр в `rangeMatches`.

2. **Дельта показателей** — как только бэкенд вернёт `GET /api/v1/analytics/kpi?range=X`, сравнивать текущий период с предыдущим и показывать `+18%` / `−3д`.

3. **Источники** — как только бэкенд вернёт `GET /api/v1/analytics/sources`, убрать empty state и рендерить реальные данные с прогресс-барами.

4. **Экспорт** — кнопка «Экспорт» должна вызывать `GET /api/v1/analytics/export?range=X&format=csv` и скачивать файл через `<a download>`.

5. **Точные спарклайны** — сейчас `offer` и `pipelineDays` sparklines возвращают `[0,0,...,0]`. После подключения `/api/v1/analytics/kpi` заполнить из `sparklines.interviewRate` и `sparklines.medianDaysInPipeline`.

6. **Реалтайм обновления** — рефетчить KPI при изменении статуса (SSE или рефетч через React Query invalidation).

---

## Архитектура (рекомендация)

**Сейчас:** вся логика вычислений живёт внутри `DashboardAnalyticsPage`. При росте сложности это станет проблемой.

**Рекомендуется вынести:**

```
src/pages/DashboardPage/
  model/
    useDashboardData.ts        ← уже есть
    useAnalyticsKpis.ts        ← NEW: вычисление KPI из matchesAll
    useAnalyticsLoss.ts        ← NEW: loss breakdown
    useAnalyticsWeekly.ts      ← NEW: weekly bucketing
```

Когда бэкенд будет готов, `useAnalyticsKpis` можно переключить на `useQuery` (React Query / RTK Query) без изменения компонента.

**Пример:**

```typescript
// useAnalyticsKpis.ts
export function useAnalyticsKpis(matchesAll, pipelineSummary, timeRange) {
  // ... вся логика вычислений
  return { totalApplied, replyRate, interviewRate, pipelineDays, sparkBuckets };
}
```
