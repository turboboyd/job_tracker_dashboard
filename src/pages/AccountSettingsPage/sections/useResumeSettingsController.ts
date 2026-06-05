import { useCallback, useEffect, useState } from "react";

import {
  getCurrentUserProfileViaRest,
  updateCurrentUserResumeViaRest,
} from "src/features/userProfile";
import { getErrorMessage } from "src/shared/lib";

interface UseResumeSettingsControllerParams {
  loadErrorFallback: string;
  saveErrorFallback: string;
}

export function useResumeSettingsController({
  loadErrorFallback,
  saveErrorFallback,
}: UseResumeSettingsControllerParams) {
  const [resumeText, setResumeText] = useState("");
  const [savedResumeText, setSavedResumeText] = useState("");
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setIsFetching(true);
      setError(null);
      try {
        const profile = await getCurrentUserProfileViaRest();
        if (cancelled) return;
        const text = profile.resumeText ?? "";
        setResumeText(text);
        setSavedResumeText(text);
      } catch (loadError: unknown) {
        if (!cancelled) {
          setError(getErrorMessage(loadError, loadErrorFallback));
        }
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [loadErrorFallback]);

  const hasChanges = resumeText !== savedResumeText;

  const handleChange = useCallback((next: string) => {
    setResumeText(next);
    setJustSaved(false);
  }, []);

  const save = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    setJustSaved(false);
    try {
      const profile = await updateCurrentUserResumeViaRest({ resumeText });
      const text = profile.resumeText ?? "";
      setResumeText(text);
      setSavedResumeText(text);
      setJustSaved(true);
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, saveErrorFallback));
    } finally {
      setIsSaving(false);
    }
  }, [resumeText, saveErrorFallback]);

  const reset = useCallback(() => {
    setResumeText(savedResumeText);
    setError(null);
    setJustSaved(false);
  }, [savedResumeText]);

  return {
    resumeText,
    onResumeTextChange: handleChange,
    savedResumeText,
    isFetching,
    isSaving,
    error,
    justSaved,
    hasChanges,
    saveDisabled: isFetching || isSaving || !hasChanges,
    resetDisabled: isFetching || isSaving || !hasChanges,
    save,
    reset,
  };
}
