import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  CounterService,
  formatStudentMsCode,
  STUDENT_MS_COUNTER_KEY,
} from '../../src/modules/counter/counter.service';

describe('Counter Concurrency Tests (SRS Section 5.3, D22, FR-G45)', () => {
  it('allocates strictly gapless, unique MS codes across 50 concurrent operations', async () => {
    let currentCounter = 0;
    const mockTxExecutor = {
      $queryRaw: async <T = unknown>(): Promise<T> => {
        currentCounter += 1;
        return [{ value: currentCounter }] as unknown as T;
      },
    };

    const counterService = new CounterService();
    const concurrency = 50;
    const promises: Promise<string>[] = [];

    for (let i = 0; i < concurrency; i++) {
      promises.push(counterService.allocateNextStudentMsCode(mockTxExecutor));
    }

    const results = await Promise.all(promises);

    // 1. Verify exactly 50 codes allocated
    assert.equal(results.length, 50);

    // 2. Verify all 50 codes are distinct (0 duplicates)
    const uniqueCodes = new Set(results);
    assert.equal(uniqueCodes.size, 50);

    // 3. Verify gapless sequence from MS0001 to MS0050
    for (let i = 1; i <= concurrency; i++) {
      const expected = formatStudentMsCode(i);
      assert.ok(uniqueCodes.has(expected), `Missing expected code ${expected}`);
    }
  });

  it('allocates strictly sequential question numbers starting from 1', async () => {
    let currentQuestionNumber = 0;
    const mockTxExecutor = {
      $queryRaw: async <T = unknown>(): Promise<T> => {
        currentQuestionNumber += 1;
        return [{ value: currentQuestionNumber }] as unknown as T;
      },
    };

    const counterService = new CounterService();
    const count = 30;
    const numbers: number[] = [];

    for (let i = 0; i < count; i++) {
      const num = await counterService.allocateNextQuestionNumber(
        mockTxExecutor,
        'exam_set_sample_123'
      );
      numbers.push(num);
    }

    assert.equal(numbers.length, 30);
    for (let i = 0; i < count; i++) {
      assert.equal(numbers[i], i + 1);
    }
  });
});
