import React from "react";
import { useTranslation } from "react-i18next";

const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{t("about.title", "About")}</h1>
      <div className="rounded-lg border bg-white p-4 text-sm text-slate-700">
        {t(
          "about.subtitle",
          "Build is working. Next: API + RTK Query + UI kit.",
        )}
      </div>
    </div>
  );
};


export default AboutPage;