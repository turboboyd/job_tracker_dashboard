#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  collectCleanupTargets,
  getCleanupReason,
  isSafeCleanupTarget,
} from './refactor-cleanup.targets.mjs';

const projectRoot = process.cwd();
const dryRun = process.argv.includes('--dry-run');
const targets = collectCleanupTargets(projectRoot);

function removePath(relPath) {
  const fullPath = path.join(projectRoot, relPath);

  if (!fs.existsSync(fullPath)) {
    console.log(`skip  ${relPath} (already missing)`);
    return 'missing';
  }

  if (!isSafeCleanupTarget(projectRoot, relPath)) {
    console.log(`block ${relPath} (not in safe cleanup allowlist)`);
    return 'blocked';
  }

  const reason = getCleanupReason(projectRoot, relPath);

  if (dryRun) {
    console.log(`would delete ${relPath} :: ${reason}`);
    return 'dry';
  }

  fs.rmSync(fullPath, { recursive: true, force: true });
  console.log(`deleted ${relPath} :: ${reason}`);
  return 'deleted';
}

console.log(dryRun ? 'Running safe repository cleanup in dry-run mode...' : 'Running safe repository cleanup...');

let deleted = 0;
let missing = 0;
let dry = 0;
let blocked = 0;
for (const relPath of targets) {
  const result = removePath(relPath);
  if (result === 'deleted') deleted += 1;
  if (result === 'missing') missing += 1;
  if (result === 'dry') dry += 1;
  if (result === 'blocked') blocked += 1;
}

console.log('');
if (dryRun) {
  console.log(`dry-run complete: ${dry} target(s) would be deleted, ${missing} already missing, ${blocked} blocked.`);
} else {
  console.log(`cleanup complete: ${deleted} target(s) deleted, ${missing} already missing, ${blocked} blocked.`);
}
