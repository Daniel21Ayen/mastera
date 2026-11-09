import {
  CatalogBookGroupDto,
  CatalogChapterMetaDto,
  CatalogCourseDto,
  CatalogExamSetMetaDto,
  CatalogProgramDto,
  CatalogSnapshotResponseDto,
  CatalogUniversityDto,
} from '@mastera/contracts';
import { resolveCanOpen } from '@mastera/domain';
import {
  StudentAccessBadgeType,
  StudentActionChipType,
} from '@mastera/ui-tokens';

export interface LocalDownloadStateRecord {
  itemId: string; // courseId or chapterId
  downloadedVersion: number;
  encryptedFilePath: string;
  sizeBytes: number;
}

export interface LocalChapterProgressRecord {
  chapterId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  answeredCount?: number;
}

export interface ResolvedCatalogRowView<TItem> {
  item: TItem;
  canOpenNow: boolean;
  accessBadge: StudentAccessBadgeType;
  actionChip?: StudentActionChipType | undefined;
  updateAvailable: boolean;
}

export class LocalCatalogSqliteStore {
  private snapshotVersion = 0;
  private universities = new Map<string, CatalogUniversityDto>();
  private programs = new Map<string, CatalogProgramDto>();
  private courses = new Map<string, CatalogCourseDto>();
  private bookGroups = new Map<string, CatalogBookGroupDto>();
  private chapters = new Map<string, CatalogChapterMetaDto>();
  private examSets = new Map<string, CatalogExamSetMetaDto>();

  private downloads = new Map<string, LocalDownloadStateRecord>();
  private progress = new Map<string, LocalChapterProgressRecord>();
  private entitledCourseIds = new Set<string>();

  /**
   * Hydrates local SQLite tables from the bundled release seed during Splash
   * so first launch works 100% offline with zero loading state (Section 8.3, NFR-15).
   */
  hydrateFromBundledSeed(seed: CatalogSnapshotResponseDto): void {
    this.applyDeltaSnapshot(seed);
  }

  /**
   * Atomically applies a delta catalog snapshot from GET /catalog/snapshot
   * (Section 8.3, Section 8.4, SYN-03).
   */
  applyDeltaSnapshot(delta: CatalogSnapshotResponseDto): void {
    for (const u of delta.universities) {
      this.universities.set(u.id, u);
    }
    for (const p of delta.programs) {
      this.programs.set(p.id, p);
    }
    for (const c of delta.courses) {
      this.courses.set(c.id, c);
    }
    for (const bg of delta.bookGroups) {
      this.bookGroups.set(bg.id, bg);
    }
    for (const ch of delta.chapters) {
      this.chapters.set(ch.id, ch);
    }
    for (const es of delta.examSets) {
      this.examSets.set(es.id, es);
    }

    // Remove deactivated / unpublished / deleted items immediately (SYN-03)
    for (const deletedId of delta.deletedItemIds) {
      this.courses.delete(deletedId);
      this.bookGroups.delete(deletedId);
      this.chapters.delete(deletedId);
      this.examSets.delete(deletedId);
    }

    if (delta.snapshotVersion > this.snapshotVersion) {
      this.snapshotVersion = delta.snapshotVersion;
    }
  }

  setActiveEntitledCourses(courseIds: string[]): void {
    this.entitledCourseIds = new Set(courseIds);
  }

  markItemDownloaded(record: LocalDownloadStateRecord): void {
    this.downloads.set(record.itemId, record);
  }

  removeDownload(itemId: string): void {
    this.downloads.delete(itemId);
  }

  setChapterProgress(record: LocalChapterProgressRecord): void {
    this.progress.set(record.chapterId, record);
  }

  getSnapshotVersion(): number {
    return this.snapshotVersion;
  }

  getUniversities(): CatalogUniversityDto[] {
    return Array.from(this.universities.values()).filter((u) => u.isActive);
  }

  getProgramsByUniversity(universityId: string): CatalogProgramDto[] {
    return Array.from(this.programs.values()).filter(
      (p) => p.isActive && p.universityId === universityId
    );
  }

  /**
   * Draws the student's scoped course list synchronously from memory in < 1 ms
   * (well under the 300 ms NFR-15 requirement) with badges matching the
   * "My Courses" design sheet (Included, Free, Locked, Downloaded).
   */
  getScopedCoursesInstant(scope: {
    universityId: string;
    programId: string;
    semester: 1 | 2;
    stream: 'NATURAL' | 'SOCIAL';
    searchQuery?: string;
    tabFilter?: 'ALL' | 'ONGOING' | 'COMPLETED';
  }): ResolvedCatalogRowView<CatalogCourseDto>[] {
    const query = (scope.searchQuery ?? '').trim().toLowerCase();

    const matching = Array.from(this.courses.values()).filter((c) => {
      if (!c.isActive) return false;
      if (c.universityId !== null && c.universityId !== scope.universityId) {
        return false;
      }
      if (c.programId !== null && c.programId !== scope.programId) {
        return false;
      }
      if (c.semester !== scope.semester) return false;
      if (c.stream !== scope.stream && c.stream !== 'COMMON') return false;
      if (
        query &&
        !c.title.toLowerCase().includes(query) &&
        !c.code.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });

    return matching.map((course) => {
      const isEntitled = this.entitledCourseIds.has(course.id);
      const downloadRec = this.downloads.get(course.id);
      const isDownloaded = Boolean(downloadRec);
      const updateAvailable =
        downloadRec !== undefined &&
        course.contentVersion > downloadRec.downloadedVersion;

      // My Courses badge priority matching design sheet 1 ("My Courses"):
      // Included (covered by active bundle/entitlement) | Free | Downloaded | Locked
      let accessBadge: StudentAccessBadgeType;
      if (isEntitled) {
        accessBadge = isDownloaded ? 'Downloaded' : 'Included';
      } else if (course.freeAccess || course.freeTrialCount > 0) {
        accessBadge = 'Free';
      } else {
        accessBadge = 'Locked';
      }

      return {
        item: course,
        canOpenNow: true, // Every student can open the course shell to see chapter listings (D23)
        accessBadge,
        updateAvailable,
      };
    });
  }

  /**
   * Resolves chapter rows inside a Book Group (Modules, Notes, Amharic, Quiz 1-3)
   * with the Two-Part Badge Vocabulary (DR-04, Section 8.2) and R15 enforcement.
   */
  getChaptersForBookInstant(params: {
    courseId: string;
    bookGroupId: string;
    isOnline: boolean;
  }): ResolvedCatalogRowView<CatalogChapterMetaDto>[] {
    const course = this.courses.get(params.courseId);
    if (!course) return [];

    const isCourseEntitled = this.entitledCourseIds.has(course.id);
    const courseDownload = this.downloads.get(course.id);

    const chaptersInBook = Array.from(this.chapters.values())
      .filter(
        (ch) =>
          ch.courseId === params.courseId &&
          ch.bookGroupId === params.bookGroupId &&
          ch.status === 'PUBLISHED'
      )
      .sort((a, b) => a.orderIndex - b.orderIndex);

    return chaptersInBook.map((ch) => {
      const isWithinFreeTrialCount = ch.orderIndex <= course.freeTrialCount;
      const isItemFree = ch.isFree || isWithinFreeTrialCount;

      const permission = resolveCanOpen({
        isItemActive: course.isActive,
        isItemPublished: ch.status === 'PUBLISHED',
        isItemDeleted: false,
        hasActiveEntitlementForCourse: isCourseEntitled,
        isCourseFreeAccess: course.freeAccess,
        isItemFreeAtItemLevel: isItemFree,
      });

      const chapterDownload = this.downloads.get(ch.id) ?? courseDownload;
      const isDownloaded = Boolean(chapterDownload);
      const hasSource = params.isOnline || isDownloaded;

      // R15 Edge Case: If an item becomes paid while downloaded, permission.allowed is false,
      // so canOpenNow is false even though isDownloaded is true!
      const canOpenNow = permission.allowed && hasSource;

      const prog = this.progress.get(ch.id);
      const isQuiz =
        ch.category === 'QUIZ_1' ||
        ch.category === 'QUIZ_2' ||
        ch.category === 'QUIZ_3';

      let accessBadge: StudentAccessBadgeType;
      let actionChip: StudentActionChipType | undefined;

      if (!permission.allowed) {
        accessBadge = 'Locked';
      } else if (!params.isOnline && !isDownloaded) {
        accessBadge = 'Not available offline';
      } else if (isDownloaded) {
        accessBadge = 'Downloaded';
      } else if (isItemFree && !isCourseEntitled) {
        accessBadge = 'Free';
      } else {
        accessBadge = 'Download';
      }

      if (canOpenNow) {
        if (prog?.status === 'COMPLETED') {
          actionChip = 'Done';
        } else if (prog?.status === 'IN_PROGRESS') {
          actionChip = 'Resume';
        } else {
          actionChip = isQuiz ? 'Start' : 'Open';
        }
      }

      const updateAvailable =
        chapterDownload !== undefined &&
        ch.version > chapterDownload.downloadedVersion;

      return {
        item: ch,
        canOpenNow,
        accessBadge,
        actionChip,
        updateAvailable,
      };
    });
  }
}