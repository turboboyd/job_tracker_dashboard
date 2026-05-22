import { useMemo, useState } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────

type Category = "all" | "behavioral" | "situational" | "company" | "technical" | "about-you";

interface Question {
  id: string;
  text: string;
  category: Exclude<Category, "all">;
  tip?: string;
}

const QUESTIONS: Question[] = [
  // About you
  { id: "ay1", category: "about-you", text: "Расскажите о себе.", tip: "2–3 минуты: опыт → достижения → почему эта роль." },
  { id: "ay2", category: "about-you", text: "Каковы ваши сильные стороны?", tip: "Назовите 2–3 и подкрепите конкретным примером." },
  { id: "ay3", category: "about-you", text: "Какие ваши слабые стороны и как вы над ними работаете?", tip: "Честно + покажите прогресс." },
  { id: "ay4", category: "about-you", text: "Почему вы уходите с текущего места работы?" },
  { id: "ay5", category: "about-you", text: "Где вы видите себя через 3–5 лет?" },
  { id: "ay6", category: "about-you", text: "Каковы ваши зарплатные ожидания?" },

  // Behavioral (STAR)
  { id: "be1", category: "behavioral", text: "Расскажите о ситуации, когда вы решили сложную проблему.", tip: "Используйте формат STAR: Ситуация → Задача → Действие → Результат." },
  { id: "be2", category: "behavioral", text: "Опишите случай, когда вы не уложились в дедлайн. Что произошло?", tip: "Фокус на том, что вы сделали и что узнали." },
  { id: "be3", category: "behavioral", text: "Приведите пример конфликта с коллегой. Как вы его разрешили?" },
  { id: "be4", category: "behavioral", text: "Расскажите о своём крупнейшем профессиональном достижении." },
  { id: "be5", category: "behavioral", text: "Опишите случай, когда вам пришлось быстро освоить новую технологию или навык." },
  { id: "be6", category: "behavioral", text: "Как вы расставляете приоритеты, когда задач больше, чем времени?" },
  { id: "be7", category: "behavioral", text: "Расскажите о проекте, которым вы особенно гордитесь." },
  { id: "be8", category: "behavioral", text: "Был ли у вас опыт работы с недовольным клиентом или заказчиком?" },

  // Situational
  { id: "si1", category: "situational", text: "Что бы вы сделали, если бы обнаружили ошибку в продакшене за час до релиза?", tip: "Покажите структурное мышление и способность сохранять спокойствие." },
  { id: "si2", category: "situational", text: "Руководитель ставит невыполнимый дедлайн. Ваши действия?" },
  { id: "si3", category: "situational", text: "Коллега делает работу неправильно, но не принимает обратную связь. Что вы будете делать?" },
  { id: "si4", category: "situational", text: "Вам поручили проект, в котором вы не разбираетесь. Как поступите?" },
  { id: "si5", category: "situational", text: "Как бы вы вели себя, если бы две задачи с высоким приоритетом пришли одновременно?" },

  // Company & role
  { id: "co1", category: "company", text: "Почему именно наша компания?", tip: "Покажите, что вы изучили продукт, культуру и миссию." },
  { id: "co2", category: "company", text: "Почему вас привлекает именно эта позиция?" },
  { id: "co3", category: "company", text: "Что вы знаете о нашем продукте / услуге?" },
  { id: "co4", category: "company", text: "Как бы вы улучшили наш продукт или процессы?", tip: "Можно подготовить 1–2 идеи заранее." },
  { id: "co5", category: "company", text: "Какие вопросы у вас есть к нам?", tip: "Всегда готовьте 2–3 вопроса о команде, процессах, ожиданиях." },

  // Technical / role-specific
  { id: "te1", category: "technical", text: "Опишите ваш стек и почему вы его выбрали для последнего проекта." },
  { id: "te2", category: "technical", text: "Как вы обеспечиваете качество кода / работы в команде?" },
  { id: "te3", category: "technical", text: "Как вы остаётесь в курсе последних технологий и трендов в вашей области?" },
  { id: "te4", category: "technical", text: "Расскажите о самой сложной технической задаче, которую вы решили." },
  { id: "te5", category: "technical", text: "Как вы подходите к code review / проверке работы коллег?" },
];

type ReadinessState = "ready" | "needs-work" | null;
type ReadinessMap = Record<string, ReadinessState>;

const STORAGE_KEY = "questions_readiness_v1";

const CATEGORIES: Array<{ key: Category; label: string }> = [
  { key: "all",        label: "Все"          },
  { key: "about-you",  label: "О себе"       },
  { key: "behavioral", label: "Поведенческие" },
  { key: "situational",label: "Ситуационные"  },
  { key: "company",    label: "О компании"    },
  { key: "technical",  label: "Технические"   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadReadiness(): ReadinessMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReadinessMap) : {};
  } catch {
    return {};
  }
}

function saveReadiness(map: ReadinessMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

function getProgressStats(readiness: ReadinessMap) {
  const ready = QUESTIONS.filter((q) => readiness[q.id] === "ready").length;
  const needsWork = QUESTIONS.filter((q) => readiness[q.id] === "needs-work").length;
  const total = QUESTIONS.length;
  const pct = Math.round((ready / total) * 100);
  return { ready, needsWork, total, pct };
}

// ─── QuestionRow ──────────────────────────────────────────────────────────────

function ReadinessButton({
  state,
  target,
  label,
  className,
  onClick,
}: {
  state: ReadinessState;
  target: ReadinessState;
  label: string;
  className: string;
  onClick: () => void;
}) {
  const isActive = state === target;
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors whitespace-nowrap",
        isActive ? className : "border-border text-muted-foreground hover:bg-muted/60",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function QuestionRow({
  question,
  state,
  onSet,
}: {
  question: Question;
  state: ReadinessState;
  onSet: (id: string, next: ReadinessState) => void;
}) {
  function toggle(target: ReadinessState) {
    onSet(question.id, state === target ? null : target);
  }

  return (
    <div className={[
      "flex flex-col gap-2 rounded-xl border border-border bg-card px-4 py-3.5 transition-colors",
      state === "ready" ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-800/40 dark:bg-emerald-900/10" : "",
      state === "needs-work" ? "border-amber-200 bg-amber-50/30 dark:border-amber-800/40 dark:bg-amber-900/10" : "",
    ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13.5px] font-medium text-foreground leading-snug">{question.text}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          <ReadinessButton
            state={state}
            target="ready"
            label="✓ Готов"
            className="border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
            onClick={() => toggle("ready")}
          />
          <ReadinessButton
            state={state}
            target="needs-work"
            label="⟳ Нужна работа"
            className="border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
            onClick={() => toggle("needs-work")}
          />
        </div>
      </div>
      {question.tip ? (
        <p className="text-[11.5px] text-muted-foreground leading-snug">{question.tip}</p>
      ) : null}
    </div>
  );
}

// ─── QuestionsPage ────────────────────────────────────────────────────────────

export default function QuestionsPage() {
  const [readiness, setReadiness] = useState<ReadinessMap>(loadReadiness);
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const filtered = useMemo(
    () => activeCategory === "all" ? QUESTIONS : QUESTIONS.filter((q) => q.category === activeCategory),
    [activeCategory],
  );

  const { ready, needsWork, total, pct } = useMemo(
    () => getProgressStats(readiness),
    [readiness],
  );

  function handleSet(id: string, next: ReadinessState) {
    setReadiness((prev) => {
      const updated = { ...prev, [id]: next };
      if (next === null) delete updated[id];
      saveReadiness(updated);
      return updated;
    });
  }

  function handleReset() {
    setReadiness({});
    saveReadiness({});
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-background px-7 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground/60 mb-1">
              <span>Loopboard</span>
              <span>/</span>
              <span className="text-muted-foreground">Подготовка к интервью</span>
            </div>
            <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
              Подготовка к интервью
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {total} вопросов · отмечай готовность к каждому
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="shrink-0 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Сбросить
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11.5px] text-muted-foreground mb-1.5">
            <span>
              <span className="font-semibold text-foreground tabular-nums">{ready}</span> готов ·{" "}
              <span className="font-semibold text-amber-600 tabular-nums">{needsWork}</span> нужна работа ·{" "}
              <span className="tabular-nums">{total - ready - needsWork}</span> не оценено
            </span>
            <span className="tabular-nums font-medium text-foreground">{pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="mt-4 flex items-end gap-0 overflow-x-auto">
          {CATEGORIES.map((cat) => {
            const catQuestions = cat.key === "all" ? QUESTIONS : QUESTIONS.filter((q) => q.category === cat.key);
            const catReady = catQuestions.filter((q) => readiness[q.id] === "ready").length;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={[
                  "inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] border-b-2 transition-colors whitespace-nowrap",
                  activeCategory === cat.key
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {cat.label}
                <span className="tabular-nums text-[11px] text-muted-foreground/60">
                  {catReady}/{catQuestions.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="flex flex-col gap-2.5 p-6">
          {filtered.map((q) => (
            <QuestionRow
              key={q.id}
              question={q}
              state={readiness[q.id] ?? null}
              onSet={handleSet}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
