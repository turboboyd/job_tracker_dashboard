import { useState } from "react";
import { Link } from "react-router-dom";

import { Button, Input } from "src/shared/ui";

const MainPage = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <div
      className={
        theme === "light" ? "theme-light space-y-6" : "theme-dark space-y-6"
      }
    >
      <ul>
        <li>
          <Link to="/about">About</Link>
        </li>
        <li>
          <Link to="/resources">Resources</Link>
        </li>
        <li>
          <Link to="/login">Login</Link>
        </li>
        <li>
          <Link to="/dashboard">Dashboard (private позже)</Link>
        </li>
        <li>
          <Link to="/dashboard/jobs">Jobs (private позже)</Link>
        </li>
      </ul>
      <Input placeholder="This is a Tailwind input" />
      <Input shape="pill" placeholder="This is a Tailwind input" />
      <h1 className="text-2xl font-semibold">MainPage — UI Lab</h1>

      {/* Блок для объяснений */}
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        Здесь мы визуально тестируем Tailwind и shadcn Button. Меняй
        variant/size и смотри разницу.
      </div>

      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={() => setTheme("light")}>
          Light
        </Button>
        <Button variant="secondary" onClick={() => setTheme("dark")}>
          Dark
        </Button>
      </div>

      {/* Кнопки: варианты */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Variants</h2>
        <div className="flex flex-wrap gap-3">
          <Button>default</Button>
          <Button variant="secondary">secondary</Button>
          <Button variant="outline">outline</Button>
          <Button variant="ghost">ghost</Button>
          <Button variant="link">link</Button>
          <Button disabled>disabled</Button>
          <Button shape="pill">X</Button>
        </div>
      </section>

      {/* Кнопки: размеры */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Sizes</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">small</Button>
          <Button>default</Button>
          <Button size="lg">large</Button>
          <Button size="icon" aria-label="icon button">
            ✓
          </Button>
        </div>
      </section>

      {/* Пояснение как читать классы */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">How to read Tailwind classes</h2>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm text-card-foreground">
            Этот блок использует классы:
          </div>

          <pre className="mt-2 overflow-auto rounded-md bg-muted p-3 text-xs text-foreground">
            {`rounded-lg border border-border bg-card p-4`}
          </pre>

          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>
              <b>rounded-lg</b> — скругление
            </li>
            <li>
              <b>border</b> — рамка 1px
            </li>
            <li>
              <b>border-border</b> — цвет рамки из темы
            </li>
            <li>
              <b>bg-card</b> — фон карточки из темы
            </li>
            <li>
              <b>p-4</b> — padding со всех сторон
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}


export default MainPage;