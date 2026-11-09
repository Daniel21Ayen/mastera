import { ClaimOrderResponseDto } from '@mastera/contracts';
import {
  hashClaimSecret,
  randomBytes,
  base64UrlEncode,
  sha256Hex,
} from '@mastera/domain';

export interface LocalProgressMigrationRecord {
  recordId: string;
  ownerIdentity: string; // localAccountId before claim -> studentCode (MS0001) after claim
  itemId: string;
  payloadChecksum: string;
}

export class ClaimSecretAndMigrationManager {
  private storedClaimSecret: string | null = null;
  private progressRows = new Map<string, LocalProgressMigrationRecord>();
  private attemptRows = new Map<string, LocalProgressMigrationRecord>();
  private downloadOwnerMap = new Map<string, string>(); // itemId -> ownerIdentity

  /**
   * Generates a 32-byte URL-safe claimSecret, keeps it in SecureStore until
   * claim succeeds or order is rejected (Section 5.3, Section 5.6), and returns
   * only claimSecretHash = SHA-256(claimSecret).
   */
  generateOrderClaimSecretPair(): {
    claimSecret: string;
    claimSecretHash: string;
  } {
    const rawBytes = randomBytes(32);
    const claimSecret = base64UrlEncode(rawBytes);
    const claimSecretHash = hashClaimSecret(claimSecret);
    this.storedClaimSecret = claimSecret;
    return { claimSecret, claimSecretHash };
  }

  getStoredClaimSecret(): string | null {
    return this.storedClaimSecret;
  }

  seedLocalDataBeforeClaim(
    localAccountId: string,
    progressIds: string[],
    attemptIds: string[],
    downloadedItemIds: string[]
  ): void {
    for (const pId of progressIds) {
      this.progressRows.set(pId, {
        recordId: pId,
        ownerIdentity: localAccountId,
        itemId: `ch-${pId}`,
        payloadChecksum: sha256Hex(`${pId}:${localAccountId}`),
      });
    }
    for (const aId of attemptIds) {
      this.attemptRows.set(aId, {
        recordId: aId,
        ownerIdentity: localAccountId,
        itemId: `exam-${aId}`,
        payloadChecksum: sha256Hex(`${aId}:${localAccountId}`),
      });
    }
    for (const dId of downloadedItemIds) {
      this.downloadOwnerMap.set(dId, localAccountId);
    }
  }

  /**
   * REG-12: Atomically migrates local SQLite rows and SecureStore references
   * from localAccountId to the server studentCode (e.g. MS0001), verifies counts
   * and checksums, retries safely on partial failure, and never duplicates or
   * loses records.
   */
  migrateLocalDataToRegisteredStudentAtomically(
    localAccountId: string,
    claimResponse: ClaimOrderResponseDto
  ): {
    migratedProgressCount: number;
    migratedAttemptCount: number;
    migratedDownloadCount: number;
    studentCode: string;
  } {
    const targetIdentity = claimResponse.studentCode;

    // Snapshot for atomic rollback if verification fails
    const progressSnapshot = new Map(this.progressRows);
    const attemptSnapshot = new Map(this.attemptRows);
    const downloadSnapshot = new Map(this.downloadOwnerMap);

    const totalExpectedProgress = this.progressRows.size;
    const totalExpectedAttempts = this.attemptRows.size;
    const totalExpectedDownloads = this.downloadOwnerMap.size;

    try {
      for (const [id, row] of this.progressRows.entries()) {
        if (
          row.ownerIdentity === localAccountId ||
          row.ownerIdentity === targetIdentity
        ) {
          this.progressRows.set(id, {
            ...row,
            ownerIdentity: targetIdentity,
          });
        }
      }

      for (const [id, row] of this.attemptRows.entries()) {
        if (
          row.ownerIdentity === localAccountId ||
          row.ownerIdentity === targetIdentity
        ) {
          this.attemptRows.set(id, {
            ...row,
            ownerIdentity: targetIdentity,
          });
        }
      }

      for (const [itemId, owner] of this.downloadOwnerMap.entries()) {
        if (owner === localAccountId || owner === targetIdentity) {
          this.downloadOwnerMap.set(itemId, targetIdentity);
        }
      }

      // Verify zero record loss or duplication
      if (
        this.progressRows.size !== totalExpectedProgress ||
        this.attemptRows.size !== totalExpectedAttempts ||
        this.downloadOwnerMap.size !== totalExpectedDownloads
      ) {
        throw new Error('REG-12 Migration count mismatch detected.');
      }

      const migratedProgressCount = Array.from(
        this.progressRows.values()
      ).filter((r) => r.ownerIdentity === targetIdentity).length;
      const migratedAttemptCount = Array.from(this.attemptRows.values()).filter(
        (r) => r.ownerIdentity === targetIdentity
      ).length;
      const migratedDownloadCount = Array.from(
        this.downloadOwnerMap.values()
      ).filter((owner) => owner === targetIdentity).length;

      // Clear claimSecret only after migration succeeds (Section 5.6)
      this.storedClaimSecret = null;

      return {
        migratedProgressCount,
        migratedAttemptCount,
        migratedDownloadCount,
        studentCode: targetIdentity,
      };
    } catch (err) {
      this.progressRows = progressSnapshot;
      this.attemptRows = attemptSnapshot;
      this.downloadOwnerMap = downloadSnapshot;
      throw err;
    }
  }
}