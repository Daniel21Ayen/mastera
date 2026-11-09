/**
 * Formats a sequential counter integer to the authoritative studentCode (FR-G45, Section 5.5).
 * - Minimum 4 digits with zero-padding (e.g. 1 -> MS0001, 999 -> MS0999, 10000 -> MS10000)
 */
export function formatStudentCode(counterValue: number): string {
  if (counterValue <= 0 || !Number.isInteger(counterValue)) {
    throw new Error(`Invalid counterValue ${counterValue}. Counter must be a positive integer.`);
  }

  const padded = String(counterValue).padStart(4, '0');
  return `MS${padded}`;
}

/**
 * Parses an MS student code back to its integer sequence number.
 */
export function parseStudentCodeSequence(studentCode: string): number {
  const match = /^MS(\d+)$/i.exec(studentCode.trim());
  if (!match || !match[1]) {
    throw new Error(`Invalid student code format: "${studentCode}". Expected format MS0001.`);
  }
  return parseInt(match[1], 10);
}
