import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { useAuthSelectors } from "src/entities/auth";
import { Button } from "src/shared/ui";

import { CardText, Header } from "./components/Header";
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

  if (!userId) {
    return (
      <div className="space-y-6">
        <Header
          title={
            isDetails
              ? t("loops.detailsTitle", "Loop")
              : t("loops.listTitle", "My Loops")
          }
          subtitle={t("loops.signInSubtitle", "Sign in to continue.")}
          right={
            isDetails ? (
              <Button variant="outline" shape="lg" onClick={goBack}>
                {t("loops.back", "Back")}
              </Button>
            ) : null
          }
        />
        <CardText>
          {t("loops.signInBody", "Please sign in to view your loops.")}
        </CardText>
      </div>
    );
  }

  return isDetails ? (
    <LoopDetailsView userId={userId} loopId={loopId!} onBack={goBack} />
  ) : (
    <LoopsListView userId={userId} onOpenLoop={openLoop} />
  );
}
