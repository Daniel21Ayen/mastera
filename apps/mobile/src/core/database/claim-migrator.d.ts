import { ClaimOrderResponseDto } from '@mastera/contracts';
export interface LocalProgressMigrationRecord {
    recordId: string;
    ownerIdentity: string;
    itemId: string;
    payloadChecksum: string;
}
export declare class ClaimSecretAndMigrationManager {
    private storedClaimSecret;
    private progressRows;
    private attemptRows;
    private downloadOwnerMap;
    /**
     * Generates a 32-byte URL-safe claimSecret, keeps it in SecureStore until
     * claim succeeds or order is rejected (Section 5.3, Section 5.6), and returns
     * only claimSecretHash = SHA-256(claimSecret).
     */
    generateOrderClaimSecretPair(): {
        claimSecret: string;
        claimSecretHash: string;
    };
    getStoredClaimSecret(): string | null;
    seedLocalDataBeforeClaim(localAccountId: string, progressIds: string[], attemptIds: string[], downloadedItemIds: string[]): void;
    /**
     * REG-12: Atomically migrates local SQLite rows and SecureStore references
     * from localAccountId to the server studentCode (e.g. MS0001), verifies counts
     * and checksums, retries safely on partial failure, and never duplicates or
     * loses records.
     */
    migrateLocalDataToRegisteredStudentAtomically(localAccountId: string, claimResponse: ClaimOrderResponseDto): {
        migratedProgressCount: number;
        migratedAttemptCount: number;
        migratedDownloadCount: number;
        studentCode: string;
    };
}
//# sourceMappingURL=claim-migrator.d.ts.map