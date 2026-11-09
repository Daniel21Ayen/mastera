import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.resolve(__dirname, '..');
const TARGET_DIRS = ['apps', 'packages'];
const ALLOWED_PATH = path.normalize('packages/ui-tokens');
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.scss']);
const HEX_REGEX = /#[0-9a-fA-F]{3,8}\b/g;

interface Violation {
  file: string;
  line: number;
  matches: string[];
}

function scanDirectory(dirPath: string, violations: Violation[]): void {
  if (!fs.existsSync(dirPath)) return;

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(ROOT_DIR, fullPath);

    if (
      entry.name === 'node_modules' ||
      entry.name === 'dist' ||
      entry.name === '.next' ||
      entry.name === '.expo' ||
      relativePath.startsWith(ALLOWED_PATH)
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      scanDirectory(fullPath, violations);
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
      lines.forEach((lineContent, idx) => {
        const matches = lineContent.match(HEX_REGEX);
        if (matches) {
          violations.push({
            file: relativePath,
            line: idx + 1,
            matches,
          });
        }
      });
    }
  }
}

const foundViolations: Violation[] = [];
for (const dir of TARGET_DIRS) {
  scanDirectory(path.join(ROOT_DIR, dir), foundViolations);
}

if (foundViolations.length > 0) {
  console.error('NFR-20 / FR-G65 VIOLATION: Hardcoded hex colours detected outside @mastera/ui-tokens:');
  for (const v of foundViolations) {
    console.error(`  ${v.file}:${v.line} -> ${v.matches.join(', ')}`);
  }
  process.exit(1);
}

console.log('PASS: Zero hardcoded hex colours outside @mastera/ui-tokens.');