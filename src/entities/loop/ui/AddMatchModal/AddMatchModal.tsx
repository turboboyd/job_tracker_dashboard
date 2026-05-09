import { Formik, type FormikHelpers } from "formik";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useCreateMatchMutation } from "src/entities/loopMatch";
import { getErrorMessage } from "src/shared/lib";
import { Modal } from "src/shared/ui";

import type { LoopPlatform } from "../../model";

import {
  buildAddMatchLabels,
  buildAddMatchPlatformOptions,
  buildAddMatchStatusOptions,
  buildAddMatchTextFieldConfigs,
  buildCreateMatchRequest,
  buildInitialValues,
  makeAddMatchSchema,
  type AddMatchFormValues,
} from "./addMatchModal.helpers";
import { AddMatchFormContent } from "./addMatchModal.sections";

function resolveAddMatchCommonError(args: {
  formStatus: unknown;
  requestError: unknown;
}): string | undefined {
  if (typeof args.formStatus === "string") {
    return args.formStatus;
  }

  return args.requestError ? getErrorMessage(args.requestError) : undefined;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loopId: string;
  defaultPlatform?: LoopPlatform;
}

export function AddMatchModal({
  open,
  onOpenChange,
  loopId,
  defaultPlatform,
}: Props) {
  const { t } = useTranslation();
  const [createMatch, createMatchState] = useCreateMatchMutation();
  const platformManuallySetRef = useRef(false);

  const labels = useMemo(() => buildAddMatchLabels(t), [t]);
  const schema = useMemo(() => makeAddMatchSchema(t), [t]);
  const platformOptions = useMemo(() => buildAddMatchPlatformOptions(), []);
  const statusOptions = useMemo(() => buildAddMatchStatusOptions(t), [t]);
  const textFieldConfigs = useMemo(
    () => buildAddMatchTextFieldConfigs(labels),
    [labels],
  );
  const initialValues = useMemo(
    () => buildInitialValues(defaultPlatform),
    [defaultPlatform],
  );

  useEffect(() => {
    if (open) {
      platformManuallySetRef.current = false;
    }
  }, [open]);

  const disabled = createMatchState.isLoading;
  const handleCancel = () => onOpenChange(false);

  async function submitMatch(
    values: AddMatchFormValues,
    helpers: FormikHelpers<AddMatchFormValues>,
  ) {
    helpers.setStatus(undefined);

    try {
      await createMatch(buildCreateMatchRequest(loopId, values)).unwrap();
      handleCancel();
    } catch (error) {
      helpers.setStatus(
        getErrorMessage(
          error,
            labels.failedToSaveMatch,
        ),
      );
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={labels.addMatch}
      description={labels.addMatchDescription}
    >
      <Formik<AddMatchFormValues>
        initialValues={initialValues}
        enableReinitialize
        validationSchema={schema}
        onSubmit={submitMatch}
      >
        {(formik) => {
          const commonError = resolveAddMatchCommonError({
            formStatus: formik.status,
            requestError: createMatchState.isError ? createMatchState.error : undefined,
          });

          return (
            <AddMatchFormContent
              formik={formik}
              commonError={commonError}
              disabled={disabled}
              platformManuallySetRef={platformManuallySetRef}
              labels={labels}
              onCancel={handleCancel}
              platformOptions={platformOptions}
              statusOptions={statusOptions}
              textFieldConfigs={textFieldConfigs}
            />
          );
        }}
      </Formik>
    </Modal>
  );
}
