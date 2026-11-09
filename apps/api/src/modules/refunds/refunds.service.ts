import { Injectable } from '@nestjs/common';
import {
  EntitlementRecordDto,
  mastera_ERROR_CODES,
  RefundRecordDto,
} from '@mastera/contracts';
import { AuditService } from '../audit-reports/audit.service';
import {
  AuthenticatedAdminContext,
  ScopeAuthorizationService,
} from '../permissions/scope.service';

export interface RefundRepositoryPort {
  findOrderAmountAndStatus(
    orderId: string
  ): Promise<{ amountETB: number; status: string } | null>;
  createRefund(
    data: Omit<RefundRecordDto, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<RefundRecordDto>;
  findRefundById(refundId: string): Promise<RefundRecordDto | null>;
  updateRefund(
    refundId: string,
    patch: Partial<RefundRecordDto>
  ): Promise<RefundRecordDto>;
  revokeEntitlementsForOrderOnly(
    orderId: string,
    revokedByAdminId: string,
    reason: string
  ): Promise<EntitlementRecordDto[]>;
}

@Injectable()
export class RefundsService {
  constructor(
    private readonly repo: RefundRepositoryPort,
    private readonly scopeAuth: ScopeAuthorizationService,
    private readonly auditService: AuditService
  ) {}

  /**
   * Operations Admin or Super Admin requests a refund with a reason (Section 7.2).
   */
  async requestRefund(
    actor: AuthenticatedAdminContext,
    orderId: string,
    reason: string
  ): Promise<RefundRecordDto> {
    const decision = await this.scopeAuth.authorizeAdminAction(
      actor,
      'REFUND_REQUEST'
    );
    if (!decision.allowed) {
      throw new Error(`${decision.errorCode}: ${decision.reason}`);
    }

    const orderInfo = await this.repo.findOrderAmountAndStatus(orderId);
    if (!orderInfo || orderInfo.status !== 'APPROVED') {
      throw new Error('Refunds can only be requested for approved orders.');
    }

    const created = await this.repo.createRefund({
      orderId,
      amountETB: orderInfo.amountETB,
      status: 'REQUESTED',
      reason: reason.trim(),
      requestedByAdminId: actor.adminId,
      approvedByAdminId: null,
      payoutReference: null,
    });

    await this.auditService.recordReasonRequiredMutation({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'REFUND_REQUESTED',
      resourceType: 'REFUND',
      resourceId: created.id,
      reason,
      newValue: { ...created },
    });

    return created;
  }

  /**
   * Super Admin approves a requested refund, records manual payout reference,
   * and revokes ONLY entitlements tied to the refunded order (Section 7.2, PUR-09, FR-G64).
   */
  async approveAndCompleteRefund(
    actor: AuthenticatedAdminContext,
    refundId: string,
    payoutReference: string,
    reason: string
  ): Promise<{
    refund: RefundRecordDto;
    revokedEntitlements: EntitlementRecordDto[];
  }> {
    const decision = await this.scopeAuth.authorizeAdminAction(
      actor,
      'REFUND_APPROVE'
    );
    if (!decision.allowed) {
      throw new Error(
        `${mastera_ERROR_CODES.PERMISSION_DENIED}: Only Super Admin can approve refunds.`
      );
    }

    const existing = await this.repo.findRefundById(refundId);
    if (!existing || existing.status !== 'REQUESTED') {
      throw new Error('Refund in REQUESTED state not found.');
    }

    // Step 1: APPROVED -> PAID_OUT -> ENTITLEMENT_REVOKED
    const revokedEntitlements = await this.repo.revokeEntitlementsForOrderOnly(
      existing.orderId,
      actor.adminId,
      reason.trim()
    );

    const updated = await this.repo.updateRefund(refundId, {
      status: 'ENTITLEMENT_REVOKED',
      approvedByAdminId: actor.adminId,
      payoutReference: payoutReference.trim(),
    });

    await this.auditService.recordReasonRequiredMutation({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'REFUND_APPROVED_AND_ENTITLEMENTS_REVOKED',
      resourceType: 'REFUND',
      resourceId: refundId,
      reason,
      previousValue: { status: existing.status },
      newValue: {
        status: updated.status,
        payoutReference: updated.payoutReference,
        revokedEntitlementCount: revokedEntitlements.length,
      },
    });

    return { refund: updated, revokedEntitlements };
  }
}