import { Injectable } from '@nestjs/common';

export const STUDENT_MS_COUNTER_KEY = 'student_ms_code';

/**
 * Minimal transactional interface compatible with Prisma.TransactionClient
 * and unit-test mocks without requiring a live PostgreSQL socket.
 */
export interface CounterTransactionExecutor {
  $queryRaw<T = unknown>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T>;
}

/**
 * Formats a positive counter integer into the authoritative MS code format:
 * MS + at least 4 digits (MS0001..MS9999, then MS10000) (D22, FR-G45).
 */
export function formatStudentMsCode(sequenceNumber: number): string {
  if (!Number.isInteger(sequenceNumber) || sequenceNumber < 1) {
    throw new Error(`Invalid student MS sequence number: ${sequenceNumber}`);
  }
  const padded = String(sequenceNumber).padStart(4, '0');
  return `MS${padded}`;
}

@Injectable()
export class CounterService {
  /**
   * Atomically increments and locks the counter row inside the active database
   * transaction. If the enclosing transaction fails or rolls back, the row
   * update is rolled back automatically, guaranteeing zero gaps (Section 5.4, 5.7).
   */
  async incrementInTransaction(
    tx: CounterTransactionExecutor,
    counterKey: string
  ): Promise<number> {
    const rows = await tx.$queryRaw<Array<{ value: number }>>`
      INSERT INTO counters ("key", "value", "updated_at")
      VALUES (${counterKey}, 1, NOW())
      ON CONFLICT ("key")
      DO UPDATE SET
        "value" = counters."value" + 1,
        "updated_at" = NOW()
      RETURNING "value";
    `;

    const firstRow = rows[0];
    if (!firstRow || typeof firstRow.value !== 'number') {
      throw new Error(`Failed to allocate transactional counter for key: ${counterKey}`);
    }

    return firstRow.value;
  }

  /**
   * Allocates the next gapless student MS number (MS0001+) inside the
   * student-creation transaction (D22, FR-G46, REG-08).
   */
  async allocateNextStudentMsCode(
    tx: CounterTransactionExecutor
  ): Promise<string> {
    const nextValue = await this.incrementInTransaction(
      tx,
      STUDENT_MS_COUNTER_KEY
    );
    return formatStudentMsCode(nextValue);
  }

  /**
   * Allocates the next display_number (starting at 1) for an exam set or
   * quiz chapter inside the question-creation transaction (D27, FR-G11, FR-G13).
   */
  async allocateNextQuestionNumber(
    tx: CounterTransactionExecutor,
    targetType: 'EXAM_SET' | 'QUIZ_CHAPTER',
    targetId: string
  ): Promise<number> {
    const counterKey = `question_num:${targetType}:${targetId}`;
    return this.incrementInTransaction(tx, counterKey);
  }
}