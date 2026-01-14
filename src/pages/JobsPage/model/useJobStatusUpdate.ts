import { useCallback, useState } from "react";

import { useUpdateJobStatusMutation } from "src/entities/job/api/jobApi";
import type { JobStatus } from "src/entities/job/model/types";

export function useJobStatusUpdate() {
  const [updateStatus] = useUpdateJobStatusMutation();
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);

  const changeStatus = useCallback(
    async (jobId: string, status: JobStatus) => {
      try {
        setUpdatingJobId(jobId);
        await updateStatus({ jobId, status }).unwrap();
      } finally {
        setUpdatingJobId(null);
      }
    },
    [updateStatus]
  );

  return { changeStatus, updatingJobId };
}
