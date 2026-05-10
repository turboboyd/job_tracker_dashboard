import fs from 'node:fs';
import path from 'node:path';

export const SAFE_STATIC_TARGETS = [
  '.pytest_cache',
  'cross-env',
  'dist',
  'job-tracker-dashboard@1.0.0',
  'mnt',
  'report',
];

const ROOT_ARTIFACT_PATTERNS = [/^DELETE_FILES_.*\.txt$/i, /^PHASE.*_CHANGESET\.md$/i];
const DUPLICATE_COPY_PATTERN = /^(?<base>.+) \((?<copyNumber>\d+)\)(?<ext>\.[^.]+)$/;
const DUPLICATE_SCAN_DIRS = ['', 'README_technical_spec'];

export function collectCleanupTargets(projectRoot) {
  const targets = new Set();

  for (const relPath of SAFE_STATIC_TARGETS) {
    if (fs.existsSync(path.join(projectRoot, relPath))) {
      targets.add(relPath);
    }
  }

  for (const relPath of collectRootArtifacts(projectRoot)) {
    targets.add(relPath);
  }

  for (const relPath of collectVerifiedDuplicateCopies(projectRoot)) {
    targets.add(relPath);
  }

  return Array.from(targets).sort((a, b) => a.localeCompare(b));
}

export function getCleanupReason(projectRoot, relPath) {
  const normalizedPath = normalizeRelativePath(relPath);

  if (normalizedPath === '.pytest_cache') {
    return 'generated pytest cache directory that is recreated by test tooling and not used in runtime';
  }

  if (normalizedPath === 'cross-env') {
    return 'empty root artifact that is not used by npm cross-env package resolution';
  }

  if (normalizedPath === 'dist') {
    return 'generated production build directory that is recreated by npm run build and should not be committed';
  }

  if (normalizedPath === 'job-tracker-dashboard@1.0.0') {
    return 'empty root artifact left by a local/package export and not referenced by runtime';
  }

  if (normalizedPath === 'mnt') {
    return 'local container/export directory that is outside the application runtime and build flow';
  }

  if (normalizedPath === 'report') {
    return 'generated analysis report directory that is recreated by tooling and not used in runtime';
  }

  if (ROOT_ARTIFACT_PATTERNS.some((pattern) => pattern.test(path.basename(normalizedPath)))) {
    return 'generated root-level refactor artifact matched by the cleanup allowlist';
  }

  if (isVerifiedDuplicateCopy(projectRoot, normalizedPath)) {
    return 'verified duplicate copy: original file exists next to it and contents are identical';
  }

  return 'allowlisted repository artifact';
}

export function isSafeCleanupTarget(projectRoot, relPath) {
  const normalizedPath = normalizeRelativePath(relPath);
  if (!normalizedPath || normalizedPath === '.') return false;
  if (normalizedPath.includes('..')) return false;

  const fullPath = path.join(projectRoot, normalizedPath);
  if (!fs.existsSync(fullPath)) return false;

  if (SAFE_STATIC_TARGETS.includes(normalizedPath)) {
    return true;
  }

  if (!normalizedPath.includes('/') && ROOT_ARTIFACT_PATTERNS.some((pattern) => pattern.test(normalizedPath))) {
    return true;
  }

  return isVerifiedDuplicateCopy(projectRoot, normalizedPath);
}

function collectRootArtifacts(projectRoot) {
  const result = [];

  for (const entry of fs.readdirSync(projectRoot, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (ROOT_ARTIFACT_PATTERNS.some((pattern) => pattern.test(entry.name))) {
      result.push(entry.name);
    }
  }

  return result;
}

function collectVerifiedDuplicateCopies(projectRoot) {
  const result = [];

  for (const dirRelPath of DUPLICATE_SCAN_DIRS) {
    const dirPath = path.join(projectRoot, dirRelPath);
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) continue;

    for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const relPath = normalizeRelativePath(path.posix.join(dirRelPath, entry.name));
      if (isVerifiedDuplicateCopy(projectRoot, relPath)) {
        result.push(relPath);
      }
    }
  }

  return result;
}

function isVerifiedDuplicateCopy(projectRoot, relPath) {
  const normalizedPath = normalizeRelativePath(relPath);
  const parsedPath = path.posix.parse(normalizedPath);
  const match = parsedPath.base.match(DUPLICATE_COPY_PATTERN);
  if (!match?.groups?.base || !match.groups.ext) {
    return false;
  }

  const originalFileName = `${match.groups.base}${match.groups.ext}`;
  const originalRelPath = normalizeRelativePath(path.posix.join(parsedPath.dir, originalFileName));
  const duplicateFullPath = path.join(projectRoot, normalizedPath);
  const originalFullPath = path.join(projectRoot, originalRelPath);

  if (!fs.existsSync(duplicateFullPath) || !fs.existsSync(originalFullPath)) {
    return false;
  }

  const duplicateStat = fs.statSync(duplicateFullPath);
  const originalStat = fs.statSync(originalFullPath);
  if (!duplicateStat.isFile() || !originalStat.isFile()) {
    return false;
  }

  if (duplicateStat.size !== originalStat.size) {
    return false;
  }

  const duplicateBuffer = fs.readFileSync(duplicateFullPath);
  const originalBuffer = fs.readFileSync(originalFullPath);
  return Buffer.compare(duplicateBuffer, originalBuffer) === 0;
}

function normalizeRelativePath(relPath) {
  return relPath.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/$/, '');
}
