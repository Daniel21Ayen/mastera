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
  /\b(fallbackChapter|fallbackQuestions|fallbackCourses)\b/,
];

const MOBILE_FORBIDDEN_PATTERNS = [
  { pattern: /['"]Abebe(?:\s+Kebede)?['"]/, reason: "Hardcoded student name 'Abebe'" },
  { pattern: /\bAbebe\b/, reason: "Hardcoded student name identifier 'Abebe'" },
  { pattern: /['"]MS0001['"]/, reason: "Hardcoded student code 'MS0001'" },
  { pattern: /['"][^'"]*\b\d+\s*ETB[^'"]*['"]/, reason: "Hardcoded ETB string literal" },
  { pattern: /\b\d+\s*ETB\b/, reason: "Hardcoded ETB price literal" },
  { pattern: /\b38\s*days\s*left\b/i, reason: "Hardcoded duration '38 days left'" },
  { pattern: /\b\w*(?:price|days|percent)\w*\s*=\s*\{\s*\d+\s*\}/i, reason: "Numeric literal assigned to price/days/percent JSX prop" },
  { pattern: /\b(?:bundleDaysRemaining|pendingOrdersCount|overallMasteryPercent|streakDays|renewalWindowDays|priceETB)\s*=\s*\{\s*\d+\s*\}/, reason: "Numeric literal assigned to status/price/days/percent prop" },
  { pattern: /['"]National COC Exam['"]/, reason: "Hardcoded National COC Exam fallback" },
  { pattern: /['"]fallback['"]/i, reason: "String literal 'fallback'" },
  { pattern: /\bfallback\s*[:=]\s*['"{]/i, reason: "Mock data fallback assignment" },
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