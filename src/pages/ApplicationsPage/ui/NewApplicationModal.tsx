import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  CONTACT_ROLE_KEYS,
  CONTACT_ROLE_LABELS,
  type ContactRole,
} from "src/entities/contact";
import { Button } from "src/shared/ui/Button";
import { Input } from "src/shared/ui/Form/Input";
import { Modal } from "src/shared/ui/Modal/Modal";

import type { CreateFormState } from "../model/types";
import type { NewApplicationContactInput } from "../model/useApplicationsPage";

import {
  CreateApplicationTextAreaField,
  CreateApplicationTextInputField,
} from "./CreateApplicationCard.fields";
import type {
  CreateApplicationChangeHandler,
  CreateApplicationLabels,
} from "./CreateApplicationCard.types";

interface NewApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Application form state owned by the page-level controller. */
  form: CreateFormState;
  onChange: CreateApplicationChangeHandler;
  /** Returns true on success so the modal can self-close. */
  onCreate: (contact?: NewApplicationContactInput) => Promise<boolean>;
  canSubmit: boolean;
  isCreating: boolean;
  labels: CreateApplicationLabels;
  contactLabels: ContactSectionLabels;
}

export interface ContactSectionLabels {
  sectionTitle: string;
  sectionHint: string;
  firstName: string;
  firstNamePh: string;
  lastName: string;
  lastNamePh: string;
  role: string;
  phone: string;
  phonePh: string;
  email: string;
  emailPh: string;
  cancel: string;
  /** Localised role labels keyed by the role enum value. */
  roleLabels: Record<ContactRole, string>;
}

const EMPTY_CONTACT: NewApplicationContactInput = {
  firstName: "",
  lastName: "",
  role: "HR",
  phone: "",
  email: "",
};

export function NewApplicationModal({
  open,
  onOpenChange,
  form,
  onChange,
  onCreate,
  canSubmit,
  isCreating,
  labels,
  contactLabels,
}: NewApplicationModalProps) {
  const { t } = useTranslation();
  const [contact, setContact] = useState<NewApplicationContactInput>(EMPTY_CONTACT);

  // Reset contact whenever modal re-opens
  useEffect(() => {
    if (open) setContact(EMPTY_CONTACT);
  }, [open]);

  const handleSubmit = async () => {
    const ok = await onCreate(contact.firstName.trim() ? contact : undefined);
    if (ok) onOpenChange(false);
  };

  const submitLabel = isCreating ? labels.creatingButton : labels.createButton;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      showClose={false}
      title={labels.title}
      description={t("applicationsPage.create.subtitle", {
        defaultValue: "Add a new application — fill in the basics, the rest later.",
      })}
    >
      <div className="space-y-md">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <CreateApplicationTextInputField
            field="companyName"
            label={labels.company}
            value={form.companyName}
            onChange={onChange}
            placeholder={labels.companyPlaceholder}
            required
          />
          <CreateApplicationTextInputField
            field="roleTitle"
            label={labels.role}
            value={form.roleTitle}
            onChange={onChange}
            placeholder={labels.rolePlaceholder}
            required
          />
          <CreateApplicationTextInputField
            field="vacancyUrl"
            label={labels.url}
            value={form.vacancyUrl}
            onChange={onChange}
            placeholder={labels.urlPlaceholder}
            spanFull
          />
          <CreateApplicationTextInputField
            field="source"
            label={labels.source}
            value={form.source}
            onChange={onChange}
            placeholder={labels.sourcePlaceholder}
          />
          <CreateApplicationTextAreaField
            label={labels.description}
            value={form.rawDescription}
            onChange={onChange}
            placeholder={labels.descriptionPlaceholder}
          />
        </div>

        {/* ── Contact (optional) ────────────────────────────────────────── */}
        <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
          <div>
            <div className="text-sm font-semibold text-foreground">
              {contactLabels.sectionTitle}
            </div>
            <div className="text-xs text-muted-foreground">{contactLabels.sectionHint}</div>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <label className="space-y-1 text-sm md:col-span-1">
              <span className="text-xs font-medium text-muted-foreground">
                {contactLabels.firstName}
              </span>
              <Input
                preset="default"
                value={contact.firstName}
                placeholder={contactLabels.firstNamePh}
                onChange={(e) =>
                  setContact((c) => ({ ...c, firstName: e.target.value }))
                }
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-1">
              <span className="text-xs font-medium text-muted-foreground">
                {contactLabels.lastName}
              </span>
              <Input
                preset="default"
                value={contact.lastName}
                placeholder={contactLabels.lastNamePh}
                onChange={(e) =>
                  setContact((c) => ({ ...c, lastName: e.target.value }))
                }
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-1">
              <span className="text-xs font-medium text-muted-foreground">
                {contactLabels.role}
              </span>
              <select
                value={contact.role}
                onChange={(e) =>
                  setContact((c) => ({ ...c, role: e.target.value as ContactRole }))
                }
                className="block h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {CONTACT_ROLE_KEYS.map((role) => (
                  <option key={role} value={role}>
                    {contactLabels.roleLabels[role] ?? CONTACT_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">
                {contactLabels.phone}
              </span>
              <Input
                preset="default"
                type="tel"
                value={contact.phone}
                placeholder={contactLabels.phonePh}
                onChange={(e) =>
                  setContact((c) => ({ ...c, phone: e.target.value }))
                }
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">
                {contactLabels.email}
              </span>
              <Input
                preset="default"
                type="email"
                value={contact.email}
                placeholder={contactLabels.emailPh}
                onChange={(e) =>
                  setContact((c) => ({ ...c, email: e.target.value }))
                }
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="outline"
            shape="pill"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            {contactLabels.cancel}
          </Button>
          <Button
            shape="pill"
            onClick={handleSubmit}
            disabled={!canSubmit || isCreating}
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
