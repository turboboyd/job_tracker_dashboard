import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();

const requiredFiles = [
  'README.md',
  'CONTRIBUTING.md',
  'docs/ARCHITECTURE.md',
  'docs/ONBOARDING.md',
  'docs/CODE_PLACEMENT.md',
  'docs/GLOSSARY.md',
  'docs/PROJECT_MAP.md',
  'docs/TESTING.md',
  'docs/PR_REVIEW_CHECKLIST.md',
  'docs/QUALITY_GATE.md',
];

const requiredReadmeLinks = [
  'docs/ARCHITECTURE.md',
  'docs/ONBOARDING.md',
  'docs/CODE_PLACEMENT.md',
  'docs/GLOSSARY.md',
  'docs/PROJECT_MAP.md',
  'docs/TESTING.md',
  'CONTRIBUTING.md',
  'docs/PR_REVIEW_CHECKLIST.md',
  'docs/QUALITY_GATE.md',
];

const requiredArchitectureTerms = [
  'app -> pages -> features -> entities -> shared',
  'Public API',
  'Firestore boundary',
  'Architecture checks',
];

const requiredOnboardingTerms = [
  'npm ci',
  'npm run dev',
  'npm run check',
  'Where to place code',
];

const requiredContributingTerms = [
  'Safe refactoring sequence',
  'Architecture workflow',
  'Pull request checklist',
  'npm run check',
];

const requiredPrChecklistTerms = [
  'Layer ownership',
  'Import boundaries',
  'Firestore and data boundaries',
  'Required checks',
];

const requiredQualityGateTerms = [
  'npm run check',
  'npm run check:architecture',
  'npm run check:quality-gate',
  '.env.example',
];

const errors = [];

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(repoRoot, relativePath))) {
    errors.push(`Missing required documentation file: ${relativePath}`);
  }
}

if (fs.existsSync(path.join(repoRoot, 'README.md'))) {
  const readme = readText('README.md');
  for (const link of requiredReadmeLinks) {
    if (!readme.includes(link)) {
      errors.push(`README.md must link to ${link}`);
    }
  }
}

if (fs.existsSync(path.join(repoRoot, 'docs/ARCHITECTURE.md'))) {
  const architecture = readText('docs/ARCHITECTURE.md');
  for (const term of requiredArchitectureTerms) {
    if (!architecture.includes(term)) {
      errors.push(`docs/ARCHITECTURE.md must mention: ${term}`);
    }
  }
}

if (fs.existsSync(path.join(repoRoot, 'docs/ONBOARDING.md'))) {
  const onboarding = readText('docs/ONBOARDING.md');
  for (const term of requiredOnboardingTerms) {
    if (!onboarding.includes(term)) {
      errors.push(`docs/ONBOARDING.md must mention: ${term}`);
    }
  }
}

if (fs.existsSync(path.join(repoRoot, 'CONTRIBUTING.md'))) {
  const contributing = readText('CONTRIBUTING.md');
  for (const term of requiredContributingTerms) {
    if (!contributing.includes(term)) {
      errors.push(`CONTRIBUTING.md must mention: ${term}`);
    }
  }
}

if (fs.existsSync(path.join(repoRoot, 'docs/PR_REVIEW_CHECKLIST.md'))) {
  const checklist = readText('docs/PR_REVIEW_CHECKLIST.md');
  for (const term of requiredPrChecklistTerms) {
    if (!checklist.includes(term)) {
      errors.push(`docs/PR_REVIEW_CHECKLIST.md must mention: ${term}`);
    }
  }
}

if (fs.existsSync(path.join(repoRoot, 'docs/QUALITY_GATE.md'))) {
  const qualityGate = readText('docs/QUALITY_GATE.md');
  for (const term of requiredQualityGateTerms) {
    if (!qualityGate.includes(term)) {
      errors.push(`docs/QUALITY_GATE.md must mention: ${term}`);
    }
  }
}

if (errors.length > 0) {
  console.error('Documentation check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Documentation is valid: checked ${requiredFiles.length} required file(s).`);
