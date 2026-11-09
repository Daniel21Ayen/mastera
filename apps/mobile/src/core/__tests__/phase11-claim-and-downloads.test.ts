import test from 'node:test';
import assert from 'node:assert';
import { SignedEntitlementTokenPayloadDto } from '@mastera/contracts';
import { base64Encode, hmacSha256Hex } from '@mastera/domain';
import { ClaimSecretAndMigrationManager } from '../database/claim-migrator';
import { EncryptedDownloadManager } from '../downloads/encrypted-download-manager';
import {
  mergeDeltaIntoState,
  unpackPackageIntoState,
  initialRealAppData,
} from '../data/live-catalog-provider';

function createSignedTokenForTest(
  secret: string,
  payload: SignedEntitlementTokenPayloadDto
): string {
  const encoded = base64Encode(JSON.stringify(payload));
  const sig = hmacSha256Hex(secret, encoded);
  return `${encoded}.${sig}`;
}

test('Acceptance #10 (REG-12): Atomic local-to-MS0001 migration preserves all progress, attempts, and downloads', () => {
  const migrator = new ClaimSecretAndMigrationManager();
  const localAccountId = '11111111-2222-3333-4444-555555555555';

  const { claimSecret, claimSecretHash } =
    migrator.generateOrderClaimSecretPair();
  assert.ok(claimSecret.length >= 32);
  assert.strictEqual(claimSecretHash.length, 64);

  migrator.seedLocalDataBeforeClaim(
    localAccountId,
    ['prog-1', 'prog-2', 'prog-3'],
    ['att-1', 'att-2'],
    ['c-eng', 'c-calc']
  );

  const migrationResult = migrator.migrateLocalDataToRegisteredStudentAtomically(
    localAccountId,
    {
      studentId: 'stu-1',
      studentCode: 'MS0001',
      localAccountId,
      accessToken: 'jwt-access',
      refreshToken: 'jwt-refresh',
      entitlements: [],
      signedEntitlementToken: 'token',
      serverTimestamp: new Date().toISOString(),
    }
  );

  assert.strictEqual(migrationResult.studentCode, 'MS0001');
  assert.strictEqual(migrationResult.migratedProgressCount, 3);
  assert.strictEqual(migrationResult.migratedAttemptCount, 2);
  assert.strictEqual(migrationResult.migratedDownloadCount, 2);
  // Secret is cleared after successful claim & migration (Section 5.6)
  assert.strictEqual(migrator.getStoredClaimSecret(), null);
});

test('Acceptance #13 & #16 (DWN-01..09, R26): Memory streaming, Wi-Fi-only guard, atomic update rollback, and offline entitlement verification', () => {
  const secret = 'test_entitlement_signing_secret_minimum_32_bytes';
  const deviceHwId = 'budget-android-arm64-hw-001';
  const dlManager = new EncryptedDownloadManager(deviceHwId, secret);

  // 1. Online streaming holds content in RAM only -> 0 disk downloads (Section 8.2)
  dlManager.streamIntoMemoryOnly('ch-1', 'Streamed chapter body');
  assert.strictEqual(dlManager.getDiskDownloadCount(), 0);

  // 2. DWN-09: Wi-Fi-only toggle (default ON) blocks cellular download unless overridden
  assert.throws(
    () => {
      dlManager.downloadOrUpdateCourseAtomically({
        courseId: 'c-eng',
        courseTitle: 'Communicative English',
        plaintextContent: 'Version 1 course body',
        sizeMB: 18,
        version: 1,
        isPaidCourse: true,
        connectionType: 'CELLULAR',
      });
    },
    (err: Error) => err.message.includes('DWN-09_WIFI_ONLY_BLOCKED')
  );

  // 3. Download version 1 on Wi-Fi
  dlManager.downloadOrUpdateCourseAtomically({
    courseId: 'c-eng',
    courseTitle: 'Communicative English',
    plaintextContent: 'Version 1 course body',
    sizeMB: 18,
    version: 1,
    isPaidCourse: true,
    connectionType: 'WIFI',
  });

  // 4. Server bumps version to 2 -> status flips to UPDATE_AVAILABLE
  dlManager.notifyServerVersionBump('c-eng', 2);
  const summaryBeforeUpdate = dlManager.listDownloadsSummary();
  assert.strictEqual(
    summaryBeforeUpdate.entries[0]?.status,
    'UPDATE_AVAILABLE'
  );

  // 5. Acceptance #16 (DWN-06): Simulated network failure mid-update preserves Version 1 readable
  dlManager.downloadOrUpdateCourseAtomically({
    courseId: 'c-eng',
    courseTitle: 'Communicative English',
    plaintextContent: 'Version 2 course body',
    sizeMB: 20,
    version: 2,
    isPaidCourse: true,
    connectionType: 'WIFI',
    simulateNetworkFailureMidDownload: true,
  });

  const validToken = createSignedTokenForTest(secret, {
    studentId: 'stu-1',
    studentCode: 'MS0001',
    deviceHardwareId: deviceHwId,
    issuedAtServerTime: '2026-11-01T10:00:00.000Z',
    tokenExpiresAt: '2026-11-15T10:00:00.000Z',
    courseExpiries: {
      'c-eng': '2027-03-20T10:00:00.000Z',
    },
  });

  const openedOffline = dlManager.openDownloadedCourseOffline({
    courseId: 'c-eng',
    signedEntitlementToken: validToken,
    currentDeviceTimeIso: '2026-11-06T12:00:00.000Z',
    lastSeenServerTimeIso: '2026-11-06T10:00:00.000Z',
  });
  assert.strictEqual(openedOffline.allowed, true);
  assert.strictEqual(
    openedOffline.plaintextContent,
    'Version 1 course body'
  );

  // 6. R26: Device clock rolled back before lastSeenServerTime -> blocked offline
  const rollbackAttempt = dlManager.openDownloadedCourseOffline({
    courseId: 'c-eng',
    signedEntitlementToken: validToken,
    currentDeviceTimeIso: '2026-10-25T12:00:00.000Z', // Rolled back!
    lastSeenServerTimeIso: '2026-11-06T10:00:00.000Z',
  });
  assert.strictEqual(rollbackAttempt.allowed, false);
  assert.ok(rollbackAttempt.reason.includes('clock rollback'));

  // 7. Expired entitlement stops opening downloaded paid content offline (Section 7.1, 8.2)
  const expiredAttempt = dlManager.openDownloadedCourseOffline({
    courseId: 'c-eng',
    signedEntitlementToken: validToken,
    currentDeviceTimeIso: '2027-04-01T12:00:00.000Z',
  });
  assert.strictEqual(expiredAttempt.allowed, false);

  // 8. DWN-01: Delete removes file from phone
  dlManager.deleteDownloadFromPhone('c-eng');
  assert.strictEqual(dlManager.getDiskDownloadCount(), 0);
});

test('Phase 4 & 5: Delta-Sync Ingestion, Package Unpacking into Volatile RAM, and Storage Summary', () => {
  // 1. Initial state has default bundled courses
  assert.ok(initialRealAppData.courses.length >= 3);

  // 2. Merge delta with a new course and a deleted course
  const deltaSnapshot = {
    snapshotVersion: 5,
    generatedAt: new Date().toISOString(),
    universities: [],
    programs: [],
    courses: [
      {
        id: 'c-new-robotics',
        code: 'ROB201',
        title: 'Introduction to Robotics',
        universityId: 'uni-bdu',
        programId: 'prog-fresh',
        semester: 1 as const,
        stream: 'NATURAL' as const,
        accent: 'teal' as const,
        icon: 'cpu',
        freeAccess: false,
        freeTrialCount: 1,
        priceETB: 350,
        isActive: true,
        contentVersion: 1,
      },
    ],
    bookGroups: [
      {
        id: 'bg-rob-1',
        courseId: 'c-new-robotics',
        category: 'MODULES' as const,
        code: 'BG-ROB',
        title: 'Robotics Core Modules',
        subtitle: 'Foundations of Kinematics',
        orderIndex: 1,
        version: 1,
      },
    ],
    chapters: [
      {
        id: 'ch-rob-1',
        courseId: 'c-new-robotics',
        bookGroupId: 'bg-rob-1',
        category: 'MODULES' as const,
        orderIndex: 1,
        title: 'Kinematics & Actuators',
        isFree: true,
        estimatedSizeBytes: 500,
        status: 'PUBLISHED' as const,
        version: 1,
      },
    ],
    examSets: [],
    paymentMethods: [
      {
        id: 'cbe-new',
        providerName: 'Commercial Bank of Ethiopia',
        accountHolderName: 'Mastera PLC',
        accountNumberOrCode: '1000999888777',
        instructions: 'CBE mobile transfer',
        isActive: true,
      },
    ],
    deletedItemIds: ['c-calc'], // Delete Calculus
  };

  const updatedState = mergeDeltaIntoState(initialRealAppData, deltaSnapshot);

  // New course added
  assert.ok(updatedState.courses.some((c) => c.id === 'c-new-robotics'));
  // Deleted course removed
  assert.strictEqual(updatedState.courses.some((c) => c.id === 'c-calc'), false);
  // Chapters grouped by book group
  assert.ok(updatedState.chaptersByBookId['bg-rob-1']);
  assert.strictEqual(updatedState.chaptersByBookId['bg-rob-1']?.length, 1);
  // Payment methods updated
  assert.ok(updatedState.paymentMethods.some((pm) => pm.id === 'cbe-new'));

  // 3. Unpack streamed course package into memory
  const mockPackage = {
    courseId: 'c-new-robotics',
    chapters: [
      {
        id: 'ch-rob-1',
        title: 'Kinematics & Actuators',
        bodyMarkdownLatex: '# Inverse Kinematics Formula: $\\theta = \\arctan(y/x)$',
      },
    ],
    exams: [
      {
        id: 'exam-rob-mid',
        title: 'Robotics Mid Exam',
        questions: [
          {
            id: 'q-rob-1',
            displayNumber: 1,
            promptLatex: 'What is degree of freedom?',
            optionsJson: ['Number of independent parameters', 'Voltage', 'Mass', 'Speed'],
            correctOptionId: 'A',
            explanationLatex: 'Degrees of freedom denote independent coordinates.',
          },
        ],
      },
    ],
  };

  const unpackedState = unpackPackageIntoState(updatedState, mockPackage);
  assert.strictEqual(
    unpackedState.chapterBodyByChapterId['ch-rob-1']?.bodyText,
    '# Inverse Kinematics Formula: $\\theta = \\arctan(y/x)$'
  );
  assert.strictEqual(
    unpackedState.questionsByExamSetId['exam-rob-mid']?.length,
    1
  );
  assert.strictEqual(
    unpackedState.questionsByExamSetId['exam-rob-mid']?.[0]?.displayNumber,
    1
  );

  // 4. Download Manager and storage summary
  const secret = 'test_entitlement_signing_secret_minimum_32_bytes';
  const dlManager = new EncryptedDownloadManager('hw-android-x', secret);
  dlManager.downloadOrUpdateCourseAtomically({
    courseId: 'c-new-robotics',
    courseTitle: 'Introduction to Robotics',
    plaintextContent: JSON.stringify(mockPackage),
    sizeMB: 18,
    version: 1,
    isPaidCourse: false,
    connectionType: 'WIFI',
  });

  const summary = dlManager.listDownloadsSummary();
  assert.strictEqual(summary.entries.length, 1);
  assert.strictEqual(summary.totalUsedMB, 18);
  assert.strictEqual(summary.entries[0]?.courseId, 'c-new-robotics');
});