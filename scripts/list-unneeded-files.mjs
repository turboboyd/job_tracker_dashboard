#!/usr/bin/env node
import process from 'node:process';
import { collectCleanupTargets, getCleanupReason } from './refactor-cleanup.targets.mjs';

const projectRoot = process.cwd();
const targets = collectCleanupTargets(projectRoot);

console.log('Safe cleanup targets:');
if (targets.length === 0) {
  console.log('(none)');
  process.exit(0);
}

for (const relPath of targets) {
  console.log(`- ${relPath} :: ${getCleanupReason(projectRoot, relPath)}`);
}
