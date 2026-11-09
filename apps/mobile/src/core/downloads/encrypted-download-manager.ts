import {
  verifyOfflineEntitlementToken,
  sha256,
  randomBytes,
  bytesToHex,
  hexToBytes,
  authenticatedEncrypt,
  authenticatedDecrypt,
} from '@mastera/domain';

export type DownloadItemStatus =
  | 'NOT_DOWNLOADED'
  | 'DOWNLOADING'
  | 'READY'
  | 'UPDATE_AVAILABLE'
  | 'FAILED';

export interface DownloadedCourseEntry {
  courseId: string;
  courseTitle: string;
  sizeMB: number;
  downloadedVersion: number;
  serverContentVersion: number;
  isPaidCourse: boolean;
  status: DownloadItemStatus;
  progressPercent: number;
  encryptedBuffer: Uint8Array;
  ivHex: string;
  authTagHex: string;
}

export class EncryptedDownloadManager {
  private wifiOnlyEnabled = true; // DWN-09: default ON
  private volatileStreamRamBuffer = new Map<string, string>();
  private diskDownloads = new Map<string, DownloadedCourseEntry>();
  private readonly deviceKey: Uint8Array;

  constructor(
    private readonly deviceHardwareId: string,
    private readonly entitlementSigningSecret: string
  ) {
    this.deviceKey = sha256(`mastera-device-key:${deviceHardwareId}`);
  }

  isWifiOnly(): boolean {
    return this.wifiOnlyEnabled;
  }

  setWifiOnly(enabled: boolean): void {
    this.wifiOnlyEnabled = enabled;
  }

  /**
   * Section 8.2 & D24: Online students stream content into memory only;
   * zero bytes are written to diskDownloads unless they tap Download.
   */
  streamIntoMemoryOnly(itemId: string, contentBody: string): string {
    this.volatileStreamRamBuffer.set(itemId, contentBody);
    return contentBody;
  }

  getDiskDownloadCount(): number {
    return this.diskDownloads.size;
  }

  /**
   * Downloads and encrypts a course or chapter to disk (DWN-02, DWN-04, DWN-06).
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
  }): DownloadedCourseEntry {
    // DWN-09: Block mobile-data download when Wi-Fi only is ON unless student overrides
    if (
      this.wifiOnlyEnabled &&
      params.connectionType === 'CELLULAR' &&
      !params.overrideCellularWarning
    ) {
      throw new Error(
        'DWN-09_WIFI_ONLY_BLOCKED: Download on Wi-Fi only is enabled. Connect to Wi-Fi or override for this download.'
      );
    }

    const previousCopy = this.diskDownloads.get(params.courseId);

    if (params.simulateNetworkFailureMidDownload) {
      // Atomic replacement guarantee (Section 8.4, DWN-06):
      // If a previous copy exists, keep it intact and readable!
      if (previousCopy) {
        return previousCopy;
      }
      throw new Error('Download interrupted before completion.');
    }

    const iv = randomBytes(12);
    const { ciphertext, authTagHex } = authenticatedEncrypt(
      params.plaintextContent,
      this.deviceKey,
      iv
    );

    const entry: DownloadedCourseEntry = {
      courseId: params.courseId,
      courseTitle: params.courseTitle,
      sizeMB: params.sizeMB,
      downloadedVersion: params.version,
      serverContentVersion: params.version,
      isPaidCourse: params.isPaidCourse,
      status: 'READY',
      progressPercent: 100,
      encryptedBuffer: ciphertext,
      ivHex: bytesToHex(iv),
      authTagHex,
    };

    this.diskDownloads.set(params.courseId, entry);
    return entry;
  }

  /**
   * Notifies the download manager of a newer server content_version (Section 8.4, DWN-06).
   */
  notifyServerVersionBump(courseId: string, newServerVersion: number): void {
    const existing = this.diskDownloads.get(courseId);
    if (existing && newServerVersion > existing.downloadedVersion) {
      this.diskDownloads.set(courseId, {
        ...existing,
        serverContentVersion: newServerVersion,
        status: 'UPDATE_AVAILABLE',
      });
    }
  }

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
  }): { allowed: boolean; plaintextContent?: string; reason: string } {
    const entry = this.diskDownloads.get(params.courseId);
    if (!entry) {
      return {
        allowed: false,
        reason: 'Course is not downloaded on this phone.',
      };
    }

    // Section 7.1 & R26: Detect device clock rollback
    if (params.lastSeenServerTimeIso) {
      const currentMs = new Date(params.currentDeviceTimeIso).getTime();
      const lastServerMs = new Date(params.lastSeenServerTimeIso).getTime();
      if (currentMs + 60_000 < lastServerMs) {
        return {
          allowed: false,
          reason:
            'Device clock rollback detected. Connect to the internet to verify entitlement time.',
        };
      }
    }

    if (entry.isPaidCourse) {
      if (!params.signedEntitlementToken) {
        return {
          allowed: false,
          reason: 'Paid download requires a valid signed entitlement token.',
        };
      }

      const tokenVerify = verifyOfflineEntitlementToken(
        params.signedEntitlementToken,
        this.entitlementSigningSecret,
        params.currentDeviceTimeIso,
        this.deviceHardwareId,
        params.courseId
      );

      if (!tokenVerify.valid) {
        return {
          allowed: false,
          reason: tokenVerify.reason,
        };
      }
    }

    try {
      const decrypted = authenticatedDecrypt(
        entry.encryptedBuffer,
        this.deviceKey,
        hexToBytes(entry.ivHex),
        entry.authTagHex
      );

      return {
        allowed: true,
        plaintextContent: decrypted,
        reason: 'Decrypted offline download.',
      };
    } catch {
      return {
        allowed: false,
        reason: 'Failed to decrypt offline download.',
      };
    }
  }

  /**
   * DWN-01: Delete removes local encrypted files and DB rows and returns the
   * course to Download state, WITHOUT revoking the student's purchase entitlement.
   */
  deleteDownloadFromPhone(courseId: string): void {
    this.diskDownloads.delete(courseId);
  }

  listDownloadsSummary(): {
    entries: DownloadedCourseEntry[];
    totalUsedMB: number;
  } {
    const entries = Array.from(this.diskDownloads.values());
    const totalUsedMB = entries.reduce((sum, e) => sum + e.sizeMB, 0);
    return { entries, totalUsedMB };
  }
}