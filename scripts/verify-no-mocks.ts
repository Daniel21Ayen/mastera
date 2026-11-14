import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.resolve(__dirname, '..');
const APPS_DIR = path.join(ROOT_DIR, 'apps');
const FORBIDDEN_FILE_PATTERNS = [/mock/i, /fixture/i, /fake/i];
const FORBIDDEN_CODE_PATTERNS = [
  /\bmockSignIn\b/,
  /\bUSE_MOCK_DATA\b/,
  /\b__mocks__\b/,
  /\bpurgeMockStudents\b/i,
  /\bq-fallback\b/,
];

const MOBILE_FORBIDDEN_PATTERNS = [
  { pattern: /['"]Abebe(?:\s+Kebede)?['"]/, reason: "Hardcoded student name 'Abebe'" },
  { pattern: /['"]MS0001['"]/, reason: "Hardcoded student code 'MS0001'" },
  { pattern: /200\s*ETB/, reason: "Hardcoded price '200 ETB'" },
  { pattern: /350\s*ETB/, reason: "Hardcoded price '350 ETB'" },
  { pattern: /38\s*days\s*left/, reason: "Hardcoded duration '38 days left'" },
  { pattern: /bundleDaysRemaining\s*=\s*38/, reason: "Hardcoded default bundleDaysRemaining = 38" },
  { pattern: /pendingOrdersCount\s*=\s*1/, reason: "Hardcoded default pendingOrdersCount = 1" },
];

interface MockViolation {
  file: string;
  reason: string;
}

function scanAppsForMocks(dirPath: string, violations: MockViolation[]): void {
  if (!fs.existsSync(dirPath)) return;

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(ROOT_DIR, fullPath);

    if (
      entry.name === 'node_modules' ||
      entry.name === 'dist' ||
      entry.name === '.next' ||
      entry.name === 'test' ||
      entry.name === '__tests__'
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      scanAppsForMocks(fullPath, violations);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      for (const filePattern of FORBIDDEN_FILE_PATTERNS) {
        if (filePattern.test(entry.name)) {
          violations.push({
            file: relativePath,
            reason: `Forbidden mock filename matching ${filePattern}`,
          });
        }
      }

      const content = fs.readFileSync(fullPath, 'utf8');
      for (const codePattern of FORBIDDEN_CODE_PATTERNS) {
        if (codePattern.test(content)) {
          violations.push({
            file: relativePath,
            reason: `Forbidden mock identifier matching ${codePattern}`,
          });
        }
      }

      if (relativePath.startsWith('apps/mobile') && !relativePath.endsWith('.d.ts')) {
        for (const item of MOBILE_FORBIDDEN_PATTERNS) {
          if (item.pattern.test(content)) {
            violations.push({
              file: relativePath,
              reason: `Forbidden mobile hardcoded literal: ${item.reason}`,
            });
          }
        }
      }
    }
  }
}

const violations: MockViolation[] = [];
scanAppsForMocks(APPS_DIR, violations);

if (violations.length > 0) {
  console.error('D30 / FR-G66 VIOLATION: Mock code detected in production app paths:');
  for (const v of violations) {
    console.error(`  ${v.file}: ${v.reason}`);
  }
  process.exit(1);
}

console.log('PASS: Zero mock files or mock branches in production paths.');