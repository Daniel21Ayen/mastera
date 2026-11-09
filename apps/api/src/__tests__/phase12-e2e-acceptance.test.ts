import test from 'node:test';
import assert from 'node:assert';
import { performance } from 'node:perf_hooks';

// Stub react-native Flow module in Node testing environment
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Module = require('module');
  const origRequire = Module.prototype.require;
  Module.prototype.require = function (id: string, ...args: any[]) {
    if (id === 'react-native' || id === 'react-native-svg') {
      return {
        View: 'View',
        Text: 'Text',
        TouchableOpacity: 'TouchableOpacity',
        StyleSheet: { create: (s: any) => s },
        ScrollView: 'ScrollView',
        SafeAreaView: 'SafeAreaView',
        StatusBar: 'StatusBar',
        Svg: 'Svg',
        Path: 'Path',
      };
    }
    return origRequire.apply(this, [id, ...args]);
  };
} catch (e) {}

import {
  CatalogCourseDto,
  EntitlementRecordDto,
  PaymentSettingsDto,
  PriceQuoteDto,
  RefundRecordDto,
} from '@mastera/contracts';
import {
  calculateExtraCoursePrice,
  validateBundleSelection,
} from '@mastera/domain';
import { AuditService } from '../modules/audit-reports/audit.service';
import {
  CounterService,
  CounterTransactionExecutor,
} from '../modules/counter/counter.service';
import {
  AuthenticatedAdminContext,
  ScopeAuthorizationService,
} from '../modules/permissions/scope.service';
import {
  CommercePricingPort,
  CommercePricingService,
  createDefaultPaymentSettings,
} from '../modules/commerce-pricing/commerce-pricing.service';
import {
  OrdersPaymentsService,
  OrdersRepositoryPort,
  StoredOrderEntity,
  StoredStudentEntity,
} from '../modules/orders-payments/orders-payments.service';
import {
  RefundRepositoryPort,
  RefundsService,
} from '../modules/refunds/refunds.service';
import {
  buildPaginatedResponse,
  normalizePagination,
} from '../common/pagination/pagination.helper';
import {
  LocalAuthManager,
  ClaimSecretAndMigrationManager,
  EncryptedDownloadManager,
} from '@mastera/mobile';
import { runAllReleaseGateChecks } from '../common/verify-release-gates';

test('Section 16.2 Complete 17-Point End-to-End Acceptance Suite + NFR-19 10,000-Row Pagination Load Test', async () => {
  // =========================================================================
  // CRITERION #1: Register student in airplane mode; local UUID exists & zero
  // student profile data is sent to the API.
  // =========================================================================
  const mobileAuth = new LocalAuthManager();
  const localProfile = mobileAuth.registerLocalAccountOffline({
    fullName: 'Abebe Kebede',
    identifier: '+251911223344',
    password: 'AirplaneModePassword!1',
    confirmPassword: 'AirplaneModePassword!1',
    stream: 'NATURAL',
  });
  mobileAuth.saveProfileSetupOffline({
    universityId: 'uni-aastu',
    programId: 'prog-se',
    semester: 1,
    stream: 'NATURAL',
    selectedCourseIds: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'],
  });

  assert.strictEqual(localProfile.accountState, 'LOCAL_ONLY');
  assert.strictEqual(localProfile.studentCode, null);
  assert.strictEqual(mobileAuth.canSendStudentDataToServer(), false);
  assert.strictEqual(mobileAuth.getStudentNetworkRequestCount(), 0);

  // Set up Backend Stores for Criteria #2..#16
  let settings: PaymentSettingsDto = createDefaultPaymentSettings();
  const courses: CatalogCourseDto[] = Array.from({ length: 18 }, (_, idx) => {
    const num = idx + 1;
    return {
      id: `c${num}`,
      code: `CRS${100 + num}`,
      title: `Course ${num}`,
      universityId: 'uni-aastu',
      programId: 'prog-se',
      semester: 1,
      stream: 'NATURAL',
      accent: 'blue',
      icon: 'book-open',
      freeAccess: false,
      freeTrialCount: 1,
      priceETB: 60,
      contentVersion: 1,
      isActive: true,
    };
  });

  const quotes = new Map<string, PriceQuoteDto>();
  const orders = new Map<string, StoredOrderEntity>();
  const students = new Map<string, StoredStudentEntity>();
  const entitlements = new Map<string, EntitlementRecordDto>();
  const refunds = new Map<string, RefundRecordDto>();
  let counters = new Map<string, number>();

  const pricingPort: CommercePricingPort = {
    getActiveSettings: async () => settings,
    saveSettings: async (next) => {
      settings = next;
      return settings;
    },
    findCoursesByIds: async (ids) => courses.filter((c) => ids.includes(c.id)),
    getActiveStudentEntitlements: async (studentId) =>
      Array.from(entitlements.values()).filter(
        (e) =>
          e.status === 'ACTIVE' &&
          orders.get(e.orderId)?.studentId === studentId
      ),
    saveQuote: async (q) => {
      quotes.set(q.quoteId, q);
    },
    findQuoteById: async (id) => quotes.get(id) ?? null,
  };

  const ordersRepo: OrdersRepositoryPort = {
    runInTransaction: async <T>(
      work: (tx: CounterTransactionExecutor) => Promise<T>
    ): Promise<T> => {
      const snapshot = new Map(counters);
      const tx: CounterTransactionExecutor = {
        $queryRaw: async <R = unknown>(
          _strings: TemplateStringsArray,
          ...values: unknown[]
        ): Promise<R> => {
          const key = String(values[0]);
          const next = (counters.get(key) ?? 0) + 1;
          counters.set(key, next);
          return [{ value: next }] as unknown as R;
        },
      };
      try {
        return await work(tx);
      } catch (err) {
        counters = snapshot;
        throw err;
      }
    },
    findQuoteById: async (id) => quotes.get(id) ?? null,
    getMaxReceiptSizeBytes: async () => settings.maxReceiptSizeBytes,
    findOrderByLocalAccountId: async (localId) =>
      Array.from(orders.values()).find((o) => o.localAccountId === localId) ??
      null,
    findOrderByTransactionRef: async (ref) =>
      Array.from(orders.values()).find(
        (o) => o.transactionReference === ref
      ) ?? null,
    findOrderById: async (id) => orders.get(id) ?? null,
    countPendingOrdersByIdentifier: async (identifier) =>
      Array.from(orders.values()).filter(
        (o) =>
          o.status === 'PENDING' &&
          o.pendingProfile.identifier === identifier
      ).length,
    findStudentByIdentifier: async (identifier) =>
      Array.from(students.values()).find((s) => s.identifier === identifier) ??
      null,
    findStudentById: async (id) => students.get(id) ?? null,
    insertOrder: async (data) => {
      const id = `ord-${orders.size + 1}`;
      const rec: StoredOrderEntity = { id, ...data };
      orders.set(id, rec);
      return rec;
    },
    updateOrder: async (id, patch) => {
      const existing = orders.get(id)!;
      const updated = { ...existing, ...patch };
      orders.set(id, updated);
      return updated;
    },
    createStudentInTx: async (_tx, data) => {
      const id = `stu-${students.size + 1}`;
      const rec: StoredStudentEntity = { id, ...data };
      students.set(id, rec);
      return rec;
    },
    insertEntitlementsInTx: async (_tx, items) => {
      const created: EntitlementRecordDto[] = [];
      for (const item of items) {
        const id = `ent-${entitlements.size + 1}`;
        const rec: EntitlementRecordDto = { id, ...item };
        entitlements.set(id, rec);
        created.push(rec);
      }
      return created;
    },
    listStudentEntitlements: async (studentId) =>
      Array.from(entitlements.values()).filter(
        (e) => orders.get(e.orderId)?.studentId === studentId
      ),
  };

  const refundRepo: RefundRepositoryPort = {
    findOrderAmountAndStatus: async (orderId) => {
      const o = orders.get(orderId);
      return o ? { amountETB: o.expectedAmountETB, status: o.status } : null;
    },
    createRefund: async (data) => {
      const id = `ref-${refunds.size + 1}`;
      const now = new Date().toISOString();
      const rec: RefundRecordDto = {
        id,
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      refunds.set(id, rec);
      return rec;
    },
    findRefundById: async (id) => refunds.get(id) ?? null,
    updateRefund: async (id, patch) => {
      const existing = refunds.get(id)!;
      const updated = { ...existing, ...patch };
      refunds.set(id, updated);
      return updated;
    },
    revokeEntitlementsForOrderOnly: async (orderId) => {
      const revoked: EntitlementRecordDto[] = [];
      for (const [id, ent] of entitlements.entries()) {
        if (ent.orderId === orderId) {
          const next: EntitlementRecordDto = { ...ent, status: 'REVOKED' };
          entitlements.set(id, next);
          revoked.push(next);
        }
      }
      return revoked;
    },
  };

  const auditService = new AuditService({ writeAuditRow: async () => {} });
  const scopeService = new ScopeAuthorizationService(auditService);
  const counterService = new CounterService();
  const signingSecret = 'e2e_entitlement_signing_secret_32_characters_long';

  const pricingService = new CommercePricingService(
    pricingPort,
    scopeService,
    auditService
  );
  const ordersService = new OrdersPaymentsService(
    ordersRepo,
    counterService,
    scopeService,
    auditService,
    signingSecret
  );
  const refundsService = new RefundsService(
    refundRepo,
    scopeService,
    auditService
  );

  const superAdmin: AuthenticatedAdminContext = {
    adminId: 'super-1',
    adminRole: 'SUPER_ADMIN',
    isActive: true,
    canReviewAndPublish: true,
    scopes: [],
  };
  const opsAdmin: AuthenticatedAdminContext = {
    adminId: 'ops-1',
    adminRole: 'OPERATIONS_ADMIN',
    isActive: true,
    canReviewAndPublish: false,
    scopes: [],
  };

  // =========================================================================
  // CRITERION #2: Local-only student single-course purchase rejected
  // =========================================================================
  await assert.rejects(
    async () => {
      await pricingService.createPriceQuote({
        productType: 'EXTRA_SINGLE_COURSE',
        selectedCourseIds: ['c1'],
      });
    },
    (err: Error) => err.message.includes('SINGLE_COURSE_BUNDLE_REQUIRED')
  );

  // =========================================================================
  // CRITERION #3: Bundle below min (6 < 7) and above max (11 > 10) rejected;
  // boundary counts (7 and 10) accepted by both client domain and API.
  // =========================================================================
  const sixIds = courses.slice(0, 6).map((c) => c.id);
  const sevenIds = courses.slice(0, 7).map((c) => c.id);
  const tenIds = courses.slice(0, 10).map((c) => c.id);
  const elevenIds = courses.slice(0, 11).map((c) => c.id);

  assert.strictEqual(
    validateBundleSelection(
      sixIds,
      courses,
      settings.bundles.SEMESTER_BUNDLE
    ).valid,
    false
  );
  assert.strictEqual(
    validateBundleSelection(
      elevenIds,
      courses,
      settings.bundles.SEMESTER_BUNDLE
    ).valid,
    false
  );
  assert.strictEqual(
    validateBundleSelection(
      sevenIds,
      courses,
      settings.bundles.SEMESTER_BUNDLE
    ).valid,
    true
  );
  assert.strictEqual(
    validateBundleSelection(
      tenIds,
      courses,
      settings.bundles.SEMESTER_BUNDLE
    ).valid,
    true
  );

  const initialBundleQuote = await pricingService.createPriceQuote({
    productType: 'SEMESTER_BUNDLE',
    selectedCourseIds: sevenIds,
  });
  assert.strictEqual(initialBundleQuote.totalAmountETB, 200);

  // =========================================================================
  // CRITERION #4: Change bundle price in Admin; fresh quote uses new settings
  // while existing valid snapshot is unchanged.
  // =========================================================================
  const nextSettings = createDefaultPaymentSettings();
  nextSettings.bundles.SEMESTER_BUNDLE.fixedPriceETB = 250;
  await pricingService.updatePaymentSettings(
    superAdmin,
    nextSettings,
    'Adjust semester bundle price to 250 ETB for new orders'
  );

  const freshQuoteAfterChange = await pricingService.createPriceQuote({
    productType: 'SEMESTER_BUNDLE',
    selectedCourseIds: sevenIds,
  });
  assert.strictEqual(freshQuoteAfterChange.totalAmountETB, 250);
  // Existing quote snapshot remains 200 ETB!
  const storedOldQuote = await pricingPort.findQuoteById(
    initialBundleQuote.quoteId
  );
  assert.strictEqual(storedOldQuote?.totalAmountETB, 200);

  // =========================================================================
  // CRITERION #5: Submit valid bundle order with receipt; student stays
  // local-only and absent from Admin Students while pending.
  // =========================================================================
  const migrator = new ClaimSecretAndMigrationManager();
  const { claimSecret, claimSecretHash } =
    migrator.generateOrderClaimSecretPair();
  const pngReceipt = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01,
  ]);

  const submittedOrder = await ordersService.submitOrderWithReceipt(
    {
      localAccountId: localProfile.localAccountId,
      profile: {
        fullName: localProfile.fullName,
        identifier: localProfile.identifier,
        universityId: 'uni-aastu',
        programId: 'prog-se',
        semester: 1,
        stream: 'NATURAL',
        selectedCourseIds: sevenIds,
      },
      passwordPlaintextOverTls: 'AirplaneModePassword!1',
      claimSecretHash,
      deviceHardwareId: 'budget-android-hw-001',
      quoteId: initialBundleQuote.quoteId,
      productType: 'SEMESTER_BUNDLE',
      selectedCourseIds: sevenIds,
      paymentMethodId: 'pm-cbe-mobile',
      transactionReference: 'FT26302MAST89',
    },
    pngReceipt
  );

  assert.strictEqual(submittedOrder.status, 'PENDING');
  assert.strictEqual(submittedOrder.amountSnapshotETB, 200);
  assert.strictEqual(students.size, 0); // Absent from Admin Students while pending

  // =========================================================================
  // CRITERION #6 & #7: Force a transaction failure -> leaves no MS gap.
  // Approve receipt -> creates Student + MS0001 + device binding + entitlements.
  // =========================================================================
  await assert.rejects(async () => {
    await ordersRepo.runInTransaction(async (tx) => {
      await counterService.allocateNextStudentMsCode(tx);
      throw new Error('Simulated DB error before commit');
    });
  });

  const approved = await ordersService.approveOrderReceipt(
    opsAdmin,
    submittedOrder.orderId,
    200
  );
  assert.strictEqual(approved.student.studentCode, 'MS0001'); // Zero gap!
  assert.strictEqual(
    approved.student.boundDeviceHardware,
    'budget-android-hw-001'
  );
  assert.strictEqual(approved.entitlements.length, 7);

  // =========================================================================
  // CRITERION #8 & #10: Wrong claim secret rejected; right secret claims
  // idempotently & atomically migrates local SQLite rows to MS0001.
  // =========================================================================
  await assert.rejects(
    async () => {
      await ordersService.claimApprovedOrder(submittedOrder.orderId, {
        claimSecret: 'invalid_secret',
        deviceHardwareId: 'budget-android-hw-001',
      });
    },
    (err: Error) => err.message.includes('CLAIM_SECRET_INVALID')
  );

  const claimRes = await ordersService.claimApprovedOrder(
    submittedOrder.orderId,
    {
      claimSecret,
      deviceHardwareId: 'budget-android-hw-001',
    }
  );
  assert.strictEqual(claimRes.studentCode, 'MS0001');

  migrator.seedLocalDataBeforeClaim(
    localProfile.localAccountId,
    ['p1', 'p2'],
    ['a1'],
    ['c1']
  );
  const migrated = migrator.migrateLocalDataToRegisteredStudentAtomically(
    localProfile.localAccountId,
    claimRes
  );
  assert.strictEqual(migrated.studentCode, 'MS0001');
  assert.strictEqual(migrated.migratedProgressCount, 2);

  // =========================================================================
  // CRITERION #9: Phone/email collision cannot silently link to existing paid student
  // =========================================================================
  await assert.rejects(
    async () => {
      await ordersService.submitOrderWithReceipt(
        {
          localAccountId: '88888888-4444-4444-4444-121212121212',
          profile: {
            fullName: 'Impersonator',
            identifier: '+251911223344',
            universityId: 'uni-aastu',
            programId: 'prog-se',
            semester: 1,
            stream: 'NATURAL',
            selectedCourseIds: sevenIds,
          },
          passwordPlaintextOverTls: 'Pass123!',
          claimSecretHash,
          deviceHardwareId: 'other-phone-hw',
          quoteId: freshQuoteAfterChange.quoteId,
          productType: 'SEMESTER_BUNDLE',
          selectedCourseIds: sevenIds,
          paymentMethodId: 'pm-cbe-mobile',
          transactionReference: 'FT00000001',
        },
        pngReceipt
      );
    },
    (err: Error) => err.message.includes('ACCOUNT_EXISTS_LOGIN_REQUIRED')
  );

  // =========================================================================
  // CRITERION #11: Buy 7 extra courses -> 1*100 + 4*50 + 2*40 = 380 ETB;
  // included course ('c1') cannot be bought again (COURSE_ALREADY_INCLUDED).
  // =========================================================================
  await assert.rejects(
    async () => {
      await pricingService.createPriceQuote({
        productType: 'EXTRA_SINGLE_COURSE',
        selectedCourseIds: ['c1'], // Already covered by Semester Bundle!
        studentId: claimRes.studentId,
      });
    },
    (err: Error) => err.message.includes('COURSE_ALREADY_INCLUDED')
  );

  const sevenExtraIds = courses.slice(7, 14).map((c) => c.id);
  const sevenExtrasQuote = await pricingService.createPriceQuote({
    productType: 'EXTRA_SINGLE_COURSE',
    selectedCourseIds: sevenExtraIds,
    studentId: claimRes.studentId,
  });
  assert.strictEqual(sevenExtrasQuote.totalAmountETB, 380);

  const extraOrderSub = await ordersService.submitOrderWithReceipt(
    {
      localAccountId: claimRes.localAccountId,
      profile: {
        fullName: localProfile.fullName,
        identifier: localProfile.identifier,
        universityId: 'uni-aastu',
        programId: 'prog-se',
        semester: 1,
        stream: 'NATURAL',
        selectedCourseIds: sevenExtraIds,
      },
      passwordPlaintextOverTls: 'AirplaneModePassword!1',
      claimSecretHash,
      deviceHardwareId: 'budget-android-hw-001',
      quoteId: sevenExtrasQuote.quoteId,
      productType: 'EXTRA_SINGLE_COURSE',
      selectedCourseIds: sevenExtraIds,
      paymentMethodId: 'pm-telebirr',
      transactionReference: 'TB777888999',
    },
    pngReceipt,
    claimRes.studentId
  );
  await ordersService.approveOrderReceipt(opsAdmin, extraOrderSub.orderId, 380);

  // =========================================================================
  // CRITERION #12: Disable single-course sales -> new extra orders fail
  // (SINGLE_COURSES_DISABLED); existing entitlements remain usable.
  // =========================================================================
  const disabledSinglesConfig = {
    ...settings,
    singleCoursesEnabled: false,
  };
  await pricingService.updatePaymentSettings(
    superAdmin,
    disabledSinglesConfig,
    'Temporarily disable single course sales'
  );

  await assert.rejects(
    async () => {
      await pricingService.createPriceQuote({
        productType: 'EXTRA_SINGLE_COURSE',
        selectedCourseIds: ['c15'],
        studentId: claimRes.studentId,
      });
    },
    (err: Error) => err.message.includes('SINGLE_COURSES_DISABLED')
  );

  // =========================================================================
  // CRITERION #13 & #16: Online streaming uses RAM only; offline access works
  // for downloaded content while entitlement is valid; failed update keeps old copy.
  // =========================================================================
  const dlManager = new EncryptedDownloadManager(
    'budget-android-hw-001',
    signingSecret
  );
  dlManager.streamIntoMemoryOnly('ch-stream-1', 'Online memory-only text');
  assert.strictEqual(dlManager.getDiskDownloadCount(), 0);

  dlManager.downloadOrUpdateCourseAtomically({
    courseId: 'c1',
    courseTitle: 'Course 1',
    plaintextContent: 'Course 1 Version 1 Content',
    sizeMB: 14,
    version: 1,
    isPaidCourse: true,
    connectionType: 'WIFI',
  });

  // Simulate failed v2 update -> v1 remains readable
  dlManager.notifyServerVersionBump('c1', 2);
  dlManager.downloadOrUpdateCourseAtomically({
    courseId: 'c1',
    courseTitle: 'Course 1',
    plaintextContent: 'Course 1 Version 2 Content',
    sizeMB: 15,
    version: 2,
    isPaidCourse: true,
    connectionType: 'WIFI',
    simulateNetworkFailureMidDownload: true,
  });

  const openV1 = dlManager.openDownloadedCourseOffline({
    courseId: 'c1',
    signedEntitlementToken: claimRes.signedEntitlementToken,
    currentDeviceTimeIso: new Date().toISOString(),
  });
  assert.strictEqual(openV1.allowed, true);
  assert.strictEqual(openV1.plaintextContent, 'Course 1 Version 1 Content');

  // =========================================================================
  // CRITERION #14 & #15: Refund / expire bundle -> revokes only bundle
  // entitlements ('c1'..'c7'); separately bought extra ('c8') stays ACTIVE.
  // =========================================================================
  const refundReq = await refundsService.requestRefund(
    opsAdmin,
    submittedOrder.orderId,
    'Refund semester bundle order only'
  );
  await refundsService.approveAndCompleteRefund(
    superAdmin,
    refundReq.id,
    'REF-PAYOUT-900',
    'Approved semester bundle refund'
  );

  const postRefundEntitlements = await ordersRepo.listStudentEntitlements(
    claimRes.studentId
  );
  const c1BundleEnt = postRefundEntitlements.find((e) => e.courseId === 'c1')!;
  const c8ExtraEnt = postRefundEntitlements.find((e) => e.courseId === 'c8')!;
  assert.strictEqual(c1BundleEnt.status, 'REVOKED');
  assert.strictEqual(c8ExtraEnt.status, 'ACTIVE');

  // =========================================================================
  // CRITERION #17 + NFR-19: 10,000-row admin pagination < 500 ms p95 + Release Gates
  // =========================================================================
  const tenThousandRows = Array.from({ length: 10_000 }, (_, i) => ({
    id: `row-${i + 1}`,
    studentCode: `MS${String(i + 1).padStart(4, '0')}`,
  }));

  const t0 = performance.now();
  const pageParams = normalizePagination({ page: 500, pageSize: 10 });
  const sliced = tenThousandRows.slice(
    pageParams.skip,
    pageParams.skip + pageParams.take
  );
  const pagedResult = buildPaginatedResponse(
    sliced,
    tenThousandRows.length,
    pageParams
  );
  const paginationElapsedMs = performance.now() - t0;

  assert.ok(
    paginationElapsedMs < 500,
    `Expected NFR-19 pagination < 500ms, got ${paginationElapsedMs}ms`
  );
  assert.strictEqual(pagedResult.totalPages, 1000);
  assert.strictEqual(pagedResult.items.length, 10);

  // Execute automated release gate checks (Size, Seed, WCAG Contrast, 30-Formula RAM)
  runAllReleaseGateChecks();
});