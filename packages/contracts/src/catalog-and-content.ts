import { CourseAccentName } from '@mastera/ui-tokens';
import { PaymentMethodEntryDto } from './commerce-and-claims';

export type AcademicStream = 'NATURAL' | 'SOCIAL' | 'COMMON';

export type MaterialType = 'MODULES' | 'NOTES' | 'AMHARIC_NOTE';

export type QuizTarget = 'QUIZ_1' | 'QUIZ_2' | 'QUIZ_3';

export type ExamCategory = 'MID' | 'FINAL' | 'MOCK' | 'COC';

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'BLANK_SPACE';

export type ContentStatus = 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'INACTIVE';

export interface CatalogUniversityDto {
  id: string;
  name: string;
  shortName: string;
  isActive: boolean;
  version: number;
}

export interface CatalogProgramDto {
  id: string;
  universityId: string;
  name: string;
  isActive: boolean;
  version: number;
}

export interface CatalogCourseDto {
  id: string;
  code: string;
  title: string;
  universityId: string | null; // null means All Universities
  programId: string | null;
  semester: 1 | 2;
  stream: AcademicStream;
  accent: CourseAccentName;
  icon: string;
  freeAccess: boolean;
  freeTrialCount: number;
  priceETB: number;
  contentVersion: number;
  isActive: boolean;
}

export interface CatalogBookGroupDto {
  id: string;
  courseId: string;
  category: MaterialType | QuizTarget;
  code: string; // e.g., M1, N1, A1, Q1
  title: string;
  subtitle: string;
  orderIndex: number;
  version: number;
}

export interface CatalogChapterMetaDto {
  id: string;
  courseId: string;
  bookGroupId: string;
  category: MaterialType | QuizTarget;
  orderIndex: number;
  title: string;
  isFree: boolean;
  questionCount?: number;
  timeAllowedMinutes?: number | null; // DR-05, Q13: optional for quizzes
  estimatedSizeBytes: number;
  version: number;
  status: ContentStatus;
}

export interface CatalogExamSetMetaDto {
  id: string;
  examSetCode: string;
  category: ExamCategory;
  universityId: string | null;
  programId: string | null;
  courseId: string | null; // null for standalone COC sets
  semester: 1 | 2 | null;
  stream: AcademicStream | null;
  year: string;
  title: string;
  questionCount: number;
  timeAllowedMinutes: number; // D13: duration set on exam set
  isFreeSample: boolean;
  version: number;
  status: ContentStatus;
}

export interface CatalogSnapshotQueryDto {
  universityId?: string;
  programId?: string;
  semester?: 1 | 2;
  stream?: 'NATURAL' | 'SOCIAL';
  sinceVersion?: number;
}

export interface CatalogSnapshotResponseDto {
  snapshotVersion: number;
  generatedAt: string;
  universities: CatalogUniversityDto[];
  programs: CatalogProgramDto[];
  courses: CatalogCourseDto[];
  bookGroups: CatalogBookGroupDto[];
  chapters: CatalogChapterMetaDto[];
  examSets: CatalogExamSetMetaDto[];
  paymentMethods?: PaymentMethodEntryDto[] | undefined;
  deletedItemIds: string[];
}

export interface QuestionItemDto {
  id: string; // Global database UUID (FR-G12: never shown as question number)
  displayNumber: number; // FR-G11: restarts at 1 per exam set or quiz chapter
  questionType: QuestionType;
  promptLatex: string;
  options?: { id: string; textLatex: string }[];
  correctOptionId?: string;
  correctBoolean?: boolean;
  acceptedAnswers?: string[];
  explanationLatex: string;
}

export interface CsvImportRowErrorDto {
  rowNumber: number;
  column: string;
  message: string;
}

export interface CoursePackageManifestDto {
  packageId: string;
  courseId: string;
  courseCode: string;
  contentVersion: number;
  sizeBytes: number;
  sha256Checksum: string;
  chaptersCount: number;
  examsCount: number;
  downloadUrl: string;
  generatedAt: string;
}

export interface CoursePackageSummaryDto {
  courseId: string;
  version: number;
  sizeBytes: number;
  sha256Hex: string;
  downloadUrl: string;
  isReady: boolean;
}

export interface DeltaSyncQueryDto {
  sinceVersion: number;
  universityId?: string;
  programId?: string;
  semester?: 1 | 2;
  stream?: 'NATURAL' | 'SOCIAL';
}

export interface DeltaSyncResponseDto {
  currentVersion: number;
  generatedAt: string;
  upsertedCourses: CatalogCourseDto[];
  upsertedBookGroups: CatalogBookGroupDto[];
  upsertedChapters: CatalogChapterMetaDto[];
  upsertedExamSets: CatalogExamSetMetaDto[];
  paymentMethods?: PaymentMethodEntryDto[];
  deletedItemIds: string[];
}


export interface CsvImportDryRunResultDto {
  valid: boolean;
  totalRows: number;
  validRowsCount: number;
  errors: CsvImportRowErrorDto[];
}