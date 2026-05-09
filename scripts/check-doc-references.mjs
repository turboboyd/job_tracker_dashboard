import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
const packageScripts = new Set(Object.keys(packageJson.scripts ?? {}));
const docsRoot = path.join(repoRoot, 'docs');
const rootMarkdownFiles = ['README.md', 'CONTRIBUTING.md'];
const errors = [];

function listMarkdownFiles() {
  const files = [...rootMarkdownFiles];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolutePath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(path.relative(repoRoot, absolutePath).replaceAll(path.sep, '/'));
      }
    }
  }

  walk(docsRoot);
  return files.sort((a, b) => a.localeCompare(b));
}

function stripAnchorAndQuery(target) {
  return target.split('#')[0].split('?')[0];
}

function isExternalLink(target) {
  return /^(https?:|mailto:|tel:)/i.test(target);
}

function isPureAnchor(target) {
  return target.startsWith('#');
}

function checkMarkdownLinks(filePath, text) {
  const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
  const fileDir = path.dirname(path.join(repoRoot, filePath));

  for (const match of text.matchAll(linkPattern)) {
    const rawTarget = match[1].trim();
    if (!rawTarget || isExternalLink(rawTarget) || isPureAnchor(rawTarget)) continue;

    const target = stripAnchorAndQuery(rawTarget);
    if (!target) continue;

    const resolvedPath = path.resolve(fileDir, target);
    if (!resolvedPath.startsWith(repoRoot)) {
      errors.push(`${filePath} links outside the repository: ${rawTarget}`);
      continue;
    }

    if (!fs.existsSync(resolvedPath)) {
      errors.push(`${filePath} has a broken local markdown link: ${rawTarget}`);
    }
  }
}

function checkNpmCommands(filePath, text) {
  const commandPattern = /npm\s+run\s+([a-zA-Z0-9:_-]+)/g;

  for (const match of text.matchAll(commandPattern)) {
    const scriptName = match[1];
    if (!packageScripts.has(scriptName)) {
      errors.push(`${filePath} mentions missing npm script: npm run ${scriptName}`);
    }
  }
}

const markdownFiles = listMarkdownFiles();
for (const filePath of markdownFiles) {
  const text = fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
  checkMarkdownLinks(filePath, text);
  checkNpmCommands(filePath, text);
}

if (errors.length > 0) {
  console.error('Documentation reference check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Documentation references are valid: checked ${markdownFiles.length} markdown file(s) and ${packageScripts.size} npm script(s).`,
);
