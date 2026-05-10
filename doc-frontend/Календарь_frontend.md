# Frontend — Календарь (`/dashboard/calendar`)

> Статус: **реализовано** (базовая версия с реальными данными из Firebase)

---

## Текущее состояние

Страница реализована в `src/pages/CalendarPage/CalendarPage.tsx`.

Маршрут: `/dashboard/calendar`  
Пункт в сайдбаре: **Calendar** (иконка `CalendarDays`)

---

## Что уже работает (без бэкенда)

| Функция | Источник данных | Статус |
|---|---|---|
| Месячная сетка с навигацией (‹/›) | вычисляется локально | ✅ |
| Текущий день (подсвечен primary-кружком) | `new Date()` | ✅ |
| Вид «Месяц» с событиями по ячейкам | Firebase `process.*` | ✅ |
| Чипы событий с цветовой кодировкой | tone из статуса | ✅ |
| Карточка «Сегодня» (события дня) | Firebase | ✅ |
| Ближайшие события (правая панель) | Firebase | ✅ |
| Переключатель День/Неделя/Месяц | UI только | ✅ (месяц активен) |
| События из `process.nextActionAt` | Firebase `ApplicationDoc` | ✅ точно |
| События из `process.followUpDueAt` | Firebase `ApplicationDoc` | ✅ точно |
| Интервью из статуса INTERVIEW_1/2 | Firebase `lastStatusChangeAt` | ⚠️ прокси-дата |
| Тестовое из статуса TEST_TASK | Firebase `lastStatusChangeAt` | ⚠️ прокси-дата |

---

## Маппинг событий (текущий алгоритм)

```typescript
// Приоритет 1: явная запланированная дата
if (process.nextActionAt) → событие на эту дату + время

// Приоритет 2: дедлайн follow-up
if (process.followUpDueAt) → "Follow-up · {company}", tone: "warning"

// Приоритет 3: прокси через lastStatusChangeAt
if (status === "INTERVIEW_1") → "HR · {company}", tone: "accent"
if (status === "INTERVIEW_2") → "Тех · {company}", tone: "info"
if (status === "TEST_TASK")   → "Тестовое · {company}", tone: "warning"
```

---

## Что нужно доделать на фронтенде

### 1. Подключить реальные события из бэкенда
Когда `GET /api/v1/calendar/events` будет готов — заменить `deriveEvents()` на RTK Query запрос:

```typescript
// Вместо:
const allEvents = useMemo(() => deriveEvents(rows), [rows]);

// После подключения бэкенда:
const { data } = useGetCalendarEventsQuery({ from, to });
```

Компонент `MonthGrid` и `UpcomingEvents` уже принимают `CalEvent[]` — менять их не нужно, только источник данных.

### 2. Создание событий вручную
Кнопка «Создать событие» сейчас нажата без действия. Нужно:
- Модальное окно: дата, время, заголовок, tone, привязка к заявке (optional)
- Вызов `POST /api/v1/calendar/events`
- Оптимистичное обновление сетки

```typescript
function CreateEventModal({ onClose, onSave }) {
  // DatePicker, TimePicker, текст, тип события
}
```

### 3. iCal Sync
Кнопка «Sync iCal» → открывает модал с `feedUrl` для копирования / открытия в системном календаре:

```typescript
function ICalModal({ feedUrl }) {
  return (
    <div>
      <p>Скопируй ссылку и добавь в Google Calendar / Apple Calendar:</p>
      <code>{feedUrl}</code>
      <button onClick={() => window.open(`webcal://...`)}>Открыть</button>
    </div>
  );
}
```

### 4. Виды «День» и «Неделя»
Сейчас показывают заглушку «Будет доступно после подключения бэкенда».

При наличии бэкенда (`GET /api/v1/calendar/events`) реализовать:

**Вид «Неделя»:**
- 7 колонок (Пн–Вс)
- Временна́я шкала 07:00–22:00 по вертикали
- Блоки событий с позиционированием по времени

**Вид «День»:**
- Одна колонка
- Временна́я шкала с блоками событий
- Кнопка «Сегодня»

### 5. Кликабельность событий
Сейчас чипы не открывают детали. Нужно:
- Клик на чип → открывает `ApplicationDetailsPage` по `appId` (если есть)
- Клик на чип ручного события → открывает inline-редактирование события

### 6. Напоминания
После того как бэкенд реализует `POST /api/v1/calendar/events/:id/reminder`:
- При наведении на событие → кнопка «🔔 Напомнить»
- Выбор времени (за 15 мин / 1 час / 1 день)

---

## Архитектура (рекомендация)

Вынести логику в хук `useCalendarData(month: Date)`:

```typescript
// src/pages/CalendarPage/model/useCalendarData.ts
export function useCalendarData(year: number, month: number) {
  // Phase 1 (current): Firebase
  // Phase 2: RTK Query → GET /api/v1/calendar/events

  return {
    events: CalEvent[],
    eventsByDate: Map<string, CalEvent[]>,
    isLoading: boolean,
    createEvent: (payload) => Promise<void>,
  };
}
```

Компоненты `MonthGrid`, `UpcomingEvents` остаются чисто презентационными.

---

## Локализация

Сейчас все строки захардкожены на русском. При добавлении i18n:
- Названия месяцев → `useTranslation` + ключи `calendar.months.*`
- Дни недели → `calendar.weekdays.*`
- Кнопки → `calendar.actions.*`
