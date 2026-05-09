import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Mail,
  Search,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { classNames } from "src/shared/lib";
import { Button } from "src/shared/ui/Button";
import { Input } from "src/shared/ui/Form/Input";
import { PageHeader } from "src/shared/ui/PageHeaders";
import { PageShell } from "src/shared/ui/PageShell";

import {
  ALL_CATEGORIES,
  BUILT_IN_TEMPLATES,
  CATEGORY_EMOJI,
  CATEGORY_LABELS,
  type EmailTemplate,
  type TemplateCategory,
  type TemplateVariable,
} from "./model/emailTemplates";
import {
  buildMailtoHref,
  copyToClipboard,
  getEmptyVariableValues,
  substituteVariables,
  type VariableValues,
} from "./model/templateHelpers";

const VAR_LABELS: Record<TemplateVariable, string> = {
  "{{contactName}}": "Contact name",
  "{{companyName}}": "Company name",
  "{{roleTitle}}": "Role / position",
  "{{myName}}": "Your name",
  "{{interviewDate}}": "Interview date",
  "{{offerDeadline}}": "Offer deadline",
};

const VAR_FIELD_MAP: Record<TemplateVariable, keyof VariableValues> = {
  "{{contactName}}": "contactName",
  "{{companyName}}": "companyName",
  "{{roleTitle}}": "roleTitle",
  "{{myName}}": "myName",
  "{{interviewDate}}": "interviewDate",
  "{{offerDeadline}}": "offerDeadline",
};

function CategoryBar({
  active,
  onSelect,
}: {
  active: TemplateCategory | "all";
  onSelect: (c: TemplateCategory | "all") => void;
}) {
  const items: (TemplateCategory | "all")[] = ["all", ...ALL_CATEGORIES];
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onSelect(cat)}
          className={classNames(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
            active === cat
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {cat === "all" ? "All" : <>{CATEGORY_EMOJI[cat]} {CATEGORY_LABELS[cat]}</>}
        </button>
      ))}
    </div>
  );
}

function VariablesPanel({
  variables,
  values,
  onChange,
}: {
  variables: TemplateVariable[];
  values: VariableValues;
  onChange: (key: keyof VariableValues, value: string) => void;
}) {
  if (variables.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fill in variables</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {variables.map((v) => (
          <div key={v}>
            <span className="block text-xs text-muted-foreground mb-1">{VAR_LABELS[v]}</span>
            <Input
              preset="default"
              value={values[VAR_FIELD_MAP[v]]}
              onChange={(e) => onChange(VAR_FIELD_MAP[v], e.target.value)}
              placeholder={VAR_LABELS[v]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewPanel({
  subject, body, copiedField, onCopySubject, onCopyBody, onOpenMail,
}: {
  subject: string; body: string;
  copiedField: "subject" | "body" | null;
  onCopySubject: () => void; onCopyBody: () => void; onOpenMail: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-xs font-semibold text-muted-foreground">Subject</span>
          <button type="button" onClick={onCopySubject}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
            {copiedField === "subject" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            Copy
          </button>
        </div>
        <p className="px-3 py-2 text-sm font-medium text-foreground">{subject}</p>
      </div>
      <div className="rounded-lg border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-xs font-semibold text-muted-foreground">Body</span>
          <button type="button" onClick={onCopyBody}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
            {copiedField === "body" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            Copy
          </button>
        </div>
        <pre className="whitespace-pre-wrap break-words px-3 py-3 text-sm text-foreground font-sans leading-relaxed max-h-64 overflow-y-auto">{body}</pre>
      </div>
      <Button variant="outline" shape="pill" className="gap-2 w-full" onClick={onOpenMail}>
        <ExternalLink className="h-4 w-4" />Open in Mail app
      </Button>
    </div>
  );
}

function TemplateCard({
  template, globalVars, onVarChange,
}: {
  template: EmailTemplate; globalVars: VariableValues;
  onVarChange: (key: keyof VariableValues, value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<"subject" | "body" | null>(null);
  const subject = useMemo(() => substituteVariables(template.subject, globalVars), [template.subject, globalVars]);
  const body = useMemo(() => substituteVariables(template.body, globalVars), [template.body, globalVars]);

  const handleCopy = useCallback(async (field: "subject" | "body") => {
    await copyToClipboard(field === "subject" ? subject : body);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, [body, subject]);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button type="button" onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-3 p-4 text-left transition-colors hover:bg-muted/40">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{template.label}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {CATEGORY_EMOJI[template.category]} {CATEGORY_LABELS[template.category]}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{template.description}</p>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />}
      </button>
      {expanded ? (
        <div className="border-t border-border p-4 space-y-4">
          <VariablesPanel variables={template.variables} values={globalVars} onChange={onVarChange} />
          <PreviewPanel subject={subject} body={body} copiedField={copiedField}
            onCopySubject={() => handleCopy("subject")} onCopyBody={() => handleCopy("body")}
            onOpenMail={() => window.open(buildMailtoHref(subject, body), "_blank")} />
        </div>
      ) : null}
    </div>
  );
}

export default function InboxPage() {
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [globalVars, setGlobalVars] = useState<VariableValues>(getEmptyVariableValues());

  const handleVarChange = useCallback((key: keyof VariableValues, value: string) => {
    setGlobalVars((prev) => ({ ...prev, [key]: value }));
  }, []);

  const visibleTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return BUILT_IN_TEMPLATES.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      if (q && !t.label.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [category, search]);

  return (
    <PageShell paddingX="md" paddingY="sm">
      <div className="space-y-5">
        <PageHeader title="Email Templates"
          subtitle="Ready-to-send templates for every stage of your job search." />

        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            Your details — auto-fills all templates
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(["{{myName}}", "{{contactName}}", "{{companyName}}"] as TemplateVariable[]).map((v) => (
              <div key={v}>
                <span className="block text-xs text-muted-foreground mb-1">{VAR_LABELS[v]}</span>
                <Input preset="default" value={globalVars[VAR_FIELD_MAP[v]]}
                  onChange={(e) => handleVarChange(VAR_FIELD_MAP[v], e.target.value)}
                  placeholder={VAR_LABELS[v]} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input preset="default" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…" className="pl-9" />
          </div>
          <CategoryBar active={category} onSelect={setCategory} />
        </div>

        {visibleTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm font-semibold text-foreground">No templates found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleTemplates.map((t) => (
              <TemplateCard key={t.id} template={t} globalVars={globalVars} onVarChange={handleVarChange} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
