import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { S3StorageService } from '../../infrastructure/storage/s3.service';
import {
  CoursePackageManifestDto,
  CoursePackageSummaryDto,
} from '@mastera/contracts';
import { AuditService } from '../audit-reports/audit.service';

@Injectable()
export class ContentPackageBuilderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3StorageService,
    private readonly auditService: AuditService
  ) {}

  /**
   * Builds, compresses, hashes, and uploads a course content package archive (.pkg).
   * Upserts the CourseContentPackage record and bumps global catalog version.
   */
  async buildCoursePackage(
    courseId: string,
    actorId?: string,
    auditReason?: string
  ): Promise<CoursePackageManifestDto> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        university: true,
        program: true,
      },
    });

    if (!course) {
      throw new NotFoundException(`Course not found: ${courseId}`);
    }

    // 1. Gather all chapters belonging to this course
    const chapters = await this.prisma.content.findMany({
      where: { courseId },
      orderBy: [{ category: 'asc' }, { orderIndex: 'asc' }],
      include: {
        bookGroup: true,
      },
    });

    // 2. Gather all assessments/exam sets and their questions
    const examSets = await this.prisma.examSet.findMany({
      where: { courseId },
      include: {
        questions: {
          orderBy: { displayNumber: 'asc' },
        },
      },
    });

    // 3. Assemble package data payload
    const packagePayload = {
      formatVersion: '1.0.0',
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      contentVersion: course.contentVersion,
      universityName: course.university?.name ?? '',
      programName: course.program?.name ?? '',
      semester: course.semester,
      stream: course.stream,
      generatedAt: new Date().toISOString(),
      chapters: chapters.map((ch) => ({
        id: ch.id,
        bookGroupId: ch.bookGroupId,
        bookGroupTitle: ch.bookGroup?.title ?? '',
        category: ch.category,
        orderIndex: ch.orderIndex,
        title: ch.title,
        bodyMarkdownLatex: ch.bodyMarkdownLatex,
        pdfStorageKey: ch.pdfStorageKey,
        isFree: ch.isFree,
        timeAllowedMinutes: ch.timeAllowedMinutes,
        estimatedSizeBytes: ch.estimatedSizeBytes,
        version: ch.version,
        status: ch.status,
      })),
      exams: examSets.map((ex) => ({
        id: ex.id,
        examSetCode: ex.examSetCode,
        title: ex.title,
        category: ex.category,
        year: ex.year,
        timeAllowedMinutes: ex.timeAllowedMinutes,
        isFreeSample: ex.isFreeSample,
        version: ex.version,
        questions: ex.questions.map((q) => ({
          id: q.id,
          displayNumber: q.displayNumber,
          questionType: q.questionType,
          promptLatex: q.promptLatex,
          optionsJson: q.optionsJson,
          correctOptionId: q.correctOptionId,
          explanationLatex: q.explanationLatex,
        })),
      })),
    };

    // 4. Serialize and gzip compress (deflate level 9 for minimum over-the-air size)
    const jsonBuffer = Buffer.from(JSON.stringify(packagePayload), 'utf8');
    const gzippedBuffer = zlib.gzipSync(jsonBuffer, { level: 9 });

    // 5. Compute SHA-256 tamper-proof checksum
    const sha256Hex = crypto
      .createHash('sha256')
      .update(gzippedBuffer)
      .digest('hex');

    // 6. Upload .pkg archive to MinIO / S3
    const storageKey = `packages/${course.id}/package-v${course.contentVersion}.pkg`;
    await this.s3Service.uploadPackageBuffer(
      storageKey,
      gzippedBuffer,
      'application/octet-stream'
    );

    // 7. Upsert CourseContentPackage in PostgreSQL
    const pkgRecord = await this.prisma.courseContentPackage.upsert({
      where: {
        courseId_version: {
          courseId: course.id,
          version: course.contentVersion,
        },
      },
      create: {
        courseId: course.id,
        version: course.contentVersion,
        sizeBytes: gzippedBuffer.byteLength,
        storageKey,
        sha256Hex,
        chaptersCount: chapters.length,
        examsCount: examSets.length,
      },
      update: {
        sizeBytes: gzippedBuffer.byteLength,
        storageKey,
        sha256Hex,
        chaptersCount: chapters.length,
        examsCount: examSets.length,
      },
    });

    // 8. Generate presigned download URL (valid for 1 hour for secure transfer)
    let downloadUrl = '';
    try {
      downloadUrl = await this.s3Service.getPresignedDownloadUrl(storageKey, 3600);
    } catch {
      downloadUrl = `/content/packages/${course.id}/stream`;
    }

    // 9. Record audit trail
    if (actorId) {
      await this.auditService.record({
        actorId,
        actorRole: 'SUPER_ADMIN',
        action: 'COURSE_PACKAGE_GENERATED',
        resourceType: 'CONTENT_PACKAGE',
        resourceId: pkgRecord.id,
        newValue: {
          courseId: course.id,
          version: course.contentVersion,
          sizeBytes: gzippedBuffer.byteLength,
          sha256Hex,
          chaptersCount: chapters.length,
          examsCount: examSets.length,
          reason:
            auditReason ||
            'Admin published new chapter or generated course package',
        },
      });
    }

    return {
      packageId: pkgRecord.id,
      courseId: course.id,
      courseCode: course.code,
      contentVersion: course.contentVersion,
      sizeBytes: gzippedBuffer.byteLength,
      sha256Checksum: sha256Hex,
      chaptersCount: chapters.length,
      examsCount: examSets.length,
      downloadUrl,
      generatedAt: pkgRecord.updatedAt.toISOString(),
    };
  }

  /**
   * Fetches latest course package manifest without rebuilding if already present.
   */
  async getPackageManifest(
    courseId: string
  ): Promise<CoursePackageManifestDto | null> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) return null;

    const pkgRecord = await this.prisma.courseContentPackage.findUnique({
      where: {
        courseId_version: {
          courseId: course.id,
          version: course.contentVersion,
        },
      },
    });

    if (!pkgRecord) {
      // Auto-build on demand if no package exists yet
      return this.buildCoursePackage(courseId);
    }

    let downloadUrl = '';
    try {
      downloadUrl = await this.s3Service.getPresignedDownloadUrl(
        pkgRecord.storageKey,
        3600
      );
    } catch {
      downloadUrl = `/content/packages/${course.id}/stream`;
    }

    return {
      packageId: pkgRecord.id,
      courseId: course.id,
      courseCode: course.code,
      contentVersion: pkgRecord.version,
      sizeBytes: pkgRecord.sizeBytes,
      sha256Checksum: pkgRecord.sha256Hex,
      chaptersCount: pkgRecord.chaptersCount,
      examsCount: pkgRecord.examsCount,
      downloadUrl,
      generatedAt: pkgRecord.updatedAt.toISOString(),
    };
  }

  /**
   * Fetches package summary for quick mobile verification.
   */
  async getPackageSummary(courseId: string): Promise<CoursePackageSummaryDto> {
    const manifest = await this.getPackageManifest(courseId);
    if (!manifest) {
      return {
        courseId,
        version: 0,
        sizeBytes: 0,
        sha256Hex: '',
        downloadUrl: '',
        isReady: false,
      };
    }
    return {
      courseId: manifest.courseId,
      version: manifest.contentVersion,
      sizeBytes: manifest.sizeBytes,
      sha256Hex: manifest.sha256Checksum,
      downloadUrl: manifest.downloadUrl,
      isReady: true,
    };
  }

  /**
   * Streams package archive directly with HTTP Content-Range support.
   */
  async streamPackage(
    courseId: string,
    range?: string
  ): Promise<{
    stream: any;
    contentLength?: number | undefined;
    contentRange?: string | undefined;
    contentType?: string | undefined;
    sha256Hex: string;
    version: number;
    sizeBytes: number;
  }> {
    const manifest = await this.getPackageManifest(courseId);
    if (!manifest) {
      throw new NotFoundException(`No package available for course: ${courseId}`);
    }

    const pkgRecord = await this.prisma.courseContentPackage.findUnique({
      where: { id: manifest.packageId },
    });
    if (!pkgRecord) {
      throw new NotFoundException('Package record not found in database');
    }

    const s3Result = await this.s3Service.getObjectStream(
      pkgRecord.storageKey,
      range
    );

    return {
      stream: s3Result.stream,
      contentLength: s3Result.contentLength,
      contentRange: s3Result.contentRange,
      contentType: s3Result.contentType,
      sha256Hex: pkgRecord.sha256Hex,
      version: pkgRecord.version,
      sizeBytes: pkgRecord.sizeBytes,
    };
  }
}
