import assert from "node:assert/strict";

import { atsScoreCvVsJd } from "../atsScore";

function test(_name: string, run: () => void) {
  run();
}

test("atsScoreCvVsJd recommends apply for strong skill and experience matches", () => {
  const result = atsScoreCvVsJd(
    [
      "Senior Frontend Engineer with 5 years of experience.",
      "React, TypeScript, Next.js, Jest, Docker, CI/CD and accessibility.",
    ].join(" "),
    [
      "Senior Frontend Developer role requiring 3 years of experience.",
      "React, TypeScript, Next.js, Jest, Docker, CI/CD and accessibility.",
    ].join(" "),
  );

  assert.equal(result.decision, "APPLY");
  assert.equal(result.hardFilterFlags.length, 0);
  assert.ok(result.score >= 75);
  assert.ok(result.matchedSkills.includes("react"));
  assert.ok(result.matchedSkills.includes("typescript"));
  assert.equal(result.evidence.jdYears, 3);
  assert.equal(result.evidence.cvYears, 5);
});

test("atsScoreCvVsJd skips low skill coverage with hard filter flags", () => {
  const result = atsScoreCvVsJd(
    "Junior content editor with HTML and CSS portfolio projects.",
    [
      "Senior fullstack role requiring 5 years of experience.",
      "React, TypeScript, Node.js, PostgreSQL, Docker, Kubernetes and AWS.",
    ].join(" "),
  );

  assert.equal(result.decision, "SKIP");
  assert.ok(result.hardFilterFlags.includes("LOW_SKILL_COVERAGE"));
  assert.ok(result.hardFilterFlags.includes("MANY_MISSING_SKILLS"));
  assert.ok(result.missingSkills.includes("react"));
  assert.ok(result.missingSkills.includes("typescript"));
  assert.ok(result.score < 55);
});

test("atsScoreCvVsJd normalizes common skill synonyms", () => {
  const result = atsScoreCvVsJd(
    "Mid developer with React.js, TS, Node.js and PostgreSQL experience.",
    "Mid developer role: React, TypeScript, Node, SQL.",
  );

  assert.equal(result.decision, "APPLY");
  assert.ok(result.matchedSkills.includes("react"));
  assert.ok(result.matchedSkills.includes("typescript"));
  assert.ok(result.matchedSkills.includes("node"));
  assert.ok(result.matchedSkills.includes("sql"));
});

test("atsScoreCvVsJd handles vague job descriptions without hard filters", () => {
  const result = atsScoreCvVsJd(
    "Frontend developer with React and TypeScript experience.",
    "Friendly product team looking for a thoughtful builder.",
  );

  assert.equal(result.decision, "SKIP");
  assert.deepEqual(result.hardFilterFlags, []);
  assert.deepEqual(result.missingSkills, []);
  assert.equal(result.evidence.jdSkills.length, 0);
});
