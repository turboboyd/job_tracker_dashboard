import React, { useState } from "react";
import { useTranslation } from "react-i18next";

// ─── ChipChoice ──────────────────────────────────────────────────────────────

type ChipChoiceProps = {
  options: string[];
  value: string[];
  multi?: boolean;
  onChange: (v: string[]) => void;
};

function ChipChoice({ options, value, multi = true, onChange }: ChipChoiceProps) {
  function toggle(opt: string) {
    if (multi) {
      onChange(value.includes(opt) ? value.filter((x) => x !== opt) : [...value, opt]);
    } else {
      onChange([opt]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = value.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={[
              "rounded-[20px] border px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-100",
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted",
            ].join(" ")}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ─── Step definitions ─────────────────────────────────────────────────────────

type WizardState = {
  searchStatus: string[];
  roles: string[];
  locations: string[];
  seniority: string[];
  workMode: string[];
};

const EMPTY: WizardState = {
  searchStatus: [],
  roles: [],
  locations: [],
  seniority: [],
  workMode: [],
};

// ─── Step progress bar ────────────────────────────────────────────────────────

// Width/colour for a progress dot. Extracted from a nested ternary
// (sonarjs/no-nested-conditional); the produced class string is unchanged.
function progressDotClass(i: number, current: number): string {
  if (i === current) return "w-5 bg-primary";
  if (i < current) return "w-1.5 bg-primary/40";
  return "w-1.5 bg-border";
}

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={[
            "h-1.5 rounded-full transition-all duration-200",
            progressDotClass(i, current),
          ].join(" ")}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const STEP_COUNT = 5;

export default function ProfileQuestionsPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardState>(EMPTY);
  const [roleInput, setRoleInput] = useState("");
  const [saved, setSaved] = useState(false);

  function patch<K extends keyof WizardState>(key: K, val: WizardState[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function addRole() {
    const v = roleInput.trim();
    if (v && !form.roles.includes(v)) {
      patch("roles", [...form.roles, v]);
    }
    setRoleInput("");
  }

  function removeRole(r: string) {
    patch("roles", form.roles.filter((x) => x !== r));
  }

  function handleSave() {
    setSaved(true);
    // In a real app: persist to Firestore here
  }

  // Per-step "can advance" validation, as a lookup instead of a nested ternary
  // (sonarjs/no-nested-conditional). All checks are side-effect-free reads, so
  // eager evaluation is equivalent; steps without an entry default to true.
  const stepCanAdvance: Record<number, boolean> = {
    0: form.searchStatus.length > 0,
    1: form.roles.length > 0,
    2: form.locations.length > 0,
    3: form.seniority.length > 0,
  };
  const canNext = stepCanAdvance[step] ?? true;

  const stepTitles = [
    t("profileQuestions.step1.title", "Job search status"),
    t("profileQuestions.step2.title", "Target roles"),
    t("profileQuestions.step3.title", "Preferred locations"),
    t("profileQuestions.step4.title", "Seniority level"),
    t("profileQuestions.step5.title", "Work mode"),
  ];

  const stepSubtitles = [
    t("profileQuestions.step1.subtitle", "What best describes your current situation?"),
    t("profileQuestions.step2.subtitle", "What roles are you looking for?"),
    t("profileQuestions.step3.subtitle", "Where would you like to work?"),
    t("profileQuestions.step4.subtitle", "What's your experience level?"),
    t("profileQuestions.step5.subtitle", "How do you prefer to work?"),
  ];

  if (saved) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="shrink-0 border-b border-border bg-background px-7 py-5">
          <div className="flex items-center gap-2 text-[11.5px] text-subtle-foreground mb-1">
            <span>Loopboard</span>
            <span>/</span>
            <span className="text-muted-foreground">
              {t("profileQuestions.title", "Profile questions")}
            </span>
          </div>
          <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
            {t("profileQuestions.title", "Profile questions")}
          </h1>
        </div>
        <div className="flex flex-1 items-center justify-center bg-background p-7">
          <div className="text-center">
            <div className="text-4xl mb-3">🎉</div>
            <div className="text-base font-semibold text-foreground">
              {t("profileQuestions.saved.title", "Profile saved!")}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {t("profileQuestions.saved.subtitle", "Your job preferences have been saved.")}
            </div>
            <button
              type="button"
              onClick={() => { setSaved(false); setStep(0); setForm(EMPTY); }}
              className="mt-4 rounded-[8px] border border-border bg-card px-4 py-2 text-[12.5px] font-medium text-foreground hover:bg-muted transition-colors"
            >
              {t("profileQuestions.saved.restart", "Update answers")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Page header */}
      <div className="shrink-0 border-b border-border bg-background px-7 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11.5px] text-subtle-foreground mb-1">
              <span>Loopboard</span>
              <span>/</span>
              <span className="text-muted-foreground">
                {t("profileQuestions.title", "Profile questions")}
              </span>
            </div>
            <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
              {t("profileQuestions.title", "Profile questions")}
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {t("profileQuestions.subtitle", "Help us personalise your job search experience.")}
            </p>
          </div>
          <StepDots total={STEP_COUNT} current={step} />
        </div>
      </div>

      {/* Wizard content */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="mx-auto max-w-[600px] p-7">
          {/* Step card */}
          <div className="rounded-[16px] border border-border bg-card p-6 space-y-5">
            {/* Step label */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-subtle-foreground mb-1">
                {t("profileQuestions.stepOf", "Step {{n}} of {{total}}", {
                  n: step + 1,
                  total: STEP_COUNT,
                })}
              </div>
              <h2 className="text-[18px] font-semibold text-foreground leading-tight">
                {stepTitles[step]}
              </h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {stepSubtitles[step]}
              </p>
            </div>

            {/* Step 0 – Search status */}
            {step === 0 && (
              <ChipChoice
                options={[
                  t("profileQuestions.step1.opt1", "Actively searching"),
                  t("profileQuestions.step1.opt2", "Open to offers"),
                  t("profileQuestions.step1.opt3", "Employed, not looking"),
                  t("profileQuestions.step1.opt4", "Taking a break"),
                ]}
                value={form.searchStatus}
                multi={false}
                onChange={(v) => patch("searchStatus", v)}
              />
            )}

            {/* Step 1 – Target roles */}
            {step === 1 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addRole();
                      }
                    }}
                    placeholder={t("profileQuestions.step2.placeholder", "e.g. Frontend Developer")}
                    className="flex-1 rounded-[8px] border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addRole}
                    disabled={!roleInput.trim()}
                    className="rounded-[8px] border border-border bg-card px-3 py-2 text-[12.5px] font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40"
                  >
                    {t("profileQuestions.step2.add", "Add")}
                  </button>
                </div>
                {/* Quick picks */}
                <div>
                  <div className="mb-1.5 text-[11.5px] text-muted-foreground">
                    {t("profileQuestions.step2.quickPicks", "Quick picks")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {["Frontend Developer", "Backend Developer", "Full-Stack Developer", "React Developer", "UX Designer", "Product Manager", "DevOps Engineer", "Data Analyst"].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          if (!form.roles.includes(r)) patch("roles", [...form.roles, r]);
                        }}
                        disabled={form.roles.includes(r)}
                        className="rounded-[6px] border border-dashed border-border px-2.5 py-1 text-[11.5px] text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-default"
                      >
                        + {r}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Selected roles */}
                {form.roles.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {form.roles.map((r) => (
                      <span key={r} className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/8 px-3 py-1 text-[12px] font-medium text-primary">
                        {r}
                        <button
                          type="button"
                          onClick={() => removeRole(r)}
                          className="ml-0.5 text-primary/60 hover:text-primary"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 2 – Locations */}
            {step === 2 && (
              <ChipChoice
                options={[
                  t("profileQuestions.step3.remote", "Remote"),
                  "Berlin",
                  "Munich",
                  "Hamburg",
                  "Frankfurt",
                  "Cologne",
                  "Stuttgart",
                  "Düsseldorf",
                  "Leipzig",
                  t("profileQuestions.step3.other", "Open to relocation"),
                ]}
                value={form.locations}
                onChange={(v) => patch("locations", v)}
              />
            )}

            {/* Step 3 – Seniority */}
            {step === 3 && (
              <ChipChoice
                options={["Intern", "Junior", "Mid", "Senior", "Lead", "Principal"]}
                value={form.seniority}
                onChange={(v) => patch("seniority", v)}
              />
            )}

            {/* Step 4 – Work mode */}
            {step === 4 && (
              <div className="space-y-4">
                <ChipChoice
                  options={[
                    t("profileQuestions.step5.remote", "Remote"),
                    t("profileQuestions.step5.hybrid", "Hybrid"),
                    t("profileQuestions.step5.onsite", "On-site"),
                  ]}
                  value={form.workMode}
                  onChange={(v) => patch("workMode", v)}
                />

                {/* Summary preview */}
                {form.searchStatus.length > 0 && (
                  <div className="mt-4 rounded-[10px] border border-border bg-background p-4 space-y-2">
                    <div className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-subtle-foreground mb-2">
                      {t("profileQuestions.summary.label", "Your profile summary")}
                    </div>
                    {(
                      [
                        [t("profileQuestions.step1.title", "Status"), form.searchStatus],
                        [t("profileQuestions.step2.title", "Roles"), form.roles],
                        [t("profileQuestions.step3.title", "Locations"), form.locations],
                        [t("profileQuestions.step4.title", "Seniority"), form.seniority],
                      ] as [string, string[]][]
                    ).map(([label, vals]) => vals.length > 0 ? (
                      <div key={label} className="flex gap-2 text-[12.5px]">
                        <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
                        <span className="text-foreground">{vals.join(", ")}</span>
                      </div>
                    ) : null)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="rounded-[8px] border border-border bg-card px-4 py-2 text-[12.5px] font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-default"
            >
              ← {t("profileQuestions.nav.back", "Back")}
            </button>

            {step < STEP_COUNT - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext}
                className="rounded-[8px] bg-primary px-5 py-2 text-[12.5px] font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-default"
              >
                {t("profileQuestions.nav.next", "Next")} →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={!canNext}
                className="rounded-[8px] bg-primary px-5 py-2 text-[12.5px] font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-default"
              >
                {t("profileQuestions.nav.save", "Save profile")} ✓
              </button>
            )}
          </div>

          {/* Skip */}
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(STEP_COUNT - 1, s + 1))}
              className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("profileQuestions.nav.skip", "Skip this step")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
