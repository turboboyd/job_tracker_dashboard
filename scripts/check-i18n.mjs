import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const checkedLanguages = ['ru', 'de'];
const supportedLanguages = ['en', ...checkedLanguages];
const resourceBundles = [
  ['common', 'src/shared/locales/common'],
  ['auth', 'src/shared/locales/auth'],
  ['header', 'src/shared/locales/header'],
  ['status', 'src/shared/locales/status'],
  ['onboarding', 'src/shared/locales/onboarding'],
  ['dashboard', 'src/pages/DashboardPage/locales'],
  ['matches', 'src/pages/MatchesPage/locales'],
  ['board', 'src/pages/BoardPage/locales'],
  ['applicationsPage', 'src/shared/locales/applications'],
  ['applicationDetails', 'src/pages/ApplicationDetailsPage/locales'],
  ['questions', 'src/pages/QuestionsPage/locales'],
  ['cvChecker', 'src/pages/CvCheckerPage/locales'],
  ['cvBuilder', 'src/pages/CvBuilderPage/locales'],
  ['inbox', 'src/pages/InboxPage/locales'],
  ['home', 'src/pages/MainPage/locales'],
  ['about', 'src/pages/AboutPage/locales'],
  ['resources', 'src/pages/ResourcesPage/locales'],
  ['login', 'src/pages/LoginPage/locales'],
  ['register', 'src/pages/RegisterPage/locales'],
  ['profileQuestions', 'src/pages/ProfileQuestionsPage/locales'],
  ['loops', 'src/pages/LoopsPage/locales'],
  ['notFound', 'src/pages/NotFoundPage/locales'],
  ['whatsNew', 'src/pages/WhatsNewPage/locales'],
  ['accountSettings', 'src/pages/AccountSettingsPage/locales'],
];
const namespaceByPath = [
  ['src/pages/DashboardPage/', 'dashboard'],
  ['src/pages/ResourcesPage/', 'resources'],
  ['src/pages/BoardPage/', 'board'],
  ['src/pages/MatchesPage/', 'matches'],
  ['src/pages/ApplicationsPage/', 'applicationsPage'],
  ['src/pages/ApplicationDetailsPage/', 'applicationDetails'],
  ['src/pages/CvBuilderPage/', 'cvBuilder'],
  ['src/pages/CvCheckerPage/', 'cvChecker'],
  ['src/pages/MainPage/', 'home'],
  ['src/pages/LoopsPage/', 'loops'],
  ['src/pages/AccountSettingsPage/', 'accountSettings'],
];
const errors = [];
const brokenTextPatterns = [
  { label: 'replacement character', pattern: '\uFFFD' },
  { label: 'mojibake вЂ', pattern: '\u0432\u0402' },
  { label: 'mojibake вњ', pattern: '\u0432\u045A' },
  { label: 'mojibake Р°', pattern: '\u0420\u00B0' },
  { label: 'mojibake СЏ', pattern: '\u0421\u040F' },
  { label: 'mojibake рџ', pattern: '\u0440\u045F' },
  { label: 'test placeholder', pattern: 'ffff' },
  { label: 'unfinished placeholder', pattern: 'TODO' },
  { label: 'unfinished placeholder', pattern: '???' },
];

function isLocaleBaseline(filePath) {
  if (path.basename(filePath) !== 'en.json') return false;

  const parentDir = path.basename(path.dirname(filePath));
  const grandparentDir = path.basename(path.dirname(path.dirname(filePath)));

  return parentDir === 'locales' || grandparentDir === 'locales';
}

function listFiles(dir) {
  const result = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolutePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      result.push(...listFiles(absolutePath));
      continue;
    }

    if (entry.isFile()) result.push(absolutePath);
  }

  return result;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function unwrapSelfNamedBundle(bundleName, data) {
  const keys = Object.keys(data);
  const nested = data[bundleName];

  if (
    keys.length === 1 &&
    nested &&
    typeof nested === 'object' &&
    !Array.isArray(nested)
  ) {
    return nested;
  }

  return data;
}

function collectKeys(value, prefix = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.keys(value).flatMap((key) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    return collectKeys(value[key], nextPrefix);
  });
}

function collectStringEntries(value, prefix = '') {
  if (typeof value === 'string') {
    return prefix ? [{ key: prefix, value }] : [];
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];

  return Object.keys(value).flatMap((key) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    return collectStringEntries(value[key], nextPrefix);
  });
}

function collectResourceKeys(value, prefix = '', result = new Set()) {
  if (typeof value === 'string') {
    result.add(prefix);
    return result;
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;

  for (const [key, next] of Object.entries(value)) {
    collectResourceKeys(next, prefix ? `${prefix}.${key}` : key, result);
  }

  return result;
}

function toRelative(filePath) {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, '/');
}

function checkBrokenText(filePath, data) {
  for (const { key, value } of collectStringEntries(data)) {
    const trimmed = value.trim();
    if (!trimmed) {
      errors.push(`${toRelative(filePath)} has empty translation at key: ${key}`);
      continue;
    }

    for (const item of brokenTextPatterns) {
      if (value.includes(item.pattern)) {
        errors.push(`${toRelative(filePath)} has ${item.label} at key: ${key}`);
      }
    }
  }
}

function sourceNamespace(relativePath, source) {
  const keyPrefixMatch = source.match(/keyPrefix\s*:\s*['"]([^'"]+)['"]/);
  if (keyPrefixMatch) return keyPrefixMatch[1];

  for (const [pathPrefix, namespace] of namespaceByPath) {
    if (relativePath.startsWith(pathPrefix)) return namespace;
  }

  return '';
}

function collectLiteralFallbackKeys() {
  const sourceFiles = listFiles(path.join(repoRoot, 'src')).filter((filePath) =>
    /\.(ts|tsx)$/.test(filePath),
  );
  const keys = new Map();
  const regexes = [
    /\b(?:t|tr|translate)\(\s*['"]([^'"`$]+)['"]\s*,\s*(?:\{|['"])/g,
    /tt\(\s*t\s*,\s*['"]([^'"`$]+)['"]\s*,/g,
  ];

  for (const filePath of sourceFiles) {
    const relativePath = toRelative(filePath);
    const source = fs.readFileSync(filePath, 'utf8');
    const namespace = sourceNamespace(relativePath, source);

    for (const regex of regexes) {
      let match;
      while ((match = regex.exec(source))) {
        const key = match[1];
        const fullKey =
          namespace && !key.startsWith(`${namespace}.`) ? `${namespace}.${key}` : key;

        if (!keys.has(fullKey)) keys.set(fullKey, relativePath);
      }
    }
  }

  return keys;
}

function collectLanguageResourceKeys(language) {
  const resource = {};

  for (const [bundleName, relativeDir] of resourceBundles) {
    const localePath = path.join(repoRoot, relativeDir, `${language}.json`);
    if (!fs.existsSync(localePath)) continue;

    resource[bundleName] = unwrapSelfNamedBundle(bundleName, readJson(localePath));
  }

  return collectResourceKeys(resource);
}

const baselines = listFiles(path.join(repoRoot, 'src'))
  .filter(isLocaleBaseline)
  .sort((left, right) => left.localeCompare(right));

for (const baselinePath of baselines) {
  const baselineData = readJson(baselinePath);
  checkBrokenText(baselinePath, baselineData);

  const baselineKeys = new Set(collectKeys(baselineData));
  const localeDir = path.dirname(baselinePath);

  for (const language of checkedLanguages) {
    const localePath = path.join(localeDir, `${language}.json`);

    if (!fs.existsSync(localePath)) {
      errors.push(`${toRelative(localePath)} is missing`);
      continue;
    }

    const localeData = readJson(localePath);
    checkBrokenText(localePath, localeData);

    const localeKeys = new Set(collectKeys(localeData));
    for (const key of baselineKeys) {
      if (!localeKeys.has(key)) {
        errors.push(`${toRelative(localePath)} is missing key: ${key}`);
      }
    }
  }
}

const literalFallbackKeys = collectLiteralFallbackKeys();
for (const language of supportedLanguages) {
  const resourceKeys = collectLanguageResourceKeys(language);

  for (const [key, sourceFile] of literalFallbackKeys.entries()) {
    if (!resourceKeys.has(key)) {
      errors.push(`${sourceFile} uses i18n key missing in ${language}: ${key}`);
    }
  }
}

if (errors.length > 0) {
  console.error('i18n check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`i18n bundles are aligned: checked ${baselines.length} English baseline file(s).`);
