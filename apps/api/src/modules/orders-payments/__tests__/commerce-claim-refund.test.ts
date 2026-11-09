import test from 'node:test';
import assert from 'node:assert';
import {
  CatalogCourseDto,
  EntitlementRecordDto,
  PaymentSettingsDto,
  PriceQuoteDto,
  RefundRecordDto,
} from '@mastera/contracts';
import {
  hashClaimSecret,
  verifyOfflineEntitlementToken,
} from '@mastera/domain';
import { AuditService } from '../../audit-reports/audit.service';
import {
  CounterService,
  CounterTransactionExecutor,
} from '../../counter/counter.service';
import {
  AuthenticatedAdminContext,
  ScopeAuthorizationService,
} from '../../permissions/scope.service';
import {
  CommercePricingPort,
  CommercePricingService,
  createDefaultPaymentSettings,
} from '../../commerce-pricing/commerce-pricing.service';
import {
  OrdersPaymentsService,
  OrdersRepositoryPort,
  StoredOrderEntity,
  StoredStudentEntity,
} from '../orders-payments.service';
import {
  RefundRepositoryPort,
  RefundsService,
} from '../../refunds/refunds.service';

test('Section 16.2 Acceptance #2-#15: Quotes, First-Bundle Order, Atomic MS0001 Approval, Claim, Takeover Guard, and Order-Scoped Refund', async () => {
  let activeSettings: PaymentSettingsDto = createDefaultPaymentSettings();
  // Configure Semester Bundle min=3, max=5 for concise test selection
  activeSettings.bundles.SEMESTER_BUNDLE.minCourses = 3;
  activeSettings.bundles.SEMESTER_BUNDLE.maxCourses = 5;

  const courses: CatalogCourseDto[] = [1, 2, 3, 4].map((n) => ({
    id: `c${n}`,
    code: `CRS10${n}`,
    title: `Course ${n}`,
    universityId: 'uni-aastu',
    programId: 'prog-se',
    semester: 1,
    stream: 'NATURAL',
    accent: 'blue',
    icon: 'book',
    freeAccess: false,
    freeTrialCount: 1,
    priceETB: 60,
    contentVersion: 1,
    isActive: true,
  }));

  const quotes = new Map<string, PriceQuoteDto>();
  const orders = new Map<string, StoredOrderEntity>();
  const students = new Map<string, StoredStudentEntity>();
  const entitlements = new Map<string, EntitlementRecordDto>();
  const refunds = new Map<string, RefundRecordDto>();
  const counters = new Map<string, number>();

  const pricingPort: CommercePricingPort = {
    getActiveSettings: async () => activeSettings,
    saveSettings: async (next) => {
      activeSettings = next;
      return activeSettings;
    },
    findCoursesByIds: async (ids) =>
      courses.filter((c) => ids.includes(c.id)),
    getActiveStudentEntitlements: async (studentId) =>
      Array.from(entitlements.values()).filter(
        (e) => e.status === 'ACTIVE' && orders.get(e.orderId)?.studentId === studentId
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
      return work(tx);
    },
    findQuoteById: async (id) => quotes.get(id) ?? null,
    getMaxReceiptSizeBytes: async () => activeSettings.maxReceiptSizeBytes,
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
      const record: StoredOrderEntity = { id, ...data };
      orders.set(id, record);
      return record;
    },
    updateOrder: async (id, patch) => {
      const existing = orders.get(id)!;
      const updated = { ...existing, ...patch };
      orders.set(id, updated);
      return updated;
    },
    createStudentInTx: async (_tx, data) => {
      const id = `stu-${students.size + 1}`;
      const record: StoredStudentEntity = { id, ...data };
      students.set(id, record);
      return record;
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
      const updated: RefundRecordDto = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      refunds.set(id, updated);
      return updated;
    },
    revokeEntitlementsForOrderOnly: async (orderId) => {
      const revoked: EntitlementRecordDto[] = [];
      for (const [id, ent] of entitlements.entries()) {
        if (ent.orderId === orderId) {
          const updated: EntitlementRecordDto = { ...ent, status: 'REVOKED' };
          entitlements.set(id, updated);
          revoked.push(updated);
        }
      }
      return revoked;
    },
  };

  const auditService = new AuditService({ writeAuditRow: async () => {} });
  const scopeService = new ScopeAuthorizationService(auditService);
  const counterService = new CounterService();
  const signingSecret = 'super_secure_entitlement_signing_secret_32_chars_min';

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

  const opsAdmin: AuthenticatedAdminContext = {
    adminId: 'ops-1',
    adminRole: 'OPERATIONS_ADMIN',
    isActive: true,
    canReviewAndPublish: false,
    scopes: [],
  };
  const superAdmin: AuthenticatedAdminContext = {
    adminId: 'super-1',
    adminRole: 'SUPER_ADMIN',
    isActive: true,
    canReviewAndPublish: true,
    scopes: [],
  };

  // 1. Acceptance #2: Local-only student attempting single-course quote is rejected
  await assert.rejects(
    async () => {
      await pricingService.createPriceQuote({
        productType: 'EXTRA_SINGLE_COURSE',
        selectedCourseIds: ['c1'],
      });
    },
    (err: Error) => err.message.includes('SINGLE_COURSE_BUNDLE_REQUIRED')
  );

  // 2. Acceptance #3: Bundle below minCourses (2 < 3) is rejected
  await assert.rejects(
    async () => {
      await pricingService.createPriceQuote({
        productType: 'SEMESTER_BUNDLE',
        selectedCourseIds: ['c1', 'c2'],
      });
    },
    (err: Error) => err.message.includes('BUNDLE_SIZE_INVALID')
  );

  // 3. Valid Semester Bundle quote (3 courses = 200 ETB fixed default)
  const bundleQuote = await pricingService.createPriceQuote({
    productType: 'SEMESTER_BUNDLE',
    selectedCourseIds: ['c1', 'c2', 'c3'],
  });
  assert.strictEqual(bundleQuote.totalAmountETB, 200);

  // 4. Acceptance #5: Submit first bundle order with valid PNG receipt & claimSecretHash
  const validPngReceipt = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01, 0x02,
  ]);
  const rawClaimSecret = 'claim_secret_32_bytes_random_url_safe_token_001';
  const claimSecretHash = hashClaimSecret(rawClaimSecret);

  const orderSubmission = await ordersService.submitOrderWithReceipt(
    {
      localAccountId: '11111111-2222-3333-4444-555555555555',
      profile: {
        fullName: 'Abebe Kebede',
        identifier: '+251911223344',
        universityId: 'uni-aastu',
        programId: 'prog-se',
        semester: 1,
        stream: 'NATURAL',
        selectedCourseIds: ['c1', 'c2', 'c3'],
      },
      passwordPlaintextOverTls: 'StrongStudentPass!2026',
      claimSecretHash,
      deviceHardwareId: 'android-device-hw-001',
      quoteId: bundleQuote.quoteId,
      productType: 'SEMESTER_BUNDLE',
      selectedCourseIds: ['c1', 'c2', 'c3'],
      paymentMethodId: 'pm-cbe-mobile',
      transactionReference: 'FT2426163930',
    },
    validPngReceipt
  );

  assert.strictEqual(orderSubmission.status, 'PENDING');
  // Student does NOT exist on server while pending (REG-04)
  assert.strictEqual(students.size, 0);

  // 5. Acceptance #6: Operations Admin approves receipt -> creates Student + MS0001 + entitlements in 1 tx
  const approvalOutcome = await ordersService.approveOrderReceipt(
    opsAdmin,
    orderSubmission.orderId,
    200
  );
  assert.strictEqual(approvalOutcome.student.studentCode, 'MS0001');
  assert.strictEqual(approvalOutcome.entitlements.length, 3);

  // 6. Acceptance #8: Claim with wrong secret fails; claim with right secret is idempotent
  await assert.rejects(
    async () => {
      await ordersService.claimApprovedOrder(orderSubmission.orderId, {
        claimSecret: 'wrong_secret_value',
        deviceHardwareId: 'android-device-hw-001',
      });
    },
    (err: Error) => err.message.includes('CLAIM_SECRET_INVALID')
  );

  const claimResponse1 = await ordersService.claimApprovedOrder(
    orderSubmission.orderId,
    {
      claimSecret: rawClaimSecret,
      deviceHardwareId: 'android-device-hw-001',
    }
  );
  const claimResponse2 = await ordersService.claimApprovedOrder(
    orderSubmission.orderId,
    {
      claimSecret: rawClaimSecret,
      deviceHardwareId: 'android-device-hw-001',
    }
  );
  assert.strictEqual(claimResponse1.studentCode, 'MS0001');
  assert.strictEqual(claimResponse2.studentCode, 'MS0001');

  // Verify offline signed entitlement token for course 'c1'
  const offlineVerify = verifyOfflineEntitlementToken(
    claimResponse1.signedEntitlementToken,
    signingSecret,
    new Date().toISOString(),
    'android-device-hw-001',
    'c1'
  );
  assert.strictEqual(offlineVerify.valid, true);

  // 7. Acceptance #9: Takeover protection blocks unauthenticated order using Abebe's phone number
  await assert.rejects(
    async () => {
      await ordersService.submitOrderWithReceipt(
        {
          localAccountId: '99999999-8888-7777-6666-555555555555',
          profile: {
            fullName: 'Another Person',
            identifier: '+251911223344', // Collision with paid student MS0001
            universityId: 'uni-aastu',
            programId: 'prog-se',
            semester: 1,
            stream: 'NATURAL',
            selectedCourseIds: ['c1', 'c2', 'c3'],
          },
          passwordPlaintextOverTls: 'OtherPass!123',
          claimSecretHash,
          deviceHardwareId: 'other-phone-hw',
          quoteId: bundleQuote.quoteId,
          productType: 'SEMESTER_BUNDLE',
          selectedCourseIds: ['c1', 'c2', 'c3'],
          paymentMethodId: 'pm-cbe-mobile',
          transactionReference: 'FT9999999999',
        },
        validPngReceipt
      );
    },
    (err: Error) => err.message.includes('ACCOUNT_EXISTS_LOGIN_REQUIRED')
  );

  // 8. Acceptance #11: Registered student with active bundle buys Extra #1 ('c4') -> 100 ETB tier
  const extraQuote = await pricingService.createPriceQuote({
    productType: 'EXTRA_SINGLE_COURSE',
    selectedCourseIds: ['c4'],
    studentId: claimResponse1.studentId,
  });
  assert.strictEqual(extraQuote.totalAmountETB, 100);

  const extraOrder = await ordersService.submitOrderWithReceipt(
    {
      localAccountId: claimResponse1.localAccountId,
      profile: {
        fullName: 'Abebe Kebede',
        identifier: '+251911223344',
        universityId: 'uni-aastu',
        programId: 'prog-se',
        semester: 1,
        stream: 'NATURAL',
        selectedCourseIds: ['c4'],
      },
      passwordPlaintextOverTls: 'StrongStudentPass!2026',
      claimSecretHash,
      deviceHardwareId: 'android-device-hw-001',
      quoteId: extraQuote.quoteId,
      productType: 'EXTRA_SINGLE_COURSE',
      selectedCourseIds: ['c4'],
      paymentMethodId: 'pm-telebirr',
      transactionReference: 'TB888777666',
    },
    validPngReceipt,
    claimResponse1.studentId
  );

  await ordersService.approveOrderReceipt(opsAdmin, extraOrder.orderId, 100);

  // 9. Acceptance #14 & #15 (PUR-09): Refund the Semester Bundle -> revokes c1..c3, but extra course 'c4' stays ACTIVE
  const refundReq = await refundsService.requestRefund(
    opsAdmin,
    orderSubmission.orderId,
    'Student requested bundle refund'
  );
  await refundsService.approveAndCompleteRefund(
    superAdmin,
    refundReq.id,
    'BANK-PAYOUT-REF-001',
    'Approved bundle refund payout'
  );

  const allStudentEntitlements = await ordersRepo.listStudentEntitlements(
    claimResponse1.studentId
  );
  const c1Ent = allStudentEntitlements.find((e) => e.courseId === 'c1')!;
  const c4Ent = allStudentEntitlements.find((e) => e.courseId === 'c4')!;
  assert.strictEqual(c1Ent.status, 'REVOKED');
  assert.strictEqual(c4Ent.status, 'ACTIVE');
});