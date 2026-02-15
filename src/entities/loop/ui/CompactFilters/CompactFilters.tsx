import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, FormField, Input } from "src/shared/ui";

import type { CanonicalFilters } from "../../model";

const RADIUS_OPTIONS: CanonicalFilters["radiusKm"][] = [5, 10, 20, 30, 50, 100];
const POSTED_WITHIN_OPTIONS: CanonicalFilters["postedWithin"][] = [
  1, 3, 7, 14, 30,
];

type Option<T> = { value: T; label: string };

type Props = {
  value: CanonicalFilters;
  onChange: (next: CanonicalFilters) => void;

  onApply: () => void;
  onReset: () => void;

  disabled?: boolean;
};

function parseKeywordLine(v: string) {
  return v.replace(/\s+/g, " ").trim();
}

export function CompactFilters({
  value,
  onChange,
  onApply,
  onReset,
  disabled,
}: Props) {
  const { t } = useTranslation();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const workModeOptions: Array<Option<CanonicalFilters["workMode"]>> = useMemo(
    () => [
      { value: "any", label: t("loops.workMode.any", "Any") },
      { value: "onsite", label: t("loops.workMode.onsite", "On-site") },
      { value: "hybrid", label: t("loops.workMode.hybrid", "Hybrid") },
      { value: "remote", label: t("loops.workMode.remote", "Remote") },
      {
        value: "remote_only",
        label: t("loops.workMode.remoteOnly", "Remote-only"),
      },
    ],
    [t]
  );

  const seniorityOptions: Array<Option<CanonicalFilters["seniority"]>> = useMemo(
    () => [
      { value: "intern", label: t("loops.seniority.intern", "Intern") },
      { value: "junior", label: t("loops.seniority.junior", "Junior") },
      { value: "mid", label: t("loops.seniority.mid", "Mid") },
      { value: "senior", label: t("loops.seniority.senior", "Senior") },
      { value: "lead", label: t("loops.seniority.lead", "Lead") },
    ],
    [t]
  );

  const employmentOptions: Array<Option<CanonicalFilters["employmentType"]>> =
    useMemo(
      () => [
        {
          value: "full_time",
          label: t("loops.employment.fullTime", "Full-time"),
        },
        {
          value: "part_time",
          label: t("loops.employment.partTime", "Part-time"),
        },
        { value: "contract", label: t("loops.employment.contract", "Contract") },
        {
          value: "internship",
          label: t("loops.employment.internship", "Internship"),
        },
        {
          value: "ausbildung",
          label: t("loops.employment.ausbildung", "Ausbildung"),
        },
      ],
      [t]
    );

  const languageOptions: Array<Option<CanonicalFilters["language"]>> = useMemo(
    () => [
      { value: "any", label: t("loops.language.any", "Any") },
      { value: "de", label: t("loops.language.de", "DE") },
      { value: "en", label: t("loops.language.en", "EN") },
    ],
    [t]
  );

  const badges = useMemo(() => {
    const out: string[] = [];
    const role = value.role.trim();
    const location = value.location.trim();

    if (role)
      out.push(t("loops.badgeRole", "Role: {{value}}", { value: role }));
    if (location)
      out.push(t("loops.badgeLoc", "Loc: {{value}}", { value: location }));

    out.push(
      t("loops.badgeRadius", "Radius: {{value}}km", { value: value.radiusKm })
    );

    if (value.workMode !== "any")
      out.push(t("loops.badgeMode", "Mode: {{value}}", { value: value.workMode }));

    out.push(
      t("loops.badgePosted", "Posted: {{value}}d", { value: value.postedWithin })
    );

    return out;
  }, [t, value]);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-semibold text-foreground">
            {t("loops.filtersTitle", "Filters")}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {t(
              "loops.filtersSubtitle",
              "Update → Apply → links refresh & saved to loop."
            )}
          </div>

          {badges.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {badges.map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground"
                >
                  {b}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            shadow="sm"
            shape="lg"
            onClick={onApply}
            disabled={disabled}
          >
            {t("loops.apply", "Apply")}
          </Button>
          <Button
            variant="outline"
            shape="lg"
            onClick={onReset}
            disabled={disabled}
          >
            {t("loops.reset", "Reset")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="md:col-span-5">
          <FormField label={t("loops.professionRole", "Profession / Role")}>
            <Input
              value={value.role}
              onChange={(e) => onChange({ ...value, role: e.target.value })}
              placeholder={t(
                "loops.professionRolePlaceholder",
                "Fachinformatiker OR React Developer"
              )}
              disabled={disabled}
            />
          </FormField>
        </div>

        <div className="md:col-span-4">
          <FormField label={t("loops.location", "Location")}>
            <Input
              value={value.location}
              onChange={(e) => onChange({ ...value, location: e.target.value })}
              placeholder={t("loops.locationPlaceholder", "Berlin")}
              disabled={disabled}
            />
          </FormField>
        </div>

        <div className="md:col-span-2">
          <FormField label={t("loops.radius", "Radius")}>
            <select
              value={value.radiusKm}
              onChange={(e) =>
                onChange({
                  ...value,
                  radiusKm: Number(e.target.value) as CanonicalFilters["radiusKm"],
                })
              }
              className="h-10 w-full rounded-xl border border-border bg-input px-3 text-sm text-foreground"
              disabled={disabled}
            >
              {RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {t("loops.km", "{{value}} km", { value: r })}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="md:col-span-1">
          <FormField label=" " hint="">
            <Button
              variant="outline"
              shape="lg"
              className="w-full"
              onClick={() => setAdvancedOpen((v) => !v)}
              disabled={disabled}
            >
              {advancedOpen
                ? t("loops.less", "Less")
                : t("loops.more", "More")}
            </Button>
          </FormField>
        </div>
      </div>

      {advancedOpen ? (
        <div className="rounded-2xl border border-border bg-background p-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-3">
              <FormField label={t("loops.workModeTitle", "Work mode")}>
                <select
                  value={value.workMode}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      workMode: e.target.value as CanonicalFilters["workMode"],
                    })
                  }
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                  disabled={disabled}
                >
                  {workModeOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="md:col-span-3">
              <FormField label={t("loops.seniorityTitle", "Seniority")}>
                <select
                  value={value.seniority}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      seniority: e.target.value as CanonicalFilters["seniority"],
                    })
                  }
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                  disabled={disabled}
                >
                  {seniorityOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="md:col-span-3">
              <FormField label={t("loops.employmentType", "Employment type")}>
                <select
                  value={value.employmentType}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      employmentType: e.target.value as CanonicalFilters["employmentType"],
                    })
                  }
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                  disabled={disabled}
                >
                  {employmentOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="md:col-span-3">
              <FormField label={t("loops.postedWithin", "Posted within")}>
                <select
                  value={value.postedWithin}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      postedWithin: Number(
                        e.target.value
                      ) as CanonicalFilters["postedWithin"],
                    })
                  }
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                  disabled={disabled}
                >
                  {POSTED_WITHIN_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {t("loops.days", "{{value}} days", { value: d })}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-6">
              <FormField
                label={t("loops.includeKeywords", "Include keywords")}
                hint={t(
                  "loops.includeKeywordsHint",
                  "Optional, will be appended to search query"
                )}
              >
                <Input
                  value={value.includeKeywords}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      includeKeywords: parseKeywordLine(e.target.value),
                    })
                  }
                  placeholder={t("loops.includeKeywordsPlaceholder", "react typescript next")}
                  disabled={disabled}
                />
              </FormField>
            </div>

            <div className="md:col-span-6">
              <FormField
                label={t("loops.excludeKeywords", "Exclude keywords")}
                hint={t(
                  "loops.excludeKeywordsHint",
                  "Optional, will be appended as exclusions"
                )}
              >
                <Input
                  value={value.excludeKeywords}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      excludeKeywords: parseKeywordLine(e.target.value),
                    })
                  }
                  placeholder={t(
                    "loops.excludeKeywordsPlaceholder",
                    "senior lead manager zeitarbeit"
                  )}
                  disabled={disabled}
                />
              </FormField>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-3">
              <FormField label={t("loops.languageTitle", "Language")}>
                <select
                  value={value.language}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      language: e.target.value as CanonicalFilters["language"],
                    })
                  }
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
                  disabled={disabled}
                >
                  {languageOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="md:col-span-4 flex items-end">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={value.excludeAgencies}
                  onChange={(e) =>
                    onChange({ ...value, excludeAgencies: e.target.checked })
                  }
                  disabled={disabled}
                />
                {t("loops.excludeAgencies", "Exclude agencies / Zeitarbeit")}
              </label>
            </div>

            <div className="md:col-span-5" />
          </div>

          <div className="text-xs text-muted-foreground">
            {t(
              "loops.advancedInfo",
              "Advanced filters are stored in loop.filters. URL builders can be extended later per platform."
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
