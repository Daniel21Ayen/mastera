import test from 'node:test';
import assert from 'node:assert';
import { calculateBundlePrice } from '../commerce/bundle-pricing';
import { validateBundleSelection } from '../commerce/bundle-validator';
import { canPurchaseSingleCourse } from '../commerce/single-eligibility';
import { resolveCanOpen } from '../access/can-open';
import { resolveContentAccess } from '../access/resolve-content-access';
import { evaluateClockRollback } from '../entitlement/clock-rollback';
import { formatStudentCode, parseStudentCodeSequence } from '../registration/ms-code-formatter';
import { compareVersions } from '../sync/version-comparator';
import { resolveProgressConflict } from '../sync/conflict-resolver';
import { hashClaimSecret, verifyClaimSecret } from '../registration/claim-secret';

test('calculateBundlePrice - Calculated Mode with discount', () => {
  const courses = [
    { courseId: 'c1', priceETB: 100 },
    { courseId: 'c2', priceETB: 100 },
    { courseId: 'c3', priceETB: 100 },
  ];
  const config = {
    pricingMode: 'CALCULATED' as const,
    fixedPriceETB: 0,
    discountPercent: 10,
    productType: 'SEMESTER_BUNDLE' as const,
    enabled: true,
    minCourses: 3,
    maxCourses: 10,
    durationDays: 150,
    unlocksSingleCourses: true,
    includesCommonCourses: true,
    includesCocAndExams: true,
  };

  const result = calculateBundlePrice('SEMESTER_BUNDLE', courses, config);
  assert.strictEqual(result.baseAmountETB, 300);
  assert.strictEqual(result.discountAmountETB, 30);
  assert.strictEqual(result.totalAmountETB, 270);
});

test('validateBundleSelection - Rejects below minCourses', () => {
  const config = {
    productType: 'SEMESTER_BUNDLE' as const,
    enabled: true,
    minCourses: 3,
    maxCourses: 10,
    pricingMode: 'CALCULATED' as const,
    discountPercent: 0,
    fixedPriceETB: 200,
    durationDays: 150,
    unlocksSingleCourses: true,
    includesCommonCourses: true,
    includesCocAndExams: true,
  };
  const availableCourses = [
    { id: 'c1', code: 'A', title: 'A', universityId: null, programId: null, semester: 1 as const, stream: 'NATURAL' as const, accent: 'blue' as const, icon: 'book', freeAccess: false, freeTrialCount: 0, priceETB: 50, contentVersion: 1, isActive: true },
    { id: 'c2', code: 'B', title: 'B', universityId: null, programId: null, semester: 1 as const, stream: 'NATURAL' as const, accent: 'blue' as const, icon: 'book', freeAccess: false, freeTrialCount: 0, priceETB: 50, contentVersion: 1, isActive: true },
  ];

  const validation = validateBundleSelection(['c1', 'c2'], availableCourses, config);
  assert.strictEqual(validation.valid, false);
  assert.strictEqual(validation.errorCode, 'BUNDLE_SIZE_INVALID');
});

test('canPurchaseSingleCourse - Rejects without active qualifying bundle', () => {
  const check = canPurchaseSingleCourse({
    singleCoursesEnabled: true,
    hasActiveQualifyingBundle: false,
    isCourseAlreadyOwnedOrIncluded: false,
  });
  assert.strictEqual(check.allowed, false);
  assert.strictEqual(check.errorCode, 'SINGLE_COURSE_BUNDLE_REQUIRED');
});

test('resolveCanOpen - Precedence check (Active entitlement opens content)', () => {
  const access = resolveCanOpen({
    isItemActive: true,
    isItemPublished: true,
    isItemDeleted: false,
    hasActiveEntitlementForCourse: true,
    isCourseFreeAccess: false,
    isItemFreeAtItemLevel: false,
  });
  assert.strictEqual(access.allowed, true);
});

test('Claim secret hash and constant-time verification', () => {
  const secret = 'sec_secure_random_32_bytes_url_safe';
  const hashed = hashClaimSecret(secret);
  const isValid = verifyClaimSecret(secret, hashed);
  assert.strictEqual(isValid, true);

  const isInvalid = verifyClaimSecret('wrong_secret', hashed);
  assert.strictEqual(isInvalid, false);
});

test('resolveContentAccess - Evaluates streaming vs offline downloaded delivery', () => {
  const onlineStream = resolveContentAccess({
    canOpenContext: {
      isItemActive: true,
      isItemPublished: true,
      isItemDeleted: false,
      hasActiveEntitlementForCourse: true,
      isCourseFreeAccess: false,
      isItemFreeAtItemLevel: false,
    },
    isOnline: true,
    hasDownloadedFile: false,
    isDownloadedVersionCurrent: true,
  });
  assert.strictEqual(onlineStream.canOpen, true);
  assert.strictEqual(onlineStream.resolutionMode, 'ONLINE_STREAM');

  const offlineLocal = resolveContentAccess({
    canOpenContext: {
      isItemActive: true,
      isItemPublished: true,
      isItemDeleted: false,
      hasActiveEntitlementForCourse: true,
      isCourseFreeAccess: false,
      isItemFreeAtItemLevel: false,
    },
    isOnline: false,
    hasDownloadedFile: true,
    isDownloadedVersionCurrent: true,
  });
  assert.strictEqual(offlineLocal.canOpen, true);
  assert.strictEqual(offlineLocal.resolutionMode, 'OFFLINE_LOCAL');

  const offlineNotDownloaded = resolveContentAccess({
    canOpenContext: {
      isItemActive: true,
      isItemPublished: true,
      isItemDeleted: false,
      hasActiveEntitlementForCourse: true,
      isCourseFreeAccess: false,
      isItemFreeAtItemLevel: false,
    },
    isOnline: false,
    hasDownloadedFile: false,
    isDownloadedVersionCurrent: false,
  });
  assert.strictEqual(offlineNotDownloaded.canOpen, false);
  assert.strictEqual(offlineNotDownloaded.resolutionMode, 'NOT_AVAILABLE_OFFLINE');
});

test('evaluateClockRollback - Detects R26 clock rollback', () => {
  const serverTime = 1700000000000;
  // Rolled back 2 hours
  const rolledBackDeviceTime = serverTime - 2 * 60 * 60 * 1000;

  const result = evaluateClockRollback({
    currentDeviceTimestampMs: rolledBackDeviceTime,
    lastSeenServerTimestampMs: serverTime,
  });

  assert.strictEqual(result.isTampered, true);
  assert.match(result.reason, /R26 CLOCK ROLLBACK DETECTED/);

  // Normal advancing time
  const normalResult = evaluateClockRollback({
    currentDeviceTimestampMs: serverTime + 1000,
    lastSeenServerTimestampMs: serverTime,
  });
  assert.strictEqual(normalResult.isTampered, false);
});

test('formatStudentCode and parseStudentCodeSequence - FR-G45 format', () => {
  assert.strictEqual(formatStudentCode(1), 'MS0001');
  assert.strictEqual(formatStudentCode(42), 'MS0042');
  assert.strictEqual(formatStudentCode(1000), 'MS1000');
  assert.strictEqual(formatStudentCode(12345), 'MS12345');

  assert.strictEqual(parseStudentCodeSequence('MS0001'), 1);
  assert.strictEqual(parseStudentCodeSequence('MS12345'), 12345);
});

test('compareVersions - Content version delta detection', () => {
  const current = compareVersions(1, 1);
  assert.strictEqual(current.hasUpdate, false);

  const updated = compareVersions(1, 2);
  assert.strictEqual(updated.hasUpdate, true);
});

test('resolveProgressConflict - COMPLETED supersedes and higher scores win', () => {
  const clientInProgress = {
    chapterId: 'ch1',
    status: 'IN_PROGRESS' as const,
    score: 5,
    updatedAtMs: 2000,
  };
  const serverCompleted = {
    chapterId: 'ch1',
    status: 'COMPLETED' as const,
    score: 8,
    updatedAtMs: 1000,
  };

  const res1 = resolveProgressConflict(clientInProgress, serverCompleted);
  assert.strictEqual(res1.winner.status, 'COMPLETED');
  assert.strictEqual(res1.source, 'SERVER');

  const clientHigherScore = {
    chapterId: 'ch1',
    status: 'COMPLETED' as const,
    score: 10,
    updatedAtMs: 1000,
  };
  const serverLowerScore = {
    chapterId: 'ch1',
    status: 'COMPLETED' as const,
    score: 7,
    updatedAtMs: 2000,
  };

  const res2 = resolveProgressConflict(clientHigherScore, serverLowerScore);
  assert.strictEqual(res2.winner.score, 10);
  assert.strictEqual(res2.source, 'CLIENT');
});


test('resolveContentAccess - Evaluates streaming vs offline downloaded delivery', () => {
  const onlineStream = resolveContentAccess({
    canOpenContext: {
      isItemActive: true,
      isItemPublished: true,
      isItemDeleted: false,
      hasActiveEntitlementForCourse: true,
      isCourseFreeAccess: false,
      isItemFreeAtItemLevel: false,
    },
    isOnline: true,
    hasDownloadedFile: false,
    isDownloadedVersionCurrent: true,
  });
  assert.strictEqual(onlineStream.canOpen, true);
  assert.strictEqual(onlineStream.resolutionMode, 'ONLINE_STREAM');

  const offlineLocal = resolveContentAccess({
    canOpenContext: {
      isItemActive: true,
      isItemPublished: true,
      isItemDeleted: false,
      hasActiveEntitlementForCourse: true,
      isCourseFreeAccess: false,
      isItemFreeAtItemLevel: false,
    },
    isOnline: false,
    hasDownloadedFile: true,
    isDownloadedVersionCurrent: true,
  });
  assert.strictEqual(offlineLocal.canOpen, true);
  assert.strictEqual(offlineLocal.resolutionMode, 'OFFLINE_LOCAL');

  const offlineNotDownloaded = resolveContentAccess({
    canOpenContext: {
      isItemActive: true,
      isItemPublished: true,
      isItemDeleted: false,
      hasActiveEntitlementForCourse: true,
      isCourseFreeAccess: false,
      isItemFreeAtItemLevel: false,
    },
    isOnline: false,
    hasDownloadedFile: false,
    isDownloadedVersionCurrent: false,
  });
  assert.strictEqual(offlineNotDownloaded.canOpen, false);
  assert.strictEqual(offlineNotDownloaded.resolutionMode, 'NOT_AVAILABLE_OFFLINE');
});

test('evaluateClockRollback - Detects R26 clock rollback', () => {
  const serverTime = 1700000000000;
  // Rolled back 2 hours
  const rolledBackDeviceTime = serverTime - 2 * 60 * 60 * 1000;

  const result = evaluateClockRollback({
    currentDeviceTimestampMs: rolledBackDeviceTime,
    lastSeenServerTimestampMs: serverTime,
  });

  assert.strictEqual(result.isTampered, true);
  assert.match(result.reason, /R26 CLOCK ROLLBACK DETECTED/);

  // Normal advancing time
  const normalResult = evaluateClockRollback({
    currentDeviceTimestampMs: serverTime + 1000,
    lastSeenServerTimestampMs: serverTime,
  });
  assert.strictEqual(normalResult.isTampered, false);
});

test('formatStudentCode and parseStudentCodeSequence - FR-G45 format', () => {
  assert.strictEqual(formatStudentCode(1), 'MS0001');
  assert.strictEqual(formatStudentCode(42), 'MS0042');
  assert.strictEqual(formatStudentCode(1000), 'MS1000');
  assert.strictEqual(formatStudentCode(12345), 'MS12345');

  assert.strictEqual(parseStudentCodeSequence('MS0001'), 1);
  assert.strictEqual(parseStudentCodeSequence('MS12345'), 12345);
});

test('compareVersions - Content version delta detection', () => {
  const current = compareVersions(1, 1);
  assert.strictEqual(current.hasUpdate, false);

  const updated = compareVersions(1, 2);
  assert.strictEqual(updated.hasUpdate, true);
});

test('resolveProgressConflict - COMPLETED supersedes and higher scores win', () => {
  const clientInProgress = {
    chapterId: 'ch1',
    status: 'IN_PROGRESS' as const,
    score: 5,
    updatedAtMs: 2000,
  };
  const serverCompleted = {
    chapterId: 'ch1',
    status: 'COMPLETED' as const,
    score: 8,
    updatedAtMs: 1000,
  };

  const res1 = resolveProgressConflict(clientInProgress, serverCompleted);
  assert.strictEqual(res1.winner.status, 'COMPLETED');
  assert.strictEqual(res1.source, 'SERVER');

  const clientHigherScore = {
    chapterId: 'ch1',
    status: 'COMPLETED' as const,
    score: 10,
    updatedAtMs: 1000,
  };
  const serverLowerScore = {
    chapterId: 'ch1',
    status: 'COMPLETED' as const,
    score: 7,
    updatedAtMs: 2000,
  };

  const res2 = resolveProgressConflict(clientHigherScore, serverLowerScore);
  assert.strictEqual(res2.winner.score, 10);
  assert.strictEqual(res2.source, 'CLIENT');
});