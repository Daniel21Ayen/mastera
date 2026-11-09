export interface ClockRollbackEvaluationInput {
  currentDeviceTimestampMs: number;
  lastSeenServerTimestampMs: number;
  maxAllowedBackwardDriftMs?: number; // Tolerates minor NTP network drift, default 60_000 (1 minute)
}

export interface ClockRollbackEvaluationResult {
  isTampered: boolean;
  advancingServerTimestampMs: number;
  reason: string;
}

/**
 * Evaluates whether the client system clock was rolled backwards relative
 * to the last authenticated server timestamp (Section 18, R26).
 */
export function evaluateClockRollback(
  input: ClockRollbackEvaluationInput
): ClockRollbackEvaluationResult {
  const maxDrift = input.maxAllowedBackwardDriftMs ?? 60_000;

  if (input.currentDeviceTimestampMs < input.lastSeenServerTimestampMs - maxDrift) {
    const driftSeconds = Math.round(
      (input.lastSeenServerTimestampMs - input.currentDeviceTimestampMs) / 1000
    );
    return {
      isTampered: true,
      advancingServerTimestampMs: input.lastSeenServerTimestampMs,
      reason: `R26 CLOCK ROLLBACK DETECTED: Device clock is ${driftSeconds}s behind last-seen server time. Access locked until online token sync.`,
    };
  }

  // Update monotonically advancing timestamp if device clock is newer
  const nextTimestamp = Math.max(
    input.currentDeviceTimestampMs,
    input.lastSeenServerTimestampMs
  );

  return {
    isTampered: false,
    advancingServerTimestampMs: nextTimestamp,
    reason: 'Clock monotonic integrity verified.',
  };
}
