import { useTranslation } from "react-i18next";

import { InlineError } from "src/shared/ui";

import { CvBuilderUploadCard } from "./cvBuilder.upload";
import { CvVersionsCard } from "./cvBuilder.versions";
import type { CvBuilderPageViewModel } from "./useCvBuilderPageController";

interface CvBuilderPageLayoutProps {
  cvBuilder: CvBuilderPageViewModel;
}

export function CvBuilderPageLayout({ cvBuilder }: CvBuilderPageLayoutProps) {
  return (
    <div className="space-y-lg">
      <CvBuilderHeader />

      {cvBuilder.error ? <InlineError message={cvBuilder.error} /> : null}

      <CvBuilderUploadCard {...cvBuilder.upload} />
      <CvVersionsCard {...cvBuilder.versions} />
    </div>
  );
}

export function CvBuilderHeader() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="text-xl font-semibold text-foreground">
        {t("cvBuilder.title", "CV Builder")}
      </div>
      <div className="text-sm text-muted-foreground">
        {t("cvBuilder.subtitle", "Upload CV versions and link them to applications.")}
      </div>
    </div>
  );
}

export { CvBuilderUploadCard } from "./cvBuilder.upload";
export { CvVersionsCard } from "./cvBuilder.versions";
