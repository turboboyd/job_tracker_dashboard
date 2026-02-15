import React from "react";
import { useTranslation } from "react-i18next";

import {
  AppRoutes,
  RoutePath,
} from "src/app/providers/router/routeConfig/routeConfig";
import { LinkButton, Card } from "src/shared/ui";

type Props = {
  ctaPrimary: React.ReactNode;
  ctaSecondary: React.ReactNode;
};

export const HowToStartBlock: React.FC<Props> = ({
  ctaPrimary,
  ctaSecondary,
}) => {
  const { t } = useTranslation();

  const steps = [
    {
      n: "01",
      title: t("home.start.s1.title", "Build your loop in 60 seconds"),
      text: t(
        "home.start.s1.text",
        "Role, location, radius, work mode, keywords and exclusions. This becomes your saved search scenario.",
      ),
    },
    {
      n: "02",
      title: t("home.start.s2.title", "Open platforms with one scenario"),
      text: t(
        "home.start.s2.text",
        "Hit Apply and get ready links to job boards with the same filters. Check fresh listings fast.",
      ),
    },
    {
      n: "03",
      title: t("home.start.s3.title", "Save matches and move statuses"),
      text: t(
        "home.start.s3.text",
        "Like a job? Save it. Then: saved → applied → interview → offer / rejected — with notes and deadlines.",
      ),
    },
  ];

  return (
    <section className="mt-10">
      <div className="overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-10">
        <header className="max-w-3xl">
          <h2 className="text-base font-semibold text-foreground sm:text-lg">
            {t("home.start.title", "How to start (and not burn out)")}
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            {t(
              "home.start.sub",
              "Three steps that move you forward: set up → apply → lock the next action.",
            )}
          </p>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {t(
              "home.start.extra",
              "Aim for consistency, not perfection: one loop, a small daily routine, and clear next steps.",
            )}
          </p>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-lg md:grid-cols-3">
          {steps.map((s) => (
            <Card
              key={s.n}
              className={[
                "group h-full p-6",
                "border border-border bg-background",
                "transition-all duration-normal ease-out",
                "motion-safe:hover:-translate-y-0.5",
                "motion-safe:hover:shadow-md",
                "motion-safe:hover:bg-muted",
              ].join(" ")}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-md">
                  <div className="text-xs font-medium text-muted-foreground">
                    {s.n}
                  </div>
                  <span className="inline-flex items-center rounded-full border border-border bg-card px-sm py-0.5 text-[11px] text-muted-foreground">
                    {t("home.start.stepLabel", "Step")}
                  </span>
                </div>

                <div className="mt-2 text-sm font-semibold text-foreground sm:text-base">
                  <span className="break-words [hyphens:auto]">{s.title}</span>
                </div>

                <div className="mt-2 text-sm leading-6 text-muted-foreground">
                  <span className="break-words [hyphens:auto]">{s.text}</span>
                </div>

                <div className="mt-auto pt-4">
                  <div className="h-px w-full bg-border/70" />
                  <div className="mt-3 text-xs text-muted-foreground">
                    {t("home.start.micro", "Keep it simple. Keep it daily.")}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-lg lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm leading-6 text-muted-foreground lg:max-w-2xl">
            {t(
              "home.start.note",
              "Simple rule: one loop becomes your daily rhythm. Check sources → save matches → do the next step.",
            )}
          </p>

          <div className="flex flex-col gap-md sm:flex-row sm:flex-wrap sm:items-center">
            <div className="w-full sm:w-auto">{ctaPrimary}</div>

            <LinkButton
              to={RoutePath[AppRoutes.RESOURCES]}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              {t("home.start.resources", "Cheat sheets & guides")}
            </LinkButton>

            <LinkButton
              to={RoutePath[AppRoutes.LOOPS]}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              {t("home.start.createLoop", "Create your first loop")}
            </LinkButton>

            <div className="w-full sm:w-auto">{ctaSecondary}</div>
          </div>
        </div>
      </div>
    </section>
  );
};
