import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
const scripts = packageJson.scripts ?? {};
const errors = [];

function requireScript(name) {
  if (!scripts[name]) errors.push(`Missing npm script: ${name}`);
}

function requireScriptReference(scriptName, requiredReference) {
  const command = scripts[scriptName] ?? '';
  if (!command.includes(requiredReference)) {
    errors.push(`npm run ${scriptName} must include: ${requiredReference}`);
  }
}

function readIfExists(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, 'utf8') : '';
}

const requiredScripts = [
  'check',
  'check:architecture',
  'check:quality-gate',
  'check:i18n',
  'check:docs',
  'check:doc-references',
  'check:structure-contract',
  'check:local-imports',
  'check:public-api-imports',
  'check:pages-boundaries',
  'check:layer-boundaries',
  'check:arch',
  'cleanup:repo',
  'cleanup:repo:list',
];

for (const scriptName of requiredScripts) requireScript(scriptName);

const requiredCheckReferences = [
  'npm run typecheck',
  'npm run lint',
  'npm run test:auth',
  'npm run test:core',
  'npm run check:scripts',
  'npm run check:i18n',
  'npm run check:docs',
  'npm run check:doc-references',
  'npm run check:quality-gate',
  'npm run check:architecture',
];

for (const reference of requiredCheckReferences) {
  requireScriptReference('check', reference);
}

const requiredArchitectureReferences = [
  'npm run check:structure-contract',
  'npm run check:local-imports',
  'npm run check:public-api-imports',
  'npm run check:pages-boundaries',
  'npm run check:layer-boundaries',
  'npm run check:arch',
];

for (const reference of requiredArchitectureReferences) {
  requireScriptReference('check:architecture', reference);
}

const docsThatMustMentionQualityGate = [
  'README.md',
  'CONTRIBUTING.md',
  'docs/ARCHITECTURE.md',
  'docs/ONBOARDING.md',
  'docs/PR_REVIEW_CHECKLIST.md',
  'docs/QUALITY_GATE.md',
];

for (const docPath of docsThatMustMentionQualityGate) {
  const text = readIfExists(docPath);
  if (!text) {
    errors.push(`Missing documentation file: ${docPath}`);
    continue;
  }

  if (!text.includes('npm run check')) {
    errors.push(`${docPath} must mention npm run check`);
  }
}

const cleanupTargets = readIfExists('scripts/refactor-cleanup.targets.mjs');
for (const forbiddenTarget of ['.env', '.env.example']) {
  const forbiddenPattern = new RegExp(String.raw`['"\`]${forbiddenTarget.replace('.', '\\.')}['"\`]`);
  if (forbiddenPattern.test(cleanupTargets)) {
    errors.push(`Cleanup targets must not include ${forbiddenTarget}`);
  }
}

if (errors.length > 0) {
  console.error('Quality gate contract check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Quality gate contract is valid.');
