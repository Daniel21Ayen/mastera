import { Injectable } from '@nestjs/common';
import { resolveProgressConflict, ProgressStateRecord } from '@mastera/domain';

export interface StudentSyncPayloadDto {
  studentId: string;
  progressUpdates: ProgressStateRecord[];
}

export interface SyncRepositoryPort {
  getStudentProgress(studentId: string): Promise<Map<string, ProgressStateRecord>>;
  saveStudentProgress(studentId: string, records: ProgressStateRecord[]): Promise<void>;
}

@Injectable()
export class StudentSyncService {
  constructor(private readonly repo: SyncRepositoryPort) {}

  /**
   * Synchronizes student offline progress batches using the v3.4 domain conflict matrix (SYN-01).
   */
  async processUpwardSync(payload: StudentSyncPayloadDto): Promise<{ processedCount: number }> {
    const existingMap = await this.repo.getStudentProgress(payload.studentId);
    const resolvedToPersist: ProgressStateRecord[] = [];

    for (const update of payload.progressUpdates) {
      const serverRecord = existingMap.get(update.chapterId);
      if (!serverRecord) {
        resolvedToPersist.push(update);
      } else {
        const { winner } = resolveProgressConflict(update, serverRecord);
        resolvedToPersist.push(winner);
      }
    }

    await this.repo.saveStudentProgress(payload.studentId, resolvedToPersist);

    return { processedCount: resolvedToPersist.length };
  }
}
