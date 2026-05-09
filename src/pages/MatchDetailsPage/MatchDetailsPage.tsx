import { EditMatchModal } from "../MatchesPage/components/EditMatchModal";

import {
  MatchDetailsContent,
  MatchDetailsHeader,
  MatchDetailsMessage,
  MatchDetailsShell,
} from "./matchDetails.sections";
import { useMatchDetailsPageController } from "./useMatchDetailsPageController";

export default function MatchDetailsPage() {
  const vm = useMatchDetailsPageController();

  const header = (
    <MatchDetailsHeader
      backTo={vm.backTo}
      title={vm.labels.title}
      subtitle={vm.labels.subtitle}
      backLabel={vm.labels.backLabel}
    />
  );

  return (
    <MatchDetailsShell header={header}>
      {vm.state.kind === "ready" && vm.details ? (
        <MatchDetailsContent
          busy={vm.busy}
          details={vm.details}
          labels={vm.labels}
          onDelete={vm.actions.onDelete}
          onEdit={vm.openEdit}
          onUpdateStatus={vm.actions.onUpdateStatus}
        />
      ) : (
        <MatchDetailsMessage message={vm.state.message ?? vm.labels.loading} />
      )}

      <EditMatchModal
        open={Boolean(vm.editingMatch)}
        busy={vm.busy}
        loopName={vm.editingLoopName}
        match={vm.editingMatch}
        onClose={vm.closeEdit}
        onSave={vm.actions.onSaveEdit}
      />
    </MatchDetailsShell>
  );
}
