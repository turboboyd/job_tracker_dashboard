import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { useAuthSelectors } from "src/entities/auth";

import { CardText } from "./components/Header";
import { LoopDetailsView } from "./components/LoopDetailsView";
import { LoopsListView } from "./components/LoopsListView";

export default function LoopsPage() {
  const { t } = useTranslation();
  const { userId } = useAuthSelectors();

  const navigate = useNavigate();
  const location = useLocation();
  const { loopId } = useParams<{ loopId: string }>();

  const isDetails = Boolean(loopId);

  const goBack = () => navigate(`/dashboard/loops${location.search}`);
  const openLoop = (id: string) =>
    navigate(`/dashboard/loops/${id}${location.search}`);
  const openLoopApplications = (id: string) =>
    navigate(`/dashboard/applications?loopId=${encodeURIComponent(id)}`);
  const openLoopMatches = (id: string) =>
    navigate(`/dashboard/matches?loopId=${encodeURIComponent(id)}`);
  const addLoopApplication = (id: string) =>
    navigate(
      `/dashboard/applications?loopId=${encodeURIComponent(id)}&create=1&mode=manual`,
    );
  const importLoopVacancy = (id: string) =>
    navigate(
      `/dashboard/applications?loopId=${encodeURIComponent(id)}&create=1&mode=import`,
    );

  if (!userId) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="shrink-0 border-b border-border bg-background px-7 py-5">
          <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
            {isDetails
              ? t("loops.detailsTitle", "Loop")
              : t("loops.listTitle", "Loops")}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {t("loops.signInSubtitle", "Sign in to continue.")}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto bg-background p-7">
          <CardText>
            {t("loops.signInBody", "Please sign in to view your loops.")}
          </CardText>
        </div>
      </div>
    );
  }

  return isDetails ? (
    <LoopDetailsView userId={userId} loopId={loopId!} onBack={goBack} />
  ) : (
    <LoopsListView
      userId={userId}
      onOpenLoop={openLoop}
      onOpenApplications={openLoopApplications}
      onOpenMatches={openLoopMatches}
      onAddApplication={addLoopApplication}
      onImportVacancy={importLoopVacancy}
    />
  );
}
