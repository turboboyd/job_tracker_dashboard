import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const SOURCE_EXTENSIONS = new Set([".json", ".ts", ".tsx"]);
const MOJIBAKE_PATTERNS = ["\u0432\u0402", "\u0432\u045A", "\u0420\u00B0", "\u0421\u040F", "\uFFFD"] as const;

function test(_name: string, run: () => void) {
  run();
}

function collectSourceFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return collectSourceFiles(fullPath);
    }

    return SOURCE_EXTENSIONS.has(path.extname(entry.name)) ? [fullPath] : [];
  });
}

test("source text does not contain common mojibake sequences", () => {
  const srcDir = path.join(process.cwd(), "src");
  const findings = collectSourceFiles(srcDir).flatMap((filePath) => {
    const text = fs.readFileSync(filePath, "utf8");

    return MOJIBAKE_PATTERNS.flatMap((pattern): string[] => {
      if (!text.includes(pattern)) return [];

      return [`${path.relative(process.cwd(), filePath)} contains ${pattern}`];
    });
  });

  assert.deepEqual(findings, []);
});
