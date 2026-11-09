import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CsvQuestionImportService } from './csv-import.service';
import { AuthenticatedAdminContext } from '../permissions/scope.service';

@Controller('questions')
export class CsvImportController {
  constructor(private readonly csvService: CsvQuestionImportService) {}

  @Post('csv-dry-run')
  @HttpCode(HttpStatus.OK)
  async dryRun(
    @Body()
    body: {
      actor: AuthenticatedAdminContext;
      csvContentBase64: string;
      targetType: 'EXAM_SET' | 'QUIZ_CHAPTER';
      targetId: string;
      courseId?: string;
    }
  ) {
    const rawBuffer = Buffer.from(body.csvContentBase64, 'base64');
    return this.csvService.processCsvImport(
      body.actor,
      rawBuffer,
      {
        examSetId: body.targetType === 'EXAM_SET' ? body.targetId : null,
        quizChapterId: body.targetType === 'QUIZ_CHAPTER' ? body.targetId : null,
        courseId: body.courseId ?? null,
      },
      true
    );
  }

  @Post('csv-import')
  @HttpCode(HttpStatus.OK)
  async importCsv(
    @Body()
    body: {
      actor: AuthenticatedAdminContext;
      csvContentBase64: string;
      targetType: 'EXAM_SET' | 'QUIZ_CHAPTER';
      targetId: string;
      courseId?: string;
    }
  ) {
    const rawBuffer = Buffer.from(body.csvContentBase64, 'base64');
    return this.csvService.processCsvImport(
      body.actor,
      rawBuffer,
      {
        examSetId: body.targetType === 'EXAM_SET' ? body.targetId : null,
        quizChapterId: body.targetType === 'QUIZ_CHAPTER' ? body.targetId : null,
        courseId: body.courseId ?? null,
      },
      false
    );
  }
}
