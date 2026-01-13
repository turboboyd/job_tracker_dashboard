import React from "react";
import { useTranslation } from "react-i18next";

const LANGS = [
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
  { code: "de", label: "DE" },
  { code: "uk", label: "UK" },
] as const;

export const LanguageSelect: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language?.slice(0, 2) ?? "en"}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="h-9 rounded-md border border-border bg-card px-2 text-sm text-foreground shadow-[var(--shadow-sm)] hover:bg-muted transition-colors"
      aria-label="Select language"
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
};
