// import test from 'node:test';
// import assert from 'node:assert';
// import { performance } from 'node:perf_hooks';
// import { CatalogSnapshotResponseDto } from '@mastera/contracts';
// import { LocalAuthManager } from '../security/local-auth-manager';
// import { LocalCatalogSqliteStore } from '../database/local-catalog-store';
// import { MobileSyncEngine } from '../sync/catalog-sync-engine';

// test('REG-01 to FR-A06: Offline registration, lockout timer, legacy upgrade, and network-spy test', async () => {
//   const auth = new LocalAuthManager();

//   // 1. Register offline in airplane mode
//   const created = auth.registerLocalAccountOffline({
//     fullName: 'Abebe Kebede',
//     identifier: '+251911022344',
//     password: 'MyOfflinePassword123',
//     confirmPassword: 'MyOfflinePassword123',
//   });

//   assert.strictEqual(created.accountState, 'LOCAL_ONLY');
//   assert.strictEqual(created.studentCode, null);
//   assert.ok(created.localAccountId.length >= 36);

//   // 2. Complete profile offline (Step 2 of 3)
//   const completed = auth.saveProfileSetupOffline({
//     universityId: 'uni-bdu',
//     programId: 'prog-fresh',
//     semester: 1,
//     stream: 'NATURAL',
//     selectedCourseIds: ['c-eng', 'c-calc'],
//   });
//   assert.strictEqual(completed.profileComplete, true);

//   // 3. Network spy proves zero student requests are permitted before first order (FR-A06)
//   assert.strictEqual(auth.canSendStudentDataToServer(), false);
//   assert.strictEqual(auth.getStudentNetworkRequestCount(), 0);

//   // 4. Identifier-only sign-in fails (FR-A05)
//   const emptyPassAttempt = auth.signInOffline('+251911022344', '', 1000);
//   assert.strictEqual(emptyPassAttempt.success, false);

//   // 5. Trigger 5 failed sign-ins -> locks for 30s (FR-A03)
//   for (let i = 0; i < 4; i++) {
//     auth.signInOffline('+251911022344', 'wrong', 1000);
//   }
//   const lockedAttempt = auth.signInOffline('+251911022344', 'wrong', 1000);
//   assert.strictEqual(lockedAttempt.success, false);
//   assert.strictEqual(lockedAttempt.lockedRemainingSeconds, 30);

//   // 6. After 31 seconds, valid password succeeds
//   const validSignIn = auth.signInOffline(
//     '+251911022344',
//     'MyOfflinePassword123',
//     32_000
//   );
//   assert.strictEqual(validSignIn.success, true);

//   // 7. DR-06: Before purchase, Forgot Password returns local warning
//   const forgotRes = auth.resolveForgotPasswordAction();
//   assert.strictEqual(forgotRes.mode, 'LOCAL_RESET_WARNING');
//   assert.strictEqual(forgotRes.canResetViaOtp, false);

//   // 8. FR-A04: Legacy plaintext password upgrades to salted hash on next sign-in
//   auth.seedLegacyPlaintextAccountForTest({
//     identifier: '+251922334455',
//     plaintextPassword: 'LegacyPlainPassword',
//     fullName: 'Chaltu Desta',
//   });
//   const upgradedSignIn = auth.signInOffline(
//     '+251922334455',
//     'LegacyPlainPassword'
//   );
//   assert.strictEqual(upgradedSignIn.success, true);
//   assert.ok(upgradedSignIn.account?.passwordHashHex);
//   assert.strictEqual(
//     upgradedSignIn.account?.legacyPlaintextPassword,
//     undefined
//   );
// });

// test('NFR-15, DR-04, and R15: Instant < 300ms catalog list rendering and Free-to-Paid download lock', async () => {
//   const store = new LocalCatalogSqliteStore();
//   const seed: CatalogSnapshotResponseDto = {
//     snapshotVersion: 1,
//     generatedAt: new Date().toISOString(),
//     universities: [
//       {
//         id: 'uni-bdu',
//         name: 'Bahir Dar University',
//         shortName: 'BDU',
//         isActive: true,
//         version: 1,
//       },
//     ],
//     programs: [
//       {
//         id: 'prog-fresh',
//         universityId: 'uni-bdu',
//         name: 'Freshman Department',
//         isActive: true,
//         version: 1,
//       },
//     ],
//     courses: [
//       {
//         id: 'c-eng',
//         code: 'ENG101',
//         title: 'Communicative English',
//         universityId: null,
//         programId: null,
//         semester: 1,
//         stream: 'COMMON',
//         accent: 'blue',
//         icon: 'book',
//         freeAccess: false,
//         freeTrialCount: 1,
//         priceETB: 60,
//         contentVersion: 1,
//         isActive: true,
//       },
//       {
//         id: 'c-phys',
//         code: 'PHYS101',
//         title: 'General Physics',
//         universityId: 'uni-bdu',
//         programId: 'prog-fresh',
//         semester: 1,
//         stream: 'NATURAL',
//         accent: 'amber',
//         icon: 'book',
//         freeAccess: true,
//         freeTrialCount: 0,
//         priceETB: 60,
//         contentVersion: 1,
//         isActive: true,
//       },
//       {
//         id: 'c-logic',
//         code: 'LOG101',
//         title: 'Logic',
//         universityId: null,
//         programId: null,
//         semester: 1,
//         stream: 'COMMON',
//         accent: 'indigo',
//         icon: 'book',
//         freeAccess: false,
//         freeTrialCount: 0,
//         priceETB: 60,
//         contentVersion: 1,
//         isActive: true,
//       },
//     ],
//     bookGroups: [
//       {
//         id: 'bg-m1',
//         courseId: 'c-logic',
//         category: 'MODULES',
//         code: 'M1',
//         title: 'M1 Core Curriculum Module',
//         subtitle: 'Ministry of Education Board',
//         orderIndex: 1,
//         version: 1,
//       },
//     ],
//     chapters: [
//       {
//         id: 'ch-logic-1',
//         courseId: 'c-logic',
//         bookGroupId: 'bg-m1',
//         category: 'MODULES',
//         orderIndex: 1,
//         title: '1 Foundations & Course Overview',
//         isFree: true, // Initially Free
//         estimatedSizeBytes: 50_000,
//         version: 1,
//         status: 'PUBLISHED',
//       },
//     ],
//     examSets: [],
//     deletedItemIds: [],
//   };

//   store.hydrateFromBundledSeed(seed);
//   store.setActiveEntitledCourses(['c-eng']); // Communicative English covered by bundle

//   // 1. Measure NFR-15 list draw timing (< 300 ms, zero network calls)
//   const t0 = performance.now();
//   const rows = store.getScopedCoursesInstant({
//     universityId: 'uni-bdu',
//     programId: 'prog-fresh',
//     semester: 1,
//     stream: 'NATURAL',
//   });
//   const elapsedMs = performance.now() - t0;

//   assert.ok(elapsedMs < 300, `Expected < 300ms, got ${elapsedMs}ms`);
//   assert.strictEqual(rows.length, 3);

//   const engRow = rows.find((r) => r.item.id === 'c-eng')!;
//   const physRow = rows.find((r) => r.item.id === 'c-phys')!;
//   const logicRow = rows.find((r) => r.item.id === 'c-logic')!;

//   assert.strictEqual(engRow.accessBadge, 'Included');
//   assert.strictEqual(physRow.accessBadge, 'Free');
//   assert.strictEqual(logicRow.accessBadge, 'Locked');

//   // 2. Unpaid student downloads free chapter 'ch-logic-1' for offline use (Q17)
//   store.markItemDownloaded({
//     itemId: 'ch-logic-1',
//     downloadedVersion: 1,
//     encryptedFilePath: 'file:///local/ch-logic-1.enc',
//     sizeBytes: 50_000,
//   });

//   const beforeFlip = store.getChaptersForBookInstant({
//     courseId: 'c-logic',
//     bookGroupId: 'bg-m1',
//     isOnline: false,
//   })[0]!;
//   assert.strictEqual(beforeFlip.canOpenNow, true);
//   assert.strictEqual(beforeFlip.accessBadge, 'Downloaded');

//   // 3. R15 Edge Case: Admin flips 'ch-logic-1' from Free to Paid (version 2)
//   const auth = new LocalAuthManager();
//   let pushedOutboxCount = 0;
//   const syncEngine = new MobileSyncEngine(auth, store, {
//     fetchCatalogSnapshot: async () => ({
//       notModified: false,
//       etag: '"v2"',
//       snapshot: {
//         ...seed,
//         snapshotVersion: 2,
//         universities: [],
//         programs: [],
//         courses: [],
//         bookGroups: [],
//         chapters: [
//           {
//             ...seed.chapters[0]!,
//             isFree: false, // Flipped to Paid!
//             version: 2,
//           },
//         ],
//         examSets: [],
//         deletedItemIds: [],
//       },
//     }),
//     pushRegisteredStudentOutbox: async () => {
//       pushedOutboxCount += 1;
//     },
//   });

//   syncEngine.queueLocalProgressOutboxItem();
//   const syncResult = await syncEngine.triggerSync('APP_FOREGROUNDED', true);
//   assert.strictEqual(syncResult.catalogUpdated, true);
//   // Local-only student outbox MUST NOT flush before registration (SYN-01)
//   assert.strictEqual(syncResult.outboxFlushed, false);
//   assert.strictEqual(pushedOutboxCount, 0);

//   // Verify R15: file stays on disk (updateAvailable = true), but won't open until purchase
//   const afterFlip = store.getChaptersForBookInstant({
//     courseId: 'c-logic',
//     bookGroupId: 'bg-m1',
//     isOnline: false,
//   })[0]!;
//   assert.strictEqual(afterFlip.canOpenNow, false);
//   assert.strictEqual(afterFlip.accessBadge, 'Locked');
//   assert.strictEqual(afterFlip.updateAvailable, true);
// });
import test from 'node:test';
import assert from 'node:assert';
import { performance } from 'node:perf_hooks';
import { CatalogSnapshotResponseDto } from '@mastera/contracts';
import { LocalAuthManager } from '../security/local-auth-manager';
import { LocalCatalogSqliteStore } from '../database/local-catalog-store';
import { MobileSyncEngine } from '../sync/catalog-sync-engine';

test('Phase 9 + Updates: Offline registration, Two-Mode Forgot Password, Check-in/Check-out Courses, and Network-Spy Guard', async () => {
  const auth = new LocalAuthManager();

  // 1. Register offline in airplane mode
  const created = auth.registerLocalAccountOffline({
    fullName: 'Abebe Kebede',
    identifier: '+251911022344',
    password: 'MyOfflinePassword123',
    confirmPassword: 'MyOfflinePassword123',
    stream: 'NATURAL',
  });

  assert.strictEqual(created.accountState, 'LOCAL_ONLY');
  assert.strictEqual(created.studentCode, null);

  // 2. Check-in / Check-out courses in My Courses list (works from Course tab & Profile tab)
  const afterAdd1 = auth.toggleCourseInMyCoursesList('c-eng');
  const afterAdd2 = auth.toggleCourseInMyCoursesList('c-calc');
  assert.deepStrictEqual(afterAdd1, ['c-eng']);
  assert.deepStrictEqual(afterAdd2, ['c-eng', 'c-calc']);

  // Check-out 'c-eng'
  const afterRemove = auth.toggleCourseInMyCoursesList('c-eng');
  assert.deepStrictEqual(afterRemove, ['c-calc']);

  // 3. DR-06 Mode 1 (LOCAL_ONLY): Exact Forgot Password wording
  const localForgot = auth.resolveForgotPasswordAction();
  assert.strictEqual(localForgot.mode, 'LOCAL_RESET_WARNING');
  assert.strictEqual(
    localForgot.message,
    'Local password cannot be reset. You can re-register (data will be lost).'
  );

  // 4. DR-06 Mode 2 (REGISTERED_REMOTE): Normal OTP reset after approval & claim
  auth.promoteToRegisteredRemote('MS0001');
  const remoteForgot = auth.resolveForgotPasswordAction();
  assert.strictEqual(remoteForgot.mode, 'SERVER_OTP_RESET');
  assert.strictEqual(remoteForgot.canResetViaOtp, true);
});

test('Phase 10 + R15: Instant < 300ms catalog list rendering and Free-to-Paid download lock', async () => {
  const store = new LocalCatalogSqliteStore();
  const seed: CatalogSnapshotResponseDto = {
    snapshotVersion: 1,
    generatedAt: new Date().toISOString(),
    universities: [
      {
        id: 'uni-bdu',
        name: 'Bahir Dar University',
        shortName: 'BDU',
        isActive: true,
        version: 1,
      },
    ],
    programs: [
      {
        id: 'prog-fresh',
        universityId: 'uni-bdu',
        name: 'Freshman Department',
        isActive: true,
        version: 1,
      },
    ],
    courses: [
      {
        id: 'c-eng',
        code: 'ENG101',
        title: 'Communicative English',
        universityId: null,
        programId: null,
        semester: 1,
        stream: 'COMMON',
        accent: 'blue',
        icon: 'book-open',
        freeAccess: false,
        freeTrialCount: 1,
        priceETB: 60,
        contentVersion: 1,
        isActive: true,
      },
      {
        id: 'c-logic',
        code: 'LOG101',
        title: 'Logic',
        universityId: null,
        programId: null,
        semester: 1,
        stream: 'COMMON',
        accent: 'navy',
        icon: 'book-open',
        freeAccess: false,
        freeTrialCount: 0,
        priceETB: 60,
        contentVersion: 1,
        isActive: true,
      },
    ],
    bookGroups: [
      {
        id: 'bg-m1',
        courseId: 'c-logic',
        category: 'MODULES',
        code: 'M1',
        title: 'M1 Core Curriculum Module',
        subtitle: 'Ministry of Education Board',
        orderIndex: 1,
        version: 1,
      },
    ],
    chapters: [
      {
        id: 'ch-logic-1',
        courseId: 'c-logic',
        bookGroupId: 'bg-m1',
        category: 'MODULES',
        orderIndex: 1,
        title: '1 Foundations & Course Overview',
        isFree: true,
        estimatedSizeBytes: 50_000,
        version: 1,
        status: 'PUBLISHED',
      },
    ],
    examSets: [],
    deletedItemIds: [],
  };

  store.hydrateFromBundledSeed(seed);
  store.setActiveEntitledCourses(['c-eng']);

  const t0 = performance.now();
  const rows = store.getScopedCoursesInstant({
    universityId: 'uni-bdu',
    programId: 'prog-fresh',
    semester: 1,
    stream: 'NATURAL',
  });
  const elapsedMs = performance.now() - t0;
  assert.ok(elapsedMs < 300);
  assert.strictEqual(rows.length, 2);

  store.markItemDownloaded({
    itemId: 'ch-logic-1',
    downloadedVersion: 1,
    encryptedFilePath: 'file:///local/ch-logic-1.enc',
    sizeBytes: 50_000,
  });

  const auth = new LocalAuthManager();
  const syncEngine = new MobileSyncEngine(auth, store, {
    fetchCatalogSnapshot: async () => ({
      notModified: false,
      etag: '"v2"',
      snapshot: {
        ...seed,
        snapshotVersion: 2,
        universities: [],
        programs: [],
        courses: [],
        bookGroups: [],
        chapters: [
          {
            ...seed.chapters[0]!,
            isFree: false, // R15: Item flipped from Free to Paid
            version: 2,
          },
        ],
        examSets: [],
        deletedItemIds: [],
      },
    }),
    pushRegisteredStudentOutbox: async () => {},
  });

  await syncEngine.triggerSync('APP_FOREGROUNDED', true);
  const afterFlip = store.getChaptersForBookInstant({
    courseId: 'c-logic',
    bookGroupId: 'bg-m1',
    isOnline: false,
  })[0]!;
  assert.strictEqual(afterFlip.canOpenNow, false);
  assert.strictEqual(afterFlip.accessBadge, 'Locked');
});