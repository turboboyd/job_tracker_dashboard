import { rmSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const baselinePath = path.join(rootDir, 'docs/refactor/arch-baseline.json');
const jscpdOutputDir = path.join(rootDir, 'report/.arch-jscpd');
const binDir = path.join(rootDir, 'node_modules', '.bin');

function getBin(name) {
  const suffix = process.platform === 'win32' ? '.cmd' : '';
  return path.join(binDir, `${name}${suffix}`);
}

function runCommand(command, args) {
  const isWindowsCmd =
    process.platform === 'win32' && ['.cmd', '.bat'].includes(path.extname(command).toLowerCase());

  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    shell: isWindowsCmd,
    windowsHide: true,
  });

  if (result.error) {
    throw new Error(`Failed to run ${command}: ${result.error.message}`, { cause: result.error });
  }

  return result;
}

function runJsonCommand(toolName, command, args) {
  const result = runCommand(command, args);

  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const combined = [stdout, stderr].filter(Boolean).join('\n');

  const jsonText = extractJsonPayload(combined);
  if (!jsonText) {
    throw new Error(
      `${toolName} did not produce JSON output. Exit code: ${result.status ?? 'unknown'}\n${combined}`,
    );
  }

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    throw new Error(
      `${toolName} returned non-JSON output. Exit code: ${result.status ?? 'unknown'}\n${combined}`,
      { cause: error },
    );
  }
}

function extractJsonPayload(text) {
  const trimmed = text.trim();
  if (!trimmed) return '';

  const starts = ['{', '['];
  let best = '';
  for (const token of starts) {
    const startIndex = trimmed.indexOf(token);
    if (startIndex === -1) continue;
    for (let end = trimmed.length; end > startIndex; end -= 1) {
      const candidate = trimmed.slice(startIndex, end).trim();
      if (!candidate) continue;
      try {
        JSON.parse(candidate);
        if (candidate.length > best.length) best = candidate;
        break;
      } catch {
        // keep shrinking until valid JSON is found
      }
    }
  }
  return best;
}

function runJscpdReport() {
  rmSync(jscpdOutputDir, { recursive: true, force: true });

  const result = runCommand(getBin('jscpd'), [
    'src',
    '--reporters',
    'json',
    '--output',
    path.relative(rootDir, jscpdOutputDir),
  ]);

  const reportPath = path.join(jscpdOutputDir, 'jscpd-report.json');

  if (!existsSync(reportPath)) {
    throw new Error(
      `jscpd report was not generated. Exit code: ${result.status ?? 'unknown'}\n${result.stdout ?? ''}\n${result.stderr ?? ''}`,
    );
  }

  return JSON.parse(readFileSync(reportPath, 'utf8'));
}

function countDependencyCruiserViolations(summaryViolations = []) {
  const byRule = {};

  for (const violation of summaryViolations) {
    const ruleName = violation.rule?.name ?? 'unknown';
    byRule[ruleName] = (byRule[ruleName] ?? 0) + 1;
  }

  return byRule;
}

function formatDelta(current, baseline) {
  if (current === baseline) return `${current} (= baseline)`;
  if (current < baseline) return `${current} (improved from ${baseline})`;
  return `${current} (worse than ${baseline})`;
}

function compareMetric(label, current, baseline, failures, epsilon = 0) {
  const exceeds = current > baseline + epsilon;
  const line = `${label}: ${formatDelta(current, baseline)}`;

  if (exceeds) failures.push(line);

  console.log(`${exceeds ? '✖' : '✔'} ${line}`);
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));

const depcruiseReport = runJsonCommand('dependency-cruiser', getBin('depcruise'), [
  'src',
  '--config',
  '.dependency-cruiser.js',
  '--output-type',
  'json',
]);

const madgeCycles = runJsonCommand('madge', getBin('madge'), [
  '--circular',
  '--extensions',
  'ts,tsx',
  '--ts-config',
  'tsconfig.json',
  '--json',
  'src',
]);

const jscpdReport = runJscpdReport();

const current = {
  dependencyCruiser: {
    totalViolations: depcruiseReport.summary?.error ?? 0,
    byRule: countDependencyCruiserViolations(depcruiseReport.summary?.violations),
  },
  madge: {
    cycles: Array.isArray(madgeCycles) ? madgeCycles.length : 0,
  },
  jscpd: {
    percentage: Number(jscpdReport.statistics?.total?.percentage ?? 0),
    clones: Number(jscpdReport.statistics?.total?.clones ?? 0),
    duplicatedLines: Number(jscpdReport.statistics?.total?.duplicatedLines ?? 0),
  },
};

const failures = [];

console.log('Architecture baseline check');
console.log('---------------------------');

compareMetric(
  'dependency-cruiser.total',
  current.dependencyCruiser.totalViolations,
  baseline.dependencyCruiser.totalViolations,
  failures,
);

for (const [ruleName, baselineCount] of Object.entries(baseline.dependencyCruiser.byRule)) {
  compareMetric(
    `dependency-cruiser.${ruleName}`,
    current.dependencyCruiser.byRule[ruleName] ?? 0,
    baselineCount,
    failures,
  );
}

compareMetric('madge.cycles', current.madge.cycles, baseline.madge.cycles, failures);
compareMetric('jscpd.percentage', current.jscpd.percentage, baseline.jscpd.percentage, failures, 0.0001);
compareMetric('jscpd.clones', current.jscpd.clones, baseline.jscpd.clones, failures);
compareMetric('jscpd.duplicatedLines', current.jscpd.duplicatedLines, baseline.jscpd.duplicatedLines, failures);

if (failures.length > 0) {
  console.error('\nArchitecture baseline regressed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('\nArchitecture baseline is stable or improved.');
