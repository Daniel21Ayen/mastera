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