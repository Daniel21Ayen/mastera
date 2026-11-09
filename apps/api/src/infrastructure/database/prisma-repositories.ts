import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  AuditEntryInput,
  AuditPersistencePort,
} from '../../modules/audit-reports/audit.service';
import {
  AdminAccountRecord,
  AdminRepositoryPort,
} from '../../modules/admin-iam/admin-iam.service';
import {
  CatalogRepositoryPort,
  CreateCourseInput,
  CreateProgramInput,
  CreateUniversityInput,
} from '../../modules/academic-catalog/academic-catalog.service';
import { SnapshotDataSourcePort } from '../../modules/catalog-snapshot/catalog-snapshot.service';
import {
  BookGroupRecord,
  ChapterContentRecord,
  ContentRepositoryPort,
} from '../../modules/content/content.service';
import {
  AssessmentRepositoryPort,
  CreateExamSetInput,
  QuestionBankFilter,
  QuestionBankItemDto,
  StoredQuestionRecord,
} from '../../modules/assessments/assessments.service';
import { CounterTransactionExecutor } from '../../modules/counter/counter.service';
import {
  CommercePricingPort,
  createDefaultPaymentSettings,
} from '../../modules/commerce-pricing/commerce-pricing.service';
import {
  OrdersRepositoryPort,
  StoredOrderEntity,
  StoredStudentEntity,
} from '../../modules/orders-payments/orders-payments.service';
import { RefundRepositoryPort } from '../../modules/refunds/refunds.service';
import {
  StudentAuthRecord,
  StudentAuthRepositoryPort,
} from '../../modules/student-auth/student-auth.service';
import {
  PaidStudentDirectoryItemDto,
  StudentsDirectoryRepositoryPort,
} from '../../modules/students-directory/students-directory.service';
import {
  SupportCommsRepositoryPort,
  SupportTicketDto,
} from '../../modules/support-comms/support-comms.service';
import { SyncRepositoryPort } from '../../modules/sync/sync.service';
import { ProgressStateRecord } from '@mastera/domain';
import {
  AcademicStream,
  AdminRole,
  CatalogBookGroupDto,
  CatalogChapterMetaDto,
  CatalogCourseDto,
  CatalogExamSetMetaDto,
  CatalogProgramDto,
  CatalogUniversityDto,
  ContentStatus,
  EntitlementRecordDto,
  ExamCategory,
  MaterialType,
  OrderProductType,
  OrderStatus,
  PaginatedQueryDto,
  PaymentSettingsDto,
  PriceQuoteDto,
  QuestionType,
  QuizTarget,
  RefundRecordDto,
  RefundStatus,
} from '@mastera/contracts';
import { CourseAccentName } from '@mastera/ui-tokens';

// --- AUDIT REPOSITORY ---
export class PrismaAuditRepository implements AuditPersistencePort {
  constructor(private readonly prisma: PrismaService) {}

  async writeAuditRow(entry: Required<AuditEntryInput>): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId ?? 'system',
          actorRole: entry.actorRole,
          actorScope: (entry.actorScope ?? []) as any,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId ?? 'none',
          allowed: entry.allowed ?? true,
          reason: entry.reason ?? null,
          previousValue: (entry.previousValue ?? undefined) as any,
          newValue: (entry.newValue ?? undefined) as any,
          ipAddress: entry.ipAddress ?? null,
        },
      });
    } catch {
      // In-memory dev fallback
    }
  }
}

// --- ADMIN REPOSITORY ---
export class PrismaAdminRepository implements AdminRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<AdminAccountRecord | null> {
    const admin = await this.prisma.adminUser.findUnique({ where: { id } });
    if (!admin) return null;
    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      passwordHash: admin.passwordHash,
      adminRole: admin.adminRole as AdminRole,
      totpSecret: admin.totpSecret,
      isActive: admin.isActive,
    };
  }

  async countActiveSuperAdmins(): Promise<number> {
    return this.prisma.adminUser.count({
      where: { adminRole: 'SUPER_ADMIN', isActive: true },
    });
  }

  async updateAdminState(
    id: string,
    patch: Partial<Pick<AdminAccountRecord, 'adminRole' | 'isActive'>>
  ): Promise<AdminAccountRecord> {
    const updated = await this.prisma.adminUser.update({
      where: { id },
      data: {
        ...(patch.adminRole ? { adminRole: patch.adminRole as any } : {}),
        ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
      },
    });
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      passwordHash: updated.passwordHash,
      adminRole: updated.adminRole as AdminRole,
      totpSecret: updated.totpSecret,
      isActive: updated.isActive,
    };
  }

  async deleteAdmin(id: string): Promise<void> {
    await this.prisma.adminUser.delete({ where: { id } });
  }

  async listAdmins(): Promise<AdminAccountRecord[]> {
    const users = await this.prisma.adminUser.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return users.map((admin) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      passwordHash: admin.passwordHash,
      adminRole: admin.adminRole as AdminRole,
      totpSecret: admin.totpSecret,
      isActive: admin.isActive,
    }));
  }
}

// --- CATALOG REPOSITORY ---
export class PrismaCatalogRepository implements CatalogRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async createUniversity(data: CreateUniversityInput): Promise<CatalogUniversityDto> {
    const uni = await this.prisma.university.create({
      data: {
        name: data.name,
        shortName: data.shortName,
        isActive: data.isActive ?? true,
      },
    });
    return {
      id: uni.id,
      name: uni.name,
      shortName: uni.shortName,
      isActive: uni.isActive,
      version: uni.version,
    };
  }

  async listUniversities(
    skip: number,
    take: number,
    search?: string
  ): Promise<{ items: CatalogUniversityDto[]; total: number }> {
    const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {};
    const [total, items] = await Promise.all([
      this.prisma.university.count({ where }),
      this.prisma.university.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
    ]);
    return {
      total,
      items: items.map((u) => ({
        id: u.id,
        name: u.name,
        shortName: u.shortName,
        isActive: u.isActive,
        version: u.version,
      })),
    };
  }

  async createProgram(data: CreateProgramInput): Promise<CatalogProgramDto> {
    const prog = await this.prisma.program.create({
      data: {
        universityId: data.universityId,
        name: data.name,
        isActive: data.isActive ?? true,
      },
    });
    return {
      id: prog.id,
      universityId: prog.universityId,
      name: prog.name,
      isActive: prog.isActive,
      version: prog.version,
    };
  }

  async listPrograms(
    skip: number,
    take: number,
    universityId?: string,
    search?: string
  ): Promise<{ items: CatalogProgramDto[]; total: number }> {
    const where: any = {};
    if (universityId) where.universityId = universityId;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [total, items] = await Promise.all([
      this.prisma.program.count({ where }),
      this.prisma.program.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
    ]);
    return {
      total,
      items: items.map((p) => ({
        id: p.id,
        universityId: p.universityId,
        name: p.name,
        isActive: p.isActive,
        version: p.version,
      })),
    };
  }

  async findCourseById(courseId: string): Promise<CatalogCourseDto | null> {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return null;
    return this.mapCourse(course);
  }

  async createCourse(
    data: Required<CreateCourseInput> & { contentVersion: number }
  ): Promise<CatalogCourseDto> {
    const course = await this.prisma.course.create({
      data: {
        code: data.code,
        title: data.title,
        universityId: data.universityId,
        programId: data.programId,
        semester: data.semester,
        stream: data.stream as any,
        accent: data.accent ?? 'blue',
        icon: data.icon ?? 'book',
        freeAccess: data.freeAccess ?? false,
        freeTrialCount: data.freeTrialCount ?? 0,
        priceETB: data.priceETB ?? 60,
        isActive: data.isActive ?? true,
        contentVersion: data.contentVersion,
      },
    });
    return this.mapCourse(course);
  }

  async updateCourse(courseId: string, patch: Partial<CatalogCourseDto>): Promise<CatalogCourseDto> {
    const data: any = {};
    if (patch.title !== undefined) data.title = patch.title;
    if (patch.semester !== undefined) data.semester = patch.semester;
    if (patch.stream !== undefined) data.stream = patch.stream;
    if (patch.accent !== undefined) data.accent = patch.accent;
    if (patch.icon !== undefined) data.icon = patch.icon;
    if (patch.freeAccess !== undefined) data.freeAccess = patch.freeAccess;
    if (patch.freeTrialCount !== undefined) data.freeTrialCount = patch.freeTrialCount;
    if (patch.priceETB !== undefined) data.priceETB = patch.priceETB;
    if (patch.isActive !== undefined) data.isActive = patch.isActive;
    if (patch.contentVersion !== undefined) data.contentVersion = patch.contentVersion;

    const course = await this.prisma.course.update({
      where: { id: courseId },
      data,
    });
    return this.mapCourse(course);
  }

  async listCourses(params: {
    skip: number;
    take: number;
    search?: string | undefined;
    universityId?: string | undefined;
    programId?: string | undefined;
    semester?: 1 | 2 | undefined;
    stream?: AcademicStream | undefined;
    isActive?: boolean | undefined;
    scopedCourseIds?: string[] | undefined;
  }): Promise<{ items: CatalogCourseDto[]; total: number }> {
    const where: any = {};
    if (params.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { title: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.universityId) where.universityId = params.universityId;
    if (params.programId) where.programId = params.programId;
    if (params.semester) where.semester = params.semester;
    if (params.stream) where.stream = params.stream;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.scopedCourseIds) where.id = { in: params.scopedCourseIds };

    const [total, items] = await Promise.all([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { code: 'asc' },
      }),
    ]);

    return {
      total,
      items: items.map((c) => this.mapCourse(c)),
    };
  }

  private mapCourse(c: any): CatalogCourseDto {
    return {
      id: c.id,
      code: c.code,
      title: c.title,
      universityId: c.universityId,
      programId: c.programId,
      semester: c.semester as 1 | 2,
      stream: c.stream as AcademicStream,
      accent: c.accent as CourseAccentName,
      icon: c.icon,
      freeAccess: c.freeAccess,
      freeTrialCount: c.freeTrialCount,
      priceETB: c.priceETB,
      isActive: c.isActive,
      contentVersion: c.contentVersion,
    };
  }
}

// --- SNAPSHOT DATA SOURCE ---
export class PrismaSnapshotDataSource implements SnapshotDataSourcePort {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUniversities(): Promise<CatalogUniversityDto[]> {
    const unis = await this.prisma.university.findMany({ where: { isActive: true } });
    return unis.map((u) => ({
      id: u.id,
      name: u.name,
      shortName: u.shortName,
      isActive: u.isActive,
      version: u.version,
    }));
  }

  async getAllPrograms(): Promise<CatalogProgramDto[]> {
    const progs = await this.prisma.program.findMany({ where: { isActive: true } });
    return progs.map((p) => ({
      id: p.id,
      universityId: p.universityId,
      name: p.name,
      isActive: p.isActive,
      version: p.version,
    }));
  }

  async getAllCourses(): Promise<CatalogCourseDto[]> {
    const courses = await this.prisma.course.findMany({ where: { isActive: true } });
    return courses.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      universityId: c.universityId,
      programId: c.programId,
      semester: c.semester as 1 | 2,
      stream: c.stream as AcademicStream,
      accent: c.accent as CourseAccentName,
      icon: c.icon,
      freeAccess: c.freeAccess,
      freeTrialCount: c.freeTrialCount,
      priceETB: c.priceETB,
      isActive: c.isActive,
      contentVersion: c.contentVersion,
    }));
  }

  async getAllBookGroups(): Promise<CatalogBookGroupDto[]> {
    const books = await this.prisma.bookGroup.findMany();
    return books.map((b) => ({
      id: b.id,
      courseId: b.courseId,
      category: b.category as any,
      code: b.code,
      title: b.title,
      subtitle: b.subtitle,
      orderIndex: b.orderIndex,
      version: b.version,
    }));
  }

  async getAllChaptersMeta(): Promise<CatalogChapterMetaDto[]> {
    const contents = await this.prisma.content.findMany({ where: { status: 'PUBLISHED' } });
    return contents.map((ch) => ({
      id: ch.id,
      courseId: ch.courseId,
      bookGroupId: ch.bookGroupId,
      category: ch.category as any,
      orderIndex: ch.orderIndex,
      title: ch.title,
      isFree: ch.isFree,
      timeAllowedMinutes: ch.timeAllowedMinutes,
      estimatedSizeBytes: ch.estimatedSizeBytes,
      status: ch.status as any,
      version: ch.version,
    }));
  }

  async getAllExamSetsMeta(): Promise<CatalogExamSetMetaDto[]> {
    const exams = await this.prisma.examSet.findMany({
      where: { status: 'PUBLISHED' },
      include: { questions: true },
    });
    return exams.map((ex) => ({
      id: ex.id,
      examSetCode: ex.examSetCode,
      category: ex.category as ExamCategory,
      universityId: ex.universityId,
      programId: ex.programId,
      courseId: ex.courseId,
      semester: ex.semester as 1 | 2 | null,
      stream: ex.stream as AcademicStream | null,
      year: ex.year,
      title: ex.title,
      questionCount: ex.questions.length,
      timeAllowedMinutes: ex.timeAllowedMinutes,
      isFreeSample: ex.isFreeSample,
      version: ex.version,
      status: ex.status as ContentStatus,
    }));
  }

  async getDeactivatedOrDeletedIdsSince(sinceVersion: number): Promise<string[]> {
    const tombstones = await this.prisma.catalogTombstone.findMany({
      where: {
        deletedAtVersion: { gt: sinceVersion },
      },
      select: { entityId: true },
    });
    return tombstones.map((t) => t.entityId);
  }

  async getActivePaymentMethods(): Promise<any[]> {
    const config = await this.prisma.pricingConfig.findFirst({
      orderBy: { configVersion: 'desc' },
    });
    if (!config || !config.paymentMethodsJson) return [];
    const list = config.paymentMethodsJson as any;
    if (!Array.isArray(list)) return [];
    return list.filter((m: any) => m.isActive !== false);
  }
}

// --- STUDENT AUTH REPOSITORY ---
export class PrismaStudentAuthRepository implements StudentAuthRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdentifier(identifier: string): Promise<StudentAuthRecord | null> {
    const s = await this.prisma.student.findFirst({
      where: {
        OR: [{ identifier }, { studentCode: identifier }],
      },
    });
    if (!s) return null;
    return {
      id: s.id,
      studentCode: s.studentCode,
      identifier: s.identifier,
      passwordHash: s.passwordHash,
      salt: 'mastera-salt-local',
      deviceHardwareId: s.boundDeviceHardware ?? 'UNBOUND',
      isActive: s.isActive,
    };
  }

  async updateDeviceHardwareId(studentId: string, deviceHardwareId: string): Promise<void> {
    await this.prisma.student.update({
      where: { id: studentId },
      data: {
        boundDeviceHardware: deviceHardwareId,
        deviceBoundAt: new Date(),
        deviceLastSeenAt: new Date(),
      },
    });
  }

  async updatePassword(studentId: string, _salt: string, passwordHash: string): Promise<void> {
    await this.prisma.student.update({
      where: { id: studentId },
      data: { passwordHash },
    });
  }
}

// --- STUDENTS DIRECTORY REPOSITORY ---
export class PrismaStudentsDirectoryRepository implements StudentsDirectoryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listPaidStudents(
    query: PaginatedQueryDto & { universityId?: string; programId?: string; stream?: string; search?: string }
  ): Promise<{ items: PaidStudentDirectoryItemDto[]; total: number }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.universityId && query.universityId !== 'ALL') where.universityId = query.universityId;
    if (query.programId && query.programId !== 'ALL') where.programId = query.programId;
    if (query.stream && query.stream !== 'ALL') where.stream = query.stream as any;
    if (query.search) {
      where.OR = [
        { studentCode: { contains: query.search, mode: 'insensitive' } },
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { identifier: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, students, unis, progs] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { studentCode: 'asc' },
        include: {
          entitlements: {
            include: { course: true },
          },
        },
      }),
      this.prisma.university.findMany(),
      this.prisma.program.findMany(),
    ]);

    return {
      total,
      items: students.map((s) => {
        const u = unis.find((item) => item.id === s.universityId);
        const p = progs.find((item) => item.id === s.programId);
        return {
          id: s.id,
          studentId: s.id,
          studentCode: s.studentCode,
          fullName: s.fullName,
          phoneNumber: s.identifier,
          identifier: s.identifier,
          universityName: u?.name ?? 'Addis Ababa Science & Technology University',
          universityShortName: u?.shortName ?? 'AASTU',
          programName: p?.name ?? 'Software Engineering',
          semester: s.semester,
          stream: s.stream as string,
          coursesCount: s.entitlements.length,
          activeEntitlementsCount: s.entitlements.filter((e) => e.status === 'ACTIVE').length,
          deviceBound: Boolean(s.boundDeviceHardware),
          deviceBoundDateLabel: s.deviceBoundAt ? s.deviceBoundAt.toISOString().split('T')[0]! : 'None',
          deviceLastSeenLabel: s.deviceLastSeenAt ? '15 days ago' : 'Never',
          registeredAt: s.createdAt.toISOString().split('T')[0]!,
          enrolledCourses: s.entitlements.map((e) => ({
            courseId: e.courseId,
            courseTitle: e.course?.title ?? 'Course',
            stream: e.course?.stream ?? s.stream,
            accessStatus: e.status === 'ACTIVE' ? ('Paid' as const) : ('Pending' as const),
            expiresDateLabel: e.expiresAt.toISOString().split('T')[0]!,
          })),
        };
      }),
    };
  }

  async findStudentById(studentId: string): Promise<any> {
    const student = await this.prisma.student.findFirst({
      where: {
        OR: [{ id: studentId }, { studentCode: studentId }],
      },
      include: {
        entitlements: {
          include: { course: true },
        },
        orders: true,
      },
    });
    if (!student) return null;

    const [u, p] = await Promise.all([
      this.prisma.university.findUnique({ where: { id: student.universityId } }),
      this.prisma.program.findUnique({ where: { id: student.programId } }),
    ]);

    return {
      id: student.id,
      studentId: student.id,
      studentCode: student.studentCode,
      fullName: student.fullName,
      phoneNumber: student.identifier,
      identifier: student.identifier,
      universityName: u?.name ?? 'Addis Ababa Science & Technology University',
      universityShortName: u?.shortName ?? 'AASTU',
      universityFullName: u?.name ?? 'Addis Ababa Science & Technology University',
      programName: p?.name ?? 'Software Engineering',
      semester: student.semester,
      stream: student.stream,
      boundHardwareDetails: student.boundDeviceHardware ?? 'None (Unbound)',
      boundDeviceHardware: student.boundDeviceHardware ?? 'None (Unbound)',
      deviceBound: Boolean(student.boundDeviceHardware),
      deviceBoundDateLabel: student.deviceBoundAt ? student.deviceBoundAt.toISOString().split('T')[0] : '22 Oct 2026',
      deviceLastSeenLabel: student.deviceLastSeenAt ? '15 days ago' : 'Never',
      registeredDate: student.createdAt.toISOString().split('T')[0],
      totalSpentETB: student.orders.reduce((sum, o) => sum + (o.status === 'APPROVED' ? o.expectedAmountETB : 0), 0) || 350,
      coursesCount: student.entitlements.length,
      enrolledCourses: student.entitlements.map((e) => ({
        courseId: e.courseId,
        courseTitle: e.course?.title ?? 'Course',
        stream: e.course?.stream ?? student.stream,
        accessStatus: e.status === 'ACTIVE' ? 'Paid' : 'Pending',
        expiresDateLabel: e.expiresAt.toISOString().split('T')[0],
      })),
      recentOrders: student.orders.map((o) => ({
        id: o.id,
        referenceNumber: o.transactionReference,
        bank: o.paymentMethodId === 'cbe' ? 'Commercial Bank of Ethiopia (CBE)' : 'Telebirr',
        amountETB: o.expectedAmountETB,
        approvedAt: o.approvedAt ? o.approvedAt.toISOString() : o.createdAt.toISOString(),
        approvedBy: 'Admin (admin@mastara.demo)',
      })),
    };
  }

  async releaseDeviceHardware(studentId: string): Promise<void> {
    await this.prisma.student.updateMany({
      where: {
        OR: [{ id: studentId }, { studentCode: studentId }],
      },
      data: { boundDeviceHardware: null },
    });
  }

  async grantOrExtendAccess(studentId: string, courseId: string, days: number, reason: string): Promise<void> {
    const student = await this.prisma.student.findFirst({
      where: { OR: [{ id: studentId }, { studentCode: studentId }] },
    });
    if (!student) return;

    const startsAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const existing = await this.prisma.entitlement.findFirst({
      where: { studentId: student.id, courseId },
    });

    if (existing) {
      await this.prisma.entitlement.update({
        where: { id: existing.id },
        data: {
          expiresAt,
          status: 'ACTIVE',
        },
      });
    } else {
      await this.prisma.entitlement.create({
        data: {
          studentId: student.id,
          courseId,
          productType: 'EXTRA_SINGLE_COURSE',
          startsAt,
          expiresAt,
          status: 'ACTIVE',
        },
      });
    }
  }
}

// --- COMMERCE PRICING REPOSITORY ---
export class PrismaCommercePricingRepository implements CommercePricingPort {
  private readonly quotes = new Map<string, PriceQuoteDto>();

  constructor(private readonly prisma: PrismaService) {}

  async getActiveSettings(): Promise<PaymentSettingsDto> {
    const record = await this.prisma.pricingConfig.findFirst({
      where: { isActive: true },
      orderBy: { configVersion: 'desc' },
    });
    if (!record) {
      return createDefaultPaymentSettings();
    }
    return {
      configVersion: record.configVersion,
      singleCoursesEnabled: record.singleCoursesEnabled,
      renewalWindowDays: record.renewalWindowDays,
      quoteExpiryMinutes: record.quoteExpiryMinutes,
      maxReceiptSizeBytes: record.maxReceiptSizeBytes,
      bundles: record.bundlesJson as any,
      bothStreamsPriceETB: record.bothStreamsPriceETB,
      bothStreamsDurationDays: record.bothStreamsDuration,
      extraCourseTiers: record.extraCourseTiersJson as any,
      paymentMethods: record.paymentMethodsJson as any,
    };
  }

  async saveSettings(nextSettings: PaymentSettingsDto): Promise<PaymentSettingsDto> {
    await this.prisma.pricingConfig.create({
      data: {
        configVersion: Date.now(),
        singleCoursesEnabled: nextSettings.singleCoursesEnabled,
        renewalWindowDays: nextSettings.renewalWindowDays,
        quoteExpiryMinutes: nextSettings.quoteExpiryMinutes,
        maxReceiptSizeBytes: nextSettings.maxReceiptSizeBytes,
        bundlesJson: nextSettings.bundles as any,
        extraCourseTiersJson: nextSettings.extraCourseTiers as any,
        paymentMethodsJson: nextSettings.paymentMethods as any,
        bothStreamsPriceETB: nextSettings.bothStreamsPriceETB,
        bothStreamsDuration: nextSettings.bothStreamsDurationDays,
        updatedByAdminId: '00000000-0000-0000-0000-000000000000',
        changeReason: 'Admin update via API',
      },
    });
    return nextSettings;
  }

  async findQuoteById(quoteId: string): Promise<PriceQuoteDto | null> {
    return this.quotes.get(quoteId) ?? null;
  }

  async findCoursesByIds(courseIds: string[]): Promise<CatalogCourseDto[]> {
    const courses = await this.prisma.course.findMany({
      where: { id: { in: courseIds } },
    });
    return courses.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      universityId: c.universityId,
      programId: c.programId,
      semester: c.semester as 1 | 2,
      stream: c.stream as AcademicStream,
      accent: c.accent as CourseAccentName,
      icon: c.icon,
      freeAccess: c.freeAccess,
      freeTrialCount: c.freeTrialCount,
      priceETB: c.priceETB,
      isActive: c.isActive,
      contentVersion: c.contentVersion,
    }));
  }

  async getActiveStudentEntitlements(studentId: string): Promise<EntitlementRecordDto[]> {
    const ents = await this.prisma.entitlement.findMany({
      where: { studentId, status: 'ACTIVE' },
    });
    return ents.map((e) => ({
      id: e.id,
      orderId: e.orderId ?? '',
      courseId: e.courseId,
      productType: e.productType as any,
      status: e.status as any,
      startsAt: e.startsAt.toISOString(),
      expiresAt: e.expiresAt.toISOString(),
    }));
  }

  async saveQuote(quote: PriceQuoteDto): Promise<void> {
    this.quotes.set(quote.quoteId, quote);
  }
}

// --- ORDERS REPOSITORY ---
export class PrismaOrdersRepository implements OrdersRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(work: (tx: CounterTransactionExecutor) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const executor: CounterTransactionExecutor = {
        $queryRaw: (strings: TemplateStringsArray, ...values: unknown[]) => tx.$queryRaw(strings, ...values),
      };
      return work(executor);
    });
  }

  async findQuoteById(_quoteId: string): Promise<PriceQuoteDto | null> {
    return null;
  }

  async getMaxReceiptSizeBytes(): Promise<number> {
    return 300 * 1024;
  }

  async findOrderByLocalAccountId(localAccountId: string): Promise<StoredOrderEntity | null> {
    const o = await this.prisma.order.findFirst({
      where: { localAccountId },
      orderBy: { createdAt: 'desc' },
    });
    if (!o) return null;
    return this.mapOrder(o);
  }

  async findOrderByTransactionRef(reference: string): Promise<StoredOrderEntity | null> {
    const o = await this.prisma.order.findUnique({
      where: { transactionReference: reference },
    });
    if (!o) return null;
    return this.mapOrder(o);
  }

  async findOrderById(orderId: string): Promise<StoredOrderEntity | null> {
    const o = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!o) return null;
    return this.mapOrder(o);
  }

  async countPendingOrdersByIdentifier(identifier: string): Promise<number> {
    return this.prisma.order.count({
      where: {
        status: 'PENDING',
        student: { identifier },
      },
    });
  }

  async listOrders(status?: string): Promise<StoredOrderEntity[]> {
    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status.toUpperCase();
    }
    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: true,
      },
    });
    return orders.map((o) => this.mapOrder(o));
  }

  async findStudentByIdentifier(identifier: string): Promise<StoredStudentEntity | null> {
    const s = await this.prisma.student.findFirst({
      where: {
        OR: [{ identifier }, { localAccountId: identifier }, { studentCode: identifier }],
      },
    });
    if (!s) return null;
    return this.mapStudent(s);
  }

  async findStudentById(studentId: string): Promise<StoredStudentEntity | null> {
    const s = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!s) return null;
    return this.mapStudent(s);
  }

  async insertOrder(data: Omit<StoredOrderEntity, 'id'>): Promise<StoredOrderEntity> {
    const created = await this.prisma.order.create({
      data: {
        studentId: data.studentId,
        localAccountId: data.localAccountId,
        claimSecretHash: data.claimSecretHash,
        pendingProfileJson: data.pendingProfile as any,
        pendingPasswordHash: data.pendingPasswordHash,
        deviceHardwareId: data.deviceHardwareId,
        quoteSnapshotJson: data.quoteSnapshot as any,
        configVersion: data.configVersion,
        orderType: data.orderType as any,
        expectedAmountETB: data.expectedAmountETB,
        durationDays: data.durationDays,
        paymentMethodId: data.paymentMethodId,
        transactionReference: data.transactionReference,
        receiptStorageKey: data.receiptStorageKey,
        status: data.status as any,
      },
    });
    return this.mapOrder(created);
  }

  async updateOrder(orderId: string, patch: Partial<StoredOrderEntity>): Promise<StoredOrderEntity> {
    const data: any = {};
    if (patch.status) data.status = patch.status as any;
    if (patch.rejectionReason !== undefined) data.rejectionReason = patch.rejectionReason;
    if (patch.reviewedByAdminId !== undefined) data.reviewedByAdminId = patch.reviewedByAdminId;
    if (patch.approvedAt !== undefined) data.approvedAt = patch.approvedAt ? new Date(patch.approvedAt) : null;
    if (patch.claimedAt !== undefined) data.claimedAt = patch.claimedAt ? new Date(patch.claimedAt) : null;
    if (patch.studentId !== undefined) data.studentId = patch.studentId;

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data,
    });
    return this.mapOrder(updated);
  }

  async createStudentInTx(
    _tx: CounterTransactionExecutor,
    data: Omit<StoredStudentEntity, 'id'>
  ): Promise<StoredStudentEntity> {
    const s = await this.prisma.student.create({
      data: {
        studentCode: data.studentCode,
        localAccountId: data.localAccountId,
        fullName: data.fullName,
        identifier: data.identifier,
        passwordHash: data.passwordHash,
        universityId: data.universityId,
        programId: data.programId,
        semester: data.semester,
        stream: data.stream as any,
        boundDeviceHardware: data.boundDeviceHardware,
      },
    });
    return this.mapStudent(s);
  }

  async insertEntitlementsInTx(
    _tx: CounterTransactionExecutor,
    entitlements: Omit<EntitlementRecordDto, 'id'>[]
  ): Promise<EntitlementRecordDto[]> {
    const results: EntitlementRecordDto[] = [];
    for (const ent of entitlements) {
      const created = await this.prisma.entitlement.create({
        data: {
          studentId: '00000000-0000-0000-0000-000000000000',
          orderId: ent.orderId,
          courseId: ent.courseId,
          status: ent.status as any,
          productType: ent.productType as any,
          startsAt: new Date(ent.startsAt),
          expiresAt: new Date(ent.expiresAt),
        },
      });
      results.push({
        id: created.id,
        orderId: created.orderId ?? ent.orderId,
        courseId: created.courseId,
        productType: created.productType as any,
        status: created.status as any,
        startsAt: created.startsAt.toISOString(),
        expiresAt: created.expiresAt.toISOString(),
      });
    }
    return results;
  }

  async listStudentEntitlements(studentId: string): Promise<EntitlementRecordDto[]> {
    const ents = await this.prisma.entitlement.findMany({ where: { studentId } });
    return ents.map((e) => ({
      id: e.id,
      orderId: e.orderId ?? '',
      courseId: e.courseId,
      productType: e.productType as any,
      status: e.status as any,
      startsAt: e.startsAt.toISOString(),
      expiresAt: e.expiresAt.toISOString(),
    }));
  }

  private mapOrder(o: any): StoredOrderEntity {
    return {
      id: o.id,
      studentId: o.studentId,
      localAccountId: o.localAccountId,
      claimSecretHash: o.claimSecretHash,
      pendingProfile: o.pendingProfileJson as any,
      pendingPasswordHash: o.pendingPasswordHash,
      deviceHardwareId: o.deviceHardwareId,
      quoteSnapshot: o.quoteSnapshotJson as any,
      configVersion: o.configVersion,
      orderType: o.orderType as any,
      expectedAmountETB: o.expectedAmountETB,
      durationDays: o.durationDays,
      paymentMethodId: o.paymentMethodId,
      transactionReference: o.transactionReference,
      receiptStorageKey: o.receiptStorageKey,
      status: o.status as any,
      rejectionReason: o.rejectionReason,
      reviewedByAdminId: o.reviewedByAdminId,
      approvedAt: o.approvedAt?.toISOString() ?? null,
      claimedAt: o.claimedAt?.toISOString() ?? null,
      submittedAt: o.createdAt.toISOString(),
    };
  }

  private mapStudent(s: any): StoredStudentEntity {
    return {
      id: s.id,
      studentCode: s.studentCode,
      localAccountId: s.localAccountId,
      fullName: s.fullName,
      identifier: s.identifier,
      passwordHash: s.passwordHash,
      universityId: s.universityId,
      programId: s.programId,
      semester: s.semester as 1 | 2,
      stream: s.stream as 'NATURAL' | 'SOCIAL',
      boundDeviceHardware: s.boundDeviceHardware,
      deviceBoundAt: s.deviceBoundAt?.toISOString() ?? null,
    };
  }
}

// --- REFUND REPOSITORY ---
export class PrismaRefundRepository implements RefundRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findOrderAmountAndStatus(orderId: string): Promise<{ amountETB: number; status: string } | null> {
    const o = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!o) return null;
    return { amountETB: o.expectedAmountETB, status: o.status };
  }

  async createRefund(data: Omit<RefundRecordDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<RefundRecordDto> {
    const r = await this.prisma.refund.create({
      data: {
        orderId: data.orderId,
        amountETB: data.amountETB,
        status: data.status as any,
        reason: data.reason,
        requestedByAdminId: data.requestedByAdminId,
      },
    });
    return this.mapRefund(r);
  }

  async findRefundById(id: string): Promise<RefundRecordDto | null> {
    const r = await this.prisma.refund.findUnique({ where: { id } });
    if (!r) return null;
    return this.mapRefund(r);
  }

  async updateRefund(id: string, patch: Partial<RefundRecordDto>): Promise<RefundRecordDto> {
    const data: any = {};
    if (patch.status) data.status = patch.status as any;
    if (patch.approvedByAdminId !== undefined) data.approvedByAdminId = patch.approvedByAdminId;
    if (patch.payoutReference !== undefined) data.payoutReference = patch.payoutReference;

    const r = await this.prisma.refund.update({
      where: { id },
      data,
    });
    return this.mapRefund(r);
  }

  async revokeEntitlementsForOrderOnly(
    orderId: string,
    revokedByAdminId: string,
    reason: string
  ): Promise<EntitlementRecordDto[]> {
    await this.prisma.entitlement.updateMany({
      where: { orderId },
      data: {
        status: 'REVOKED',
        revokedByAdminId,
        revocationReason: reason,
        revokedAt: new Date(),
      },
    });
    const ents = await this.prisma.entitlement.findMany({ where: { orderId } });
    return ents.map((e) => ({
      id: e.id,
      orderId: e.orderId ?? '',
      courseId: e.courseId,
      productType: e.productType as any,
      status: e.status as any,
      startsAt: e.startsAt.toISOString(),
      expiresAt: e.expiresAt.toISOString(),
    }));
  }

  private mapRefund(r: any): RefundRecordDto {
    return {
      id: r.id,
      orderId: r.orderId,
      amountETB: r.amountETB,
      status: r.status as RefundStatus,
      reason: r.reason,
      requestedByAdminId: r.requestedByAdminId,
      approvedByAdminId: r.approvedByAdminId,
      payoutReference: r.payoutReference,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }
}

// --- SUPPORT COMMS REPOSITORY ---
export class PrismaSupportCommsRepository implements SupportCommsRepositoryPort {
  private inMemoryTickets: SupportTicketDto[] = [];

  constructor(private readonly prisma: PrismaService) {}

  async listTickets(status?: string): Promise<SupportTicketDto[]> {
    if (status) {
      return this.inMemoryTickets.filter((t) => t.status === status);
    }
    return this.inMemoryTickets;
  }

  async replyTicket(ticketId: string, reply: string): Promise<void> {
    const ticket = this.inMemoryTickets.find((t) => t.id === ticketId);
    if (ticket) {
      ticket.status = 'RESOLVED';
      ticket.replyMessage = reply;
    }
  }
}

// --- SYNC REPOSITORY ---
export class PrismaSyncRepository implements SyncRepositoryPort {
  private progressMap: Map<string, Map<string, ProgressStateRecord>> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  async getStudentProgress(studentId: string): Promise<Map<string, ProgressStateRecord>> {
    let studentStore = this.progressMap.get(studentId);
    if (!studentStore) {
      studentStore = new Map();
      this.progressMap.set(studentId, studentStore);
    }
    return new Map(studentStore);
  }

  async saveStudentProgress(studentId: string, records: ProgressStateRecord[]): Promise<void> {
    let studentStore = this.progressMap.get(studentId);
    if (!studentStore) {
      studentStore = new Map();
      this.progressMap.set(studentId, studentStore);
    }
    for (const record of records) {
      studentStore.set(record.chapterId, record);
    }
  }
}

// --- CONTENT REPOSITORY ---
export class PrismaContentRepository implements ContentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async createChapter(data: Omit<ChapterContentRecord, 'id'>): Promise<ChapterContentRecord> {
    let bookGroupId = data.bookGroupId;
    if (!bookGroupId) {
      const existingBg = await this.prisma.bookGroup.findFirst({
        where: { courseId: data.courseId, category: data.category as any },
      });
      if (existingBg) {
        bookGroupId = existingBg.id;
      } else {
        const newBg = await this.prisma.bookGroup.create({
          data: {
            courseId: data.courseId,
            category: data.category as any,
            code: `BG-${data.category}-${Date.now().toString(36).toUpperCase()}`,
            title: `${data.category} Material Group`,
            orderIndex: 1,
            version: 1,
          },
        });
        bookGroupId = newBg.id;
      }
    }

    const ch = await this.prisma.content.create({
      data: {
        courseId: data.courseId,
        bookGroupId: bookGroupId,
        category: data.category as any,
        orderIndex: data.orderIndex,
        title: data.title,
        bodyMarkdownLatex: data.bodyMarkdownLatex,
        pdfStorageKey: data.pdfStorageKey,
        isFree: data.isFree,
        timeAllowedMinutes: data.timeAllowedMinutes ?? null,
        estimatedSizeBytes: data.estimatedSizeBytes,
        status: data.status as any,
        authoredById: data.authoredById,
        version: data.version,
      },
      include: {
        course: {
          include: {
            university: true,
            program: true,
          },
        },
      },
    });
    return this.mapChapter(ch);
  }

  async findChapterById(id: string): Promise<ChapterContentRecord | null> {
    const ch = await this.prisma.content.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            university: true,
            program: true,
          },
        },
      },
    });
    if (!ch) return null;
    return this.mapChapter(ch);
  }

  async updateChapter(id: string, patch: Partial<ChapterContentRecord>): Promise<ChapterContentRecord> {
    const data: any = {};
    if (patch.title !== undefined) data.title = patch.title;
    if (patch.orderIndex !== undefined) data.orderIndex = patch.orderIndex;
    if (patch.status !== undefined) data.status = patch.status as any;
    if (patch.reviewedById !== undefined) data.reviewedById = patch.reviewedById;
    if (patch.version !== undefined) data.version = patch.version;
    if (patch.bodyMarkdownLatex !== undefined) data.bodyMarkdownLatex = patch.bodyMarkdownLatex;
    if (patch.pdfStorageKey !== undefined) data.pdfStorageKey = patch.pdfStorageKey;

    const ch = await this.prisma.content.update({
      where: { id },
      data,
      include: {
        course: {
          include: {
            university: true,
            program: true,
          },
        },
      },
    });
    return this.mapChapter(ch);
  }

  async bumpCourseContentVersion(courseId: string): Promise<void> {
    await this.prisma.course.update({
      where: { id: courseId },
      data: { contentVersion: { increment: 1 } },
    });
  }

  async listBookGroups(filter?: {
    courseId?: string;
    category?: string;
  }): Promise<BookGroupRecord[]> {
    const where: any = {};
    if (filter?.courseId && filter.courseId !== 'ALL') where.courseId = filter.courseId;
    if (filter?.category && filter.category !== 'ALL') where.category = filter.category as any;

    const list = await this.prisma.bookGroup.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
      include: {
        _count: {
          select: { chapters: true },
        },
      },
    });

    return list.map((bg) => ({
      id: bg.id,
      courseId: bg.courseId,
      category: bg.category as any,
      code: bg.code,
      title: bg.title,
      subtitle: bg.subtitle,
      orderIndex: bg.orderIndex,
      version: bg.version,
      chaptersCount: bg._count?.chapters || 0,
    }));
  }

  async createBookGroup(data: {
    courseId: string;
    category: MaterialType | QuizTarget;
    title: string;
    subtitle?: string | undefined;
    code?: string | undefined;
    orderIndex?: number | undefined;
  }): Promise<BookGroupRecord> {
    const count = await this.prisma.bookGroup.count({
      where: { courseId: data.courseId, category: data.category as any },
    });
    const orderIndex = data.orderIndex ?? count + 1;
    const code = data.code ?? `BG-${data.category}-${Date.now().toString(36).toUpperCase()}`;

    const created = await this.prisma.bookGroup.create({
      data: {
        courseId: data.courseId,
        category: data.category as any,
        code,
        title: data.title.trim(),
        subtitle: data.subtitle?.trim() || '',
        orderIndex,
        version: 1,
      },
    });

    return {
      id: created.id,
      courseId: created.courseId,
      category: created.category as any,
      code: created.code,
      title: created.title,
      subtitle: created.subtitle,
      orderIndex: created.orderIndex,
      version: created.version,
      chaptersCount: 0,
    };
  }

  async listChapters(filter?: {
    courseId?: string;
    bookGroupId?: string;
    category?: string;
    status?: string;
    universityId?: string;
    programId?: string;
  }): Promise<ChapterContentRecord[]> {
    const where: any = {};
    if (filter?.courseId && filter.courseId !== 'ALL') where.courseId = filter.courseId;
    if (filter?.bookGroupId && filter.bookGroupId !== 'ALL') where.bookGroupId = filter.bookGroupId;
    if (filter?.category && filter.category !== 'ALL') where.category = filter.category as any;
    if (filter?.status && filter.status !== 'ALL') where.status = filter.status as any;

    if ((filter?.universityId && filter.universityId !== 'ALL') || (filter?.programId && filter.programId !== 'ALL')) {
      where.course = {};
      if (filter?.universityId && filter.universityId !== 'ALL') {
        where.course.universityId = filter.universityId;
      }
      if (filter?.programId && filter.programId !== 'ALL') {
        where.course.programId = filter.programId;
      }
    }

    const list = await this.prisma.content.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
      include: {
        course: {
          include: {
            university: true,
            program: true,
          },
        },
        bookGroup: true,
      },
    });
    return list.map((c) => this.mapChapter(c));
  }

  private mapChapter(ch: any): ChapterContentRecord {
    return {
      id: ch.id,
      courseId: ch.courseId,
      bookGroupId: ch.bookGroupId,
      category: ch.category as MaterialType | QuizTarget,
      orderIndex: ch.orderIndex,
      title: ch.title,
      isFree: ch.isFree,
      timeAllowedMinutes: ch.timeAllowedMinutes,
      estimatedSizeBytes: ch.estimatedSizeBytes,
      status: ch.status as ContentStatus,
      version: ch.version,
      bodyMarkdownLatex: ch.bodyMarkdownLatex,
      pdfStorageKey: ch.pdfStorageKey,
      authoredById: ch.authoredById,
      reviewedById: ch.reviewedById,
      courseCode: ch.course?.code,
      courseTitle: ch.course?.title,
      universityName: ch.course?.university?.name,
      programName: ch.course?.program?.name,
      bookGroupTitle: ch.bookGroup?.title,
    };
  }
}

// --- ASSESSMENT REPOSITORY ---
export class PrismaAssessmentRepository implements AssessmentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(work: (tx: CounterTransactionExecutor) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const executor: CounterTransactionExecutor = {
        $queryRaw: (strings: TemplateStringsArray, ...values: unknown[]) => tx.$queryRaw(strings, ...values),
      };
      return work(executor);
    });
  }

  async createExamSet(
    data: CreateExamSetInput & {
      authoredById: string;
      status: ContentStatus;
      version: number;
    }
  ): Promise<CatalogExamSetMetaDto> {
    const exam = await this.prisma.examSet.create({
      data: {
        examSetCode: data.examSetCode,
        courseId: data.courseId,
        universityId: data.universityId,
        programId: data.programId,
        semester: data.semester,
        stream: data.stream as any,
        year: data.year,
        category: data.category as any,
        title: data.title,
        timeAllowedMinutes: data.timeAllowedMinutes,
        isFreeSample: data.isFreeSample ?? false,
        version: data.version,
        status: data.status as any,
        authoredById: data.authoredById,
      },
    });
    return {
      id: exam.id,
      examSetCode: exam.examSetCode,
      category: exam.category as ExamCategory,
      universityId: exam.universityId,
      programId: exam.programId,
      courseId: exam.courseId,
      semester: exam.semester as 1 | 2 | null,
      stream: exam.stream as AcademicStream | null,
      year: exam.year,
      title: exam.title,
      questionCount: 0,
      timeAllowedMinutes: exam.timeAllowedMinutes,
      isFreeSample: exam.isFreeSample,
      version: exam.version,
      status: exam.status as ContentStatus,
    };
  }

  async listExamSets(filter?: { category?: string | undefined; courseId?: string | undefined }): Promise<CatalogExamSetMetaDto[]> {
    const where: any = {};
    if (filter?.category) where.category = filter.category as any;
    if (filter?.courseId) where.courseId = filter.courseId;
    const sets = await this.prisma.examSet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { questions: true } } },
    });
    return sets.map((exam) => ({
      id: exam.id,
      examSetCode: exam.examSetCode,
      category: exam.category as ExamCategory,
      universityId: exam.universityId,
      programId: exam.programId,
      courseId: exam.courseId,
      semester: exam.semester as 1 | 2 | null,
      stream: exam.stream as AcademicStream | null,
      year: exam.year,
      title: exam.title,
      questionCount: exam._count.questions,
      timeAllowedMinutes: exam.timeAllowedMinutes,
      isFreeSample: exam.isFreeSample,
      version: exam.version,
      status: exam.status as ContentStatus,
    }));
  }

  async findExamSetById(id: string): Promise<
    | (CatalogExamSetMetaDto & {
        authoredById: string;
        reviewedById: string | null;
      })
    | null
  > {
    const exam = await this.prisma.examSet.findUnique({
      where: { id },
      include: { questions: true },
    });
    if (!exam) return null;
    return {
      id: exam.id,
      examSetCode: exam.examSetCode,
      category: exam.category as ExamCategory,
      universityId: exam.universityId,
      programId: exam.programId,
      courseId: exam.courseId,
      semester: exam.semester as 1 | 2 | null,
      stream: exam.stream as AcademicStream | null,
      year: exam.year,
      title: exam.title,
      questionCount: exam.questions.length,
      timeAllowedMinutes: exam.timeAllowedMinutes,
      isFreeSample: exam.isFreeSample,
      version: exam.version,
      status: exam.status as ContentStatus,
      authoredById: exam.authoredById,
      reviewedById: exam.reviewedById,
    };
  }

  async updateExamSetStatus(
    id: string,
    status: ContentStatus,
    reviewedById: string | null,
    nextVersion: number
  ): Promise<CatalogExamSetMetaDto> {
    const exam = await this.prisma.examSet.update({
      where: { id },
      data: {
        status: status as any,
        reviewedById,
        version: nextVersion,
      },
      include: { questions: true },
    });
    return {
      id: exam.id,
      examSetCode: exam.examSetCode,
      category: exam.category as ExamCategory,
      universityId: exam.universityId,
      programId: exam.programId,
      courseId: exam.courseId,
      semester: exam.semester as 1 | 2 | null,
      stream: exam.stream as AcademicStream | null,
      year: exam.year,
      title: exam.title,
      questionCount: exam.questions.length,
      timeAllowedMinutes: exam.timeAllowedMinutes,
      isFreeSample: exam.isFreeSample,
      version: exam.version,
      status: exam.status as ContentStatus,
    };
  }

  async listQuestionsInTarget(
    targetType: 'EXAM_SET' | 'QUIZ_CHAPTER',
    targetId: string
  ): Promise<StoredQuestionRecord[]> {
    const questions = await this.prisma.question.findMany({
      where:
        targetType === 'EXAM_SET'
          ? { examSetId: targetId }
          : { quizChapterId: targetId },
      orderBy: { displayNumber: 'asc' },
    });
    return questions.map((q) => this.mapQuestion(q));
  }

  async findQuestionById(id: string): Promise<StoredQuestionRecord | null> {
    const q = await this.prisma.question.findUnique({ where: { id } });
    if (!q) return null;
    return this.mapQuestion(q);
  }

  async insertQuestion(data: Omit<StoredQuestionRecord, 'id'>): Promise<StoredQuestionRecord> {
    let examSetId = data.examSetId;
    let quizChapterId = data.quizChapterId;
    if (!examSetId && !quizChapterId) {
      const defaultSet = await this.prisma.examSet.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      if (defaultSet) {
        examSetId = defaultSet.id;
      }
    }

    let displayNumber = data.displayNumber;
    if (!displayNumber || displayNumber <= 0) {
      const count = await this.prisma.question.count({
        where: examSetId ? { examSetId } : { quizChapterId },
      });
      displayNumber = count + 1;
    }

    const q = await this.prisma.question.create({
      data: {
        examSetId,
        quizChapterId,
        status: data.status as any,
        authoredById: data.authoredById,
        displayNumber,
        questionType: data.questionType as any,
        promptLatex: data.promptLatex,
        optionsJson: (data.options ?? undefined) as any,
        correctOptionId: data.correctOptionId ?? null,
        correctBoolean: data.correctBoolean ?? null,
        acceptedAnswers: (data.acceptedAnswers ?? undefined) as any,
        explanationLatex: data.explanationLatex,
      },
    });
    return this.mapQuestion(q);
  }

  async updateQuestionDisplayNumber(
    questionId: string,
    newDisplayNumber: number
  ): Promise<StoredQuestionRecord> {
    const q = await this.prisma.question.update({
      where: { id: questionId },
      data: { displayNumber: newDisplayNumber },
    });
    return this.mapQuestion(q);
  }

  async deleteQuestionAndRenumberLaterOnes(
    targetType: 'EXAM_SET' | 'QUIZ_CHAPTER',
    targetId: string,
    deletedQuestionId: string,
    deletedDisplayNumber: number
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.question.delete({ where: { id: deletedQuestionId } });
      const condition =
        targetType === 'EXAM_SET'
          ? { examSetId: targetId }
          : { quizChapterId: targetId };
      await tx.question.updateMany({
        where: {
          ...condition,
          displayNumber: { gt: deletedDisplayNumber },
        },
        data: {
          displayNumber: { decrement: 1 },
        },
      });
    });
  }

  async bumpParentCourseContentVersion(courseId: string): Promise<void> {
    await this.prisma.course.update({
      where: { id: courseId },
      data: { contentVersion: { increment: 1 } },
    });
  }

  async listBankQuestions(filter?: QuestionBankFilter): Promise<QuestionBankItemDto[]> {
    const where: any = {};

    if (filter?.category && filter.category !== 'ALL') {
      where.examSet = {
        category: filter.category as any,
      };
    }

    if (filter?.quizTab && filter.quizTab !== 'ALL') {
      where.quizChapterId = { not: null };
    }

    if (filter?.year && filter.year !== 'ALL') {
      where.examSet = {
        ...(where.examSet || {}),
        year: filter.year,
      };
    }

    if (filter?.courseId && filter.courseId !== 'ALL') {
      where.OR = [
        { examSet: { courseId: filter.courseId } },
        { quizChapter: { courseId: filter.courseId } },
      ];
    }

    if (filter?.universityId && filter.universityId !== 'ALL') {
      const uniFilter = [
        { examSet: { universityId: filter.universityId } },
        { examSet: { course: { universityId: filter.universityId } } },
        { quizChapter: { course: { universityId: filter.universityId } } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: uniFilter }];
        delete where.OR;
      } else {
        where.OR = uniFilter;
      }
    }

    if (filter?.programId && filter.programId !== 'ALL') {
      const progFilter = [
        { examSet: { programId: filter.programId } },
        { examSet: { course: { programId: filter.programId } } },
        { quizChapter: { course: { programId: filter.programId } } },
      ];
      if (where.AND) {
        where.AND.push({ OR: progFilter });
      } else if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: progFilter }];
        delete where.OR;
      } else {
        where.OR = progFilter;
      }
    }

    if (filter?.semester != null && (filter.semester as any) !== 'ALL') {
      const sem = Number(filter.semester);
      const semFilter = [
        { examSet: { semester: sem } },
        { examSet: { course: { semester: sem } } },
        { quizChapter: { course: { semester: sem } } },
      ];
      if (where.AND) {
        where.AND.push({ OR: semFilter });
      } else if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: semFilter }];
        delete where.OR;
      } else {
        where.OR = semFilter;
      }
    }

    if (filter?.stream && filter.stream !== 'ALL') {
      const str = filter.stream as any;
      const streamFilter = [
        { examSet: { stream: str } },
        { examSet: { course: { stream: str } } },
        { quizChapter: { course: { stream: str } } },
      ];
      if (where.AND) {
        where.AND.push({ OR: streamFilter });
      } else if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: streamFilter }];
        delete where.OR;
      } else {
        where.OR = streamFilter;
      }
    }

    if (filter?.search && filter.search.trim()) {
      const term = filter.search.trim();
      const searchFilter = [
        { promptLatex: { contains: term, mode: 'insensitive' } },
        { explanationLatex: { contains: term, mode: 'insensitive' } },
      ];
      if (where.AND) {
        where.AND.push({ OR: searchFilter });
      } else if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchFilter }];
        delete where.OR;
      } else {
        where.OR = searchFilter;
      }
    }

    const list = await this.prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        examSet: {
          include: {
            course: {
              include: { university: true, program: true },
            },
          },
        },
        quizChapter: {
          include: {
            course: {
              include: { university: true, program: true },
            },
          },
        },
      },
    });

    return list.map((q) => {
      const course = q.examSet?.course || q.quizChapter?.course;
      const university = course?.university;
      const program = course?.program;
      const targetType: 'EXAM_SET' | 'QUIZ_CHAPTER' = q.examSetId ? 'EXAM_SET' : 'QUIZ_CHAPTER';
      const targetId = (q.examSetId || q.quizChapterId) as string;
      const targetTitle = q.examSet?.title || q.quizChapter?.title || 'Assessment';

      return {
        id: q.id,
        displayNumber: q.displayNumber,
        questionType: q.questionType as QuestionType,
        promptLatex: q.promptLatex,
        options: (q.optionsJson as any) || [],
        correctOptionId: q.correctOptionId,
        correctBoolean: q.correctBoolean,
        acceptedAnswers: (q.acceptedAnswers as any) || null,
        explanationLatex: q.explanationLatex,
        status: q.status as ContentStatus,
        targetType,
        targetId,
        targetTitle,
        examSetCode: q.examSet?.examSetCode,
        category: q.examSet?.category || (q.quizChapter ? 'QUIZ' : undefined),
        courseId: course?.id || q.examSet?.courseId || null,
        courseCode: course?.code || 'GEN',
        courseTitle: course?.title || 'General Studies',
        universityId: university?.id || q.examSet?.universityId || null,
        universityName: university?.name || 'National Examination Board',
        universityShortName: university?.shortName || 'NAT',
        programId: program?.id || q.examSet?.programId || null,
        programName: program?.name || 'Common Curriculum',
        semester: q.examSet?.semester ?? course?.semester ?? 1,
        stream: (q.examSet?.stream || course?.stream || 'COMMON') as string,
        year: q.examSet?.year || '2024',
      };
    });
  }

  private mapQuestion(q: any): StoredQuestionRecord {
    const record: StoredQuestionRecord = {
      id: q.id,
      examSetId: q.examSetId,
      quizChapterId: q.quizChapterId,
      status: q.status as ContentStatus,
      authoredById: q.authoredById,
      reviewedById: q.reviewedById,
      displayNumber: q.displayNumber,
      questionType: q.questionType as QuestionType,
      promptLatex: q.promptLatex,
      explanationLatex: q.explanationLatex,
    };
    if (q.optionsJson) {
      record.options = q.optionsJson as { id: string; textLatex: string }[];
    }
    if (q.correctOptionId != null) {
      record.correctOptionId = q.correctOptionId;
    }
    if (q.correctBoolean != null) {
      record.correctBoolean = q.correctBoolean;
    }
    if (q.acceptedAnswers) {
      record.acceptedAnswers = q.acceptedAnswers as string[];
    }
    return record;
  }
}
