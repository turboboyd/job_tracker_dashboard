import {
  Calendar,
  CheckCircle2,
  FileText,
  LayoutGrid,
  ListChecks,
  Sparkles,
  Target,
} from "lucide-react";

/**
 * Static, per-step icon. Returns a statically-referenced lucide icon per step id
 * (no dynamically-assembled component during render) so it stays compatible with
 * the React Compiler lint rules.
 */
export function OnboardingStepIcon({ id, className }: { id: string; className?: string }) {
  switch (id) {
    case "loops":
      return <Target className={className} aria-hidden="true" />;
    case "matches":
      return <ListChecks className={className} aria-hidden="true" />;
    case "applications":
      return <FileText className={className} aria-hidden="true" />;
    case "board":
      return <LayoutGrid className={className} aria-hidden="true" />;
    case "calendar":
      return <Calendar className={className} aria-hidden="true" />;
    case "finish":
      return <CheckCircle2 className={className} aria-hidden="true" />;
    case "welcome":
    default:
      return <Sparkles className={className} aria-hidden="true" />;
  }
}
