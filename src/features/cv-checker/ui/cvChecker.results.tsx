import { Card } from "src/shared/ui/Card";

import type { AtsResult } from "./cvChecker.helpers";
import {
  EmptyValue,
  METRIC_CARD_CLASS,
  ResultGroup,
  ResultTag,
} from "./cvChecker.primitives";
import type { CvCheckerText } from "./cvChecker.text";

function BreakdownMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className={METRIC_CARD_CLASS}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function ResultSummaryCard({
  result,
  text,
}: {
  result: AtsResult;
  text: CvCheckerText;
}) {
  return (
    <Card className="p-4 lg:col-span-1">
      <div className="text-sm text-muted-foreground">{text.score}</div>
      <div className="mt-1 text-3xl font-semibold text-foreground">
        {result.score}/100
      </div>
      <div className="mt-2 text-sm">
        {text.decision}:{" "}
        <span className="font-semibold text-foreground">
          {result.decision}
        </span>
      </div>

      {result.hardFilterFlags.length > 0 ? (
        <div className="mt-3">
          <div className="text-xs font-medium text-muted-foreground">
            {text.flags}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {result.hardFilterFlags.map((flag) => (
              <ResultTag key={flag}>{flag}</ResultTag>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function ResultDetailsCard({
  result,
  text,
}: {
  result: AtsResult;
  text: CvCheckerText;
}) {
  return (
    <Card className="p-4 lg:col-span-2">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ResultGroup title={text.matched}>
          {result.matchedSkills.length > 0 ? (
            result.matchedSkills.map((skill) => (
              <ResultTag key={skill}>{skill}</ResultTag>
            ))
          ) : (
            <EmptyValue text={text.emptyValue} />
          )}
        </ResultGroup>

        <ResultGroup title={text.gaps}>
          {result.gapsTop.length > 0 ? (
            result.gapsTop.map((gap) => (
              <ResultTag key={gap.key} tone="danger">
                {gap.label} p={gap.priority}
              </ResultTag>
            ))
          ) : (
            <EmptyValue text={text.emptyValue} />
          )}
        </ResultGroup>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <BreakdownMetric
          label={text.metrics.skills}
          value={result.breakdown.skills}
        />
        <BreakdownMetric
          label={text.metrics.experience}
          value={result.breakdown.experience}
        />
        <BreakdownMetric
          label={text.metrics.keywords}
          value={result.breakdown.keywords}
        />
        <BreakdownMetric
          label={text.metrics.penalty}
          value={result.breakdown.redFlags}
        />
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        {text.confidence}:{" "}
        <span className="ml-1 font-semibold text-foreground">
          {result.confidence}
        </span>
      </div>
    </Card>
  );
}

export function ResultView({
  result,
  text,
}: {
  result: AtsResult;
  text: CvCheckerText;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <ResultSummaryCard result={result} text={text} />
      <ResultDetailsCard result={result} text={text} />
    </div>
  );
}
