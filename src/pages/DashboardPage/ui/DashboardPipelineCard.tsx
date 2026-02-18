import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { DonutChart } from "src/shared/ui";
import { Card } from "src/shared/ui/Card/Card";

type Summary = {
  total: number;
  new: number;
  applied: number;
  saved: number;
  interview: number;
  offer: number;
  rejected: number;
};

type Props = {
  summary: Summary;
  size?: number;
  stroke?: number;
};

export function DashboardPipelineCard({
  summary,
  size = 240,
  stroke = 16,
}: Props) {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const inPipeline =
    summary.new +
    summary.applied +
    summary.interview +
    summary.offer +
    summary.rejected;

  const responsiveSize = isMobile ? 200 : size;
  const responsiveStroke = isMobile ? 14 : stroke;

  return (
    <Card
      padding="md"
      className="rounded-3xl p-4 sm:p-6"
    >
      <div className="flex justify-center">
        <DonutChart
          title={t("pipeline.title", "Applications pipeline")}
          totalLabel={t("pipeline.totalLabel", "In pipeline")}
          centerTop={`${inPipeline}`}
          centerBottom={t("pipeline.centerBottom", "of {{total}} total", {
            total: summary.total,
          })}
          size={responsiveSize}
          stroke={responsiveStroke}
          slices={[
            {
              label: t("status.new", "New"),
              value: summary.new,
              className: "stroke-sky-500",
            },
            {
              label: t("status.applied", "Applied"),
              value: summary.applied,
              className: "stroke-blue-500",
            },
            {
              label: t("status.interview", "Interview"),
              value: summary.interview,
              className: "stroke-purple-500",
            },
            {
              label: t("status.offer", "Offer"),
              value: summary.offer,
              className: "stroke-emerald-500",
            },
            {
              label: t("status.rejected", "Rejected"),
              value: summary.rejected,
              className: "stroke-red-500",
            },
          ]}
        />
      </div>
    </Card>
  );
}
