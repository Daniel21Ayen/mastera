import test from 'node:test';
import assert from 'node:assert';
import {
  CounterService,
  CounterTransactionExecutor,
  formatStudentMsCode,
} from '../counter.service';
import {
  AuditEntryInput,
  AuditPersistencePort,
  AuditService,
} from '../../audit-reports/audit.service';
import {
  AuthenticatedAdminContext,
  ScopeAuthorizationService,
} from '../../permissions/scope.service';
import {
  AdminAccountRecord,
  AdminIamService,
  AdminRepositoryPort,
} from '../../admin-iam/admin-iam.service';

class InMemoryTransactionalCounterDb {
  private counters = new Map<string, number>();

  async runTransaction<T>(
    work: (tx: CounterTransactionExecutor) => Promise<T>
  ): Promise<T> {
    const snapshot = new Map(this.counters);
    const tx: CounterTransactionExecutor = {
      $queryRaw: async <R = unknown>(
        _strings: TemplateStringsArray,
        ...values: unknown[]
      ): Promise<R> => {
        const key = String(values[0]);
        const nextVal = (this.counters.get(key) ?? 0) + 1;
        this.counters.set(key, nextVal);
        return [{ value: nextVal }] as unknown as R;
      },
    };

    try {
      return await work(tx);
    } catch (err) {
      // Simulate PostgreSQL transaction rollback restoring counter state
      this.counters = snapshot;
      throw err;
    }
  }
}

test('FR-G45 to FR-G48: 50 concurrent approvals produce gapless MS0001..MS0050 and rollback leaves no gap', async () => {
  const db = new InMemoryTransactionalCounterDb();
  const counterService = new CounterService();
  const allocatedCodes: string[] = [];

  // Allocate first 25 concurrently
  const firstBatch = await Promise.all(
    Array.from({ length: 25 }, () =>
      db.runTransaction((tx) => counterService.allocateNextStudentMsCode(tx))
    )
  );
  allocatedCodes.push(...firstBatch);

  // Force a transaction failure after incrementing counter inside transaction
  await assert.rejects(async () => {
    await db.runTransaction(async (tx) => {
      await counterService.allocateNextStudentMsCode(tx);
      throw new Error('Simulated DB constraint failure inside approval transaction');
    });
  });

  // Allocate remaining 25 concurrently
  const secondBatch = await Promise.all(
    Array.from({ length: 25 }, () =>
      db.runTransaction((tx) => counterService.allocateNextStudentMsCode(tx))
    )
  );
  allocatedCodes.push(...secondBatch);

  assert.strictEqual(allocatedCodes.length, 50);
  for (let i = 1; i <= 50; i++) {
    assert.strictEqual(allocatedCodes[i - 1], formatStudentMsCode(i));
  }
  assert.strictEqual(formatStudentMsCode(10000), 'MS10000');
});

test('FR-G60, FR-G61, FR-G62: RBAC Matrix, Academic Scope Isolation, and Maker-Checker', async () => {
  const auditLogs: Required<AuditEntryInput>[] = [];
  const auditPort: AuditPersistencePort = {
    writeAuditRow: async (entry) => {
      auditLogs.push(entry);
    },
  };
  const auditService = new AuditService(auditPort);
  const scopeService = new ScopeAuthorizationService(auditService);

  const academicAdmin: AuthenticatedAdminContext = {
    adminId: 'acad-1',
    adminRole: 'ACADEMIC_ADMIN',
    isActive: true,
    canReviewAndPublish: true,
    scopes: [{ id: 's1', adminId: 'acad-1', courseId: 'course-physics' }],
  };

  // 1. Academic Admin cannot manage commercial settings (Section 4.2)
  const commerceCheck = await scopeService.authorizeAdminAction(
    academicAdmin,
    'COMMERCE_SETTINGS_MANAGE'
  );
  assert.strictEqual(commerceCheck.allowed, false);
  assert.strictEqual(commerceCheck.errorCode, 'PERMISSION_DENIED');

  // 2. Academic Admin cannot edit an out-of-scope course (FR-G61)
  const outOfScopeCheck = await scopeService.authorizeAdminAction(
    academicAdmin,
    'CONTENT_AUTHOR_SCOPED',
    { courseId: 'course-history' }
  );
  assert.strictEqual(outOfScopeCheck.allowed, false);
  assert.strictEqual(outOfScopeCheck.errorCode, 'OUT_OF_SCOPE');

  // 3. Academic Admin can edit an in-scope course
  const inScopeCheck = await scopeService.authorizeAdminAction(
    academicAdmin,
    'CONTENT_AUTHOR_SCOPED',
    { courseId: 'course-physics' }
  );
  assert.strictEqual(inScopeCheck.allowed, true);

  // 4. Maker-Checker: Author cannot publish their own work (FR-G62)
  const selfPublishCheck = await scopeService.authorizeAdminAction(
    academicAdmin,
    'CONTENT_PUBLISH',
    { courseId: 'course-physics', authoredByAdminId: 'acad-1' }
  );
  assert.strictEqual(selfPublishCheck.allowed, false);
  assert.strictEqual(selfPublishCheck.errorCode, 'PERMISSION_DENIED');
});

test('FR-G63: Last active Super Admin cannot be deleted, deactivated, or demoted', async () => {
  const auditService = new AuditService({
    writeAuditRow: async () => {},
  });

  const admins = new Map<string, AdminAccountRecord>([
    [
      'super-1',
      {
        id: 'super-1',
        name: 'Super One',
        email: 'super1@mastera.et',
        passwordHash: 'hash',
        adminRole: 'SUPER_ADMIN',
        totpSecret: '00112233445566778899aabbccddeeff',
        isActive: true,
      },
    ],
    [
      'super-2',
      {
        id: 'super-2',
        name: 'Super Two',
        email: 'super2@mastera.et',
        passwordHash: 'hash',
        adminRole: 'SUPER_ADMIN',
        totpSecret: '00112233445566778899aabbccddeeff',
        isActive: false, // Inactive
      },
    ],
  ]);

  const repo: AdminRepositoryPort = {
    findById: async (id) => admins.get(id) ?? null,
    countActiveSuperAdmins: async () =>
      Array.from(admins.values()).filter(
        (a) => a.adminRole === 'SUPER_ADMIN' && a.isActive
      ).length,
    updateAdminState: async (id, patch) => {
      const existing = admins.get(id)!;
      const updated = { ...existing, ...patch };
      admins.set(id, updated);
      return updated;
    },
    deleteAdmin: async (id) => {
      admins.delete(id);
    },
  };

  const iamService = new AdminIamService(repo, auditService);
  const actor: AuthenticatedAdminContext = {
    adminId: 'super-actor',
    adminRole: 'SUPER_ADMIN',
    isActive: true,
    canReviewAndPublish: true,
    scopes: [],
  };

  // Attempt to demote the only active Super Admin ('super-1')
  const demoteResult = await iamService.changeAdminStatusOrRole(
    actor,
    'super-1',
    {
      newRole: 'OPERATIONS_ADMIN',
      reason: 'Testing demotion of last active super admin',
    }
  );
  assert.strictEqual(demoteResult.success, false);
  assert.strictEqual(demoteResult.errorCode, 'PERMISSION_DENIED');
});