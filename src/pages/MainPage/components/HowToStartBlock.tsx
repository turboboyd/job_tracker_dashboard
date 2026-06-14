import React from "react";
import { useTranslation } from "react-i18next";

import {
  AppRoutes,
  RoutePath,
} from "src/app/providers/router/routeConfig/routeConfig";
import { LinkButton } from "src/shared/ui";

type Props = {
  ctaPrimary: React.ReactNode;
  ctaSecondary: React.ReactNode;
};

export const HowToStartBlock: React.FC<Props> = ({ ctaPrimary }) => {
  const { t } = useTranslation();

  const steps = [
    {
      n: "01",
      title: t("home.start.s1.title", "Build your loop in 60 seconds"),
      text: t("home.start.s1.text", "Role, location, radius, work mode, keywords and exclusions. This becomes your saved search scenario."),
    },
    {
      n: "02",
      title: t("home.start.s2.title", "Open platforms with one scenario"),
      text: t("home.start.s2.text", "Hit Apply and get ready links to job boards with the same filters. Check fresh listings fast."),
    },
    {
      n: "03",
      title: t("home.start.s3.title", "Save matches and move statuses"),
      text: t("home.start.s3.text", "Like a job? Save it. Then: saved → applied → interview → offer / rejected — with notes and deadlines."),
    },
  ];

  return (
    <section className="mt-0 pb-14">
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-12">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_1.6fr] lg:items-start">
          {/* Left */}
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.07em] text-subtle-foreground">
              {t("home.start.title", "How to start")}
            </div>
            <h2 className="mt-2.5 text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground">
              {t("home.start.sub", "One small step every day")}
            </h2>
            <p className="mt-4 text-[14px] leading-[1.6] text-muted-foreground">
              {t("home.start.note", "Simple rule: one loop becomes your daily rhythm. Check sources → save matches → do the next step.")}
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              {ctaPrimary}
              <LinkButton to={RoutePath[AppRoutes.RESOURCES]} variant="outline" size="lg">
                {t("home.start.resources", "Cheat sheets & guides")}
              </LinkButton>
            </div>
          </div>

          {/* Right: timeline */}
          <div className="border-l border-border">
            {steps.map((s, i) => (
              <div
                key={s.n}
                className={[
                  "relative pl-8",
                  i < steps.length - 1 ? "border-b border-border pb-6" : "",
                  i > 0 ? "pt-6" : "",
                ].join(" ")}
              >
                {/* Timeline dot */}
                <div className="absolute left-[-7px] top-0 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-border-strong bg-card">
                  <div className="h-[5px] w-[5px] rounded-full bg-primary" />
                </div>
                <div className="flex items-baseline gap-3.5">
                  <span className="font-mono text-[11px] tracking-[0.05em] text-subtle-foreground">
                    {s.n}
                  </span>
                  <h3 className="text-[17px] font-semibold tracking-[-0.02em]">{s.title}</h3>
                </div>
                <p className="mt-2 ml-[35px] text-[13.5px] leading-[1.6] text-muted-foreground">
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
