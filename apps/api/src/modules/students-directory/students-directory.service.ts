import { Injectable } from '@nestjs/common';
import {
  PaginatedQueryDto,
  PaginatedResponseDto,
} from '@mastera/contracts';
import { AuditService } from '../audit-reports/audit.service';
import { AuthenticatedAdminContext } from '../permissions/scope.service';

export interface PaidStudentDirectoryItemDto {
  id: string;
  studentId: string;
  studentCode: string; // MS0001+
  fullName: string;
  identifier: string;
  universityName: string;
  universityShortName: string;
  programName: string;
  semester: number;
  stream: string;
  coursesCount: number;
  activeEntitlementsCount: number;
  deviceBound: boolean;
  deviceBoundDateLabel: string;
  deviceLastSeenLabel: string;
  registeredAt: string;
  enrolledCourses: Array<{
    courseId: string;
    courseTitle: string;
    stream: string;
    accessStatus: 'Paid' | 'Pending';
    expiresDateLabel: string;
  }>;
}

export interface StudentsDirectoryRepositoryPort {
  listPaidStudents(
    query: PaginatedQueryDto & { universityId?: string; programId?: string; stream?: string; search?: string }
  ): Promise<{ items: PaidStudentDirectoryItemDto[]; total: number }>;
  findStudentById?(studentId: string): Promise<any>;
  releaseDeviceHardware(studentId: string): Promise<void>;
  grantOrExtendAccess?(studentId: string, courseId: string, days: number, reason: string): Promise<void>;
}

@Injectable()
export class StudentsDirectoryService {
  constructor(
    private readonly repo: StudentsDirectoryRepositoryPort,
    private readonly auditService: AuditService
  ) {}

  async listStudents(
    actor: AuthenticatedAdminContext,
    query: PaginatedQueryDto & { universityId?: string; programId?: string; stream?: string; search?: string }
  ): Promise<PaginatedResponseDto<PaidStudentDirectoryItemDto>> {
    if (actor.adminRole === 'ACADEMIC_ADMIN') {
      throw new Error('PERMISSION_DENIED: Academic Admin cannot view student PII or directory.');
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const { items, total } = await this.repo.listPaidStudents({
      ...query,
      page,
      pageSize,
    });

    return {
      items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getStudentById(actor: AuthenticatedAdminContext, studentId: string): Promise<any> {
    if (actor.adminRole === 'ACADEMIC_ADMIN') {
      throw new Error('PERMISSION_DENIED: Academic Admin cannot view student PII.');
    }
    if (this.repo.findStudentById) {
      return this.repo.findStudentById(studentId);
    }
    return null;
  }

  async grantOrExtendAccess(
    actor: AuthenticatedAdminContext,
    studentId: string,
    courseId: string,
    days: number,
    reason: string
  ): Promise<void> {
    if (this.repo.grantOrExtendAccess) {
      await this.repo.grantOrExtendAccess(studentId, courseId, days, reason);
    }
    await this.auditService.record({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'STUDENT_ACCESS_GRANTED',
      resourceType: 'STUDENT',
      resourceId: studentId,
      newValue: { courseId, days, reason },
    });
  }

  async releaseDevice(
    actor: AuthenticatedAdminContext,
    studentId: string,
    reason: string
  ): Promise<void> {
    if (actor.adminRole === 'ACADEMIC_ADMIN') {
      throw new Error('PERMISSION_DENIED: Academic Admin cannot release student devices.');
    }

    await this.repo.releaseDeviceHardware(studentId);

    await this.auditService.record({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'STUDENT_DEVICE_RELEASED',
      resourceType: 'STUDENT',
      resourceId: studentId,
      newValue: { reason, releasedAt: new Date().toISOString() },
    });
  }
}
