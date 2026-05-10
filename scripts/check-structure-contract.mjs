import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, 'src');

const requiredLayers = ['app', 'pages', 'features', 'entities', 'shared'];
const sharedPublicAreas = ['api', 'config', 'lib', 'model', 'ui'];
const docsThatMustMentionPublicApis = ['docs/PROJECT_MAP.md'];

const errors = [];

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function listChildDirs(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return [];

  return fs
    .readdirSync(absolutePath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith('_') && !name.startsWith('.'))
    .sort((a, b) => a.localeCompare(b));
}

function requireFile(relativePath, message = `Missing required file: ${relativePath}`) {
  if (!exists(relativePath)) errors.push(message);
}

for (const layer of requiredLayers) {
  if (!fs.existsSync(path.join(srcRoot, layer))) {
    errors.push(`Missing required source layer: src/${layer}`);
  }
}

for (const layer of ['entities', 'features']) {
  for (const sliceName of listChildDirs(`src/${layer}`)) {
    requireFile(
      `src/${layer}/${sliceName}/index.ts`,
      `Missing public API for ${layer} slice: src/${layer}/${sliceName}/index.ts`,
    );
  }
}

for (const area of sharedPublicAreas) {
  requireFile(
    `src/shared/${area}/index.ts`,
    `Missing shared public API: src/shared/${area}/index.ts`,
  );
}

const publicApiPaths = [
  ...sharedPublicAreas.map((area) => `src/shared/${area}`),
  ...listChildDirs('src/entities').map((sliceName) => `src/entities/${sliceName}`),
  ...listChildDirs('src/features').map((sliceName) => `src/features/${sliceName}`),
  'src/pages',
].sort((a, b) => a.localeCompare(b));

for (const docPath of docsThatMustMentionPublicApis) {
  if (!exists(docPath)) {
    errors.push(`Missing documentation file: ${docPath}`);
    continue;
  }

  const docText = readText(docPath);
  for (const publicApiPath of publicApiPaths) {
    if (!docText.includes(publicApiPath)) {
      errors.push(`${docPath} must mention public API path: ${publicApiPath}`);
    }
  }
}

if (errors.length > 0) {
  console.error('Structure contract check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Structure contract is valid: ${publicApiPaths.length} public API path(s), ${requiredLayers.length} layer(s).`,
);
