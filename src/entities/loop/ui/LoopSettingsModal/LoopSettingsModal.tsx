import { useTranslation } from "react-i18next";

import { Modal } from "src/shared/ui";

import type { CanonicalFilters } from "../../model";
import { CompactFilters } from "../CompactFilters/CompactFilters";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  value: CanonicalFilters;
  onChange: (next: CanonicalFilters) => void;

  onApply: () => Promise<void> | void;
  onReset: () => void;

  disabled?: boolean;
};

export function LoopSettingsModal({
  open,
  onOpenChange,
  value,
  onChange,
  onApply,
  onReset,
  disabled,
}: Props) {
  const { t } = useTranslation();
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t("loops.myLoopSettings", "My Loop settings")}
      description={t(
        "loops.myLoopSettingsDescription",
        "Update filters, click Apply to refresh links and save settings to your loop."
      )}
      size="lg"
    >
      <CompactFilters
        value={value}
        onChange={onChange}
        onApply={onApply}
        onReset={onReset}
        disabled={disabled}
      />
    </Modal>
  );
}
