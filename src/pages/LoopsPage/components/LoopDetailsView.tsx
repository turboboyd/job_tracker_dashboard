import { useTranslation } from "react-i18next";

import {
  LoopDetailsContent,
  LoopDetailsHeader,
} from "./loopDetails.sections";
import { useLoopDetailsController } from "./useLoopDetailsController";

interface LoopDetailsViewProps {
  userId: string;
  loopId: string;
  onBack: () => void;
}

export function LoopDetailsView({
  userId,
  loopId,
  onBack,
}: LoopDetailsViewProps) {
  const { t } = useTranslation();
  const { detailsPage, loop, loopQuery, changePage } = useLoopDetailsController({
    loopId,
  });

  return (
    <div className="space-y-6">
      <LoopDetailsHeader loop={loop} onBack={onBack} t={t} />

      <LoopDetailsContent
        userId={userId}
        loop={loop}
        page={detailsPage}
        isLoading={loopQuery.isLoading}
        isError={loopQuery.isError}
        error={loopQuery.error}
        onPageChange={changePage}
        t={t}
      />
    </div>
  );
}
