import { Injectable } from '@nestjs/common';
import {
  AcademicStream,
  CatalogCourseDto,
  CatalogProgramDto,
  CatalogUniversityDto,
  mastera_ERROR_CODES,
  PaginatedQueryDto,
  PaginatedResponseDto,
} from '@mastera/contracts';
import {
  COURSE_ACCENT_NAMES,
  CourseAccentName,
} from '@mastera/ui-tokens';
import { AuditService } from '../audit-reports/audit.service';
import {
  AuthenticatedAdminContext,
  ScopeAuthorizationService,
} from '../permissions/scope.service';
import {
  buildPaginatedResponse,
  normalizePagination,
} from '../../common/pagination/pagination.helper';

export interface CreateUniversityInput {
  name: string;
  shortName: string;
  isActive?: boolean | undefined;
}

export interface CreateProgramInput {
  universityId: string;
  name: string;
  isActive?: boolean | undefined;
}

export interface CreateCourseInput {
  code: string;
  title: string;
  universityId: string | null;
  programId: string | null;
  semester: 1 | 2;
  stream: AcademicStream;
  accent?: CourseAccentName | undefined;
  icon?: string | undefined;
  freeAccess?: boolean | undefined;
  freeTrialCount?: number | undefined;
  priceETB?: number | undefined;
  isActive?: boolean | undefined;
}

export interface UpdateCourseInput {
  title?: string | undefined;
  semester?: 1 | 2 | undefined;
  stream?: AcademicStream | undefined;
  accent?: CourseAccentName | undefined;
  icon?: string | undefined;
  isActive?: boolean | undefined;
  // Commercial / Revenue controls (Super Admin only, reason required per Section 4.3)
  freeAccess?: boolean | undefined;
  freeTrialCount?: number | undefined;
  priceETB?: number | undefined;
  reason?: string | undefined;
}

export interface CatalogRepositoryPort {
  createUniversity(data: CreateUniversityInput): Promise<CatalogUniversityDto>;
  listUniversities(
    skip: number,
    take: number,
    search?: string
  ): Promise<{ items: CatalogUniversityDto[]; total: number }>;

  createProgram(data: CreateProgramInput): Promise<CatalogProgramDto>;
  listPrograms(
    skip: number,
    take: number,
    universityId?: string,
    search?: string
  ): Promise<{ items: CatalogProgramDto[]; total: number }>;

  findCourseById(courseId: string): Promise<CatalogCourseDto | null>;
  createCourse(
    data: Required<CreateCourseInput> & { contentVersion: number }
  ): Promise<CatalogCourseDto>;
  updateCourse(
    courseId: string,
    patch: Partial<CatalogCourseDto>
  ): Promise<CatalogCourseDto>;
  listCourses(params: {
    skip: number;
    take: number;
    search?: string | undefined;
    universityId?: string | undefined;
    programId?: string | undefined;
    semester?: 1 | 2 | undefined;
    stream?: AcademicStream | undefined;
    isActive?: boolean | undefined;
    scopedCourseIds?: string[] | undefined;
  }): Promise<{ items: CatalogCourseDto[]; total: number }>;
}

@Injectable()
export class AcademicCatalogService {
  constructor(
    private readonly repo: CatalogRepositoryPort,
    private readonly scopeAuth: ScopeAuthorizationService,
    private readonly auditService: AuditService
  ) {}

  async listUniversities(
    skip = 0,
    take = 100,
    search?: string
  ): Promise<{ items: CatalogUniversityDto[]; total: number }> {
    return this.repo.listUniversities(skip, take, search);
  }

  async listPrograms(
    skip = 0,
    take = 100,
    universityId?: string,
    search?: string
  ): Promise<{ items: CatalogProgramDto[]; total: number }> {
    return this.repo.listPrograms(skip, take, universityId, search);
  }

  async findCourseById(courseId: string): Promise<CatalogCourseDto | null> {
    return this.repo.findCourseById(courseId);
  }

  async deleteCourse(
    actor: AuthenticatedAdminContext,
    courseId: string
  ): Promise<{ success: boolean }> {
    await this.repo.updateCourse(courseId, { isActive: false });
    return { success: true };
  }

  async createUniversity(
    actor: AuthenticatedAdminContext,
    input: CreateUniversityInput
  ): Promise<CatalogUniversityDto> {
    const decision = await this.scopeAuth.authorizeAdminAction(
      actor,
      'CATALOG_CREATE_DELETE'
    );
    if (!decision.allowed) {
      throw new Error(`${decision.errorCode}: ${decision.reason}`);
    }

    const created = await this.repo.createUniversity({
      name: input.name.trim(),
      shortName: input.shortName.trim().toUpperCase(),
      isActive: input.isActive ?? false, // Default Inactive per UI modal screenshot
    });

    await this.auditService.record({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'UNIVERSITY_CREATED',
      resourceType: 'UNIVERSITY',
      resourceId: created.id,
      newValue: { ...created },
    });

    return created;
  }

  async createProgram(
    actor: AuthenticatedAdminContext,
    input: CreateProgramInput
  ): Promise<CatalogProgramDto> {
    const decision = await this.scopeAuth.authorizeAdminAction(
      actor,
      'CATALOG_CREATE_DELETE'
    );
    if (!decision.allowed) {
      throw new Error(`${decision.errorCode}: ${decision.reason}`);
    }

    const created = await this.repo.createProgram({
      universityId: input.universityId,
      name: input.name.trim(),
      isActive: input.isActive ?? false, // Default Inactive per UI modal screenshot
    });

    await this.auditService.record({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'PROGRAM_CREATED',
      resourceType: 'PROGRAM',
      resourceId: created.id,
      newValue: { ...created },
    });

    return created;
  }

  async createCourse(
    actor: AuthenticatedAdminContext,
    input: CreateCourseInput
  ): Promise<CatalogCourseDto> {
    const decision = await this.scopeAuth.authorizeAdminAction(
      actor,
      'CATALOG_CREATE_DELETE'
    );
    if (!decision.allowed) {
      throw new Error(`${decision.errorCode}: ${decision.reason}`);
    }

    const accent: CourseAccentName =
      input.accent && COURSE_ACCENT_NAMES.includes(input.accent)
        ? input.accent
        : 'blue';

    const freeTrialCount = input.freeTrialCount ?? 0;
    if (freeTrialCount < 0 || freeTrialCount > 20) {
      throw new Error(
        'Validation error: freeTrialCount must be between 0 and 20.'
      );
    }

    const priceETB = input.priceETB ?? 60;
    if (priceETB < 0) {
      throw new Error('Validation error: priceETB must be non-negative.');
    }

    const created = await this.repo.createCourse({
      code: input.code.trim().toUpperCase(),
      title: input.title.trim(),
      universityId: input.universityId,
      programId: input.programId,
      semester: input.semester,
      stream: input.stream,
      accent,
      icon: input.icon?.trim() || 'book',
      freeAccess: input.freeAccess ?? false,
      freeTrialCount,
      priceETB,
      isActive: input.isActive ?? false,
      contentVersion: 1, // DWN-06: default content_version is 1
    });

    await this.auditService.record({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'COURSE_CREATED',
      resourceType: 'COURSE',
      resourceId: created.id,
      newValue: { ...created },
    });

    return created;
  }

  /**
   * Updates a course and bumps contentVersion whenever details, active state,
   * or Free/Paid access flags change (Section 8.3, Section 8.4).
   * Enforces Super Admin exclusivity on commercial fields (Section 4.3).
   */
  async updateCourse(
    actor: AuthenticatedAdminContext,
    courseId: string,
    input: UpdateCourseInput
  ): Promise<CatalogCourseDto> {
    const existing = await this.repo.findCourseById(courseId);
    if (!existing) {
      throw new Error('Course not found.');
    }

    const editDecision = await this.scopeAuth.authorizeAdminAction(
      actor,
      'CATALOG_EDIT_SCOPED',
      {
        universityId: existing.universityId,
        programId: existing.programId,
        courseId: existing.id,
      }
    );
    if (!editDecision.allowed) {
      throw new Error(`${editDecision.errorCode}: ${editDecision.reason}`);
    }

    const touchesCommercialSettings =
      input.freeAccess !== undefined ||
      input.freeTrialCount !== undefined ||
      input.priceETB !== undefined;

    if (touchesCommercialSettings) {
      const commercialDecision = await this.scopeAuth.authorizeAdminAction(
        actor,
        'COURSE_FREE_ACCESS_AND_TRIAL_SET',
        { courseId: existing.id }
      );
      if (!commercialDecision.allowed) {
        throw new Error(
          `${mastera_ERROR_CODES.PERMISSION_DENIED}: Only Super Admin may change Free Access, free-trial count, or course price.`
        );
      }

      if (!input.reason || input.reason.trim().length < 3) {
        throw new Error(
          'Audit reason is required when changing course Free Access, free-trial count, or price (Section 4.3).'
        );
      }
    }

    // Bump contentVersion on edit, deactivate, or Free <-> Paid change (Section 8.3, 8.4)
    const nextContentVersion = existing.contentVersion + 1;

    const updated = await this.repo.updateCourse(courseId, {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.semester !== undefined ? { semester: input.semester } : {}),
      ...(input.stream !== undefined ? { stream: input.stream } : {}),
      ...(input.accent !== undefined ? { accent: input.accent } : {}),
      ...(input.icon !== undefined ? { icon: input.icon.trim() } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.freeAccess !== undefined ? { freeAccess: input.freeAccess } : {}),
      ...(input.freeTrialCount !== undefined
        ? { freeTrialCount: input.freeTrialCount }
        : {}),
      ...(input.priceETB !== undefined ? { priceETB: input.priceETB } : {}),
      contentVersion: nextContentVersion,
    });

    if (touchesCommercialSettings && input.reason) {
      await this.auditService.recordReasonRequiredMutation({
        actorId: actor.adminId,
        actorRole: actor.adminRole,
        action: 'COURSE_COMMERCIAL_SETTINGS_UPDATED',
        resourceType: 'COURSE',
        resourceId: courseId,
        reason: input.reason,
        previousValue: {
          freeAccess: existing.freeAccess,
          freeTrialCount: existing.freeTrialCount,
          priceETB: existing.priceETB,
          contentVersion: existing.contentVersion,
        },
        newValue: {
          freeAccess: updated.freeAccess,
          freeTrialCount: updated.freeTrialCount,
          priceETB: updated.priceETB,
          contentVersion: updated.contentVersion,
        },
      });
    } else {
      await this.auditService.record({
        actorId: actor.adminId,
        actorRole: actor.adminRole,
        action: 'COURSE_UPDATED',
        resourceType: 'COURSE',
        resourceId: courseId,
        previousValue: { ...existing },
        newValue: { ...updated },
      });
    }

    return updated;
  }

  /**
   * Lists courses with standard pagination (FR-G40..G44) and automatic scope
   * filtering for Academic Admins (FR-G61).
   */
  async listCoursesForAdmin(
    actor: AuthenticatedAdminContext,
    query: PaginatedQueryDto & {
      universityId?: string;
      programId?: string;
      semester?: 1 | 2;
      stream?: AcademicStream;
      isActive?: boolean;
    }
  ): Promise<PaginatedResponseDto<CatalogCourseDto>> {
    const viewDecision = await this.scopeAuth.authorizeAdminAction(
      actor,
      'CATALOG_VIEW'
    );
    if (!viewDecision.allowed) {
      throw new Error(`${viewDecision.errorCode}: ${viewDecision.reason}`);
    }

    const pagination = normalizePagination(query);
    const scopedCourseIds =
      actor.adminRole === 'ACADEMIC_ADMIN'
        ? actor.scopes
            .map((s) => s.courseId)
            .filter((id): id is string => typeof id === 'string')
        : undefined;

    const { items, total } = await this.repo.listCourses({
      skip: pagination.skip,
      take: pagination.take,
      search: query.search,
      universityId: query.universityId,
      programId: query.programId,
      semester: query.semester,
      stream: query.stream,
      isActive: query.isActive,
      scopedCourseIds,
    });

    return buildPaginatedResponse(items, total, pagination);
  }
}