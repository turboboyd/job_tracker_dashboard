import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { AppRoutes, RoutePath } from "src/app/providers/router/routeConfig/routeConfig";
import { useAuthSelectors } from "src/features/auth";
import { LinkButton } from "src/shared/ui";

import {
  HeroSection,
  HowToStartBlock,
  buildFeatures,
  buildQuickStats,
  buildPreviewModel,
  FeaturesSection,
  FooterNote,
} from "./components";
import type { CtaBlock } from "./components";

const MainPage: React.FC = () => {
  const { t } = useTranslation();

  const { isAuthenticated } = useAuthSelectors();

  const quickStats = useMemo(() => buildQuickStats(t), [t]);
  const features = useMemo(() => buildFeatures(t), [t]);
  const previewModel = useMemo(() => buildPreviewModel(t), [t]);

  const ctaPrimary: CtaBlock = isAuthenticated ? (
    <LinkButton
      to={RoutePath[AppRoutes.DASHBOARD]}
      variant="default"
      shadow="sm"
      size="lg"
      className="w-full sm:w-auto"
    >
      {t("home.goToDashboard", "Go to Dashboard")}
    </LinkButton>
  ) : (
    <LinkButton
      to={RoutePath[AppRoutes.LOGIN]}
      variant="outline"
      shadow="sm"
      size="lg"
      className="w-full sm:w-auto"
    >
      {t("home.signIn", "Sign in")}
    </LinkButton>
  );

  const ctaSecondary: CtaBlock = isAuthenticated ? (
    <LinkButton
      to={RoutePath[AppRoutes.RESOURCES]}
      variant="outline"
      size="lg"
      className="w-full sm:w-auto"
    >
      {t("home.viewResources", "Resources & tips")}
    </LinkButton>
  ) : (
    <LinkButton
      to={RoutePath[AppRoutes.REGISTER]}
      variant="default"
      shadow="sm"
      size="lg"
      className="w-full sm:w-auto"
    >
      {t("home.createAccount", "Create account")}
    </LinkButton>
  );

  const learnMoreCta: CtaBlock = (
    <LinkButton
      to={RoutePath[AppRoutes.RESOURCES]}
      variant="ghost"
      size="lg"
      className="w-full sm:w-auto"
    >
      {t("home.learnMore", "Learn more")}
    </LinkButton>
  );

  return (
    // Scroll container (AppLayout uses overflow-hidden at higher levels)
    <div className="h-full min-h-0 overflow-y-auto bg-background text-foreground">
      <div className="mx-auto max-w-container px-lg py-10 sm:py-14">
        <HeroSection
          badgeText={t(
            "home.badge",
            "Job Tracker Dashboard • less chaos, more results",
          )}
          title={t("home.title2", "Systematic job search")}
          titleMuted={t("home.title2b", "instead of 100 tabs")}
          subtitle={t(
            "home.subtitle2",
            "Build a loop (your search scenario) to open job searches across platforms, save the best matches, and move through stages from saved to offer.",
          )}
          ctaPrimary={ctaPrimary}
          ctaSecondary={ctaSecondary}
          ctaTertiary={learnMoreCta}
          quickStats={quickStats}
          preview={previewModel}
        />

        <div className="mt-10 sm:mt-12">
          <FeaturesSection features={features} />
        </div>

        <HowToStartBlock ctaPrimary={ctaPrimary} ctaSecondary={ctaSecondary} />

        <FooterNote
          title={t("home.footer.title", "Why this feels better")}
          text={t(
            "home.footer.text",
            "Instead of rebuilding searches manually every day, you follow a scenario: filters are saved, links are ready, and statuses are visible. Less chaos — more control.",
          )}
          pills={[
            { label: t("home.footer.pill1", "Consistent"), tone: "success" },
            { label: t("home.footer.pill2", "Clear next steps"), tone: "info" },
            { label: t("home.footer.pill3", "Less noise"), tone: "warning" },
          ]}
          ctaPrimary={ctaPrimary}
          ctaSecondary={ctaSecondary}
        />
      </div>

      <div className="mx-auto max-w-container px-lg pb-10 sm:pb-14"></div>
    </div>
  );
};

export default MainPage;
