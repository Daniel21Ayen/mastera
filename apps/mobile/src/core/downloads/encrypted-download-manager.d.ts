export type DownloadItemStatus = 'NOT_DOWNLOADED' | 'DOWNLOADING' | 'READY' | 'UPDATE_AVAILABLE' | 'FAILED';
export interface DownloadedCourseEntry {
    courseId: string;
    courseTitle: string;
    sizeMB: number;
    downloadedVersion: number;
    serverContentVersion: number;
    isPaidCourse: boolean;
    status: DownloadItemStatus;
    progressPercent: number;
    encryptedBuffer: Buffer;
    ivHex: string;
    authTagHex: string;
}
export declare class EncryptedDownloadManager {
    private readonly deviceHardwareId;
    private readonly entitlementSigningSecret;
    private wifiOnlyEnabled;
    private volatileStreamRamBuffer;
    private diskDownloads;
    private readonly deviceKey;
    constructor(deviceHardwareId: string, entitlementSigningSecret: string);
    isWifiOnly(): boolean;
    setWifiOnly(enabled: boolean): void;
    /**
     * Section 8.2 & D24: Online students stream content into memory only;
     * zero bytes are written to diskDownloads unless they tap Download.
     */
    streamIntoMemoryOnly(itemId: string, contentBody: string): string;
    getDiskDownloadCount(): number;
    /**
     * Downloads and AES-256-GCM encrypts a course or chapter to disk (DWN-02, DWN-04, DWN-06).
     * Replacement is atomic: if update fails mid-transfer, the previous version remains READY.
     */
    downloadOrUpdateCourseAtomically(params: {
        courseId: string;
        courseTitle: string;
        plaintextContent: string;
        sizeMB: number;
        version: number;
        isPaidCourse: boolean;
        connectionType: 'WIFI' | 'CELLULAR';
        overrideCellularWarning?: boolean;
        simulateNetworkFailureMidDownload?: boolean;
    }): DownloadedCourseEntry;
    /**
     * Notifies the download manager of a newer server content_version (Section 8.4, DWN-06).
     */
    notifyServerVersionBump(courseId: string, newServerVersion: number): void;
    /**
     * Opens and decrypts a downloaded item offline (DWN-04, DWN-05, Q17).
     * - Free items (Q17) open using the device key.
     * - Paid items verify the server-signed, device-bound entitlement token and
     *   check for clock rollback before decrypting.
     */
    openDownloadedCourseOffline(params: {
        courseId: string;
        signedEntitlementToken?: string | null;
        currentDeviceTimeIso: string;
        lastSeenServerTimeIso?: string | null;
    }): {
        allowed: boolean;
        plaintextContent?: string;
        reason: string;
    };
    /**
     * DWN-01: Delete removes local encrypted files and DB rows and returns the
     * course to Download state, WITHOUT revoking the student's purchase entitlement.
     */
    deleteDownloadFromPhone(courseId: string): void;
    listDownloadsSummary(): {
        entries: DownloadedCourseEntry[];
        totalUsedMB: number;
    };
}
//# sourceMappingURL=encrypted-download-manager.d.ts.map