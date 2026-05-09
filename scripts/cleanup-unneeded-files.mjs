#!/usr/bin/env node
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const result = spawnSync(process.execPath, ['scripts/refactor-cleanup.mjs', ...args], {
  stdio: 'inherit',
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
