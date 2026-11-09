import { Injectable } from '@nestjs/common';
import {
  AdminRole,
  AdminScopeAssignmentDto,
  mastera_ERROR_CODES,
  masteraErrorCode,
} from '@mastera/contracts';
import {
  AdminPermissionAction,
  roleHasPermission,
} from './permission-matrix';
import { AuditService } from '../audit-reports/audit.service';

export interface AuthenticatedAdminContext {
  adminId: string;
  adminRole: AdminRole;
  isActive: boolean;
  canReviewAndPublish: boolean;
  scopes: AdminScopeAssignmentDto[];
}

export interface ResourceTargetScope {
  universityId?: string | null | undefined;
  programId?: string | null | undefined;
  courseId?: string | null | undefined;
  authoredByAdminId?: string | null | undefined;
}

export interface AuthorizationDecision {
  allowed: boolean;
  errorCode?: masteraErrorCode | undefined;
  reason: string;
}

@Injectable()
export class ScopeAuthorizationService {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Section 4.1: The client never sends a role. A forged role in the request
   * payload/query/headers is ignored and logged to the audit trail.
   */
  async detectAndStripForgedClientRole(
    actor: AuthenticatedAdminContext | null,
    requestPayload: Record<string, unknown>,
    ipAddress?: string
  ): Promise<void> {
    if ('role' in requestPayload || 'adminRole' in requestPayload) {
      delete requestPayload['role'];
      delete requestPayload['adminRole'];

      await this.auditService.record({
        actorId: actor?.adminId ?? null,
        actorRole: actor?.adminRole ?? 'UNAUTHENTICATED',
        actorScope: actor?.scopes,
        action: 'FORGED_CLIENT_ROLE_IGNORED',
        resourceType: 'REQUEST_PAYLOAD',
        allowed: false,
        reason: 'Client attempted to send role field; stripped per Section 4.1.',
        ipAddress,
      });
    }
  }

  /**
   * Evaluates whether an Academic Admin's assigned scopes cover the target
   * university, program, or course (FR-G61, Q16). Super Admin and Operations
   * Admin are not restricted by academic content scope.
   */
  isWithinAdminScope(
    admin: AuthenticatedAdminContext,
    target: ResourceTargetScope
  ): boolean {
    if (
      admin.adminRole === 'SUPER_ADMIN' ||
      admin.adminRole === 'OPERATIONS_ADMIN'
    ) {
      return true;
    }

    if (admin.scopes.length === 0) {
      return false;
    }

    return admin.scopes.some((scope) => {
      if (scope.courseId && target.courseId && scope.courseId === target.courseId) {
        return true;
      }
      if (
        scope.programId &&
        target.programId &&
        scope.programId === target.programId
      ) {
        return true;
      }
      if (
        scope.universityId &&
        target.universityId &&
        scope.universityId === target.universityId
      ) {
        return true;
      }
      return false;
    });
  }

  /**
   * Enforces Section 4.4:
   * ALLOW = authenticated + role permission + scope + resource state + business rule.
   * Logs denied requests on sensitive routes (Section 11.1, Section 14).
   */
  async authorizeAdminAction(
    admin: AuthenticatedAdminContext | null,
    permission: AdminPermissionAction,
    target?: ResourceTargetScope,
    ipAddress?: string
  ): Promise<AuthorizationDecision> {
    if (!admin || !admin.isActive) {
      await this.auditService.record({
        actorId: admin?.adminId ?? null,
        actorRole: admin?.adminRole ?? 'UNAUTHENTICATED',
        action: permission,
        resourceType: 'ADMIN_GUARD',
        allowed: false,
        reason: 'Unauthenticated or inactive admin account.',
        ipAddress,
      });
      return {
        allowed: false,
        errorCode: mastera_ERROR_CODES.PERMISSION_DENIED,
        reason: 'Authentication required.',
      };
    }

    if (!roleHasPermission(admin.adminRole, permission)) {
      await this.auditService.record({
        actorId: admin.adminId,
        actorRole: admin.adminRole,
        actorScope: admin.scopes,
        action: permission,
        resourceType: 'ADMIN_GUARD',
        allowed: false,
        reason: `Role ${admin.adminRole} lacks permission ${permission}.`,
        ipAddress,
      });
      return {
        allowed: false,
        errorCode: mastera_ERROR_CODES.PERMISSION_DENIED,
        reason: `Role ${admin.adminRole} is not permitted to perform ${permission}.`,
      };
    }

    // Maker-Checker rule (Section 4.2, Section 4.3, FR-G62):
    // Academic Admin can publish only if granted reviewer rights, and NEVER their own work.
    if (permission === 'CONTENT_PUBLISH') {
      if (admin.adminRole === 'ACADEMIC_ADMIN' && !admin.canReviewAndPublish) {
        return {
          allowed: false,
          errorCode: mastera_ERROR_CODES.PERMISSION_DENIED,
          reason: 'Academic Admin lacks reviewer grant required to publish.',
        };
      }
      if (
        admin.adminRole === 'ACADEMIC_ADMIN' &&
        target?.authoredByAdminId &&
        target.authoredByAdminId === admin.adminId
      ) {
        await this.auditService.record({
          actorId: admin.adminId,
          actorRole: admin.adminRole,
          actorScope: admin.scopes,
          action: permission,
          resourceType: 'CONTENT_PUBLISH',
          allowed: false,
          reason: 'Maker-checker violation: publisher cannot be the author (FR-G62).',
          ipAddress,
        });
        return {
          allowed: false,
          errorCode: mastera_ERROR_CODES.PERMISSION_DENIED,
          reason: 'Maker-checker rule: the publisher MUST differ from the author.',
        };
      }
    }

    // Scope check for Academic Admin (FR-G61)
    if (
      admin.adminRole === 'ACADEMIC_ADMIN' &&
      target &&
      (target.universityId || target.programId || target.courseId)
    ) {
      if (!this.isWithinAdminScope(admin, target)) {
        await this.auditService.record({
          actorId: admin.adminId,
          actorRole: admin.adminRole,
          actorScope: admin.scopes,
          action: permission,
          resourceType: 'SCOPE_GUARD',
          allowed: false,
          reason: 'Target resource is outside assigned Academic Admin scope.',
          ipAddress,
        });
        return {
          allowed: false,
          errorCode: mastera_ERROR_CODES.OUT_OF_SCOPE,
          reason: 'Target resource is outside your assigned academic scope.',
        };
      }
    }

    return { allowed: true, reason: 'Authorized.' };
  }

  /**
   * Builds a Prisma WHERE filter for list queries so Academic Admins only ever
   * read courses/content within their assigned scope (Section 4.3, FR-G61).
   */
  buildCourseScopeFilter(admin: AuthenticatedAdminContext): Record<string, unknown> {
    if (
      admin.adminRole === 'SUPER_ADMIN' ||
      admin.adminRole === 'OPERATIONS_ADMIN'
    ) {
      return {};
    }

    const universityIds = admin.scopes
      .map((s) => s.universityId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
    const programIds = admin.scopes
      .map((s) => s.programId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
    const courseIds = admin.scopes
      .map((s) => s.courseId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    return {
      OR: [
        ...(universityIds.length > 0 ? [{ universityId: { in: universityIds } }] : []),
        ...(programIds.length > 0 ? [{ programId: { in: programIds } }] : []),
        ...(courseIds.length > 0 ? [{ id: { in: courseIds } }] : []),
      ],
    };
  }
}