import React from "react";
import { useTranslation } from "react-i18next";



const WhatsNewPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("whatsNew.pageTitle", "What’s new")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("whatsNew.pageSubtitle", "Latest updates generated from GitHub Releases.")}
        </p>
      </div>

    </div>
  );
};

export default WhatsNewPage;
