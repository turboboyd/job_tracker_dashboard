import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, 'src');
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);
const importRegex = /(?:import|export)\s+(?:[^'"`]*?\sfrom\s*)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

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
  return filePath.split(path.sep).join('/');
}

const rules = [
  {
    from: /^src\/shared\//,
    to: /^src\/(entities|features|widgets|pages|app)\//,
    label: 'shared -> higher layer',
  },
  {
    from: /^src\/entities\//,
    to: /^src\/(features|widgets|pages|app)\//,
    label: 'entities -> higher layer',
  },
  {
    from: /^src\/features\//,
    to: /^src\/(widgets|pages|app)\//,
    label: 'features -> higher layer',
  },
  {
    from: /^src\/widgets\//,
    to: /^src\/(pages|app)\//,
    label: 'widgets -> higher layer',
  },
  {
    from: /^src\/pages\//,
    to: /^src\/app\//,
    label: 'pages -> app',
  },
];

const violations = [];
const sourceFiles = walk(srcRoot);

for (const sourceFile of sourceFiles) {
  const relativeFilePath = normalizePath(path.relative(repoRoot, sourceFile));
  const sourceText = fs.readFileSync(sourceFile, 'utf8');

  for (const match of sourceText.matchAll(importRegex)) {
    const importPath = (match[1] ?? match[2] ?? '').replaceAll('\\', '/');
    if (!importPath.startsWith('src/')) continue;

    for (const rule of rules) {
      if (rule.from.test(relativeFilePath) && rule.to.test(importPath)) {
        violations.push({
          file: relativeFilePath,
          importPath,
          label: rule.label,
        });
      }
    }
  }
}

if (violations.length > 0) {
  console.error('Layer boundary violations found:');
  for (const violation of violations) {
    console.error(`- ${violation.file} -> ${violation.importPath} (${violation.label})`);
  }
  process.exit(1);
}

console.log(`Layer boundaries are valid: checked ${sourceFiles.length} source file(s), 0 violation(s).`);
