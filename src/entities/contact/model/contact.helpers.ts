import type { ContactDoc } from "./contact.types";

/**
 * Returns "FirstName LastName" or falls back to available part.
 */
export function getContactFullName(contact: Pick<ContactDoc, "firstName" | "lastName">): string {
  const parts = [contact.firstName.trim(), contact.lastName.trim()].filter(Boolean);
  return parts.join(" ") || "—";
}

/**
 * Returns initials for avatar display, e.g. "Anna Müller" → "AM".
 */
export function getContactInitials(contact: Pick<ContactDoc, "firstName" | "lastName">): string {
  const first = contact.firstName.trim()[0] ?? "";
  const last = contact.lastName.trim()[0] ?? "";
  return (first + last).toUpperCase() || "?";
}

/**
 * Returns the primary phone number (first in array) or undefined.
 */
export function getPrimaryPhone(contact: Pick<ContactDoc, "phones">): string | undefined {
  return contact.phones[0]?.number;
}

/**
 * Returns the primary email address (first in array) or undefined.
 */
export function getPrimaryEmail(contact: Pick<ContactDoc, "emails">): string | undefined {
  return contact.emails[0]?.address;
}

/**
 * Builds a mailto: href for the primary email.
 */
export function buildMailtoHref(contact: Pick<ContactDoc, "emails">, subject?: string): string | undefined {
  const email = getPrimaryEmail(contact);
  if (!email) return undefined;
  return subject ? `mailto:${email}?subject=${encodeURIComponent(subject)}` : `mailto:${email}`;
}

/**
 * Builds a tel: href for the primary phone.
 */
export function buildTelHref(contact: Pick<ContactDoc, "phones">): string | undefined {
  const phone = getPrimaryPhone(contact);
  if (!phone) return undefined;
  return `tel:${phone.replace(/\s/g, "")}`;
}
