# Frontend — Страница «Оптимизация поиска» (`/dashboard/optimization`)

## Файл

`src/pages/OptimizationPage/OptimizationPage.tsx`

## Маршрут

`/dashboard/optimization` → `AppRoutes.OPTIMIZATION`

---

## Что реализовано

### Шапка страницы
- Breadcrumb: Loopboard / Воркспейс / Оптимизация
- Кнопки «Перепроверить» (outline) и «Применить топ-3» (primary, Sparkles icon)
- Subtitle о влиянии рекомендаций

### Score row (Section 1)
- **Donut chart** — чистый SVG (без внешних библиотек), `r=42`, `stroke-width=10`
  - Серый трек + primary дуга прогресса
  - Центральный текст: score / 100
  - Справа: ярлык «Качество поиска» + «Можно лучше» / «Отлично»
- **«Рекомендаций»** — count найденных инсайтов
- **«Применено за неделю»** — заглушка «—»

### Score computation (из реальных данных)
```typescript
score = min(100, 22 + replyRate>0 ? 20 : 0 + interviewRate>0 ? 15 : 0 + hasMatches ? 10 : 0)
```
Использует `pipelineSummary.byColumn` из `useDashboardData()`.

### Insights list (Section 2)
- Каждая карточка: цветная accent-полоса слева (6px) + content справа
- Badge с severity (критично / высокий / средний / низкий)
- Метаданные: область · потенциал %
- Кнопки действий навигируют через `useNavigate()`

### Реальный инсайт (stale applications)
```typescript
staleCount = matchesAll.filter(m => status===ACTIVE||APPLIED && updatedAt > 14 дней назад).length
```
Если `staleCount > 0` — вставляется инсайт «follow-up по N заявкам».

### Статические инсайты
1. Добавь интервью в календарь (high)
2. Синхронизируй Google Calendar (low)

### Навигация из кнопок
- «Открыть календарь» → `/dashboard/calendar`
- «Открыть заявки» → `/dashboard/applications`

---

## Что НЕ реализовано (нужен бэкенд)

| Функция | Статус |
|---|---|
| Реальный AI-скоринг качества поиска | ❌ нет `GET /api/v1/optimization/insights` |
| «Применено за неделю» | ❌ нет tracking применения |
| «Применить топ-3» — автоматическое применение | ❌ нет API |
| Персонализированные инсайты (AI) | ❌ нет API |
| История изменений score | ❌ нет API |

---

## Зависимости

- `useDashboardData` → `src/pages/DashboardPage/model/useDashboardData`
- `toMillis` → `src/shared/lib/firestore/toMillis`
- `Button` → `src/shared/ui`
- Иконки: `lucide-react` (`Sparkles`, `ArrowUpRight`)
- Роутинг: `useNavigate` из `react-router-dom`
