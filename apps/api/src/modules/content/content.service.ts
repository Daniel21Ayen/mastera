import { Injectable } from '@nestjs/common';
import {
  CatalogChapterMetaDto,
  ContentStatus,
  MaterialType,
  QuizTarget,
} from '@mastera/contracts';
import { AuditService } from '../audit-reports/audit.service';
import {
  AuthenticatedAdminContext,
  ScopeAuthorizationService,
} from '../permissions/scope.service';

export interface ChapterContentRecord extends CatalogChapterMetaDto {
  bodyMarkdownLatex: string;
  pdfStorageKey: string | null;
  authoredById: string;
  reviewedById: string | null;
  courseCode?: string;
  courseTitle?: string;
  universityName?: string;
  programName?: string;
  bookGroupTitle?: string;
}

export interface BookGroupRecord {
  id: string;
  courseId: string;
  category: MaterialType | QuizTarget;
  code: string;
  title: string;
  subtitle: string;
  orderIndex: number;
  version: number;
  chaptersCount?: number;
}

export interface UpsertChapterContentInput {
  courseId: string;
  bookGroupId?: string | null | undefined;
  category: MaterialType | QuizTarget;
  orderIndex: number;
  title: string;
  bodyMarkdownLatex: string;
  pdfStorageKey?: string | null | undefined;
  isFree?: boolean | undefined;
  timeAllowedMinutes?: number | null | undefined; // Optional for quizzes (DR-05, Q13)
}

export interface ContentRepositoryPort {
  createChapter(
    data: Omit<ChapterContentRecord, 'id'>
  ): Promise<ChapterContentRecord>;
  findChapterById(id: string): Promise<ChapterContentRecord | null>;
  updateChapter(
    id: string,
    patch: Partial<ChapterContentRecord>
  ): Promise<ChapterContentRecord>;
  bumpCourseContentVersion(courseId: string): Promise<void>;
  listChapters?(filter?: {
    courseId?: string;
    bookGroupId?: string;
    category?: string;
    status?: string;
    universityId?: string;
    programId?: string;
  }): Promise<ChapterContentRecord[]>;
  listBookGroups?(filter?: {
    courseId?: string;
    category?: string;
  }): Promise<BookGroupRecord[]>;
  createBookGroup?(data: {
    courseId: string;
    category: MaterialType | QuizTarget;
    title: string;
    subtitle?: string | undefined;
    code?: string | undefined;
    orderIndex?: number | undefined;
  }): Promise<BookGroupRecord>;
}

@Injectable()
export class ContentAuthoringService {
  constructor(
    private readonly repo: ContentRepositoryPort,
    private readonly scopeAuth: ScopeAuthorizationService,
    private readonly auditService: AuditService
  ) {}

  async listBookGroups(filter?: {
    courseId?: string;
    category?: string;
  }): Promise<BookGroupRecord[]> {
    if (this.repo.listBookGroups) {
      return this.repo.listBookGroups(filter);
    }
    return [];
  }

  async createBookGroup(
    actor: AuthenticatedAdminContext,
    input: {
      courseId: string;
      category: MaterialType | QuizTarget;
      title: string;
      subtitle?: string | undefined;
    }
  ): Promise<BookGroupRecord> {
    const decision = await this.scopeAuth.authorizeAdminAction(
      actor,
      'CONTENT_AUTHOR_SCOPED',
      { courseId: input.courseId }
    );
    if (!decision.allowed) {
      throw new Error(`${decision.errorCode}: ${decision.reason}`);
    }
    if (!this.repo.createBookGroup) {
      throw new Error('createBookGroup is not implemented in repository');
    }
    const created = await this.repo.createBookGroup(input);
    await this.auditService.record({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'BOOK_GROUP_CREATED',
      resourceType: 'CONTENT',
      resourceId: created.id,
      newValue: {
        courseId: created.courseId,
        category: created.category,
        title: created.title,
      },
    });
    return created;
  }

  async listChapters(filter?: {
    courseId?: string;
    bookGroupId?: string;
    category?: string;
    status?: string;
    universityId?: string;
    programId?: string;
  }): Promise<ChapterContentRecord[]> {
    if (this.repo.listChapters) {
      return this.repo.listChapters(filter);
    }
    return [];
  }

  async getChapterById(id: string): Promise<ChapterContentRecord | null> {
    return this.repo.findChapterById(id);
  }

  async createChapterDraft(
    actor: AuthenticatedAdminContext,
    input: UpsertChapterContentInput
  ): Promise<ChapterContentRecord> {
    const decision = await this.scopeAuth.authorizeAdminAction(
      actor,
      'CONTENT_AUTHOR_SCOPED',
      { courseId: input.courseId }
    );
    if (!decision.allowed) {
      throw new Error(`${decision.errorCode}: ${decision.reason}`);
    }

    const bodyBytes = Buffer.byteLength(input.bodyMarkdownLatex, 'utf8');
    const created = await this.repo.createChapter({
      courseId: input.courseId,
      bookGroupId: input.bookGroupId ?? '',
      category: input.category,
      orderIndex: input.orderIndex,
      title: input.title.trim(),
      bodyMarkdownLatex: input.bodyMarkdownLatex,
      pdfStorageKey: input.pdfStorageKey ?? null,
      isFree: input.isFree ?? false,
      timeAllowedMinutes: input.timeAllowedMinutes ?? null,
      estimatedSizeBytes: bodyBytes,
      version: 1,
      status: 'DRAFT',
      authoredById: actor.adminId,
      reviewedById: null,
    });

    await this.auditService.record({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'CHAPTER_DRAFT_CREATED',
      resourceType: 'CONTENT',
      resourceId: created.id,
      newValue: {
        courseId: created.courseId,
        category: created.category,
        title: created.title,
      },
    });

    return created;
  }

  async updateChapter(
    actor: AuthenticatedAdminContext,
    chapterId: string,
    patch: Partial<UpsertChapterContentInput>
  ): Promise<ChapterContentRecord> {
    const existing = await this.repo.findChapterById(chapterId);
    if (!existing) {
      throw new Error('Chapter not found.');
    }

    const decision = await this.scopeAuth.authorizeAdminAction(
      actor,
      'CONTENT_AUTHOR_SCOPED',
      { courseId: existing.courseId }
    );
    if (!decision.allowed) {
      throw new Error(`${decision.errorCode}: ${decision.reason}`);
    }

    const updateData: Partial<ChapterContentRecord> = {};
    if (patch.title !== undefined) updateData.title = patch.title.trim();
    if (patch.orderIndex !== undefined) updateData.orderIndex = patch.orderIndex;
    if (patch.bodyMarkdownLatex !== undefined) {
      updateData.bodyMarkdownLatex = patch.bodyMarkdownLatex;
      updateData.estimatedSizeBytes = Buffer.byteLength(patch.bodyMarkdownLatex, 'utf8');
    }
    if (patch.pdfStorageKey !== undefined) updateData.pdfStorageKey = patch.pdfStorageKey;
    if (patch.isFree !== undefined) updateData.isFree = patch.isFree;

    const updated = await this.repo.updateChapter(chapterId, updateData);

    await this.auditService.record({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'CHAPTER_UPDATED',
      resourceType: 'CONTENT',
      resourceId: chapterId,
      newValue: {
        title: updated.title,
        orderIndex: updated.orderIndex,
      },
    });

    return updated;
  }

  async submitForReview(
    actor: AuthenticatedAdminContext,
    chapterId: string
  ): Promise<ChapterContentRecord> {
    const existing = await this.repo.findChapterById(chapterId);
    if (!existing) {
      throw new Error('Chapter not found.');
    }

    const decision = await this.scopeAuth.authorizeAdminAction(
      actor,
      'CONTENT_SUBMIT_REVIEW',
      { courseId: existing.courseId }
    );
    if (!decision.allowed) {
      throw new Error(`${decision.errorCode}: ${decision.reason}`);
    }

    return this.repo.updateChapter(chapterId, {
      status: 'IN_REVIEW',
    });
  }

  /**
   * Publishes a chapter under Maker-Checker rules (FR-G62: publisher MUST differ
   * from author) and bumps both chapter version and parent course contentVersion.
   */
  async publishChapter(
    actor: AuthenticatedAdminContext,
    chapterId: string
  ): Promise<ChapterContentRecord> {
    const existing = await this.repo.findChapterById(chapterId);
    if (!existing) {
      throw new Error('Chapter not found.');
    }

    const decision = await this.scopeAuth.authorizeAdminAction(
      actor,
      'CONTENT_PUBLISH',
      {
        courseId: existing.courseId,
        authoredByAdminId: existing.authoredById,
      }
    );
    if (!decision.allowed) {
      throw new Error(`${decision.errorCode}: ${decision.reason}`);
    }

    const published = await this.repo.updateChapter(chapterId, {
      status: 'PUBLISHED',
      reviewedById: actor.adminId,
      version: existing.version + 1,
    });

    await this.repo.bumpCourseContentVersion(existing.courseId);

    await this.auditService.record({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'CHAPTER_PUBLISHED',
      resourceType: 'CONTENT',
      resourceId: chapterId,
      previousValue: { status: existing.status, version: existing.version },
      newValue: { status: published.status, version: published.version },
    });

    return published;
  }
}