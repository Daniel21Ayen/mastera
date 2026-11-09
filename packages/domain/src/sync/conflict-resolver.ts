export interface ProgressStateRecord {
  chapterId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  completedAt?: string | null;
  score?: number | null;
  updatedAtMs: number;
}

export type ConflictResolutionSource = 'CLIENT' | 'SERVER' | 'MERGED';

export interface ConflictResolutionResult {
  winner: ProgressStateRecord;
  source: ConflictResolutionSource;
}

/**
 * Resolves progress/attempt synchronization conflicts between client and server (SYN-01..03).
 * Rule:
 * 1. COMPLETED state always supersedes IN_PROGRESS or NOT_STARTED regardless of timestamp.
 * 2. If both states are identical (e.g. both COMPLETED or both IN_PROGRESS), highest score / progress wins.
 * 3. Otherwise, last-write-wins (highest updatedAtMs).
 */
export function resolveProgressConflict(
  client: ProgressStateRecord,
  server: ProgressStateRecord
): ConflictResolutionResult {
  if (client.status === 'COMPLETED' && server.status !== 'COMPLETED') {
    return { winner: client, source: 'CLIENT' };
  }
  if (server.status === 'COMPLETED' && client.status !== 'COMPLETED') {
    return { winner: server, source: 'SERVER' };
  }

  if (client.status === 'COMPLETED' && server.status === 'COMPLETED') {
    const clientScore = client.score ?? 0;
    const serverScore = server.score ?? 0;
    if (clientScore > serverScore) {
      return { winner: client, source: 'CLIENT' };
    }
    if (serverScore > clientScore) {
      return { winner: server, source: 'SERVER' };
    }
  }

  // Last-write-wins fallback
  if (client.updatedAtMs >= server.updatedAtMs) {
    return { winner: client, source: 'CLIENT' };
  }
  return { winner: server, source: 'SERVER' };
}
