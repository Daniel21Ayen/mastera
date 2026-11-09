import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { hashClaimSecret } from '@mastera/domain';
import { OrdersPaymentsService } from '../../src/modules/orders-payments/orders-payments.service';
import { CounterService } from '../../src/modules/counter/counter.service';
import { ScopeAuthorizationService, AuthenticatedAdminContext } from '../../src/modules/permissions/scope.service';
import { AuditService } from '../../src/modules/audit-reports/audit.service';
import { SubmitOrderWithLocalDto, PriceQuoteDto } from '@mastera/contracts';

describe('Lifecycle E2E: Offline -> Bundle Order -> Approval -> Claim (SRS Section 5, 6, 16.2)', () => {
  it('executes the full lifecycle: local offline order -> admin receipt approval -> MS assignment -> claim', async () => {
    // In-memory backing state for e2e run
    let storedOrder: any = null;
    let storedStudent: any = null;
    let currentMsCounter = 0;

    const mockRepo: any = {
      runInTransaction: async (work: any) => {
        const executor = {
          $queryRaw: async () => {
            currentMsCounter += 1;
            return [{ value: currentMsCounter }];
          },
        };
        return work(executor);
      },
      findQuoteById: async () => null,
      getMaxReceiptSizeBytes: async () => 307200,
      findOrderByLocalAccountId: async () => storedOrder,
      findOrderByTransactionRef: async () => null,
      findOrderById: async () => storedOrder,
      countPendingOrdersByIdentifier: async () => 0,
      findStudentByIdentifier: async () => storedStudent,
      findStudentById: async () => storedStudent,
      insertOrder: async (data: any) => {
        storedOrder = { id: 'order-e2e-1', ...data };
        return storedOrder;
      },
      updateOrder: async (orderId: string, patch: any) => {
        storedOrder = { ...storedOrder, ...patch };
        return storedOrder;
      },
      createStudentInTx: async (_tx: any, data: any) => {
        storedStudent = { id: 'student-e2e-1', ...data };
        return storedStudent;
      },
      insertEntitlementsInTx: async (_tx: any, ents: any[]) => {
        return ents.map((e, idx) => ({ id: `ent-${idx}`, ...e }));
      },
      listStudentEntitlements: async () => [
        {
          id: 'ent-1',
          orderId: 'order-e2e-1',
          courseId: 'course-math-1',
          productType: 'SEMESTER_BUNDLE',
          startsAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 120 * 86400000).toISOString(),
          status: 'ACTIVE',
        },
      ],
    };

    const auditService = new AuditService({ writeAuditRow: async () => {} });
    const scopeAuth = new ScopeAuthorizationService(auditService);
    const counterService = new CounterService();
    const signingSecret = 'mastera_test_entitlement_signing_secret_32_chars';

    const ordersService = new OrdersPaymentsService(
      mockRepo,
      counterService,
      scopeAuth,
      auditService,
      signingSecret
    );

    const clientSecret = 'sec_e2e_student_local_claim_secret_123';
    const clientSecretHash = hashClaimSecret(clientSecret);

    const quoteSnapshot: PriceQuoteDto = {
      quoteId: 'quote-1',
      productType: 'SEMESTER_BUNDLE',
      uniqueCourseCount: 5,
      perCourseBreakdown: [],
      baseAmountETB: 300,
      discountAmountETB: 30,
      totalAmountETB: 270,
      durationDays: 120,
      settingsVersion: 1,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };

    mockRepo.findQuoteById = async () => quoteSnapshot;

    const submitDto: SubmitOrderWithLocalDto = {
      localAccountId: 'loc-acc-uuid-1',
      claimSecretHash: clientSecretHash,
      profile: {
        fullName: 'Abebe Bikila',
        identifier: '0911223344',
        universityId: 'uni-aau',
        programId: 'prog-cs',
        semester: 1,
        stream: 'NATURAL',
        selectedCourseIds: ['course-math-1', 'course-phys-1'],
      },
      passwordPlaintextOverTls: 'StudentPass123!',
      deviceHardwareId: 'device-hw-hash-abc',
      quoteId: 'quote-1',
      productType: 'SEMESTER_BUNDLE',
      selectedCourseIds: ['course-math-1', 'course-phys-1'],
      paymentMethodId: 'pm-telebirr',
      transactionReference: 'TR-TELEBIRR-8899',
    };

    // Step 1: Submit order with valid JPEG receipt buffer
    const receiptBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const submitResult = await ordersService.submitOrderWithReceipt(submitDto, receiptBuffer);

    assert.equal(submitResult.status, 'PENDING');
    assert.equal(submitResult.claimReady, false);

    // Step 2: Operations Admin reviews and approves the order receipt
    const opsAdmin: AuthenticatedAdminContext = {
      adminId: 'ops-admin-1',
      adminRole: 'OPERATIONS_ADMIN',
      isActive: true,
      scopes: [],
    };

    const approvalResult = await ordersService.approveOrderReceipt(
      opsAdmin,
      submitResult.orderId,
      270 // Verified amount matches snapshot
    );

    assert.equal(approvalResult.order.status, 'APPROVED');
    assert.equal(approvalResult.student.studentCode, 'MS0001');

    // Step 3: Student claims the approved order using their local claimSecret
    const claimResult = await ordersService.claimApprovedOrder(submitResult.orderId, {
      claimSecret: clientSecret,
      deviceHardwareId: 'device-hw-hash-abc',
    });

    assert.equal(claimResult.studentCode, 'MS0001');
    assert.ok(claimResult.accessToken.length > 0);
    assert.ok(claimResult.signedEntitlementToken.length > 0);
    assert.equal(claimResult.entitlements.length, 1);
  });
});
