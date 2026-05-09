import { StatusLabel } from "src/entities/application";
import type { ApplicationDoc, ProcessStatus } from "src/features/applications";
import { Button } from "src/shared/ui/Button";
import { Card } from "src/shared/ui/Card";
import { Input } from "src/shared/ui/Form/Input";

import { STATUS_BUTTONS, toStatusKey } from "./applicationDetails.helpers";
import { DetailsCardTitle } from "./applicationDetails.primitives";
import type { ApplicationDetailsText } from "./applicationDetails.text";

interface ApplicationActionsCardProps {
  app: ApplicationDoc | null;
  commentText: string;
  isMutating: boolean;
  onAddComment: () => void;
  onChangeStatus: (next: ProcessStatus) => void;
  onCommentTextChange: (value: string) => void;
  text: ApplicationDetailsText;
}

function StatusActions({
  activeStatus,
  disabled,
  onChangeStatus,
}: {
  activeStatus: ProcessStatus | undefined;
  disabled: boolean;
  onChangeStatus: (next: ProcessStatus) => void;
}) {
  return (
    <div className="flex flex-wrap gap-sm">
      {STATUS_BUTTONS.map((status) => (
        <Button
          key={status}
          size="sm"
          variant={activeStatus === status ? "default" : "outline"}
          disabled={disabled}
          onClick={() => onChangeStatus(status)}
        >
          <StatusLabel status={toStatusKey(status)} />
        </Button>
      ))}
    </div>
  );
}

function CommentComposer({
  commentText,
  disabled,
  onAddComment,
  onCommentTextChange,
  text,
}: {
  commentText: string;
  disabled: boolean;
  onAddComment: () => void;
  onCommentTextChange: (value: string) => void;
  text: ApplicationDetailsText;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">{text.comment}</div>
      <div className="flex gap-sm">
        <Input
          preset="default"
          value={commentText}
          onChange={(event) => onCommentTextChange(event.target.value)}
          placeholder={text.commentPlaceholder}
        />
        <Button disabled={!commentText.trim() || disabled} onClick={onAddComment}>
          {text.add}
        </Button>
      </div>
    </div>
  );
}

export function ApplicationActionsCard({
  app,
  commentText,
  isMutating,
  onAddComment,
  onChangeStatus,
  onCommentTextChange,
  text,
}: ApplicationActionsCardProps) {
  const isStatusChangeDisabled = !app || isMutating;

  return (
    <Card padding="md" shadow="sm" className="space-y-md">
      <DetailsCardTitle>{text.actions}</DetailsCardTitle>

      <StatusActions
        activeStatus={app?.process.status}
        disabled={isStatusChangeDisabled}
        onChangeStatus={onChangeStatus}
      />

      <CommentComposer
        commentText={commentText}
        disabled={isMutating}
        onAddComment={onAddComment}
        onCommentTextChange={onCommentTextChange}
        text={text}
      />
    </Card>
  );
}
