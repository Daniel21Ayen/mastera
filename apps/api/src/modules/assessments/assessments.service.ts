import { Injectable } from '@nestjs/common';
import {
  AcademicStream,
  CatalogExamSetMetaDto,
  ContentStatus,
  ExamCategory,
  mastera_ERROR_CODES,
  QuestionItemDto,
  QuestionType,
} from '@mastera/contracts';
import { AuditService } from '../audit-reports/audit.service';
import {
  CounterService,
  CounterTransactionExecutor,
} from '../counter/counter.service';
import {
  AuthenticatedAdminContext,
  ScopeAuthorizationService,
} from '../permissions/scope.service';

export interface CreateExamSetInput {
  examSetCode: string;
  category: ExamCategory;
  universityId: string | null;
  programId: string | null;
  courseId: string | null; // Null for standalone COC sets (D15, Section 9.1)
  semester: 1 | 2 | null;
  stream: AcademicStream | null;
  year: string;
  title: string;
  timeAllowedMinutes: number; // Mandatory on exam sets (D13)
  isFreeSample?: boolean | undefined;
}

export interface CreateQuestionInput {
  examSetId?: string | null | undefined;
  quizChapterId?: string | null | undefined;
  category?: ExamCategory | undefined;
  courseId?: string | null | undefined;
  universityId?: string | null | undefined;
  programId?: string | null | undefined;
  desiredDisplayNumber?: number | undefined; // Optional admin override (FR-G11)
  questionType: QuestionType;
  promptLatex: string;
  options?: { id: string; textLatex: string }[] | undefined;
  correctOptionId?: string | undefined;
  correctBoolean?: boolean | undefined;
  acceptedAnswers?: string[] | undefined;
  explanationLatex: string;
  year?: string | undefined;
}

export interface StoredQuestionRecord extends QuestionItemDto {
  examSetId: string | null;
  quizChapterId: string | null;
  status: ContentStatus;
  authoredById: string;
  reviewedById: string | null;
}

export interface QuestionBankFilter {
  category?: string | undefined;
  quizTab?: string | undefined;
  universityId?: string | undefined;
  programId?: string | undefined;
  courseId?: string | undefined;
  semester?: number | undefined;
  stream?: string | undefined;
  year?: string | undefined;
  search?: string | undefined;
}

export interface QuestionBankItemDto {
  id: string;
  displayNumber: number;
  questionType: QuestionType;
  promptLatex: string;
  options: { id: string; textLatex: string }[];
  correctOptionId: string | null;
  correctBoolean: boolean | null;
  acceptedAnswers: string[] | null;
  explanationLatex: string;
  status: ContentStatus;
  targetType: 'EXAM_SET' | 'QUIZ_CHAPTER';
  targetId: string;
  targetTitle: string;
  examSetCode?: string | undefined;
  category?: string | undefined;
  courseId?: string | null | undefined;
  courseCode?: string | undefined;
  courseTitle?: string | undefined;
  universityId?: string | null | undefined;
  universityName?: string | undefined;
  universityShortName?: string | undefined;
  programId?: string | null | undefined;
  programName?: string | undefined;
  semester?: number | null | undefined;
  stream?: string | null | undefined;
  year?: string | null | undefined;
}

export interface AssessmentRepositoryPort {
  runInTransaction<T>(
    work: (tx: CounterTransactionExecutor) => Promise<T>
  ): Promise<T>;
  createExamSet(
    data: CreateExamSetInput & {
      authoredById: string;
      status: ContentStatus;
      version: number;
    }
  ): Promise<CatalogExamSetMetaDto>;
  findExamSetById(id: string): Promise<
    | (CatalogExamSetMetaDto & {
        authoredById: string;
        reviewedById: string | null;
      })
    | null
  >;
  updateExamSetStatus(
    id: string,
    status: ContentStatus,
    reviewedById: string | null,
    nextVersion: number
  ): Promise<CatalogExamSetMetaDto>;

  listQuestionsInTarget(
    targetType: 'EXAM_SET' | 'QUIZ_CHAPTER',
    targetId: string
  ): Promise<StoredQuestionRecord[]>;
  findQuestionById(id: string): Promise<StoredQuestionRecord | null>;
  insertQuestion(
    data: Omit<StoredQuestionRecord, 'id'>
  ): Promise<StoredQuestionRecord>;
  updateQuestionDisplayNumber(
    questionId: string,
    newDisplayNumber: number
  ): Promise<StoredQuestionRecord>;
  deleteQuestionAndRenumberLaterOnes(
    targetType: 'EXAM_SET' | 'QUIZ_CHAPTER',
    targetId: string,
    deletedQuestionId: string,
    deletedDisplayNumber: number
  ): Promise<void>;
  bumpParentCourseContentVersion(courseId: string): Promise<void>;
  listExamSets?(filter?: { category?: string | undefined; courseId?: string | undefined }): Promise<CatalogExamSetMetaDto[]>;
  listBankQuestions?(filter?: QuestionBankFilter): Promise<QuestionBankItemDto[]>;
}

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly repo: AssessmentRepositoryPort,
    private readonly counterService: CounterService,
    private readonly scopeAuth: ScopeAuthorizationService,
    private readonly auditService: AuditService
  ) {}

  async listExamSets(filter?: { category?: string | undefined; courseId?: string | undefined }): Promise<CatalogExamSetMetaDto[]> {
    if (this.repo.listExamSets) {
      return this.repo.listExamSets(filter);
    }
    return [];
  }

  async getExamSetById(id: string) {
    return this.repo.findExamSetById(id);
  }

  async getQuestions(targetType: 'EXAM_SET' | 'QUIZ_CHAPTER', targetId: string): Promise<StoredQuestionRecord[]> {
    return this.repo.listQuestionsInTarget(targetType, targetId);
  }

  async listBankQuestions(filter?: QuestionBankFilter): Promise<QuestionBankItemDto[]> {
    if (this.repo.listBankQuestions) {
      return this.repo.listBankQuestions(filter);
    }
    return [];
  }

  /**
   * Creates an Exam Set (Mid, Final, Mock, or COC) with duration set on the
   * exam set itself (D13).
   */
  async createExamSet(
    actor: AuthenticatedAdminContext,
    input: CreateExamSetInput
  ): Promise<CatalogExamSetMetaDto> {
    const decision = await this.scopeAuth.authorizeAdminAction(
      actor,
      'QUESTIONS_AUTHOR_SCOPED',
      {
        universityId: input.universityId,
        programId: input.programId,
        courseId: input.courseId,
      }
    );
    if (!decision.allowed) {
      throw new Error(`${decision.errorCode}: ${decision.reason}`);
    }

    if (
      !Number.isInteger(input.timeAllowedMinutes) ||
      input.timeAllowedMinutes <= 0
    ) {
      throw new Error(
        'D13 Validation Error: timeAllowedMinutes must be a positive integer on exam sets.'
      );
    }

    if (input.category !== 'COC' && !input.courseId) {
      throw new Error(
        'Validation Error: Mid, Final, and Mock exam sets must belong to a course.'
      );
    }

    const created = await this.repo.createExamSet({
      ...input,
      examSetCode: input.examSetCode.trim().toUpperCase(),
      title: input.title.trim(),
      isFreeSample: input.isFreeSample ?? false,
      authoredById: actor.adminId,
      status: 'DRAFT',
      version: 1,
    });

    await this.auditService.record({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'EXAM_SET_CREATED',
      resourceType: 'EXAM_SET',
      resourceId: created.id,
      newValue: { ...created },
    });

    return created;
  }

  /**
   * Validates question payload per QuestionType (Multiple Choice, True/False,
   * Short Answer, Blank Space) and allocates a per-set displayNumber starting
   * at 1 (D27, FR-G11, FR-G12, FR-G13).
   */
  async createQuestion(
    actor: AuthenticatedAdminContext,
    input: CreateQuestionInput
  ): Promise<StoredQuestionRecord> {
    // Exam questions strictly belong to an ExamSet (they MUST NOT have a chapter).
    // If examSetId is omitted, auto-resolve or create the exam set for this category/course.
    if (!input.examSetId && !input.quizChapterId) {
      const effectiveCategory: ExamCategory = input.category || 'MID';
      let existingSets: CatalogExamSetMetaDto[] = [];
      try {
        if (this.repo.listExamSets) {
          existingSets = await this.repo.listExamSets({
            category: effectiveCategory,
            courseId: input.courseId ?? undefined,
          });
        }
      } catch (err) {
        // Fallback to empty if listing fails
        existingSets = [];
      }

      const firstSet = existingSets && existingSets.length > 0 ? existingSets[0] : null;
      if (firstSet) {
        input.examSetId = firstSet.id;
      } else {
        const fallbackCode = `SET-${effectiveCategory}-${(input.courseId || input.programId || 'GEN').slice(-6)}-${Date.now().toString().slice(-4)}`.toUpperCase();
        const autoSet = await this.repo.createExamSet({
          examSetCode: fallbackCode,
          category: effectiveCategory,
          universityId: input.universityId ?? null,
          programId: input.programId ?? null,
          courseId: input.courseId ?? null,
          semester: 1,
          stream: 'NATURAL',
          year: input.year ?? '2026 / 2027',
          title: `${effectiveCategory} Examination Set`,
          timeAllowedMinutes: 120,
          isFreeSample: false,
          authoredById: actor.adminId,
          status: 'DRAFT',
          version: 1,
        });
        input.examSetId = autoSet.id;
      }
    }

    const hasExamSet = Boolean(input.examSetId);
    const hasQuizChapter = Boolean(input.quizChapterId);

    if (hasExamSet === hasQuizChapter) {
      throw new Error(
        'Validation Error: Question must belong to exactly one examSetId OR one quizChapterId.'
      );
    }

    const decision = await this.scopeAuth.authorizeAdminAction(
      actor,
      'QUESTIONS_AUTHOR_SCOPED',
      {
        universityId: input.universityId,
        programId: input.programId,
        courseId: input.courseId,
      }
    );
    if (!decision.allowed) {
      throw new Error(`${decision.errorCode}: ${decision.reason}`);
    }

    this.validateQuestionFieldsByType(input);

    const targetType: 'EXAM_SET' | 'QUIZ_CHAPTER' = input.examSetId
      ? 'EXAM_SET'
      : 'QUIZ_CHAPTER';
    const targetId = (input.examSetId ?? input.quizChapterId)!;

    const created = await this.repo.runInTransaction(async (tx) => {
      const existingQuestions = await this.repo.listQuestionsInTarget(
        targetType,
        targetId
      );
      const usedNumbers = new Set(
        existingQuestions.map((q) => q.displayNumber)
      );

      let displayNumber: number;
      if (input.desiredDisplayNumber !== undefined) {
        if (
          !Number.isInteger(input.desiredDisplayNumber) ||
          input.desiredDisplayNumber < 1
        ) {
          throw new Error(
            'FR-G11 Validation Error: Question displayNumber must be a positive whole number (>= 1).'
          );
        }
        if (usedNumbers.has(input.desiredDisplayNumber)) {
          throw new Error(
            `FR-G11 Validation Error: Question number ${input.desiredDisplayNumber} is already used in this set.`
          );
        }
        displayNumber = input.desiredDisplayNumber;
      } else {
        // Allocate next transactional number from counter (FR-G13)
        let candidate = await this.counterService.allocateNextQuestionNumber(
          tx,
          targetType,
          targetId
        );
        while (usedNumbers.has(candidate)) {
          candidate = await this.counterService.allocateNextQuestionNumber(
            tx,
            targetType,
            targetId
          );
        }
        displayNumber = candidate;
      }

      return this.repo.insertQuestion({
        examSetId: input.examSetId ?? null,
        quizChapterId: input.quizChapterId ?? null,
        displayNumber,
        questionType: input.questionType,
        promptLatex: input.promptLatex.trim(),
        ...(input.options !== undefined ? { options: input.options } : {}),
        ...(input.correctOptionId !== undefined
          ? { correctOptionId: input.correctOptionId }
          : {}),
        ...(input.correctBoolean !== undefined
          ? { correctBoolean: input.correctBoolean }
          : {}),
        ...(input.acceptedAnswers !== undefined
          ? { acceptedAnswers: input.acceptedAnswers }
          : {}),
        explanationLatex: input.explanationLatex.trim(),
        status: (input as any).status || 'DRAFT',
        authoredById: actor.adminId,
        reviewedById: null,
      });
    });

    if (input.courseId) {
      await this.repo.bumpParentCourseContentVersion(input.courseId);
    }

    await this.auditService.record({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'QUESTION_CREATED',
      resourceType: 'QUESTION',
      resourceId: created.id,
      newValue: {
        displayNumber: created.displayNumber,
        targetType,
        targetId,
        questionType: created.questionType,
      },
    });

    return created;
  }

  /**
   * FR-G11: Admin MAY change a question's displayNumber to an unused positive
   * whole number in the same exam set or quiz chapter; server validates.
   */
  async changeQuestionNumber(
    actor: AuthenticatedAdminContext,
    questionId: string,
    newDisplayNumber: number,
    scopeContext?: { courseId?: string | null }
  ): Promise<StoredQuestionRecord> {
    if (!Number.isInteger(newDisplayNumber) || newDisplayNumber < 1) {
      throw new Error(
        'FR-G11 Validation Error: Question number must be a whole number >= 1.'
      );
    }

    const question = await this.repo.findQuestionById(questionId);
    if (!question) {
      throw new Error('Question not found.');
    }

    const decision = await this.scopeAuth.authorizeAdminAction(
      actor,
      'QUESTIONS_AUTHOR_SCOPED',
      { courseId: scopeContext?.courseId }
    );
    if (!decision.allowed) {
      throw new Error(`${decision.errorCode}: ${decision.reason}`);
    }

    const targetType: 'EXAM_SET' | 'QUIZ_CHAPTER' = question.examSetId
      ? 'EXAM_SET'
      : 'QUIZ_CHAPTER';
    const targetId = (question.examSetId ?? question.quizChapterId)!;

    const siblings = await this.repo.listQuestionsInTarget(
      targetType,
      targetId
    );
    const collision = siblings.find(
      (q) => q.id !== questionId && q.displayNumber === newDisplayNumber
    );
    if (collision) {
      throw new Error(
        `FR-G11 Validation Error: Question number ${newDisplayNumber} is already in use in this set.`
      );
    }

    return this.repo.updateQuestionDisplayNumber(questionId, newDisplayNumber);
  }

  /**
   * FR-G14 & Q7: Deleting a question renumbers all subsequent questions in the
   * same exam set or quiz chapter so numbering remains 1..N without gaps.
   */
  async deleteQuestion(
    actor: AuthenticatedAdminContext,
    questionId: string,
    scopeContext?: { courseId?: string | null }
  ): Promise<void> {
    const question = await this.repo.findQuestionById(questionId);
    if (!question) {
      throw new Error('Question not found.');
    }

    const decision = await this.scopeAuth.authorizeAdminAction(
      actor,
      'QUESTIONS_AUTHOR_SCOPED',
      { courseId: scopeContext?.courseId }
    );
    if (!decision.allowed) {
      throw new Error(`${decision.errorCode}: ${decision.reason}`);
    }

    const targetType: 'EXAM_SET' | 'QUIZ_CHAPTER' = question.examSetId
      ? 'EXAM_SET'
      : 'QUIZ_CHAPTER';
    const targetId = (question.examSetId ?? question.quizChapterId)!;

    await this.repo.deleteQuestionAndRenumberLaterOnes(
      targetType,
      targetId,
      question.id,
      question.displayNumber
    );

    if (scopeContext?.courseId) {
      await this.repo.bumpParentCourseContentVersion(scopeContext.courseId);
    }
  }

  /**
   * Maker-Checker workflow for Exam Sets (Draft -> In Review -> Published, FR-G62).
   */
  async publishExamSet(
    actor: AuthenticatedAdminContext,
    examSetId: string
  ): Promise<CatalogExamSetMetaDto> {
    const existing = await this.repo.findExamSetById(examSetId);
    if (!existing) {
      throw new Error('Exam set not found.');
    }

    const decision = await this.scopeAuth.authorizeAdminAction(
      actor,
      'CONTENT_PUBLISH',
      {
        universityId: existing.universityId,
        programId: existing.programId,
        courseId: existing.courseId,
        authoredByAdminId: existing.authoredById,
      }
    );
    if (!decision.allowed) {
      throw new Error(`${decision.errorCode}: ${decision.reason}`);
    }

    const published = await this.repo.updateExamSetStatus(
      examSetId,
      'PUBLISHED',
      actor.adminId,
      existing.version + 1
    );

    if (existing.courseId) {
      await this.repo.bumpParentCourseContentVersion(existing.courseId);
    }

    await this.auditService.record({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'EXAM_SET_PUBLISHED',
      resourceType: 'EXAM_SET',
      resourceId: examSetId,
      previousValue: { status: existing.status, version: existing.version },
      newValue: { status: published.status, version: published.version },
    });

    return published;
  }

  private validateQuestionFieldsByType(input: CreateQuestionInput): void {
    const prompt = input.promptLatex.trim();
    if (!prompt || prompt.length > 1000) {
      throw new Error(
        'Validation Error: Question prompt is required and must be <= 1000 characters.'
      );
    }

    const explanation = input.explanationLatex.trim();
    if (!explanation || explanation.length > 500) {
      throw new Error(
        'Validation Error: Answer explanation is required and must be <= 500 characters.'
      );
    }

    switch (input.questionType) {
      case 'MULTIPLE_CHOICE': {
        if (!input.options || input.options.length < 2) {
          throw new Error(
            'Validation Error: Multiple choice questions require at least 2 options.'
          );
        }
        const validOption = input.options.some(
          (o) => o.id === input.correctOptionId
        );
        if (!validOption) {
          throw new Error(
            'Validation Error: correctOptionId must match one of the provided options.'
          );
        }
        break;
      }
      case 'TRUE_FALSE': {
        if (typeof input.correctBoolean !== 'boolean') {
          throw new Error(
            'Validation Error: True/False questions require a boolean correctBoolean value.'
          );
        }
        break;
      }
      case 'SHORT_ANSWER':
      case 'BLANK_SPACE': {
        const cleaned = (input.acceptedAnswers ?? [])
          .map((a) => a.trim())
          .filter((a) => a.length > 0);
        if (cleaned.length === 0) {
          throw new Error(
            `Validation Error: ${input.questionType} questions require at least one accepted answer.`
          );
        }
        break;
      }
    }
  }
}