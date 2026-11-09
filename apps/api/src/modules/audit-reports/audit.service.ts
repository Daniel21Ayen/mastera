import { Injectable } from '@nestjs/common';
import { AdminScopeAssignmentDto } from '@mastera/contracts';

export interface AuditEntryInput {
  actorId: string | null;
  actorRole: string;
  actorScope?: AdminScopeAssignmentDto[] | undefined;
  action: string;
  resourceType: string;
  resourceId?: string | null | undefined;
  allowed?: boolean | undefined;
  reason?: string | null | undefined;
  previousValue?: Record<string, unknown> | null | undefined;
  newValue?: Record<string, unknown> | null | undefined;
  ipAddress?: string | null | undefined;
}

export interface AuditPersistencePort {
  writeAuditRow(entry: Required<AuditEntryInput>): Promise<void>;
}

@Injectable()
export class AuditService {
  constructor(private readonly persistence: AuditPersistencePort) {}

  async record(input: AuditEntryInput): Promise<void> {
    await this.persistence.writeAuditRow({
      actorId: input.actorId,
      actorRole: input.actorRole,
      actorScope: input.actorScope ?? [],
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      allowed: input.allowed ?? true,
      reason: input.reason ?? null,
      previousValue: input.previousValue ?? null,
      newValue: input.newValue ?? null,
      ipAddress: input.ipAddress ?? null,
    });
  }

  /**
   * Enforces Section 4.3: Manual grants, device releases, refunds, and
   * commercial setting changes MUST supply a non-empty reason and be audited.
   */
  async recordReasonRequiredMutation(
    input: AuditEntryInput & { reason: string }
  ): Promise<void> {
    const trimmedReason = input.reason.trim();
    if (trimmedReason.length < 3) {
      throw new Error(
        `Audit reason is mandatory for action ${input.action} on ${input.resourceType}.`
      );
    }
    await this.record({
      ...input,
      reason: trimmedReason,
      allowed: true,
    });
  }
}