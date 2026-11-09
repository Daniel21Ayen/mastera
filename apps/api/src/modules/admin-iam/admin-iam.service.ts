import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { AdminRole, mastera_ERROR_CODES } from '@mastera/contracts';
import { AuditService } from '../audit-reports/audit.service';
import { AuthenticatedAdminContext } from '../permissions/scope.service';

export const MAX_ADMIN_SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours (Section 4.3, 14)

export interface AdminAccountRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  adminRole: AdminRole;
  totpSecret: string | null;
  isActive: boolean;
}

export interface AdminRepositoryPort {
  findById(id: string): Promise<AdminAccountRecord | null>;
  countActiveSuperAdmins(): Promise<number>;
  updateAdminState(
    id: string,
    patch: Partial<Pick<AdminAccountRecord, 'adminRole' | 'isActive'>>
  ): Promise<AdminAccountRecord>;
  deleteAdmin(id: string): Promise<void>;
  listAdmins?(): Promise<AdminAccountRecord[]>;
}

/**
 * Verifies a 6-digit RFC 6238 TOTP code (30-second window, +-1 step drift).
 */
export function verifyTotpCode(
  secretHex: string,
  code: string,
  nowMs: number = Date.now()
): boolean {
  if (!/^\d{6}$/.test(code)) {
    return false;
  }
  const currentCounter = Math.floor(nowMs / 1000 / 30);
  for (const offset of [-1, 0, 1]) {
    const counter = currentCounter + offset;
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(counter), 0);

    const hmac = crypto
      .createHmac('sha1', Buffer.from(secretHex, 'hex'))
      .update(buffer)
      .digest();

    const lastByte = hmac[hmac.length - 1] ?? 0;
    const dynamicOffset = lastByte & 0x0f;
    const b0 = (hmac[dynamicOffset] ?? 0) & 0x7f;
    const b1 = (hmac[dynamicOffset + 1] ?? 0) & 0xff;
    const b2 = (hmac[dynamicOffset + 2] ?? 0) & 0xff;
    const b3 = (hmac[dynamicOffset + 3] ?? 0) & 0xff;

    const binary = (b0 << 24) | (b1 << 16) | (b2 << 8) | b3;
    const otp = String(binary % 1_000_000).padStart(6, '0');
    if (otp === code) {
      return true;
    }
  }
  return false;
}

@Injectable()
export class AdminIamService {
  constructor(
    private readonly repo: AdminRepositoryPort,
    private readonly auditService: AuditService
  ) {}

  async listAdmins(): Promise<AdminAccountRecord[]> {
    if (this.repo.listAdmins) {
      return this.repo.listAdmins();
    }
    return [];
  }

  /**
   * Section 4.3 & Section 14: TOTP 2FA is mandatory for SUPER_ADMIN and OPERATIONS_ADMIN.
   * Sessions expire in at most 12 hours.
   */
  validateTwoFactorRequirement(
    admin: AdminAccountRecord,
    totpCode?: string,
    nowMs: number = Date.now()
  ): { valid: boolean; sessionExpiresAtIso?: string; reason: string } {
    const requires2fa =
      admin.adminRole === 'SUPER_ADMIN' ||
      admin.adminRole === 'OPERATIONS_ADMIN';

    if (requires2fa) {
      if (!admin.totpSecret) {
        return {
          valid: false,
          reason: `TOTP 2FA setup is mandatory for role ${admin.adminRole}.`,
        };
      }
      if (!totpCode || !verifyTotpCode(admin.totpSecret, totpCode, nowMs)) {
        return {
          valid: false,
          reason: 'Invalid or missing TOTP 2FA code.',
        };
      }
    }

    const expiresAtIso = new Date(
      nowMs + MAX_ADMIN_SESSION_DURATION_MS
    ).toISOString();
    return {
      valid: true,
      sessionExpiresAtIso: expiresAtIso,
      reason: 'Authenticated.',
    };
  }

  /**
   * Enforces FR-G63 & Section 4.3 safety invariants:
   * 1. Only SUPER_ADMIN may modify/delete admin accounts.
   * 2. No admin can delete, deactivate, or demote their own account.
   * 3. The last active SUPER_ADMIN cannot be deleted, deactivated, or demoted.
   */
  async changeAdminStatusOrRole(
    actor: AuthenticatedAdminContext,
    targetAdminId: string,
    mutation: {
      newRole?: AdminRole | undefined;
      isActive?: boolean | undefined;
      deleteAccount?: boolean | undefined;
      reason: string;
    }
  ): Promise<{ success: boolean; errorCode?: string; message: string }> {
    if (actor.adminRole !== 'SUPER_ADMIN') {
      return {
        success: false,
        errorCode: mastera_ERROR_CODES.PERMISSION_DENIED,
        message: 'Only Super Admin can manage administrator accounts.',
      };
    }

    if (actor.adminId === targetAdminId) {
      return {
        success: false,
        errorCode: mastera_ERROR_CODES.PERMISSION_DENIED,
        message: 'Safety rule: no administrator can remove, deactivate, or demote their own account.',
      };
    }

    const target = await this.repo.findById(targetAdminId);
    if (!target) {
      return {
        success: false,
        message: 'Target administrator account not found.',
      };
    }

    const removesSuperAdminAuthority =
      target.adminRole === 'SUPER_ADMIN' &&
      target.isActive &&
      (mutation.deleteAccount === true ||
        mutation.isActive === false ||
        (mutation.newRole !== undefined && mutation.newRole !== 'SUPER_ADMIN'));

    if (removesSuperAdminAuthority) {
      const activeSuperAdminCount = await this.repo.countActiveSuperAdmins();
      if (activeSuperAdminCount <= 1) {
        await this.auditService.record({
          actorId: actor.adminId,
          actorRole: actor.adminRole,
          action: 'LAST_SUPER_ADMIN_PROTECTION_TRIGGERED',
          resourceType: 'ADMIN_USER',
          resourceId: targetAdminId,
          allowed: false,
          reason: 'Blocked attempt to delete, deactivate, or demote the last active Super Admin (FR-G63).',
        });
        return {
          success: false,
          errorCode: mastera_ERROR_CODES.PERMISSION_DENIED,
          message: 'Safety rule (FR-G63): The last active Super Admin cannot be deleted, deactivated, or demoted.',
        };
      }
    }

    if (mutation.deleteAccount) {
      await this.repo.deleteAdmin(targetAdminId);
    } else {
      await this.repo.updateAdminState(targetAdminId, {
        ...(mutation.newRole !== undefined ? { adminRole: mutation.newRole } : {}),
        ...(mutation.isActive !== undefined ? { isActive: mutation.isActive } : {}),
      });
    }

    await this.auditService.recordReasonRequiredMutation({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: mutation.deleteAccount ? 'ADMIN_DELETED' : 'ADMIN_UPDATED',
      resourceType: 'ADMIN_USER',
      resourceId: targetAdminId,
      reason: mutation.reason,
      previousValue: {
        adminRole: target.adminRole,
        isActive: target.isActive,
      },
      newValue: {
        adminRole: mutation.newRole ?? target.adminRole,
        isActive: mutation.isActive ?? target.isActive,
        deleted: mutation.deleteAccount ?? false,
      },
    });

    return {
      success: true,
      message: 'Administrator account updated.',
    };
  }
}