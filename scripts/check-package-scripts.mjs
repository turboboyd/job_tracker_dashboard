#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const scripts = packageJson.scripts ?? {};

const FILE_REFERENCE_PATTERNS = [
  /(?:^|\s)node\s+(?<path>[^\s]+\.(?:mjs|cjs|js|ts))(?=\s|$)/g,
  /--config\s+(?<path>[^\s]+)(?=\s|$)/g,
  /-p\s+(?<path>[^\s]+\.json)(?=\s|$)/g,
  /--ts-config\s+(?<path>[^\s]+\.json)(?=\s|$)/g,
];

const missing = [];

for (const [scriptName, command] of Object.entries(scripts)) {
  for (const filePath of collectLocalFileReferences(command)) {
    const normalizedPath = normalizeRelativePath(filePath);
    if (!normalizedPath) continue;

    const absolutePath = path.join(projectRoot, normalizedPath);
    if (!fs.existsSync(absolutePath)) {
      missing.push({ scriptName, filePath: normalizedPath });
    }
  }
}

if (missing.length > 0) {
  console.error('Broken package script file references found:');
  for (const item of missing) {
    console.error(`- ${item.scriptName} -> ${item.filePath}`);
  }
  process.exit(1);
}

console.log(`Package scripts are valid: checked ${Object.keys(scripts).length} script(s), 0 broken local file references.`);

function collectLocalFileReferences(command) {
  const result = new Set();

  for (const pattern of FILE_REFERENCE_PATTERNS) {
    pattern.lastIndex = 0;

    for (const match of command.matchAll(pattern)) {
      const candidate = match.groups?.path?.replace(/^['\"]|['\"]$/g, '');
      if (!candidate) continue;
      if (isExternalReference(candidate)) continue;

      result.add(candidate);
    }
  }

  return Array.from(result);
}

function isExternalReference(candidate) {
  return candidate.startsWith('http://') || candidate.startsWith('https://');
}

function normalizeRelativePath(filePath) {
  const normalized = filePath.replaceAll('\\', '/').replace(/^\.\//, '');
  if (!normalized || normalized.startsWith('/')) return '';
  if (normalized.includes('..')) return '';
  return normalized;
}
