import { Injectable } from '@nestjs/common';
import {
  CsvImportDryRunResultDto,
  CsvImportRowErrorDto,
  mastera_ERROR_CODES,
  QuestionType,
} from '@mastera/contracts';
import { AuditService } from '../audit-reports/audit.service';
import { AuthenticatedAdminContext } from '../permissions/scope.service';
import {
  AssessmentsService,
  CreateQuestionInput,
  StoredQuestionRecord,
} from '../assessments/assessments.service';

export const EXPECTED_CSV_HEADERS = [
  'question_type',
  'prompt_latex',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'correct_answer',
  'explanation_latex',
] as const;

export const MAX_CSV_BYTES = 2 * 1024 * 1024; // 2 MB limit (FR-G54)
export const MAX_CSV_ROWS = 500;

/**
 * Neutralizes spreadsheet formula injection (FR-G53: cells starting with =, +, -, @)
 * while preserving negative numbers or LaTeX expressions.
 */
export function neutralizeCsvCellFormula(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return '';
  const firstChar = trimmed[0];
  if (
    firstChar === '=' ||
    firstChar === '+' ||
    firstChar === '@' ||
    (firstChar === '-' && !/^-\d+(\.\d+)?$/.test(trimmed))
  ) {
    return `'${trimmed}`;
  }
  return trimmed;
}

/**
 * RFC 4180 compliant CSV parser that preserves UTF-8 Amharic text, multiline
 * cells, commas inside quotes, and escaped double quotes ("").
 */
export function parseRfc4180Csv(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    const nextCh = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && nextCh === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (ch === '\r' && nextCh === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++;
      } else if (ch === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += ch;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows.filter(
    (row) => !(row.length === 1 && (row[0] ?? '').trim() === '')
  );
}

@Injectable()
export class CsvQuestionImportService {
  constructor(
    private readonly assessmentsService: AssessmentsService,
    private readonly auditService: AuditService
  ) {}

  /**
   * Validates raw file bytes against %PDF, PK (ZIP/XLSX), NUL binary bytes,
   * UTF-8 BOM, headers, and row rules. Commits atomically only when dryRun is
   * false and zero errors exist (FR-G50 to FR-G55).
   */
  async processCsvImport(
    actor: AuthenticatedAdminContext,
    rawBuffer: Buffer,
    target: {
      examSetId?: string | null;
      quizChapterId?: string | null;
      courseId?: string | null;
    },
    dryRun: boolean
  ): Promise<{
    report: CsvImportDryRunResultDto;
    committedQuestions: StoredQuestionRecord[];
  }> {
    if (rawBuffer.byteLength === 0 || rawBuffer.byteLength > MAX_CSV_BYTES) {
      throw new Error(
        `${mastera_ERROR_CODES.CSV_INVALID}: CSV file is empty or exceeds the 2 MB maximum size.`
      );
    }

    // FR-G50: Inspect magic bytes (%PDF or PK zip/xlsx header or binary NUL byte)
    const asciiSignature4 = rawBuffer.subarray(0, 4).toString('ascii');
    const asciiSignature2 = rawBuffer.subarray(0, 2).toString('ascii');
    if (
      asciiSignature4 === '%PDF' ||
      asciiSignature2 === 'PK' ||
      rawBuffer.includes(0x00)
    ) {
      throw new Error(
        `${mastera_ERROR_CODES.CSV_INVALID}: Binary PDF or ZIP/XLSX content detected. Only valid UTF-8 CSV content is accepted.`
      );
    }

    // Strip UTF-8 BOM (\uFEFF) so Amharic & headers parse cleanly (FR-G51)
    let utf8Text = rawBuffer.toString('utf8');
    if (utf8Text.charCodeAt(0) === 0xfeff) {
      utf8Text = utf8Text.slice(1);
    }

    const parsedRows = parseRfc4180Csv(utf8Text);
    if (parsedRows.length < 2) {
      throw new Error(
        `${mastera_ERROR_CODES.CSV_INVALID}: CSV must contain a header row and at least one data row.`
      );
    }

    const headerRow = (parsedRows[0] ?? []).map((h) =>
      h.trim().toLowerCase()
    );
    const headerMismatch =
      headerRow.length !== EXPECTED_CSV_HEADERS.length ||
      EXPECTED_CSV_HEADERS.some((expected, idx) => headerRow[idx] !== expected);

    if (headerMismatch) {
      throw new Error(
        `${mastera_ERROR_CODES.CSV_INVALID}: Invalid CSV header. Expected: ${EXPECTED_CSV_HEADERS.join(',')}`
      );
    }

    const dataRows = parsedRows.slice(1);
    if (dataRows.length > MAX_CSV_ROWS) {
      throw new Error(
        `${mastera_ERROR_CODES.CSV_INVALID}: CSV exceeds maximum ${MAX_CSV_ROWS} rows per import.`
      );
    }

    const errors: CsvImportRowErrorDto[] = [];
    const preparedInputs: CreateQuestionInput[] = [];

    dataRows.forEach((cols, index) => {
      const rowNumber = index + 2; // 1-based including header
      const rawType = neutralizeCsvCellFormula(cols[0] ?? '').toUpperCase();
      const promptLatex = neutralizeCsvCellFormula(cols[1] ?? '');
      const optA = neutralizeCsvCellFormula(cols[2] ?? '');
      const optB = neutralizeCsvCellFormula(cols[3] ?? '');
      const optC = neutralizeCsvCellFormula(cols[4] ?? '');
      const optD = neutralizeCsvCellFormula(cols[5] ?? '');
      const correctAnswer = neutralizeCsvCellFormula(cols[6] ?? '');
      const explanationLatex = neutralizeCsvCellFormula(cols[7] ?? '');

      const validTypes: QuestionType[] = [
        'MULTIPLE_CHOICE',
        'TRUE_FALSE',
        'SHORT_ANSWER',
        'BLANK_SPACE',
      ];
      if (!validTypes.includes(rawType as QuestionType)) {
        errors.push({
          rowNumber,
          column: 'question_type',
          message: `Invalid question_type "${rawType}".`,
        });
        return;
      }

      const questionType = rawType as QuestionType;
      if (!promptLatex) {
        errors.push({
          rowNumber,
          column: 'prompt_latex',
          message: 'Question prompt is required.',
        });
      }
      if (!explanationLatex) {
        errors.push({
          rowNumber,
          column: 'explanation_latex',
          message: 'Explanation is required.',
        });
      }

      if (questionType === 'MULTIPLE_CHOICE') {
        if (!optA || !optB) {
          errors.push({
            rowNumber,
            column: 'option_a/option_b',
            message: 'Multiple choice requires at least option_a and option_b.',
          });
        }
        const upperCorrect = correctAnswer.toUpperCase();
        if (!['A', 'B', 'C', 'D'].includes(upperCorrect)) {
          errors.push({
            rowNumber,
            column: 'correct_answer',
            message: 'Multiple choice correct_answer must be A, B, C, or D.',
          });
        }
        const options = [
          { id: 'A', textLatex: optA },
          { id: 'B', textLatex: optB },
          ...(optC ? [{ id: 'C', textLatex: optC }] : []),
          ...(optD ? [{ id: 'D', textLatex: optD }] : []),
        ];
        preparedInputs.push({
          examSetId: target.examSetId,
          quizChapterId: target.quizChapterId,
          courseId: target.courseId,
          questionType,
          promptLatex,
          options,
          correctOptionId: upperCorrect,
          explanationLatex,
        });
      } else if (questionType === 'TRUE_FALSE') {
        const lower = correctAnswer.toLowerCase();
        if (lower !== 'true' && lower !== 'false') {
          errors.push({
            rowNumber,
            column: 'correct_answer',
            message: 'True/False correct_answer must be TRUE or FALSE.',
          });
        }
        preparedInputs.push({
          examSetId: target.examSetId,
          quizChapterId: target.quizChapterId,
          courseId: target.courseId,
          questionType,
          promptLatex,
          correctBoolean: lower === 'true',
          explanationLatex,
        });
      } else {
        // SHORT_ANSWER or BLANK_SPACE: pipe-separated accepted answers
        const acceptedAnswers = correctAnswer
          .split('|')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        if (acceptedAnswers.length === 0) {
          errors.push({
            rowNumber,
            column: 'correct_answer',
            message: 'At least one accepted answer is required.',
          });
        }
        preparedInputs.push({
          examSetId: target.examSetId,
          quizChapterId: target.quizChapterId,
          courseId: target.courseId,
          questionType,
          promptLatex,
          acceptedAnswers,
          explanationLatex,
        });
      }
    });

    const report: CsvImportDryRunResultDto = {
      valid: errors.length === 0,
      totalRows: dataRows.length,
      validRowsCount: dataRows.length - errors.length,
      errors,
    };

    const committedQuestions: StoredQuestionRecord[] = [];
    if (!dryRun && report.valid) {
      for (const item of preparedInputs) {
        const created = await this.assessmentsService.createQuestion(
          actor,
          item
        );
        committedQuestions.push(created);
      }

      await this.auditService.record({
        actorId: actor.adminId,
        actorRole: actor.adminRole,
        action: 'CSV_BULK_QUESTIONS_IMPORTED',
        resourceType: target.examSetId ? 'EXAM_SET' : 'QUIZ_CHAPTER',
        resourceId: target.examSetId ?? target.quizChapterId ?? null,
        newValue: {
          importedCount: committedQuestions.length,
        },
      });
    }

    return { report, committedQuestions };
  }
}