import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, 'src');
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const RESOLVE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.scss', '.css'];
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

function fileExistsWithResolution(candidatePath) {
  const candidates = [candidatePath, ...RESOLVE_EXTENSIONS.map((extension) => `${candidatePath}${extension}`)];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return true;
    }
  }

  if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isDirectory()) {
    for (const extension of RESOLVE_EXTENSIONS) {
      const indexCandidate = path.join(candidatePath, `index${extension}`);
      if (fs.existsSync(indexCandidate) && fs.statSync(indexCandidate).isFile()) {
        return true;
      }
    }
  }

  return false;
}

const sourceFiles = walk(srcRoot);
const brokenImports = [];

for (const sourceFile of sourceFiles) {
  const sourceText = fs.readFileSync(sourceFile, 'utf8');
  for (const match of sourceText.matchAll(importRegex)) {
    const rawImportPath = (match[1] ?? match[2] ?? '').replaceAll('\\', '/');
    if (!rawImportPath || !(rawImportPath.startsWith('./') || rawImportPath.startsWith('../') || rawImportPath.startsWith('src/'))) {
      continue;
    }

    const candidatePath = rawImportPath.startsWith('src/')
      ? path.join(repoRoot, rawImportPath)
      : path.resolve(path.dirname(sourceFile), rawImportPath);

    if (!fileExistsWithResolution(candidatePath)) {
      brokenImports.push({
        file: normalizePath(path.relative(repoRoot, sourceFile)),
        importPath: rawImportPath,
      });
    }
  }
}

if (brokenImports.length > 0) {
  console.error('Broken local imports found:');
  for (const brokenImport of brokenImports) {
    console.error(`- ${brokenImport.file} -> ${brokenImport.importPath}`);
  }
  process.exit(1);
}

console.log(`Local imports are valid: checked ${sourceFiles.length} source file(s), 0 broken local import(s).`);
