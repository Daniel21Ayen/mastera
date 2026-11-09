import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  ClaimOrderDto,
  ClaimOrderResponseDto,
  EntitlementRecordDto,
  mastera_ERROR_CODES,
  OrderProductType,
  OrderResultDto,
  OrderStatus,
  PriceQuoteDto,
  SignedEntitlementTokenPayloadDto,
  StudentProfileInputDto,
  SubmitOrderWithLocalDto,
} from '@mastera/contracts';
import { verifyClaimSecret } from '@mastera/domain';
import { AuditService } from '../audit-reports/audit.service';
import {
  CounterService,
  CounterTransactionExecutor,
} from '../counter/counter.service';
import {
  AuthenticatedAdminContext,
  ScopeAuthorizationService,
} from '../permissions/scope.service';

export interface StoredStudentEntity {
  id: string;
  studentCode: string;
  localAccountId: string;
  fullName: string;
  identifier: string;
  passwordHash: string;
  universityId: string;
  programId: string;
  semester: 1 | 2;
  stream: 'NATURAL' | 'SOCIAL';
  boundDeviceHardware: string | null;
  deviceBoundAt: string | null;
}

export interface StoredOrderEntity {
  id: string;
  studentId: string | null;
  localAccountId: string;
  claimSecretHash: string;
  pendingProfile: StudentProfileInputDto;
  pendingPasswordHash: string;
  deviceHardwareId: string;
  quoteSnapshot: PriceQuoteDto;
  configVersion: number;
  orderType: OrderProductType;
  expectedAmountETB: number;
  durationDays: number;
  paymentMethodId: string;
  transactionReference: string;
  receiptStorageKey: string;
  status: OrderStatus;
  rejectionReason: string | null;
  reviewedByAdminId: string | null;
  approvedAt: string | null;
  claimedAt: string | null;
  submittedAt: string;
}

export interface OrdersRepositoryPort {
  runInTransaction<T>(
    work: (tx: CounterTransactionExecutor) => Promise<T>
  ): Promise<T>;
  findQuoteById(quoteId: string): Promise<PriceQuoteDto | null>;
  getMaxReceiptSizeBytes(): Promise<number>;
  findOrderByLocalAccountId(
    localAccountId: string
  ): Promise<StoredOrderEntity | null>;
  findOrderByTransactionRef(
    reference: string
  ): Promise<StoredOrderEntity | null>;
  findOrderById(orderId: string): Promise<StoredOrderEntity | null>;
  countPendingOrdersByIdentifier(identifier: string): Promise<number>;
  listOrders?(status?: string): Promise<StoredOrderEntity[]>;
  findStudentByIdentifier(
    identifier: string
  ): Promise<StoredStudentEntity | null>;
  findStudentById(studentId: string): Promise<StoredStudentEntity | null>;
  insertOrder(
    data: Omit<StoredOrderEntity, 'id'>
  ): Promise<StoredOrderEntity>;
  updateOrder(
    orderId: string,
    patch: Partial<StoredOrderEntity>
  ): Promise<StoredOrderEntity>;
  createStudentInTx(
    tx: CounterTransactionExecutor,
    data: Omit<StoredStudentEntity, 'id'>
  ): Promise<StoredStudentEntity>;
  insertEntitlementsInTx(
    tx: CounterTransactionExecutor,
    entitlements: Omit<EntitlementRecordDto, 'id'>[]
  ): Promise<EntitlementRecordDto[]>;
  listStudentEntitlements(studentId: string): Promise<EntitlementRecordDto[]>;
}

/**
 * Validates receipt image magic bytes (JPEG, PNG, WebP) and configured size limit
 * (Section 3.2, Section 5.3, Section 14).
 */
export function validateReceiptImageBuffer(
  buffer: Buffer,
  maxBytes: number
): { valid: boolean; detectedMime?: 'image/jpeg' | 'image/png' | 'image/webp'; reason: string } {
  if (buffer.byteLength === 0 || buffer.byteLength > maxBytes) {
    return {
      valid: false,
      reason: `Receipt image size (${buffer.byteLength} bytes) exceeds limit (${maxBytes} bytes) or is empty.`,
    };
  }

  // JPEG: FF D8 FF
  if (
    buffer.byteLength >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { valid: true, detectedMime: 'image/jpeg', reason: 'Valid JPEG' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.byteLength >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { valid: true, detectedMime: 'image/png', reason: 'Valid PNG' };
  }

  // WebP: "RIFF" (0..3) and "WEBP" (8..11)
  if (
    buffer.byteLength >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { valid: true, detectedMime: 'image/webp', reason: 'Valid WebP' };
  }

  return {
    valid: false,
    reason: 'Unsupported receipt format. Only JPEG, PNG, or WebP images are accepted.',
  };
}

/**
 * Hashes student password server-side using PBKDF2-SHA512 with random salt
 * (FR-A07, Section 14: never store or log plaintext).
 */
export function hashStudentPasswordServerSide(plaintext: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto
    .pbkdf2Sync(plaintext, salt, 100_000, 64, 'sha512')
    .toString('hex');
  return `pbkdf2_sha512$100000$${salt}$${derived}`;
}

@Injectable()
export class OrdersPaymentsService {
  constructor(
    private readonly repo: OrdersRepositoryPort,
    private readonly counterService: CounterService,
    private readonly scopeAuth: ScopeAuthorizationService,
    private readonly auditService: AuditService,
    private readonly entitlementSigningSecret: string
  ) {}

  /**
   * Submits a student order with receipt image (Section 5.3, 5.5, 6.5, 6.6).
   * - Enforces idempotency on localAccountId for first-bundle orders (REG-10).
   * - Rejects single-course orders from unregistered students (SINGLE_COURSE_BUNDLE_REQUIRED).
   * - Blocks unauthenticated phone/email collision with existing paid students (ACCOUNT_EXISTS_LOGIN_REQUIRED).
   */
  async listOrders(status?: string): Promise<any[]> {
    if (this.repo.listOrders) {
      return this.repo.listOrders(status);
    }
    return [];
  }

  async getOrderById(orderId: string): Promise<any> {
    return this.repo.findOrderById(orderId);
  }

  async submitOrderWithReceipt(
    dto: SubmitOrderWithLocalDto,
    receiptBuffer: Buffer,
    authenticatedStudentId?: string | null,
    nowMs: number = Date.now()
  ): Promise<OrderResultDto> {
    // 1. Idempotency check on localAccountId for first order (REG-10)
    if (!authenticatedStudentId) {
      const existingByLocalId = await this.repo.findOrderByLocalAccountId(
        dto.localAccountId
      );
      if (existingByLocalId && existingByLocalId.status !== 'REJECTED') {
        return {
          orderId: existingByLocalId.id,
          status: existingByLocalId.status,
          amountSnapshotETB: existingByLocalId.expectedAmountETB,
          rejectionReason: existingByLocalId.rejectionReason,
          claimReady: existingByLocalId.status === 'APPROVED',
          submittedAt: existingByLocalId.submittedAt,
        };
      }
    }

    // 2. First purchase from local/unregistered student MUST be a bundle (PUR-01, PUR-03, Section 5.3)
    if (!authenticatedStudentId && dto.productType === 'EXTRA_SINGLE_COURSE') {
      throw new Error(
        `${mastera_ERROR_CODES.SINGLE_COURSE_BUNDLE_REQUIRED}: First purchase must be a valid batch, semester, or full-course bundle.`
      );
    }

    // 3. Existing paid student collision / takeover protection (Section 3.2, Section 5.5, FR-A09)
    const normalizedIdentifier = dto.profile.identifier.trim().toLowerCase();
    const existingStudent = await this.repo.findStudentByIdentifier(
      normalizedIdentifier
    );

    if (
      existingStudent &&
      existingStudent.id !== authenticatedStudentId
    ) {
      throw new Error(
        `${mastera_ERROR_CODES.ACCOUNT_EXISTS_LOGIN_REQUIRED}: An account with this phone or email already exists. Please sign in or verify via OTP.`
      );
    }

    // 4. Max 2 pending orders per phone/email identifier (Section 5.3)
    const pendingCount = await this.repo.countPendingOrdersByIdentifier(
      normalizedIdentifier
    );
    if (pendingCount >= 2) {
      throw new Error(
        `${mastera_ERROR_CODES.RECEIPT_INVALID}: Maximum of 2 pending orders allowed per phone number or email.`
      );
    }

    // 5. Duplicate transaction reference check
    const cleanRef = dto.transactionReference.trim().toUpperCase();
    const duplicateRef = await this.repo.findOrderByTransactionRef(cleanRef);
    if (duplicateRef) {
      throw new Error(
        `${mastera_ERROR_CODES.TRANSACTION_REFERENCE_DUPLICATE}: Transaction reference ${cleanRef} has already been submitted.`
      );
    }

    // 6. Validate receipt image content & size (Section 5.3)
    const maxReceiptBytes = await this.repo.getMaxReceiptSizeBytes();
    const imageCheck = validateReceiptImageBuffer(
      receiptBuffer,
      maxReceiptBytes
    );
    if (!imageCheck.valid) {
      throw new Error(
        `${mastera_ERROR_CODES.RECEIPT_INVALID}: ${imageCheck.reason}`
      );
    }

    // 7. Validate server quote snapshot & expiry (Section 6.6)
    const quote = await this.repo.findQuoteById(dto.quoteId);
    if (!quote) {
      throw new Error(
        `${mastera_ERROR_CODES.PRICE_QUOTE_EXPIRED}: Price quote not found.`
      );
    }
    if (new Date(quote.expiresAt).getTime() < nowMs) {
      throw new Error(
        `${mastera_ERROR_CODES.PRICE_QUOTE_EXPIRED}: Price quote has expired. Please request a fresh quote.`
      );
    }

    if (!/^[a-f0-9]{64}$/i.test(dto.claimSecretHash)) {
      throw new Error(
        `${mastera_ERROR_CODES.CLAIM_SECRET_INVALID}: claimSecretHash must be a valid 64-character SHA-256 hex digest.`
      );
    }

    const passwordHash = hashStudentPasswordServerSide(
      dto.passwordPlaintextOverTls
    );
    const submittedAt = new Date(nowMs).toISOString();

    const createdOrder = await this.repo.insertOrder({
      studentId: authenticatedStudentId ?? null,
      localAccountId: dto.localAccountId,
      claimSecretHash: dto.claimSecretHash.toLowerCase(),
      pendingProfile: {
        ...dto.profile,
        identifier: normalizedIdentifier,
      },
      pendingPasswordHash: passwordHash,
      deviceHardwareId: dto.deviceHardwareId,
      quoteSnapshot: quote,
      configVersion: quote.settingsVersion,
      orderType: dto.productType,
      expectedAmountETB: quote.totalAmountETB,
      durationDays: quote.durationDays,
      paymentMethodId: dto.paymentMethodId,
      transactionReference: cleanRef,
      receiptStorageKey: `receipts/${dto.localAccountId}/${Date.now()}.img`,
      status: 'PENDING',
      rejectionReason: null,
      reviewedByAdminId: null,
      approvedAt: null,
      claimedAt: null,
      submittedAt,
    });

    return {
      orderId: createdOrder.id,
      status: createdOrder.status,
      amountSnapshotETB: createdOrder.expectedAmountETB,
      rejectionReason: null,
      claimReady: false,
      submittedAt: createdOrder.submittedAt,
    };
  }

  /**
   * Operations Admin or Super Admin approves a pending receipt (Section 5.4, 7.1, 10.3, ADM-04).
   * In ONE database transaction:
   * 1. Creates the Student & allocates the next gapless MS number (if first bundle)
   * 2. Binds the student's device (REG-13)
   * 3. Marks the order APPROVED
   * 4. Creates Entitlement records with starts_at = approvalTimestamp and expires_at = starts_at + durationDays (D38)
   */
  async approveOrderReceipt(
    actor: AuthenticatedAdminContext,
    orderId: string,
    verifiedReceiptAmountETB: number,
    nowMs: number = Date.now()
  ): Promise<{
    order: StoredOrderEntity;
    student: StoredStudentEntity;
    entitlements: EntitlementRecordDto[];
  }> {
    const decision = await this.scopeAuth.authorizeAdminAction(
      actor,
      'PAYMENTS_RECEIPTS_REVIEW'
    );
    if (!decision.allowed) {
      throw new Error(`${decision.errorCode}: ${decision.reason}`);
    }

    const order = await this.repo.findOrderById(orderId);
    if (!order) {
      throw new Error('Order not found.');
    }
    if (order.status !== 'PENDING') {
      throw new Error(`Order is already ${order.status}.`);
    }

    // Section 6.6 & 10.3: Admin cannot approve an underpriced or mismatched amount order
    if (verifiedReceiptAmountETB !== order.expectedAmountETB) {
      throw new Error(
        `${mastera_ERROR_CODES.RECEIPT_INVALID}: Verified receipt amount (${verifiedReceiptAmountETB} ETB) does not match expected snapshot amount (${order.expectedAmountETB} ETB).`
      );
    }

    // PUR-04: A single-course payment never creates a student
    if (!order.studentId && order.orderType === 'EXTRA_SINGLE_COURSE') {
      throw new Error(
        `${mastera_ERROR_CODES.SINGLE_COURSE_BUNDLE_REQUIRED}: Cannot create a student from a single-course order.`
      );
    }

    const approvalTimestampIso = new Date(nowMs).toISOString();
    const expiresAtIso = new Date(
      nowMs + order.durationDays * 24 * 60 * 60 * 1000
    ).toISOString();

    const result = await this.repo.runInTransaction(async (tx) => {
      let student: StoredStudentEntity | null = order.studentId
        ? await this.repo.findStudentById(order.studentId)
        : null;

      if (!student) {
        // Allocate gapless MS number inside the same transaction (D22, FR-G46, REG-08)
        const msCode = await this.counterService.allocateNextStudentMsCode(tx);

        student = await this.repo.createStudentInTx(tx, {
          studentCode: msCode,
          localAccountId: order.localAccountId,
          fullName: order.pendingProfile.fullName,
          identifier: order.pendingProfile.identifier,
          passwordHash: order.pendingPasswordHash,
          universityId: order.pendingProfile.universityId,
          programId: order.pendingProfile.programId,
          semester: order.pendingProfile.semester,
          stream: order.pendingProfile.stream,
          boundDeviceHardware: order.deviceHardwareId,
          deviceBoundAt: approvalTimestampIso,
        });
      }

      const coveredCourseIds = order.quoteSnapshot.perCourseBreakdown.map(
        (item) => item.courseId
      );

      const createdEntitlements = await this.repo.insertEntitlementsInTx(
        tx,
        coveredCourseIds.map((courseId) => ({
          orderId: order.id,
          courseId,
          productType: order.orderType,
          startsAt: approvalTimestampIso, // D38: starts at approval timestamp
          expiresAt: expiresAtIso,
          status: 'ACTIVE',
        }))
      );

      const updatedOrder = await this.repo.updateOrder(order.id, {
        studentId: student.id,
        status: 'APPROVED',
        reviewedByAdminId: actor.adminId,
        approvedAt: approvalTimestampIso,
      });

      return {
        order: updatedOrder,
        student,
        entitlements: createdEntitlements,
      };
    });

    await this.auditService.record({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'ORDER_RECEIPT_APPROVED',
      resourceType: 'ORDER',
      resourceId: order.id,
      newValue: {
        studentCode: result.student.studentCode,
        amountETB: order.expectedAmountETB,
        startsAt: approvalTimestampIso,
        expiresAt: expiresAtIso,
      },
    });

    return result;
  }

  /**
   * Operations Admin rejects a pending receipt (Section 5.4, 10.3: reason required).
   * Student remains local-only with no MS number allocated.
   */
  async rejectOrderReceipt(
    actor: AuthenticatedAdminContext,
    orderId: string,
    reason: string
  ): Promise<StoredOrderEntity> {
    const decision = await this.scopeAuth.authorizeAdminAction(
      actor,
      'PAYMENTS_RECEIPTS_REVIEW'
    );
    if (!decision.allowed) {
      throw new Error(`${decision.errorCode}: ${decision.reason}`);
    }

    const trimmedReason = reason.trim();
    if (trimmedReason.length < 3) {
      throw new Error('Rejection reason is mandatory (Section 5.4, 10.3).');
    }

    const order = await this.repo.findOrderById(orderId);
    if (!order || order.status !== 'PENDING') {
      throw new Error('Pending order not found.');
    }

    const rejected = await this.repo.updateOrder(orderId, {
      status: 'REJECTED',
      rejectionReason: trimmedReason,
      reviewedByAdminId: actor.adminId,
    });

    await this.auditService.recordReasonRequiredMutation({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'ORDER_RECEIPT_REJECTED',
      resourceType: 'ORDER',
      resourceId: orderId,
      reason: trimmedReason,
    });

    return rejected;
  }

  /**
   * Idempotent Claim Endpoint: POST /orders/:orderId/claim (Section 5.4, 5.6, D39).
   * Verifies SHA-256(claimSecret) === stored claimSecretHash in constant time,
   * returns the allocated MS studentCode, tokens, and offline entitlement token.
   */
  async claimApprovedOrder(
    orderId: string,
    claimDto: ClaimOrderDto,
    nowMs: number = Date.now()
  ): Promise<ClaimOrderResponseDto> {
    const order = await this.repo.findOrderById(orderId);
    // Section 5.6: Do not reveal whether an arbitrary order ID exists on invalid claims
    if (!order || order.status !== 'APPROVED' || !order.studentId) {
      throw new Error(
        `${mastera_ERROR_CODES.CLAIM_SECRET_INVALID}: Invalid or unapproved order claim.`
      );
    }

    const isSecretValid = verifyClaimSecret(
      claimDto.claimSecret,
      order.claimSecretHash
    );
    if (!isSecretValid) {
      await this.auditService.record({
        actorId: null,
        actorRole: 'STUDENT_UNCLAIMED',
        action: 'CLAIM_SECRET_VERIFICATION_FAILED',
        resourceType: 'ORDER',
        resourceId: orderId,
        allowed: false,
        reason: 'Invalid claimSecret presented to claim endpoint (Section 5.6).',
      });
      throw new Error(
        `${mastera_ERROR_CODES.CLAIM_SECRET_INVALID}: Invalid or unapproved order claim.`
      );
    }

    const student = await this.repo.findStudentById(order.studentId);
    if (!student) {
      throw new Error(
        `${mastera_ERROR_CODES.CLAIM_SECRET_INVALID}: Student record missing.`
      );
    }

    if (
      student.boundDeviceHardware &&
      student.boundDeviceHardware !== claimDto.deviceHardwareId
    ) {
      throw new Error(
        `${mastera_ERROR_CODES.DEVICE_MISMATCH_LOCKED}: Account is bound to another device.`
      );
    }

    const serverTimestamp = new Date(nowMs).toISOString();
    if (!order.claimedAt) {
      await this.repo.updateOrder(orderId, {
        claimedAt: serverTimestamp,
      });
    }

    const entitlements = await this.repo.listStudentEntitlements(student.id);
    const signedEntitlementToken = this.issueSignedOfflineEntitlementToken(
      student,
      entitlements,
      nowMs
    );

    return {
      studentId: student.id,
      studentCode: student.studentCode,
      localAccountId: student.localAccountId,
      accessToken: `jwt_access_${student.studentCode}_${nowMs}`,
      refreshToken: `jwt_refresh_${student.studentCode}_${nowMs}`,
      entitlements,
      signedEntitlementToken,
      serverTimestamp,
    };
  }

  /**
   * Issues a server-signed, device-bound, expiry-limited offline entitlement token
   * compatible with verifyOfflineEntitlementToken in @mastera/domain (Section 7.1).
   */
  issueSignedOfflineEntitlementToken(
    student: StoredStudentEntity,
    entitlements: EntitlementRecordDto[],
    nowMs: number = Date.now()
  ): string {
    const nowIso = new Date(nowMs).toISOString();
    const courseExpiries: Record<string, string> = {};

    for (const ent of entitlements) {
      if (ent.status === 'ACTIVE' && ent.expiresAt > nowIso) {
        const currentMax = courseExpiries[ent.courseId];
        if (!currentMax || ent.expiresAt > currentMax) {
          courseExpiries[ent.courseId] = ent.expiresAt;
        }
      }
    }

    const payload: SignedEntitlementTokenPayloadDto = {
      studentId: student.id,
      studentCode: student.studentCode,
      deviceHardwareId: student.boundDeviceHardware ?? '',
      issuedAtServerTime: nowIso,
      tokenExpiresAt: new Date(nowMs + 14 * 24 * 60 * 60 * 1000).toISOString(),
      courseExpiries,
    };

    const encodedPayload = Buffer.from(
      JSON.stringify(payload),
      'utf8'
    ).toString('base64');
    const signatureHex = crypto
      .createHmac('sha256', this.entitlementSigningSecret)
      .update(encodedPayload)
      .digest('hex');

    return `${encodedPayload}.${signatureHex}`;
  }
}