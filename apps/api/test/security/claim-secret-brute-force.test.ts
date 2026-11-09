import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { hashClaimSecret, verifyClaimSecret } from '@mastera/domain';
import {
  ScopeAuthorizationService,
  AuthenticatedAdminContext,
} from '../../src/modules/permissions/scope.service';
import { AuditService } from '../../src/modules/audit-reports/audit.service';
import { mastera_ERROR_CODES } from '@mastera/contracts';

describe('Security & Scope Isolation Suite (SRS Section 4.2, 4.3, 14)', () => {
  it('verifies claim secrets in constant time and rejects brute-force guesses', () => {
    const validSecret = 'sec_9876543210_abcdef1234567890';
    const storedHash = hashClaimSecret(validSecret);

    // Constant-time check on correct secret
    assert.equal(verifyClaimSecret(validSecret, storedHash), true);

    // Brute-force guesses must fail safely
    const invalidGuesses = [
      '',
      'sec_9876543210_abcdef1234567891',
      'a',
      'sec_9876543210',
      'sec_9876543210_abcdef1234567890_extra',
      '1234567890',
      'totally_wrong_secret',
    ];

    for (const guess of invalidGuesses) {
      assert.equal(verifyClaimSecret(guess, storedHash), false);
    }
  });

  it('enforces RBAC matrix: Academic Admin is denied payment review and financial mutations', async () => {
    const auditService = new AuditService({
      writeAuditRow: async () => {},
    });
    const scopeAuth = new ScopeAuthorizationService(auditService);

    const academicActor: AuthenticatedAdminContext = {
      adminId: 'admin-academic-1',
      adminRole: 'ACADEMIC_ADMIN',
      scopes: [{ universityId: 'uni-aau', programId: null, courseId: null }],
    };

    const reviewDecision = await scopeAuth.authorizeAdminAction(
      academicActor,
      'PAYMENTS_RECEIPTS_REVIEW'
    );
    assert.equal(reviewDecision.allowed, false);
    assert.equal(reviewDecision.errorCode, mastera_ERROR_CODES.PERMISSION_DENIED);

    const refundDecision = await scopeAuth.authorizeAdminAction(
      academicActor,
      'REFUND_APPROVE'
    );
    assert.equal(refundDecision.allowed, false);
    assert.equal(refundDecision.errorCode, mastera_ERROR_CODES.PERMISSION_DENIED);
  });

  it('enforces scope boundary: Academic Admin cannot author outside their assigned university', async () => {
    const auditService = new AuditService({
      writeAuditRow: async () => {},
    });
    const scopeAuth = new ScopeAuthorizationService(auditService);

    const scopedAcademicActor: AuthenticatedAdminContext = {
      adminId: 'admin-scoped-1',
      adminRole: 'ACADEMIC_ADMIN',
      scopes: [{ universityId: 'uni-aau', programId: null, courseId: null }],
    };

    // Author action on ASTU (different university)
    const outOfScopeDecision = await scopeAuth.authorizeAdminAction(
      scopedAcademicActor,
      'CONTENT_AUTHOR_SCOPED',
      { universityId: 'uni-astu' }
    );

    assert.equal(outOfScopeDecision.allowed, false);
    assert.equal(outOfScopeDecision.errorCode, mastera_ERROR_CODES.PERMISSION_DENIED);
  });
});
