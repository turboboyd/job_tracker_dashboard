import assert from "node:assert/strict";

import { detectSeniority, extractKeywordsFromJd, extractSkills } from "../extract";

function test(_name: string, run: () => void) {
  run();
}

test("extractSkills does not match short aliases inside larger words", () => {
  const skills = extractSkills("Portfolio projects and jobs with basic CSS.");

  assert.equal(skills.includes("typescript"), false);
  assert.equal(skills.includes("javascript"), false);
});

test("extractSkills still matches standalone short aliases and symbol skills", () => {
  const skills = extractSkills("Built with JS, TS, Node.js and CI/CD.");

  assert.ok(skills.includes("javascript"));
  assert.ok(skills.includes("typescript"));
  assert.ok(skills.includes("node"));
  assert.ok(skills.includes("ci/cd"));
});

test("detectSeniority avoids title matches hidden inside larger words", () => {
  assert.equal(detectSeniority("Writes about leadership and middlewares."), "UNKNOWN");
  assert.equal(detectSeniority("Entry-level intern developer role."), "JUNIOR");
  assert.equal(detectSeniority("Senior staff engineer role."), "SENIOR");
});

test("extractKeywordsFromJd keeps technical keywords to standalone phrases", () => {
  const restaurantKeywords = extractKeywordsFromJd("Restaurant platform with React.");
  const apiKeywords = extractKeywordsFromJd("React role with REST APIs and clean architecture.");

  assert.equal(restaurantKeywords.includes("rest"), false);
  assert.ok(apiKeywords.includes("rest"));
  assert.ok(apiKeywords.includes("clean architecture"));
});
