import { Link } from "react-router-dom";

import { Button } from "src/shared/ui/Button";
import { PageHeader } from "src/shared/ui/PageHeaders";

import type { MatchDetailsHeaderProps } from "./matchDetails.types";

export function MatchDetailsHeader({
  backTo,
  title,
  subtitle,
  backLabel,
}: MatchDetailsHeaderProps) {
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      right={
        <div className="flex items-center gap-sm">
          <Link to={backTo}>
            <Button variant="outline" size="sm" shape="pill">
              {backLabel}
            </Button>
          </Link>
        </div>
      }
    />
  );
}

