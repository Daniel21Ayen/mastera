import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { StudentsDirectoryService } from './students-directory.service';
import { AuthenticatedAdminContext } from '../permissions/scope.service';
import { PaginatedQueryDto } from '@mastera/contracts';

const DEFAULT_OPS_ADMIN: AuthenticatedAdminContext = {
  adminId: '00000000-0000-0000-0000-000000000000',
  adminRole: 'OPERATIONS_ADMIN',
  isActive: true,
  canReviewAndPublish: true,
  scopes: [],
};

@Controller('students')
export class StudentsDirectoryController {
  constructor(private readonly studentsService: StudentsDirectoryService) {}

  @Get()
  async listStudents(
    @Query() query: PaginatedQueryDto & { universityId?: string; programId?: string; stream?: string; search?: string },
    @Body('actor') actor?: AuthenticatedAdminContext
  ) {
    const adminActor = actor ?? DEFAULT_OPS_ADMIN;
    return this.studentsService.listStudents(adminActor, query);
  }

  @Get(':id')
  async getStudent(
    @Param('id') studentId: string,
    @Body('actor') actor?: AuthenticatedAdminContext
  ) {
    const adminActor = actor ?? DEFAULT_OPS_ADMIN;
    return this.studentsService.getStudentById(adminActor, studentId);
  }

  @Post(':id/device-release')
  @HttpCode(HttpStatus.OK)
  async releaseDevice(
    @Param('id') studentId: string,
    @Body()
    body: {
      actor?: AuthenticatedAdminContext;
      reason: string;
    }
  ) {
    const adminActor = body.actor ?? DEFAULT_OPS_ADMIN;
    return this.studentsService.releaseDevice(
      adminActor,
      studentId,
      body.reason
    );
  }

  @Post(':id/grant-access')
  @HttpCode(HttpStatus.OK)
  async grantAccess(
    @Param('id') studentId: string,
    @Body()
    body: {
      actor?: AuthenticatedAdminContext;
      courseId: string;
      days: number;
      reason: string;
    }
  ) {
    const adminActor = body.actor ?? DEFAULT_OPS_ADMIN;
    return this.studentsService.grantOrExtendAccess(
      adminActor,
      studentId,
      body.courseId,
      body.days,
      body.reason
    );
  }
}
