import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, "src");
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function getOwningPageName(absoluteFilePath) {
  const relative = normalizePath(path.relative(srcRoot, absoluteFilePath));
  const match = relative.match(/^pages\/([^/]+)\//);
  return match?.[1] ?? null;
}

function extractImports(sourceText) {
  const imports = [];
  const importRegex = /from\s+["']([^"']+)["']/g;
  const dynamicImportRegex = /import\(\s*["']([^"']+)["']\s*\)/g;

  for (const regex of [importRegex, dynamicImportRegex]) {
    let match;
    while ((match = regex.exec(sourceText)) !== null) {
      imports.push(match[1]);
    }
  }

  return imports;
}

function getTargetPageName(importPath) {
  const normalizedImport = importPath.replace(/\\/g, "/");

  const absoluteMatch = normalizedImport.match(/^src\/pages\/([^/]+)(?:\/|$)/);
  if (absoluteMatch) return absoluteMatch[1];

  return null;
}

const sourceFiles = walk(srcRoot);
const violations = [];

for (const sourceFile of sourceFiles) {
  const sourceText = fs.readFileSync(sourceFile, "utf8");
  const imports = extractImports(sourceText);
  const ownerPage = getOwningPageName(sourceFile);

  for (const importPath of imports) {
    const targetPage = getTargetPageName(importPath);
    if (!targetPage) continue;

    if (ownerPage === targetPage) continue;

    violations.push({
      file: normalizePath(path.relative(repoRoot, sourceFile)),
      importPath,
      ownerPage,
      targetPage,
    });
  }
}

if (violations.length > 0) {
  console.error("Page boundary violations found:");
  for (const violation of violations) {
    console.error(
      `- ${violation.file} -> ${violation.importPath} ` +
      `(owner: ${violation.ownerPage ?? "non-page"}, target: ${violation.targetPage})`,
    );
  }
  process.exit(1);
}

console.log(`Page boundaries are valid: checked ${sourceFiles.length} source file(s), 0 violations.`);
