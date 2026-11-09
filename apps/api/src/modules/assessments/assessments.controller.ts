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
  AssessmentsService,
  CreateExamSetInput,
  CreateQuestionInput,
} from './assessments.service';
import { AuthenticatedAdminContext } from '../permissions/scope.service';

const DEFAULT_SUPER_ADMIN: AuthenticatedAdminContext = {
  adminId: '00000000-0000-0000-0000-000000000001',
  adminRole: 'SUPER_ADMIN',
  scopes: [],
  isActive: true,
  canReviewAndPublish: true,
};

@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Get('exam-sets')
  async listExamSets(
    @Query('category') category?: string,
    @Query('courseId') courseId?: string
  ) {
    const filter: { category?: string; courseId?: string } = {};
    if (category) filter.category = category;
    if (courseId) filter.courseId = courseId;
    return this.assessmentsService.listExamSets(filter);
  }

  @Get('exam-sets/:id')
  async getExamSet(@Param('id') id: string) {
    return this.assessmentsService.getExamSetById(id);
  }

  @Get('questions')
  async listQuestions(
    @Query('targetType') targetType?: 'EXAM_SET' | 'QUIZ_CHAPTER',
    @Query('targetId') targetId?: string,
    @Query('category') category?: string,
    @Query('examType') examType?: string,
    @Query('quizTab') quizTab?: string,
    @Query('universityId') universityId?: string,
    @Query('programId') programId?: string,
    @Query('courseId') courseId?: string,
    @Query('semester') semester?: string,
    @Query('stream') stream?: string,
    @Query('year') year?: string,
    @Query('search') search?: string
  ) {
    if (targetType && targetId) {
      return this.assessmentsService.getQuestions(targetType, targetId);
    }

    const filter: any = {};
    const cat = category || examType;
    if (cat && cat !== 'ALL') {
      const norm = cat.toUpperCase();
      if (norm === 'MID-EXAMS' || norm === 'MID') filter.category = 'MID';
      else if (norm === 'FINAL-EXAMS' || norm === 'FINAL') filter.category = 'FINAL';
      else if (norm === 'MOCK-EXAMS' || norm === 'MOCK') filter.category = 'MOCK';
      else if (norm === 'COC-EXAMS' || norm === 'COC') filter.category = 'COC';
      else filter.category = norm;
    }

    if (quizTab && quizTab !== 'ALL') filter.quizTab = quizTab;
    if (universityId && universityId !== 'ALL') filter.universityId = universityId;
    if (programId && programId !== 'ALL') filter.programId = programId;
    if (courseId && courseId !== 'ALL') filter.courseId = courseId;
    if (semester && semester !== 'ALL') filter.semester = parseInt(semester, 10);
    if (stream && stream !== 'ALL') filter.stream = stream.toUpperCase();
    if (year && year !== 'ALL') filter.year = year;
    if (search && search.trim()) filter.search = search.trim();

    return this.assessmentsService.listBankQuestions(filter);
  }

  @Post('exam-sets')
  async createExamSet(
    @Body()
    body: {
      actor?: AuthenticatedAdminContext;
      data: CreateExamSetInput;
    }
  ) {
    const actor = body.actor || DEFAULT_SUPER_ADMIN;
    return this.assessmentsService.createExamSet(actor, body.data);
  }

  @Post('exam-sets/:id/publish')
  async publishExamSet(
    @Param('id') examSetId: string,
    @Body() body?: { actor?: AuthenticatedAdminContext }
  ) {
    const actor = body?.actor || DEFAULT_SUPER_ADMIN;
    return this.assessmentsService.publishExamSet(actor, examSetId);
  }

  @Post('questions')
  async createQuestion(
    @Body()
    body: {
      actor?: AuthenticatedAdminContext;
      data?: CreateQuestionInput;
    } & CreateQuestionInput
  ) {
    const actor = body.actor || DEFAULT_SUPER_ADMIN;
    const data = body.data ?? body;
    return this.assessmentsService.createQuestion(actor, data);
  }

  @Put('questions/:id/number')
  async changeQuestionNumber(
    @Param('id') questionId: string,
    @Body()
    body: {
      actor?: AuthenticatedAdminContext;
      newDisplayNumber: number;
    }
  ) {
    const actor = body.actor || DEFAULT_SUPER_ADMIN;
    return this.assessmentsService.changeQuestionNumber(
      actor,
      questionId,
      body.newDisplayNumber
    );
  }

  @Delete('questions/:id')
  async deleteQuestion(
    @Param('id') questionId: string,
    @Body() body?: { actor?: AuthenticatedAdminContext }
  ) {
    const actor = body?.actor || DEFAULT_SUPER_ADMIN;
    return this.assessmentsService.deleteQuestion(actor, questionId);
  }
}
