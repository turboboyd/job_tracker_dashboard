import React, { useMemo, useState } from "react";

import { prettyStatus } from "src/entities/loop/lib";
import type { LoopMatchStatus } from "src/entities/loop/model/types";
import { Button, Card, Modal } from "src/shared/ui";

import { formatMatchedAt, normalizePlatform } from "./matchFormat";

export type MatchLike = {
  id: string;
  loopId: string;
  title: string;
  company: string;
  location: string;
  platform: unknown;
  url: string;
  status: LoopMatchStatus;
  matchedAt?: string | null;
  description?: string | null;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-medium text-muted-foreground">{children}</div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 sm:gap-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="sm:col-span-2 text-sm text-foreground break-words">
        {children}
      </div>
    </div>
  );
}

function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground">
      {children}
    </span>
  );
}

function MutedPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
      {children}
    </span>
  );
}

function ConfirmDeleteModal({
  open,
  onOpenChange,

  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  busy: boolean;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title="Delete match?"
      description={`This action cannot be undone.`}
    >
      <div className="space-y-md">
        <div className="text-sm text-foreground">
          Are you sure you want to delete this match?
        </div>

        <div className="flex items-center justify-end gap-sm">
          <Button
            variant="outline"
            size="sm"
            shape="pill"
            shadow="sm"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button
            variant="outline"
            size="sm"
            shape="pill"
            shadow="sm"
            disabled={busy}
            onClick={onConfirm}
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function MatchDetailsModal({
  open,
  onOpenChange,
  match,
  loopName,
  busy,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: MatchLike;
  loopName: string;
  busy: boolean;
  onDelete: (matchId: string) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const matchedAt = useMemo(
    () => formatMatchedAt(match.matchedAt),
    [match.matchedAt]
  );

  const platform = useMemo(() => {
    const p = normalizePlatform(match.platform);
    return p ? p.toUpperCase() : "";
  }, [match.platform]);

  const modalTitle = match.title || "Match";
  const modalDescription =
    [match.company || "", match.location || ""].filter(Boolean).join(" • ") ||
    undefined;

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        size="lg"
        title={modalTitle}
        description={modalDescription}
      >
        <div className="space-y-md">
          <div className="flex flex-wrap items-center justify-between gap-sm">
            <div className="flex flex-wrap items-center gap-sm">
              <MetaPill>{platform || "—"}</MetaPill>
              <MetaPill>{matchedAt || "—"}</MetaPill>
              {loopName ? <MetaPill>{loopName}</MetaPill> : null}
              <MutedPill>{prettyStatus(match.status)}</MutedPill>
            </div>

            <div className="flex flex-wrap items-center gap-sm">
              {match.url ? (
                <Button
                  variant="outline"
                  size="sm"
                  shape="pill"
                  shadow="sm"
                  asChild
                >
                  <a href={match.url} target="_blank" rel="noreferrer noopener">
                    Open link
                  </a>
                </Button>
              ) : null}

              <Button
                variant="outline"
                size="sm"
                shape="pill"
                shadow="sm"
                disabled={busy}
                onClick={() => setConfirmOpen(true)}
              >
                Delete
              </Button>
            </div>
          </div>

          <div className="grid gap-md md:grid-cols-2">
            <Card
              variant="default"
              padding="sm"
              shadow="sm"
              className="space-y-sm"
            >
              <SectionTitle>Overview</SectionTitle>
              <div className="h-px bg-border" />
              <div className="space-y-sm">
                <Field label="Title">{match.title || "—"}</Field>
                <Field label="Company">{match.company || "—"}</Field>
                <Field label="Location">{match.location || "—"}</Field>
                <Field label="Loop">{loopName || "—"}</Field>
              </div>
            </Card>

            <Card
              variant="default"
              padding="sm"
              shadow="sm"
              className="space-y-sm"
            >
              <SectionTitle>Details</SectionTitle>
              <div className="h-px bg-border" />
              <div className="space-y-sm">
                <Field label="Platform">{platform || "—"}</Field>
                <Field label="Matched at">{matchedAt || "—"}</Field>
                <Field label="Status">{prettyStatus(match.status)}</Field>
              </div>
            </Card>
          </div>

          <Card
            variant="default"
            padding="sm"
            shadow="sm"
            className="space-y-sm"
          >
            <SectionTitle>Description</SectionTitle>
            <div className="h-px bg-border" />
            <div className="text-sm text-foreground whitespace-pre-wrap">
              {match.description || "—"}
            </div>
          </Card>
        </div>
      </Modal>

      <ConfirmDeleteModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        busy={busy}
        onConfirm={() => {
          setConfirmOpen(false);
          onOpenChange(false);
          onDelete(match.id);
        }}
      />
    </>
  );
}
