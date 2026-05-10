#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const rootDir = process.cwd();
const testRoots = process.argv.slice(2);

process.env.TS_NODE_PROJECT = process.env.TS_NODE_PROJECT
  ?? path.join(rootDir, "tsconfig.tests.json");

installBundlerGlobalsForNodeTests();

require("ts-node/register");
require("tsconfig-paths/register");

const roots = testRoots.length > 0 ? testRoots : ["src"];
const testFiles = [
  ...new Set(
    roots.flatMap((root) => collectTestFiles(path.resolve(rootDir, root))),
  ),
].sort();

if (testFiles.length === 0) {
  console.error(`No test files found in: ${roots.join(", ")}`);
  process.exit(1);
}

for (const testFile of testFiles) {
  require(testFile);
}

console.log(`TypeScript tests passed: ${testFiles.length} file(s).`);

function collectTestFiles(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return [];
  }

  const stat = fs.statSync(targetPath);
  if (stat.isFile()) {
    return isTestFile(targetPath) ? [targetPath] : [];
  }

  return fs
    .readdirSync(targetPath, { withFileTypes: true })
    .flatMap((entry) => collectTestFiles(path.join(targetPath, entry.name)));
}

function isTestFile(filePath) {
  return /\.(test|spec)\.tsx?$/.test(filePath);
}

function installBundlerGlobalsForNodeTests() {
  globalThis.__IS_PROD__ = false;
  globalThis.__ENV__ = {
    NODE_ENV: "development",
    FIREBASE_API_KEY: "test-api-key",
    FIREBASE_AUTH_DOMAIN: "test.firebaseapp.com",
    FIREBASE_PROJECT_ID: "test-project",
    FIREBASE_APP_ID: "test-app-id",
    FIREBASE_STORAGE_BUCKET: "test.appspot.com",
    FIREBASE_MESSAGING_SENDER_ID: "test-sender-id",
    GOOGLE_CALENDAR_CONNECT_URL: "/api/google-calendar/connect",
    GOOGLE_CALENDAR_CLIENT_ID: "test-google-client-id",
  };
}
