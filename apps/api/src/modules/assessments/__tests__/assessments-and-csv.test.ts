import test from 'node:test';
import assert from 'node:assert';
import { AuditService } from '../../audit-reports/audit.service';
import {
  CounterService,
  CounterTransactionExecutor,
} from '../../counter/counter.service';
import {
  AuthenticatedAdminContext,
  ScopeAuthorizationService,
} from '../../permissions/scope.service';
import {
  AssessmentRepositoryPort,
  AssessmentsService,
  StoredQuestionRecord,
} from '../assessments.service';
import { CsvQuestionImportService } from '../../csv-import/csv-import.service';

function createTestAssessmentEnvironment() {
  const counters = new Map<string, number>();
  const questions = new Map<string, StoredQuestionRecord>();
  let courseVersion = 1;

  const repo: AssessmentRepositoryPort = {
    runInTransaction: async <T>(
      work: (tx: CounterTransactionExecutor) => Promise<T>
    ): Promise<T> => {
      const tx: CounterTransactionExecutor = {
        $queryRaw: async <R = unknown>(
          _strings: TemplateStringsArray,
          ...values: unknown[]
        ): Promise<R> => {
          const key = String(values[0]);
          const next = (counters.get(key) ?? 0) + 1;
          counters.set(key, next);
          return [{ value: next }] as unknown as R;
        },
      };
      return work(tx);
    },
    createExamSet: async (data) => ({
      id: `exam-${Date.now()}`,
      examSetCode: data.examSetCode,
      category: data.category,
      universityId: data.universityId,
      programId: data.programId,
      courseId: data.courseId,
      semester: data.semester,
      stream: data.stream,
      year: data.year,
      title: data.title,
      questionCount: 0,
      timeAllowedMinutes: data.timeAllowedMinutes,
      isFreeSample: data.isFreeSample ?? false,
      version: data.version,
      status: data.status,
    }),
    findExamSetById: async () => null,
    updateExamSetStatus: async () => {
      throw new Error('Not needed in this test');
    },
    listQuestionsInTarget: async (targetType, targetId) =>
      Array.from(questions.values())
        .filter((q) =>
          targetType === 'EXAM_SET'
            ? q.examSetId === targetId
            : q.quizChapterId === targetId
        )
        .sort((a, b) => a.displayNumber - b.displayNumber),
    findQuestionById: async (id) => questions.get(id) ?? null,
    insertQuestion: async (data) => {
      const id = `q-${questions.size + 1}-${Math.random().toString(36).slice(2, 6)}`;
      const record: StoredQuestionRecord = { id, ...data };
      questions.set(id, record);
      return record;
    },
    updateQuestionDisplayNumber: async (id, newNumber) => {
      const existing = questions.get(id)!;
      const updated = { ...existing, displayNumber: newNumber };
      questions.set(id, updated);
      return updated;
    },
    deleteQuestionAndRenumberLaterOnes: async (
      targetType,
      targetId,
      deletedId,
      deletedNumber
    ) => {
      questions.delete(deletedId);
      for (const q of questions.values()) {
        const matchesSet =
          targetType === 'EXAM_SET'
            ? q.examSetId === targetId
            : q.quizChapterId === targetId;
        if (matchesSet && q.displayNumber > deletedNumber) {
          q.displayNumber -= 1;
        }
      }
    },
    bumpParentCourseContentVersion: async () => {
      courseVersion += 1;
    },
  };

  const auditService = new AuditService({ writeAuditRow: async () => {} });
  const scopeService = new ScopeAuthorizationService(auditService);
  const counterService = new CounterService();
  const assessmentsService = new AssessmentsService(
    repo,
    counterService,
    scopeService,
    auditService
  );
  const csvService = new CsvQuestionImportService(
    assessmentsService,
    auditService
  );

  const superAdmin: AuthenticatedAdminContext = {
    adminId: 'super-1',
    adminRole: 'SUPER_ADMIN',
    isActive: true,
    canReviewAndPublish: true,
    scopes: [],
  };

  return { repo, assessmentsService, csvService, superAdmin };
}

test('FR-G11 to FR-G14: Question numbers restart at 1 per set and renumber cleanly on delete', async () => {
  const { repo, assessmentsService, superAdmin } =
    createTestAssessmentEnvironment();

  // Create 3 questions in Exam Set A
  const q1A = await assessmentsService.createQuestion(superAdmin, {
    examSetId: 'set-A',
    courseId: 'c1',
    questionType: 'TRUE_FALSE',
    promptLatex: 'Is $f(x) = x^2$ continuous?',
    correctBoolean: true,
    explanationLatex: 'Polynomials are continuous everywhere.',
  });
  const q2A = await assessmentsService.createQuestion(superAdmin, {
    examSetId: 'set-A',
    courseId: 'c1',
    questionType: 'TRUE_FALSE',
    promptLatex: 'Second question in Set A',
    correctBoolean: false,
    explanationLatex: 'Explanation 2',
  });
  const q3A = await assessmentsService.createQuestion(superAdmin, {
    examSetId: 'set-A',
    courseId: 'c1',
    questionType: 'SHORT_ANSWER',
    promptLatex: 'Derivative of $x^2$?',
    acceptedAnswers: ['2x', '2*x'],
    explanationLatex: 'Power rule.',
  });

  // Create 1 question in Exam Set B -> must restart at displayNumber = 1 (FR-G11)
  const q1B = await assessmentsService.createQuestion(superAdmin, {
    examSetId: 'set-B',
    courseId: 'c1',
    questionType: 'BLANK_SPACE',
    promptLatex: 'Water boils at ___ degrees Celsius at 1 atm.',
    acceptedAnswers: ['100'],
    explanationLatex: 'Standard boiling point.',
  });

  assert.strictEqual(q1A.displayNumber, 1);
  assert.strictEqual(q2A.displayNumber, 2);
  assert.strictEqual(q3A.displayNumber, 3);
  assert.strictEqual(q1B.displayNumber, 1);

  // Delete question #2 in Set A -> question #3 renumbers to #2 (FR-G14, Q7)
  await assessmentsService.deleteQuestion(superAdmin, q2A.id, {
    courseId: 'c1',
  });

  const remainingInSetA = await repo.listQuestionsInTarget('EXAM_SET', 'set-A');
  assert.deepStrictEqual(
    remainingInSetA.map((q) => q.displayNumber),
    [1, 2]
  );
});

test('FR-G50 to FR-G55: Bulk CSV import rejects %PDF/PK files and imports Amharic + LaTeX with commas', async () => {
  const { repo, csvService, superAdmin } = createTestAssessmentEnvironment();

  // 1. Reject PDF renamed to .csv
  const fakePdfBuffer = Buffer.from('%PDF-1.7 fake pdf content', 'utf8');
  await assert.rejects(
    async () => {
      await csvService.processCsvImport(
        superAdmin,
        fakePdfBuffer,
        { examSetId: 'set-csv' },
        true
      );
    },
    (err: Error) => err.message.includes('CSV_INVALID')
  );

  // 2. Reject XLSX/ZIP (PK header) renamed to .csv
  const fakeXlsxBuffer = Buffer.from('PK\x03\x04 fake zip content', 'binary');
  await assert.rejects(
    async () => {
      await csvService.processCsvImport(
        superAdmin,
        fakeXlsxBuffer,
        { examSetId: 'set-csv' },
        true
      );
    },
    (err: Error) => err.message.includes('CSV_INVALID')
  );

  // 3. Valid UTF-8 CSV with BOM, Amharic text, and LaTeX formula containing commas
  const validCsvContent =
    '\uFEFFquestion_type,prompt_latex,option_a,option_b,option_c,option_d,correct_answer,explanation_latex\r\n' +
    'MULTIPLE_CHOICE,"የኢትዮጵያ ዋና ከተማ ማን ናት? Evaluate $f(x, y) = x^2 + y^2$",አዲስ አበባ,ባሕር ዳር,ጎንደር,ሐዋሳ,A,"አዲስ አበባ የኢትዮጵያ ዋና ከተማ ናት። Formula: $\\int_0^1 x\\,dx = 1/2$"\r\n' +
    'TRUE_FALSE,"For all $x, y \\in \\mathbb{R}$, $(x+y)^2 = x^2 + 2xy + y^2$","","","","",TRUE,"Binomial expansion identity."';

  const validBuffer = Buffer.from(validCsvContent, 'utf8');

  // Dry run first: valid report, 0 committed questions
  const dryRunOutcome = await csvService.processCsvImport(
    superAdmin,
    validBuffer,
    { examSetId: 'set-csv', courseId: 'c1' },
    true
  );
  assert.strictEqual(dryRunOutcome.report.valid, true);
  assert.strictEqual(dryRunOutcome.committedQuestions.length, 0);

  // Actual commit: 2 questions committed with displayNumbers 1 and 2
  const commitOutcome = await csvService.processCsvImport(
    superAdmin,
    validBuffer,
    { examSetId: 'set-csv', courseId: 'c1' },
    false
  );
  assert.strictEqual(commitOutcome.report.valid, true);
  assert.strictEqual(commitOutcome.committedQuestions.length, 2);

  const stored = await repo.listQuestionsInTarget('EXAM_SET', 'set-csv');
  assert.strictEqual(stored.length, 2);
  assert.ok(stored[0]?.promptLatex.includes('የኢትዮጵያ ዋና ከተማ'));
  assert.ok(stored[0]?.promptLatex.includes('$f(x, y) = x^2 + y^2$'));
});