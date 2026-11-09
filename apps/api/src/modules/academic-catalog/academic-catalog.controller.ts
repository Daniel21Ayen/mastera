import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  AcademicCatalogService,
  CreateCourseInput,
  CreateProgramInput,
  CreateUniversityInput,
  UpdateCourseInput,
} from './academic-catalog.service';
import { AuthenticatedAdminContext } from '../permissions/scope.service';
import { AcademicStream, PaginatedQueryDto } from '@mastera/contracts';

const DEFAULT_SUPER_ADMIN: AuthenticatedAdminContext = {
  adminId: '00000000-0000-0000-0000-000000000000',
  adminRole: 'SUPER_ADMIN',
  isActive: true,
  canReviewAndPublish: true,
  scopes: [],
};

@Controller('catalog')
export class AcademicCatalogController {
  constructor(private readonly catalogService: AcademicCatalogService) {}

  @Get('universities')
  async listUniversities(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    const p = page ? Math.max(1, parseInt(page, 10)) : 1;
    const ps = pageSize ? Math.max(1, parseInt(pageSize, 10)) : 100;
    const skip = (p - 1) * ps;
    const result = await this.catalogService.listUniversities(skip, ps, search);
    return {
      page: p,
      pageSize: ps,
      total: result.total,
      totalPages: Math.ceil(result.total / ps),
      items: result.items,
    };
  }

  @Post('universities')
  async createUniversity(
    @Body()
    body: {
      actor?: AuthenticatedAdminContext;
      data?: CreateUniversityInput;
    } & CreateUniversityInput
  ) {
    const actor = body.actor ?? DEFAULT_SUPER_ADMIN;
    const data = body.data ?? body;
    return this.catalogService.createUniversity(actor, data);
  }

  @Get('programs')
  async listPrograms(
    @Query('universityId') universityId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    const p = page ? Math.max(1, parseInt(page, 10)) : 1;
    const ps = pageSize ? Math.max(1, parseInt(pageSize, 10)) : 100;
    const skip = (p - 1) * ps;
    const result = await this.catalogService.listPrograms(skip, ps, universityId, search);
    return {
      page: p,
      pageSize: ps,
      total: result.total,
      totalPages: Math.ceil(result.total / ps),
      items: result.items,
    };
  }

  @Post('programs')
  async createProgram(
    @Body()
    body: {
      actor?: AuthenticatedAdminContext;
      data?: CreateProgramInput;
    } & CreateProgramInput
  ) {
    const actor = body.actor ?? DEFAULT_SUPER_ADMIN;
    const data = body.data ?? body;
    return this.catalogService.createProgram(actor, data);
  }

  @Get('courses')
  async listCourses(
    @Query() query: PaginatedQueryDto & {
      universityId?: string;
      programId?: string;
      semester?: string;
      stream?: AcademicStream;
      isActive?: string;
    }
  ) {
    const filterQuery: any = {};
    if (query.page) filterQuery.page = Number(query.page);
    if (query.pageSize) filterQuery.pageSize = Number(query.pageSize);
    if (query.search) filterQuery.search = query.search;
    if (query.universityId) filterQuery.universityId = query.universityId;
    if (query.programId) filterQuery.programId = query.programId;
    if (query.semester) filterQuery.semester = parseInt(query.semester, 10) as 1 | 2;
    if (query.stream) filterQuery.stream = query.stream;
    if (query.isActive !== undefined) filterQuery.isActive = query.isActive === 'true';

    return this.catalogService.listCoursesForAdmin(DEFAULT_SUPER_ADMIN, filterQuery);
  }

  @Get('courses/:id')
  async getCourse(@Param('id') courseId: string) {
    return this.catalogService.findCourseById(courseId);
  }

  @Post('courses')
  async createCourse(
    @Body()
    body: {
      actor?: AuthenticatedAdminContext;
      data?: CreateCourseInput;
    } & CreateCourseInput
  ) {
    const actor = body.actor ?? DEFAULT_SUPER_ADMIN;
    const data = body.data ?? body;
    return this.catalogService.createCourse(actor, data);
  }

  @Put('courses/:id')
  async updateCourse(
    @Param('id') courseId: string,
    @Body()
    body: {
      actor?: AuthenticatedAdminContext;
      patch?: UpdateCourseInput;
    } & UpdateCourseInput
  ) {
    const actor = body.actor ?? DEFAULT_SUPER_ADMIN;
    const patch = body.patch ?? body;
    return this.catalogService.updateCourse(actor, courseId, patch);
  }

  @Delete('courses/:id')
  async deleteCourse(@Param('id') courseId: string) {
    return this.catalogService.deleteCourse(DEFAULT_SUPER_ADMIN, courseId);
  }
}
