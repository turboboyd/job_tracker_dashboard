import type { TemplateVariable } from "./emailTemplates";

export interface VariableValues {
  contactName: string;
  companyName: string;
  roleTitle: string;
  myName: string;
  interviewDate: string;
  offerDeadline: string;
}

const VAR_MAP: Record<TemplateVariable, keyof VariableValues> = {
  "{{contactName}}": "contactName",
  "{{companyName}}": "companyName",
  "{{roleTitle}}": "roleTitle",
  "{{myName}}": "myName",
  "{{interviewDate}}": "interviewDate",
  "{{offerDeadline}}": "offerDeadline",
};

export function substituteVariables(
  text: string,
  values: VariableValues,
): string {
  let result = text;
  for (const [token, key] of Object.entries(VAR_MAP)) {
    const value = values[key];
    if (value.trim()) {
      result = result.replaceAll(token, value.trim());
    }
  }
  return result;
}

export function buildMailtoHref(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  }
}

export function getEmptyVariableValues(): VariableValues {
  return {
    contactName: "",
    companyName: "",
    roleTitle: "",
    myName: "",
    interviewDate: "",
    offerDeadline: "",
  };
}
