import test from 'node:test';
import assert from 'node:assert';
import {
  CatalogCourseDto,
  CatalogProgramDto,
  CatalogUniversityDto,
} from '@mastera/contracts';
import { AuditService } from '../../audit-reports/audit.service';
import {
  AuthenticatedAdminContext,
  ScopeAuthorizationService,
} from '../../permissions/scope.service';
import {
  AcademicCatalogService,
  CatalogRepositoryPort,
} from '../../academic-catalog/academic-catalog.service';
import {
  CatalogSnapshotService,
  SnapshotDataSourcePort,
} from '../catalog-snapshot.service';
import {
  MAX_SEED_COMPRESSED_BYTES,
  buildAndVerifyCatalogSeed,
} from '../build-catalog-seed';

test('SYN-03 Parity, Version Bump, Scope Filtering, ETag, and 150 KB Seed Gate', async () => {
  const universities: CatalogUniversityDto[] = [
    {
      id: 'uni-bdu',
      name: 'Bahir Dar University',
      shortName: 'BDU',
      isActive: true,
      version: 1,
    },
  ];
  const programs: CatalogProgramDto[] = [
    {
      id: 'prog-fresh',
      universityId: 'uni-bdu',
      name: 'Freshman Department',
      isActive: true,
      version: 1,
    },
  ];
  const courses = new Map<string, CatalogCourseDto>();

  const repo: CatalogRepositoryPort = {
    createUniversity: async (input) => {
      const u: CatalogUniversityDto = {
        id: `uni-${universities.length + 1}`,
        name: input.name,
        shortName: input.shortName,
        isActive: input.isActive ?? false,
        version: 1,
      };
      universities.push(u);
      return u;
    },
    listUniversities: async () => ({
      items: universities,
      total: universities.length,
    }),
    createProgram: async (input) => {
      const p: CatalogProgramDto = {
        id: `prog-${programs.length + 1}`,
        universityId: input.universityId,
        name: input.name,
        isActive: input.isActive ?? false,
        version: 1,
      };
      programs.push(p);
      return p;
    },
    listPrograms: async () => ({
      items: programs,
      total: programs.length,
    }),
    findCourseById: async (id) => courses.get(id) ?? null,
    createCourse: async (data) => {
      const c: CatalogCourseDto = {
        id: `course-${courses.size + 1}`,
        code: data.code,
        title: data.title,
        universityId: data.universityId ?? null,
        programId: data.programId ?? null,
        semester: data.semester,
        stream: data.stream,
        accent: data.accent ?? 'blue',
        icon: data.icon ?? 'book',
        freeAccess: data.freeAccess ?? false,
        freeTrialCount: data.freeTrialCount ?? 0,
        priceETB: data.priceETB ?? 60,
        isActive: data.isActive ?? false,
        contentVersion: data.contentVersion ?? 1,
      };
      courses.set(c.id, c);
      return c;
    },
    updateCourse: async (id, patch) => {
      const existing = courses.get(id)!;
      const updated: CatalogCourseDto = { ...existing, ...patch };
      courses.set(id, updated);
      return updated;
    },
    listCourses: async ({ skip, take }) => {
      const all = Array.from(courses.values());
      return {
        items: all.slice(skip, skip + take),
        total: all.length,
      };
    },
  };

  const auditService = new AuditService({ writeAuditRow: async () => {} });
  const scopeService = new ScopeAuthorizationService(auditService);
  const catalogService = new AcademicCatalogService(
    repo,
    scopeService,
    auditService
  );

  const superAdmin: AuthenticatedAdminContext = {
    adminId: 'admin-super',
    adminRole: 'SUPER_ADMIN',
    isActive: true,
    canReviewAndPublish: true,
    scopes: [],
  };

  // 1. Create Natural, Common, and Social courses in Admin
  const calcCourse = await catalogService.createCourse(superAdmin, {
    code: 'MATH101',
    title: 'Calculus I',
    universityId: 'uni-bdu',
    programId: 'prog-fresh',
    semester: 1,
    stream: 'NATURAL',
    accent: 'blue',
    isActive: true,
  });

  const englishCommon = await catalogService.createCourse(superAdmin, {
    code: 'ENG101',
    title: 'Communicative English',
    universityId: null,
    programId: null,
    semester: 1,
    stream: 'COMMON',
    accent: 'amber',
    isActive: true,
  });

  await catalogService.createCourse(superAdmin, {
    code: 'SOC101',
    title: 'Social Anthropology',
    universityId: 'uni-bdu',
    programId: 'prog-fresh',
    semester: 1,
    stream: 'SOCIAL',
    accent: 'teal',
    isActive: true,
  });

  const snapshotSource: SnapshotDataSourcePort = {
    getAllUniversities: async () => universities,
    getAllPrograms: async () => programs,
    getAllCourses: async () => Array.from(courses.values()),
    getAllBookGroups: async () => [],
    getAllChaptersMeta: async () => [],
    getAllExamSetsMeta: async () => [],
    getDeactivatedOrDeletedIdsSince: async () => [],
  };

  const snapshotService = new CatalogSnapshotService(snapshotSource);

  // 2. Student in NATURAL stream fetches initial snapshot
  const initialSnap = await snapshotService.buildSnapshot({
    universityId: 'uni-bdu',
    programId: 'prog-fresh',
    semester: 1,
    stream: 'NATURAL',
  });

  assert.strictEqual(initialSnap.notModified, false);
  assert.ok(initialSnap.payload);
  // Should include Calculus I (NATURAL) and Communicative English (COMMON), but NOT Social Anthropology (SOCIAL)
  assert.strictEqual(initialSnap.payload.courses.length, 2);
  const returnedCodes = initialSnap.payload.courses.map((c) => c.code).sort();
  assert.deepStrictEqual(returnedCodes, ['ENG101', 'MATH101']);

  // 3. ETag match returns notModified: true
  const cachedSnap = await snapshotService.buildSnapshot(
    {
      universityId: 'uni-bdu',
      programId: 'prog-fresh',
      semester: 1,
      stream: 'NATURAL',
    },
    initialSnap.etag
  );
  assert.strictEqual(cachedSnap.notModified, true);

  // 4. Super Admin deactivates Calculus I -> bumps contentVersion to 2 and adds to deletedItemIds (SYN-03)
  const deactivatedCalc = await catalogService.updateCourse(
    superAdmin,
    calcCourse.id,
    { isActive: false }
  );
  assert.strictEqual(deactivatedCalc.contentVersion, 2);

  // 5. Delta sync since version 1 reports Calculus I in deletedItemIds
  const deltaSnap = await snapshotService.buildSnapshot({
    universityId: 'uni-bdu',
    programId: 'prog-fresh',
    semester: 1,
    stream: 'NATURAL',
    sinceVersion: 1,
  });
  assert.ok(deltaSnap.payload);
  assert.ok(deltaSnap.payload.deletedItemIds.includes(calcCourse.id));

  // 6. Verify bundled seed generator stays well under 150 KB
  const seedResult = buildAndVerifyCatalogSeed(initialSnap.payload);
  assert.ok(seedResult.compressedBytes < MAX_SEED_COMPRESSED_BYTES);
  assert.ok(seedResult.compressedBytes > 0);
  assert.ok(englishCommon.id.length > 0);
});

test('Phase 3: Delta Sync Engine with Tombstones and Payment Methods Delivery', async () => {
  const mockTombstones = ['deleted-course-99', 'deleted-chapter-42'];
  const mockPaymentMethods = [
    {
      id: 'cbe',
      providerName: 'Commercial Bank of Ethiopia (CBE)',
      accountHolderName: 'Mastera Education Services PLC',
      accountNumberOrCode: '1000234567890',
      instructions: 'Upload CBE mobile transaction screenshot',
      isActive: true,
    },
    {
      id: 'telebirr',
      providerName: 'Telebirr',
      accountHolderName: 'Mastera Education Services PLC',
      accountNumberOrCode: '+251911022344',
      instructions: 'Pay to merchant code and attach screenshot',
      isActive: true,
    },
  ];

  const dataSource: SnapshotDataSourcePort = {
    getAllUniversities: async () => [
      { id: 'u1', name: 'Bahir Dar University', shortName: 'BDU', isActive: true, version: 2 },
    ],
    getAllPrograms: async () => [
      { id: 'p1', universityId: 'u1', name: 'Freshman Department', isActive: true, version: 1 },
    ],
    getAllCourses: async () => [
      {
        id: 'c1',
        code: 'ENG101',
        title: 'Communicative English',
        universityId: 'u1',
        programId: 'p1',
        semester: 1,
        stream: 'COMMON',
        accent: 'blue',
        icon: 'book-open',
        freeAccess: false,
        freeTrialCount: 1,
        priceETB: 350,
        isActive: true,
        contentVersion: 3,
      },
    ],
    getAllBookGroups: async () => [
      { id: 'bg1', courseId: 'c1', category: 'MODULES', code: 'BG1', title: 'English Module', subtitle: '', orderIndex: 1, version: 1 },
    ],
    getAllChaptersMeta: async () => [
      { id: 'ch1', courseId: 'c1', bookGroupId: 'bg1', category: 'MODULES', orderIndex: 1, title: 'Chapter 1', isFree: true, estimatedSizeBytes: 500, status: 'PUBLISHED', version: 3 },
    ],
    getAllExamSetsMeta: async () => [],
    getDeactivatedOrDeletedIdsSince: async (sinceVersion) => {
      if (sinceVersion >= 1) return mockTombstones;
      return [];
    },
    getActivePaymentMethods: async () => mockPaymentMethods,
  };

  const service = new CatalogSnapshotService(dataSource);

  // When client asks with sinceVersion: 2
  const delta = await service.buildSnapshot({
    universityId: 'u1',
    programId: 'p1',
    semester: 1,
    stream: 'NATURAL',
    sinceVersion: 2,
  });

  assert.strictEqual(delta.notModified, false);
  assert.ok(delta.payload);
  assert.strictEqual(delta.snapshotVersion, 3);
  // c1 has contentVersion 3 > 2 -> included
  assert.strictEqual(delta.payload?.courses.length, 1);
  assert.strictEqual(delta.payload?.courses[0]?.code, 'ENG101');
  // p1 has version 1 <= 2 -> excluded
  assert.strictEqual(delta.payload?.programs.length, 0);
  // Tombstones included
  assert.deepStrictEqual(delta.payload?.deletedItemIds, mockTombstones);
  // Payment methods included
  assert.strictEqual(delta.payload?.paymentMethods?.length, 2);
  assert.strictEqual(delta.payload?.paymentMethods?.[0]?.id, 'cbe');

  // Verify ETag matches when repeated
  const cached = await service.buildSnapshot(
    {
      universityId: 'u1',
      programId: 'p1',
      semester: 1,
      stream: 'NATURAL',
      sinceVersion: 2,
    },
    delta.etag
  );
  assert.strictEqual(cached.notModified, true);
});