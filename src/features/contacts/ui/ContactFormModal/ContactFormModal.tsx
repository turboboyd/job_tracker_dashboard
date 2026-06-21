import { useCallback, useEffect, useState } from "react";

import {
  CONTACT_ROLE_KEYS,
  CONTACT_ROLE_LABELS,
} from "src/entities/contact";
import type { ContactDoc, ContactRole, EmailLabel, PhoneLabel } from "src/entities/contact";
import type { CreateContactInput, UpdateContactInput } from "src/features/contacts";
import { Button } from "src/shared/ui/Button";
import { Input } from "src/shared/ui/Form/Input";
import { Select } from "src/shared/ui/Form/Select";
import { TextArea } from "src/shared/ui/Form/TextArea";
import { Modal } from "src/shared/ui/Modal";

interface ContactFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided — edit mode; when null — create mode */
  contact?: ContactDoc | null | undefined;
  contactId?: string | undefined;
  /** The applicationId to auto-link the new contact to */
  applicationId?: string | undefined;
  /** When provided, the company field is hidden and this name is used as default */
  defaultCompanyName?: string | undefined;
  /** Hide the company field entirely (uses defaultCompanyName silently). Default: false */
  hideCompanyField?: boolean | undefined;
  onSaveCreate: (input: CreateContactInput) => Promise<void>;
  onSaveUpdate: (contactId: string, input: UpdateContactInput) => Promise<void>;
}

const ROLE_OPTIONS = CONTACT_ROLE_KEYS.map((key) => ({
  value: key,
  label: CONTACT_ROLE_LABELS[key],
}));

const PHONE_LABEL_OPTIONS: { value: PhoneLabel; label: string }[] = [
  { value: "mobile", label: "Mobile" },
  { value: "work", label: "Work" },
  { value: "other", label: "Other" },
];

const EMAIL_LABEL_OPTIONS: { value: EmailLabel; label: string }[] = [
  { value: "work", label: "Work" },
  { value: "personal", label: "Personal" },
  { value: "other", label: "Other" },
];

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <span className="block text-xs font-medium text-muted-foreground mb-1">
      {children}
      {required ? <span className="ml-0.5 text-destructive">*</span> : null}
    </span>
  );
}

interface PhoneRowState {
  number: string;
  label: PhoneLabel;
}

interface EmailRowState {
  address: string;
  label: EmailLabel;
}

function useContactForm(
  contact: ContactDoc | null | undefined,
  defaultCompanyName: string | undefined,
) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<ContactRole>("HR");
  const [phones, setPhones] = useState<PhoneRowState[]>([{ number: "", label: "mobile" }]);
  const [emails, setEmails] = useState<EmailRowState[]>([{ address: "", label: "work" }]);
  const [companyName, setCompanyName] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [tagsInput, setTagsInput] = useState(""); // comma-separated string in UI

  const populate = useCallback(
    (c: ContactDoc | null | undefined) => {
      setFirstName(c?.firstName ?? "");
      setLastName(c?.lastName ?? "");
      setRole(c?.role ?? "HR");
      setPhones(c?.phones?.length ? c.phones : [{ number: "", label: "mobile" }]);
      setEmails(c?.emails?.length ? c.emails : [{ address: "", label: "work" }]);
      setCompanyName(c?.companyName ?? defaultCompanyName ?? "");
      setLinkedInUrl(c?.linkedInUrl ?? "");
      setNotes(c?.notes ?? "");
      setTagsInput((c?.tags ?? []).join(", "));
    },
    [defaultCompanyName],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    populate(contact);
  }, [contact, populate]);

  return {
    firstName, setFirstName,
    lastName, setLastName,
    role, setRole,
    phones, setPhones,
    emails, setEmails,
    companyName, setCompanyName,
    linkedInUrl, setLinkedInUrl,
    notes, setNotes,
    tagsInput, setTagsInput,
    reset: () => populate(null),
  };
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export interface ContactFormPayloadValues {
  firstName: string;
  lastName: string;
  role: ContactRole;
  phones: PhoneRowState[];
  emails: EmailRowState[];
  companyName: string;
  linkedInUrl: string;
  notes: string;
  tagsInput: string;
}

function buildContactPayloadBase(form: ContactFormPayloadValues) {
  const companyTrimmed = form.companyName.trim();
  const linkedInTrimmed = form.linkedInUrl.trim();
  const notesTrimmed = form.notes.trim();

  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    role: form.role,
    phones: form.phones.filter((phone) => phone.number.trim()),
    emails: form.emails.filter((email) => email.address.trim()),
    tags: parseTags(form.tagsInput),
    ...(companyTrimmed ? { companyName: companyTrimmed } : {}),
    ...(linkedInTrimmed ? { linkedInUrl: linkedInTrimmed } : {}),
    ...(notesTrimmed ? { notes: notesTrimmed } : {}),
  };
}

export function buildUpdateContactInput(
  form: ContactFormPayloadValues,
): UpdateContactInput {
  return buildContactPayloadBase(form);
}

export function buildCreateContactInput(
  form: ContactFormPayloadValues,
  applicationId?: string,
): CreateContactInput {
  return {
    ...buildContactPayloadBase(form),
    ...(applicationId ? { applicationIds: [applicationId] } : {}),
  };
}

async function persistContactForm({
  form,
  isEdit,
  contactId,
  applicationId,
  onSaveCreate,
  onSaveUpdate,
}: {
  form: ContactFormPayloadValues;
  isEdit: boolean;
  contactId?: string;
  applicationId?: string;
  onSaveCreate: ContactFormModalProps["onSaveCreate"];
  onSaveUpdate: ContactFormModalProps["onSaveUpdate"];
}): Promise<void> {
  if (isEdit && contactId) {
    await onSaveUpdate(contactId, buildUpdateContactInput(form));
    return;
  }

  await onSaveCreate(buildCreateContactInput(form, applicationId));
}

function getContactSaveErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Failed to save.";
}

function getSaveButtonLabel(isSaving: boolean, isEdit: boolean): string {
  if (isSaving) return "Saving...";
  return isEdit ? "Save changes" : "Create contact";
}

export function ContactFormModal({
  open,
  onOpenChange,
  contact,
  contactId,
  applicationId,
  defaultCompanyName,
  hideCompanyField,
  onSaveCreate,
  onSaveUpdate,
}: ContactFormModalProps) {
  const isEdit = Boolean(contact && contactId);

  const form = useContactForm(contact, defaultCompanyName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    form.reset();
    setError(null);
    onOpenChange(false);
  }, [form, onOpenChange]);

  const handleSave = useCallback(async () => {
    if (!form.firstName.trim()) {
      setError("First name is required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await persistContactForm({
        form,
        isEdit,
        contactId,
        applicationId,
        onSaveCreate,
        onSaveUpdate,
      });

      handleClose();
    } catch (err: unknown) {
      setError(getContactSaveErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }, [applicationId, contactId, form, handleClose, isEdit, onSaveCreate, onSaveUpdate]);

  // Phone row helpers
  const updatePhone = (i: number, field: keyof PhoneRowState, value: string) => {
    form.setPhones((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)),
    );
  };
  const addPhone = () =>
    form.setPhones((prev) => [...prev, { number: "", label: "mobile" }]);
  const removePhone = (i: number) =>
    form.setPhones((prev) => prev.filter((_, idx) => idx !== i));

  // Email row helpers
  const updateEmail = (i: number, field: keyof EmailRowState, value: string) => {
    form.setEmails((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)),
    );
  };
  const addEmail = () =>
    form.setEmails((prev) => [...prev, { address: "", label: "work" }]);
  const removeEmail = (i: number) =>
    form.setEmails((prev) => prev.filter((_, idx) => idx !== i));

  const saveButtonLabel = getSaveButtonLabel(isSaving, isEdit);

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title={isEdit ? "Edit contact" : "New contact"}
      description="Save a recruiter, HR or hiring manager to your CRM."
      size="md"
    >
      <div className="space-y-5">
        {/* Name + Role */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel required>First name</FieldLabel>
            <Input
              preset="default"
              value={form.firstName}
              onChange={(e) => form.setFirstName(e.target.value)}
              placeholder="Anna"
            />
          </div>
          <div>
            <FieldLabel>Last name</FieldLabel>
            <Input
              preset="default"
              value={form.lastName}
              onChange={(e) => form.setLastName(e.target.value)}
              placeholder="Müller"
            />
          </div>
        </div>

        <div className={hideCompanyField ? "" : "grid grid-cols-2 gap-3"}>
          <div>
            <FieldLabel required>Role</FieldLabel>
            <Select
              value={form.role}
              onChange={form.setRole}
              options={ROLE_OPTIONS}
              size="md"
              radius="lg"
            />
          </div>
          {hideCompanyField ? null : (
            <div>
              <FieldLabel>Company</FieldLabel>
              <Input
                preset="default"
                value={form.companyName}
                onChange={(e) => form.setCompanyName(e.target.value)}
                placeholder="Siemens AG"
              />
            </div>
          )}
        </div>

        {/* Phones */}
        <div className="space-y-2">
          <SectionTitle>Phone numbers</SectionTitle>
          {form.phones.map((phone, i) => (
            <div key={i} className="flex gap-2">
              <div className="w-28 shrink-0">
                <Select
                  value={phone.label}
                  onChange={(v) => updatePhone(i, "label", v)}
                  options={PHONE_LABEL_OPTIONS}
                  size="md"
                  radius="lg"
                />
              </div>
              <Input
                preset="default"
                type="tel"
                value={phone.number}
                onChange={(e) => updatePhone(i, "number", e.target.value)}
                placeholder="+49 151 1234 5678"
                className="flex-1"
              />
              {form.phones.length > 1 ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 text-muted-foreground"
                  onClick={() => removePhone(i)}
                >
                  ✕
                </Button>
              ) : null}
            </div>
          ))}
          <Button size="sm" variant="outline" shape="pill" onClick={addPhone}>
            + Add phone
          </Button>
        </div>

        {/* Emails */}
        <div className="space-y-2">
          <SectionTitle>Email addresses</SectionTitle>
          {form.emails.map((email, i) => (
            <div key={i} className="flex gap-2">
              <div className="w-28 shrink-0">
                <Select
                  value={email.label}
                  onChange={(v) => updateEmail(i, "label", v)}
                  options={EMAIL_LABEL_OPTIONS}
                  size="md"
                  radius="lg"
                />
              </div>
              <Input
                preset="default"
                type="email"
                value={email.address}
                onChange={(e) => updateEmail(i, "address", e.target.value)}
                placeholder="anna.muller@siemens.com"
                className="flex-1"
              />
              {form.emails.length > 1 ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 text-muted-foreground"
                  onClick={() => removeEmail(i)}
                >
                  ✕
                </Button>
              ) : null}
            </div>
          ))}
          <Button size="sm" variant="outline" shape="pill" onClick={addEmail}>
            + Add email
          </Button>
        </div>

        {/* LinkedIn */}
        <div>
          <FieldLabel>LinkedIn URL</FieldLabel>
          <Input
            preset="default"
            type="url"
            value={form.linkedInUrl}
            onChange={(e) => form.setLinkedInUrl(e.target.value)}
            placeholder="https://linkedin.com/in/..."
          />
        </div>

        {/* Notes */}
        <div>
          <FieldLabel>Notes</FieldLabel>
          <TextArea
            size="sm"
            radius="lg"
            value={form.notes}
            onChange={(e) => form.setNotes(e.target.value)}
            placeholder="Key person for backend roles, very responsive..."
          />
        </div>

        {/* Tags */}
        <div>
          <FieldLabel>Tags</FieldLabel>
          <Input
            preset="default"
            value={form.tagsInput}
            onChange={(e) => form.setTagsInput(e.target.value)}
            placeholder="responsive, tech-friendly, referral (comma-separated)"
          />
          {form.tagsInput.trim() ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {parseTags(form.tagsInput).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Error */}
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" shape="pill" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button shape="pill" onClick={handleSave} disabled={isSaving}>
            {saveButtonLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
