import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CsvQuestionImportService } from './csv-import.service';
import { AuthenticatedAdminContext } from '../permissions/scope.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

const DEFAULT_SUPER_ADMIN: AuthenticatedAdminContext = {
  adminId: '00000000-0000-0000-0000-000000000001',
  adminRole: 'SUPER_ADMIN',
  isActive: true,
  canReviewAndPublish: true,
  scopes: [],
};

@Controller('questions')
export class CsvImportController {
  constructor(
    private readonly csvService: CsvQuestionImportService,
    private readonly prisma: PrismaService
  ) {}

  private async resolveTarget(
    targetType: 'EXAM_SET' | 'QUIZ_CHAPTER',
    targetId?: string | null,
    courseId?: string | null,
    category?: string | null
  ): Promise<{ examSetId: string | null; quizChapterId: string | null }> {
    if (targetType === 'EXAM_SET') {
      if (targetId) {
        return { examSetId: targetId, quizChapterId: null };
      }
      if (category) {
        const where: any = { category: category as any };
        if (courseId) where.courseId = courseId;
        const examSet = await this.prisma.examSet.findFirst({
          where,
          orderBy: { createdAt: 'desc' },
        });
        if (examSet) {
          return { examSetId: examSet.id, quizChapterId: null };
        }
      }
      return { examSetId: null, quizChapterId: null };
    } else {
      if (targetId) {
        return { examSetId: null, quizChapterId: targetId };
      }
      // Quiz target: lookup content by category / courseId
      const where: any = {};
      if (category) {
        where.category = category as any;
      } else {
        where.category = { in: ['QUIZ_1', 'QUIZ_2', 'QUIZ_3'] as any };
      }
      if (courseId) {
        where.courseId = courseId;
      }
      const chapter = await this.prisma.content.findFirst({
        where,
        orderBy: { orderIndex: 'asc' },
      });
      if (chapter) {
        return { examSetId: null, quizChapterId: chapter.id };
      }
      // Fallback: any chapter of this course
      if (courseId) {
        const anyCh = await this.prisma.content.findFirst({
          where: { courseId },
          orderBy: { orderIndex: 'asc' },
        });
        if (anyCh) {
          return { examSetId: null, quizChapterId: anyCh.id };
        }
      }
      return { examSetId: null, quizChapterId: null };
    }
  }

  @Post('csv-dry-run')
  @HttpCode(HttpStatus.OK)
  async dryRun(
    @Body()
    body: {
      actor?: AuthenticatedAdminContext;
      csvContentBase64: string;
      targetType: 'EXAM_SET' | 'QUIZ_CHAPTER';
      targetId?: string | null;
      courseId?: string | null;
      category?: string | null;
      universityId?: string | null;
      programId?: string | null;
      year?: string | null;
    }
  ) {
    const rawBuffer = Buffer.from(body.csvContentBase64 || '', 'base64');
    const actor = body.actor || DEFAULT_SUPER_ADMIN;
    const { examSetId, quizChapterId } = await this.resolveTarget(
      body.targetType,
      body.targetId,
      body.courseId,
      body.category
    );

    return this.csvService.processCsvImport(
      actor,
      rawBuffer,
      {
        examSetId,
        quizChapterId,
        courseId: body.courseId ?? null,
        category: (body.category as any) ?? null,
        universityId: body.universityId ?? null,
        programId: body.programId ?? null,
        year: body.year ?? null,
      },
      true
    );
  }

  @Post('csv-import')
  @HttpCode(HttpStatus.OK)
  async importCsv(
    @Body()
    body: {
      actor?: AuthenticatedAdminContext;
      csvContentBase64: string;
      targetType: 'EXAM_SET' | 'QUIZ_CHAPTER';
      targetId?: string | null;
      courseId?: string | null;
      category?: string | null;
      universityId?: string | null;
      programId?: string | null;
      year?: string | null;
    }
  ) {
    const rawBuffer = Buffer.from(body.csvContentBase64 || '', 'base64');
    const actor = body.actor || DEFAULT_SUPER_ADMIN;
    const { examSetId, quizChapterId } = await this.resolveTarget(
      body.targetType,
      body.targetId,
      body.courseId,
      body.category
    );

    return this.csvService.processCsvImport(
      actor,
      rawBuffer,
      {
        examSetId,
        quizChapterId,
        courseId: body.courseId ?? null,
        category: (body.category as any) ?? null,
        universityId: body.universityId ?? null,
        programId: body.programId ?? null,
        year: body.year ?? null,
      },
      false
    );
  }
}
