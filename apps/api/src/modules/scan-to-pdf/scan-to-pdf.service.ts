import { Injectable } from '@nestjs/common';
import {
  AuthenticatedAdminContext,
  ScopeAuthorizationService,
} from '../permissions/scope.service';

export type ScanTargetCategory =
  | 'MODULES'
  | 'NOTES'
  | 'AMHARIC_NOTE'
  | 'QUIZ_1'
  | 'QUIZ_2'
  | 'QUIZ_3'
  | 'MID_EXAM'
  | 'FINAL_EXAM'
  | 'MOCK_EXAM'
  | 'COC_EXAM';

export interface ScannedPageOperation {
  pageId: string;
  orderIndex: number;
  rotationDegrees: 0 | 90 | 180 | 270;
}

export interface ScanJobRecord {
  id: string;
  createdByAdminId: string;
  category: ScanTargetCategory;
  courseId: string | null;
  chapterId: string | null;
  year: string | null;
  allowedTimeMinutes: number | null;
  accessPermission: 'PAID_COURSE_ONLY' | 'FREE_TRIAL';
  answerExplanationText: string;
  pages: ScannedPageOperation[];
  convertedPdfStorageKey: string | null;
  convertedPdfSizeKB: number | null;
  status: 'IMPORTED' | 'ORDERED' | 'CONVERTED' | 'DRAFT_SAVED' | 'PUBLISHED';
}

export const MAX_SCAN_IMAGES_PER_PDF = 200; // Per UI screenshot: "Up to 200 per PDF"

@Injectable()
export class ScanToPdfService {
  private readonly jobs = new Map<string, ScanJobRecord>();

  constructor(private readonly scopeAuth: ScopeAuthorizationService) {}

  async createImportJob(
    actor: AuthenticatedAdminContext,
    pageIds: string[],
    category: ScanTargetCategory,
    courseId: string | null
  ): Promise<ScanJobRecord> {
    const decision = await this.scopeAuth.authorizeAdminAction(
      actor,
      'CONTENT_AUTHOR_SCOPED',
      { courseId }
    );
    if (!decision.allowed) {
      throw new Error(`${decision.errorCode}: ${decision.reason}`);
    }

    if (pageIds.length === 0 || pageIds.length > MAX_SCAN_IMAGES_PER_PDF) {
      throw new Error(
        `Scan to PDF requires between 1 and ${MAX_SCAN_IMAGES_PER_PDF} images.`
      );
    }

    const job: ScanJobRecord = {
      id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdByAdminId: actor.adminId,
      category,
      courseId,
      chapterId: null,
      year: null,
      allowedTimeMinutes: null,
      accessPermission: 'PAID_COURSE_ONLY',
      answerExplanationText: '',
      pages: pageIds.map((pageId, idx) => ({
        pageId,
        orderIndex: idx + 1,
        rotationDegrees: 0,
      })),
      convertedPdfStorageKey: null,
      convertedPdfSizeKB: null,
      status: 'IMPORTED',
    };

    this.jobs.set(job.id, job);
    return job;
  }

  async convertOrderedPagesToPdf(
    actor: AuthenticatedAdminContext,
    jobId: string,
    orderedPages: ScannedPageOperation[]
  ): Promise<ScanJobRecord> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error('Scan job not found.');
    }

    const decision = await this.scopeAuth.authorizeAdminAction(
      actor,
      'CONTENT_AUTHOR_SCOPED',
      { courseId: job.courseId }
    );
    if (!decision.allowed) {
      throw new Error(`${decision.errorCode}: ${decision.reason}`);
    }

    job.pages = [...orderedPages].sort((a, b) => a.orderIndex - b.orderIndex);
    job.convertedPdfStorageKey = `scans/${job.id}/compiled-${job.pages.length}p.pdf`;
    job.convertedPdfSizeKB = job.pages.length * 172;
    job.status = 'CONVERTED';

    return job;
  }
}