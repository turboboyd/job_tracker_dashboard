import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, 'src');
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);
const IMPORT_REGEX = /(?:import|export)\s+(?:[^'"`]*?\sfrom\s*)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

const PUBLIC_API_LAYERS = new Set(['entities', 'features', 'widgets']);
const SHARED_PUBLIC_AREAS = new Set(['api', 'config', 'lib', 'model', 'ui']);

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

function withoutIndexSuffix(importPath) {
  return importPath.replace(/\/index$/, '');
}

function getLayerInfo(filePathOrImport) {
  const normalized = normalizePath(filePathOrImport).replace(/^\.\//, '');
  const match = normalized.match(/^src\/([^/]+)(?:\/([^/]+))?(?:\/(.*))?$/);
  if (!match) return null;

  return {
    layer: match[1],
    sliceOrArea: match[2] ?? null,
    rest: match[3] ?? '',
  };
}

function isSameSlice(sourceInfo, targetInfo) {
  return Boolean(
    sourceInfo &&
      targetInfo &&
      sourceInfo.layer === targetInfo.layer &&
      sourceInfo.sliceOrArea === targetInfo.sliceOrArea,
  );
}

function isPublicSliceImport(importPath, targetInfo) {
  const normalized = withoutIndexSuffix(importPath.replace(/\\/g, '/'));
  return normalized === `src/${targetInfo.layer}/${targetInfo.sliceOrArea}`;
}

function hasPublicIndex(normalizedImportPath) {
  const targetDir = path.join(repoRoot, normalizedImportPath);
  return (
    fs.existsSync(path.join(targetDir, 'index.ts')) ||
    fs.existsSync(path.join(targetDir, 'index.tsx'))
  );
}

function hasPublicFile(normalizedImportPath) {
  const targetPath = path.join(repoRoot, normalizedImportPath);
  return fs.existsSync(`${targetPath}.ts`) || fs.existsSync(`${targetPath}.tsx`);
}

function isPublicModelImport(importPath, targetInfo) {
  const normalized = withoutIndexSuffix(importPath.replace(/\\/g, '/'));
  const publicModelPath = `src/${targetInfo.layer}/${targetInfo.sliceOrArea}/model`;

  return normalized === publicModelPath && hasPublicIndex(normalized);
}

function isPublicLibImport(importPath, targetInfo) {
  if (!['entities', 'features'].includes(targetInfo.layer)) return false;

  const normalized = withoutIndexSuffix(importPath.replace(/\\/g, '/'));
  const publicLibPath = `src/${targetInfo.layer}/${targetInfo.sliceOrArea}/lib`;

  return normalized === publicLibPath && hasPublicIndex(normalized);
}

function isPublicValidationImport(importPath, targetInfo) {
  if (targetInfo.layer !== 'entities') return false;

  const normalized = withoutIndexSuffix(importPath.replace(/\\/g, '/'));
  const publicValidationPath = `src/${targetInfo.layer}/${targetInfo.sliceOrArea}/validation`;

  return normalized === publicValidationPath && hasPublicIndex(normalized);
}

function isPublicUiComponentImport(importPath, targetInfo) {
  if (targetInfo.layer !== 'features') return false;

  const normalized = withoutIndexSuffix(importPath.replace(/\\/g, '/'));
  const match = normalized.match(/^src\/features\/[^/]+\/ui\/[^/]+$/);

  return Boolean(match) && hasPublicIndex(normalized);
}

function isSharedAreaPublicImport(importPath, targetInfo) {
  const normalized = withoutIndexSuffix(importPath.replace(/\\/g, '/'));
  return normalized === `src/shared/${targetInfo.sliceOrArea}`;
}

function isSharedLibSubareaPublicImport(importPath, targetInfo) {
  if (targetInfo.sliceOrArea !== 'lib') return false;

  const normalized = withoutIndexSuffix(importPath.replace(/\\/g, '/'));
  const match = normalized.match(/^src\/shared\/lib\/[^/]+$/);

  return Boolean(match) && hasPublicIndex(normalized);
}

function isSharedConfigPublicImport(importPath, targetInfo) {
  if (targetInfo.sliceOrArea !== 'config') return false;

  const normalized = withoutIndexSuffix(importPath.replace(/\\/g, '/'));
  const allowed = new Set([
    'src/shared/config/routes',
    'src/shared/config/i18n',
    'src/shared/config/firebase/auth',
    'src/shared/config/firebase/firestore',
    'src/shared/config/firebase/storage',
  ]);

  return allowed.has(normalized) && (hasPublicFile(normalized) || hasPublicIndex(normalized));
}

function isSharedApiPublicImport(importPath, targetInfo) {
  if (targetInfo.sliceOrArea !== 'api') return false;

  const normalized = withoutIndexSuffix(importPath.replace(/\\/g, '/'));
  return normalized === 'src/shared/api/rtk' && hasPublicIndex(normalized);
}

function isSharedUiSubareaPublicImport(importPath, targetInfo) {
  if (targetInfo.sliceOrArea !== 'ui') return false;

  const normalized = withoutIndexSuffix(importPath.replace(/\\/g, '/'));
  const match = normalized.match(/^src\/shared\/ui\/(?:[^/]+|[^/]+\/[^/]+)$/);

  return Boolean(match) && hasPublicIndex(normalized);
}

function normalizeImportForAnalysis(sourceFile, importPath) {
  const normalizedImport = importPath.replace(/\\/g, '/');
  if (normalizedImport.startsWith('src/')) return normalizedImport;
  if (!normalizedImport.startsWith('.')) return null;

  const absoluteTarget = path.resolve(path.dirname(sourceFile), normalizedImport);
  const relativeTarget = normalizePath(path.relative(repoRoot, absoluteTarget));

  if (!relativeTarget.startsWith('src/')) return null;

  return relativeTarget.replace(/\.(ts|tsx|js|jsx)$/, '');
}

function getViolation(sourceFile, importPath) {
  const normalizedImportPath = normalizeImportForAnalysis(sourceFile, importPath);
  if (!normalizedImportPath) return null;

  const relativeFilePath = normalizePath(path.relative(repoRoot, sourceFile));
  const sourceInfo = getLayerInfo(relativeFilePath);
  const targetInfo = getLayerInfo(normalizedImportPath);

  if (!sourceInfo || !targetInfo) return null;

  if (PUBLIC_API_LAYERS.has(targetInfo.layer)) {
    if (isSameSlice(sourceInfo, targetInfo)) return null;
    if (isPublicSliceImport(normalizedImportPath, targetInfo)) return null;
    if (isPublicModelImport(normalizedImportPath, targetInfo)) return null;
    if (isPublicLibImport(normalizedImportPath, targetInfo)) return null;
    if (isPublicValidationImport(normalizedImportPath, targetInfo)) return null;
    if (isPublicUiComponentImport(normalizedImportPath, targetInfo)) return null;

    return {
      file: relativeFilePath,
      importPath,
      message: `external import must use src/${targetInfo.layer}/${targetInfo.sliceOrArea} or an allowed public sub-entrypoint`,
    };
  }

  if (targetInfo.layer === 'shared' && SHARED_PUBLIC_AREAS.has(targetInfo.sliceOrArea)) {
    if (sourceInfo.layer === 'shared') return null;
    if (isSharedAreaPublicImport(normalizedImportPath, targetInfo)) return null;
    if (isSharedLibSubareaPublicImport(normalizedImportPath, targetInfo)) return null;
    if (isSharedConfigPublicImport(normalizedImportPath, targetInfo)) return null;
    if (isSharedApiPublicImport(normalizedImportPath, targetInfo)) return null;
    if (isSharedUiSubareaPublicImport(normalizedImportPath, targetInfo)) return null;

    return {
      file: relativeFilePath,
      importPath,
      message: `external import must use src/shared/${targetInfo.sliceOrArea} or an allowed public sub-entrypoint`,
    };
  }

  return null;
}

const sourceFiles = walk(srcRoot);
const violations = [];

for (const sourceFile of sourceFiles) {
  const sourceText = fs.readFileSync(sourceFile, 'utf8');

  for (const match of sourceText.matchAll(IMPORT_REGEX)) {
    const importPath = match[1] ?? match[2] ?? '';
    const violation = getViolation(sourceFile, importPath);
    if (violation) violations.push(violation);
  }
}

if (violations.length > 0) {
  console.error('Public API import violations found:');
  for (const violation of violations) {
    console.error(`- ${violation.file} -> ${violation.importPath} (${violation.message})`);
  }
  process.exit(1);
}

console.log(`Public API imports are valid: checked ${sourceFiles.length} source file(s), 0 violation(s).`);
