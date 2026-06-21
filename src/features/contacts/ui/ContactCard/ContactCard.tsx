import { ExternalLink, Mail, Phone, Trash2, Unlink } from "lucide-react";
import type { ElementType } from "react";

import {
  ContactAvatar,
  ContactRoleBadge,
  buildMailtoHref,
  buildTelHref,
  getContactFullName,
} from "src/entities/contact";
import type { ContactDoc } from "src/entities/contact";
import { classNames } from "src/shared/lib";
import { Button } from "src/shared/ui/Button";
import { Card } from "src/shared/ui/Card";

interface ContactCardProps {
  contactId: string;
  contact: ContactDoc;
  /** If provided, shows an "Unlink" button instead of "Delete" */
  onUnlink?: (contactId: string) => void;
  onDelete?: (contactId: string) => void;
  onEdit?: (contactId: string) => void;
  className?: string;
}

function ActionLink({
  href,
  icon: Icon,
  label,
  title,
}: {
  href: string;
  icon: ElementType;
  label?: string;
  title: string;
}) {
  return (
    <a
      href={href}
      title={title}
      className={classNames(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1",
        "text-xs font-medium text-muted-foreground",
        "border border-border bg-muted/40",
        "transition-colors hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {label && <span className="max-w-[140px] truncate">{label}</span>}
    </a>
  );
}

function ContactLinks({
  telHref,
  mailHref,
  primaryPhone,
  primaryEmail,
  linkedInUrl,
}: {
  telHref?: string;
  mailHref?: string;
  primaryPhone?: string;
  primaryEmail?: string;
  linkedInUrl?: string;
}) {
  if (!telHref && !mailHref && !linkedInUrl) return null;

  return (
    <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
      {telHref && primaryPhone ? (
        <ActionLink
          href={telHref}
          icon={Phone}
          label={primaryPhone}
          title="Call"
        />
      ) : null}
      {mailHref && primaryEmail ? (
        <ActionLink
          href={mailHref}
          icon={Mail}
          label={primaryEmail}
          title="Send email"
        />
      ) : null}
      {linkedInUrl ? (
        <ActionLink
          href={linkedInUrl}
          icon={ExternalLink}
          label="LinkedIn"
          title="Open LinkedIn profile"
        />
      ) : null}
    </div>
  );
}

export function ContactCard({
  contactId,
  contact,
  onUnlink,
  onDelete,
  onEdit,
  className,
}: ContactCardProps) {
  const fullName = getContactFullName(contact);
  const telHref = buildTelHref(contact);
  const mailHref = buildMailtoHref(contact);

  const primaryPhone = contact.phones[0]?.number;
  const primaryEmail = contact.emails[0]?.address;

  return (
    <Card
      padding="none"
      shadow="sm"
      className={classNames("flex flex-col gap-0 overflow-hidden", className)}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <ContactAvatar
          firstName={contact.firstName}
          lastName={contact.lastName}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {fullName}
              </p>
              {contact.companyName ? (
                <p className="truncate text-xs text-muted-foreground">
                  {contact.companyName}
                </p>
              ) : null}
            </div>
            <ContactRoleBadge role={contact.role} />
          </div>
        </div>
      </div>

      {/* Contact links */}
      <ContactLinks
        telHref={telHref}
        mailHref={mailHref}
        primaryPhone={primaryPhone}
        primaryEmail={primaryEmail}
        linkedInUrl={contact.linkedInUrl}
      />

      {/* Tags */}
      {contact.tags && contact.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-3">
          {contact.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground border border-border"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {/* Notes */}
      {contact.notes ? (
        <div className="border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {contact.notes}
          </p>
        </div>
      ) : null}

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-2">
        {onEdit ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(contactId)}
          >
            Edit
          </Button>
        ) : null}

        {onUnlink ? (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => onUnlink(contactId)}
          >
            <Unlink className="h-3.5 w-3.5" aria-hidden="true" />
            Unlink
          </Button>
        ) : null}

        {onDelete ? (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={() => onDelete(contactId)}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
