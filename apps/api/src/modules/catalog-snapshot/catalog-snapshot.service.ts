import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import {
  CatalogBookGroupDto,
  CatalogChapterMetaDto,
  CatalogCourseDto,
  CatalogExamSetMetaDto,
  CatalogProgramDto,
  CatalogSnapshotQueryDto,
  CatalogSnapshotResponseDto,
  CatalogUniversityDto,
  PaymentMethodEntryDto,
} from '@mastera/contracts';

export interface SnapshotDataSourcePort {
  getAllUniversities(): Promise<CatalogUniversityDto[]>;
  getAllPrograms(): Promise<CatalogProgramDto[]>;
  getAllCourses(): Promise<CatalogCourseDto[]>;
  getAllBookGroups(): Promise<CatalogBookGroupDto[]>;
  getAllChaptersMeta(): Promise<CatalogChapterMetaDto[]>;
  getAllExamSetsMeta(): Promise<CatalogExamSetMetaDto[]>;
  getDeactivatedOrDeletedIdsSince(sinceVersion: number): Promise<string[]>;
  getActivePaymentMethods?(): Promise<PaymentMethodEntryDto[]>;
}

export interface CompressedSnapshotEnvelope {
  etag: string;
  notModified: boolean;
  snapshotVersion: number;
  payload?: CatalogSnapshotResponseDto | undefined;
  gzipBuffer?: Buffer | undefined;
}

@Injectable()
export class CatalogSnapshotService {
  constructor(private readonly dataSource: SnapshotDataSourcePort) {}

  /**
   * Builds a scope-filtered, delta-versioned catalog snapshot with ETag and
   * gzip compression (Section 8.3, SYN-03).
   */
  async buildSnapshot(
    query: CatalogSnapshotQueryDto,
    clientIfNoneMatch?: string
  ): Promise<CompressedSnapshotEnvelope> {
    const since =
      typeof query.sinceVersion === 'string'
        ? parseInt(query.sinceVersion, 10) || 0
        : Number(query.sinceVersion) || 0;

    const [
      allUniversities,
      allPrograms,
      allCourses,
      allBookGroups,
      allChapters,
      allExamSets,
      explicitlyDeletedIds,
      paymentMethods,
    ] = await Promise.all([
      this.dataSource.getAllUniversities(),
      this.dataSource.getAllPrograms(),
      this.dataSource.getAllCourses(),
      this.dataSource.getAllBookGroups(),
      this.dataSource.getAllChaptersMeta(),
      this.dataSource.getAllExamSetsMeta(),
      this.dataSource.getDeactivatedOrDeletedIdsSince(since),
      this.dataSource.getActivePaymentMethods
        ? this.dataSource.getActivePaymentMethods()
        : Promise.resolve([]),
    ]);

    // 1. Filter active universities & programs
    const activeUniversities = allUniversities.filter((u) => u.isActive);
    const activePrograms = allPrograms.filter((p) => p.isActive);

    // 2. Scope-filter active courses (Student stream + COMMON stream, Section 8.3)
    const scopedActiveCourses = allCourses.filter((course) => {
      if (!course.isActive) return false;

      if (
        query.universityId &&
        course.universityId !== null &&
        course.universityId !== query.universityId
      ) {
        return false;
      }

      if (
        query.programId &&
        course.programId !== null &&
        course.programId !== query.programId
      ) {
        return false;
      }

      if (query.semester && course.semester !== query.semester) {
        return false;
      }

      if (
        query.stream &&
        course.stream !== query.stream &&
        course.stream !== 'COMMON'
      ) {
        return false;
      }

      return true;
    });

    const allowedCourseIds = new Set(scopedActiveCourses.map((c) => c.id));

    // 3. Filter book groups, published chapters, and published exam sets in scope
    const scopedBookGroups = allBookGroups.filter((bg) =>
      allowedCourseIds.has(bg.courseId)
    );

    const scopedPublishedChapters = allChapters.filter(
      (ch) =>
        allowedCourseIds.has(ch.courseId) && ch.status === 'PUBLISHED'
    );

    const scopedPublishedExamSets = allExamSets.filter((es) => {
      if (es.status !== 'PUBLISHED') return false;
      if (es.category === 'COC') {
        // Standalone COC sets match stream/semester if set
        if (
          query.stream &&
          es.stream !== null &&
          es.stream !== query.stream &&
          es.stream !== 'COMMON'
        ) {
          return false;
        }
        return true;
      }
      return es.courseId !== null && allowedCourseIds.has(es.courseId);
    });

    // 4. Compute highest snapshotVersion across all catalog entities
    const maxVersion = Math.max(
      1,
      ...activeUniversities.map((u) => u.version),
      ...activePrograms.map((p) => p.version),
      ...scopedActiveCourses.map((c) => c.contentVersion),
      ...scopedBookGroups.map((b) => b.version),
      ...scopedPublishedChapters.map((ch) => ch.version),
      ...scopedPublishedExamSets.map((es) => es.version)
    );

    // 5. Collect inactive/unpublished items that changed since `sinceVersion` (SYN-03 parity)
    const newlyInactiveCourseIds = allCourses
      .filter((c) => !c.isActive && c.contentVersion > since)
      .map((c) => c.id);

    const newlyUnpublishedChapterIds = allChapters
      .filter((ch) => ch.status !== 'PUBLISHED' && ch.version > since)
      .map((ch) => ch.id);

    const newlyUnpublishedExamIds = allExamSets
      .filter((es) => es.status !== 'PUBLISHED' && es.version > since)
      .map((es) => es.id);

    const deletedItemIds = Array.from(
      new Set([
        ...explicitlyDeletedIds,
        ...newlyInactiveCourseIds,
        ...newlyUnpublishedChapterIds,
        ...newlyUnpublishedExamIds,
      ])
    );

    // 6. Apply delta filter (`version > since`)
    const deltaPayload: CatalogSnapshotResponseDto = {
      snapshotVersion: maxVersion,
      generatedAt: new Date().toISOString(),
      universities: activeUniversities.filter((u) => u.version > since),
      programs: activePrograms.filter((p) => p.version > since),
      courses: scopedActiveCourses.filter((c) => c.contentVersion > since),
      bookGroups: scopedBookGroups.filter((b) => b.version > since),
      chapters: scopedPublishedChapters.filter((ch) => ch.version > since),
      examSets: scopedPublishedExamSets.filter((es) => es.version > since),
      paymentMethods:
        paymentMethods && paymentMethods.length > 0 ? paymentMethods : undefined,
      deletedItemIds,
    };

    // 7. Compute deterministic ETag over scope + version state
    const etagSource = JSON.stringify({
      scope: query,
      snapshotVersion: maxVersion,
      counts: {
        u: deltaPayload.universities.length,
        p: deltaPayload.programs.length,
        c: deltaPayload.courses.length,
        b: deltaPayload.bookGroups.length,
        ch: deltaPayload.chapters.length,
        es: deltaPayload.examSets.length,
        pm: deltaPayload.paymentMethods?.length ?? 0,
        d: deltaPayload.deletedItemIds.length,
      },
    });
    const etag = `"v${maxVersion}-${crypto
      .createHash('sha256')
      .update(etagSource)
      .digest('hex')
      .slice(0, 16)}"`;

    if (clientIfNoneMatch && clientIfNoneMatch === etag) {
      return {
        etag,
        notModified: true,
        snapshotVersion: maxVersion,
      };
    }

    const jsonString = JSON.stringify(deltaPayload);
    const gzipBuffer = zlib.gzipSync(Buffer.from(jsonString, 'utf8'), {
      level: zlib.constants.Z_BEST_COMPRESSION,
    });

    return {
      etag,
      notModified: false,
      snapshotVersion: maxVersion,
      payload: deltaPayload,
      gzipBuffer,
    };
  }
}