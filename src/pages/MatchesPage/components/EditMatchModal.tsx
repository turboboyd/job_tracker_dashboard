import React, { useEffect, useMemo, useState } from "react";

import { Button, Modal, InputField, TextAreaField } from "src/shared/ui";

type MatchLike = {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  matchedAt?: string | null;
  description?: string | null;
};

function toDateInputValue(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toIsoFromDateInput(v: string): string {
  return new Date(v).toISOString();
}

export function EditMatchModal({
  open,
  busy,
  match,
  loopName,
  onClose,
  onSave,
}: {
  open: boolean;
  busy: boolean;
  match: MatchLike | null;
  loopName: string;
  onClose: () => void;
  onSave: (matchId: string, patch: Record<string, unknown>) => Promise<void>;
}) {
  const [localBusy, setLocalBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [url, setUrl] = useState("");
  const [matchedAt, setMatchedAt] = useState("");
  const [description, setDescription] = useState("");

  const disabled = busy || localBusy;

  useEffect(() => {
    if (!open || !match) return;
    setTitle(match.title ?? "");
    setCompany(match.company ?? "");
    setLocation(match.location ?? "");
    setUrl(match.url ?? "");
    setMatchedAt(toDateInputValue(match.matchedAt ?? null));
    setDescription(String(match.description ?? ""));
  }, [open, match]);

  const patch = useMemo(() => {
    const p: Record<string, unknown> = {
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      url: url.trim(),
      description: description.trim(),
    };

    if (matchedAt) p.matchedAt = toIsoFromDateInput(matchedAt);

    return p;
  }, [title, company, location, url, description, matchedAt]);

  const save = async () => {
    if (!match) return;
    try {
      setLocalBusy(true);
      await onSave(match.id, patch);
      onClose();
    } finally {
      setLocalBusy(false);
    }
  };

  if (!match) return null;

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      title="Edit match"
      description={loopName ? `Loop: ${loopName}` : undefined}
      size="lg"
      showClose={false}
    >
      <div className="flex flex-col gap-lg">
        <div className="grid grid-cols-1 gap-md md:grid-cols-2">
          <div className="md:col-span-2">
            <InputField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={disabled}
            />
          </div>

          <InputField
            label="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            disabled={disabled}
          />

          <InputField
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={disabled}
          />

          <InputField
            label="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={disabled}
          />

          <InputField
            label="Matched date"
            type="date"
            value={matchedAt}
            onChange={(e) => setMatchedAt(e.target.value)}
            disabled={disabled}
          />

          <div className="md:col-span-2">
            <TextAreaField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={disabled}
              rows={6}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-sm border-t border-border pt-md">
          <Button
            variant="outline"
            size="sm"
            shape="pill"
            shadow="sm"
            disabled={disabled}
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            variant="default"
            size="sm"
            shape="pill"
            shadow="sm"
            disabled={disabled}
            onClick={save}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
