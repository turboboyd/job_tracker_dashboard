#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const projectRoot = process.cwd();
const packageJsonPath = path.join(projectRoot, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const outputPath = path.join(projectRoot, 'docs', 'whats-new', 'generated.md');

const packageVersion = packageJson.version ?? '0.0.0';
const gitEntries = readGitEntries(projectRoot);
const content = renderMarkdown({ packageVersion, gitEntries });

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, content, 'utf8');

console.log(`Generated ${path.relative(projectRoot, outputPath)}.`);
console.log(`Entries: ${gitEntries.length}.`);

function readGitEntries(cwd) {
  if (!fs.existsSync(path.join(cwd, '.git'))) {
    return [];
  }

  const result = spawnSync(
    'git',
    ['log', '--date=short', '--pretty=format:%h|%ad|%s', '-n', '10'],
    {
      cwd,
      encoding: 'utf8',
      windowsHide: true,
    },
  );

  if (typeof result.status === 'number' && result.status !== 0) {
    return [];
  }

  const stdout = result.stdout?.trim() ?? '';
  if (!stdout) {
    return [];
  }

  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [hash = '', date = '', ...subjectParts] = line.split('|');
      return {
        hash,
        date,
        subject: subjectParts.join('|').trim(),
      };
    })
    .filter((entry) => entry.hash && entry.date && entry.subject);
}

function renderMarkdown({ packageVersion, gitEntries }) {
  const lines = [
    '# What’s new',
    '',
    `Current package version: ${packageVersion}`,
    '',
  ];

  if (gitEntries.length === 0) {
    lines.push('No local git history is available in this checkout.', '');
    lines.push('This placeholder file keeps `npm run generate:whats-new` valid until a dedicated GitHub Releases pipeline is introduced.', '');
    return `${lines.join('\n')}\n`;
  }

  lines.push('Latest changes from local git history:', '');

  for (const entry of gitEntries) {
    lines.push(`- ${entry.date} · ${entry.subject} (${entry.hash})`);
  }

  lines.push('');
  lines.push('Note: this is a local fallback generator. The UI contract remains unchanged and can later switch to structured GitHub Releases data without breaking this script.');
  lines.push('');

  return `${lines.join('\n')}\n`;
}
