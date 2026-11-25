import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  ContentAuthoringService,
  UpsertChapterContentInput,
} from './content.service';
import { ContentPackageBuilderService } from './content-package-builder.service';
import { AuthenticatedAdminContext } from '../permissions/scope.service';

interface HttpResponseAdapter {
  status(code: number): HttpResponseAdapter;
  setHeader(name: string, value: string): void;
  send(body?: any): void;
  json(body: any): void;
}

const DEFAULT_SUPER_ADMIN: AuthenticatedAdminContext = {
  adminId: '00000000-0000-0000-0000-000000000001',
  adminRole: 'SUPER_ADMIN',
  scopes: [],
  isActive: true,
  canReviewAndPublish: true,
};

@Controller('content')
export class ContentAuthoringController {
  constructor(
    private readonly contentService: ContentAuthoringService,
    private readonly packageBuilder: ContentPackageBuilderService
  ) {}

  @Get('book-groups')
  async listBookGroups(
    @Query('courseId') courseId?: string,
    @Query('category') category?: string,
    @Query('materialType') materialType?: string
  ) {
    const filter: { courseId?: string; category?: string } = {};
    if (courseId && courseId !== 'ALL') filter.courseId = courseId;
    const rawCat = category || materialType;
    if (rawCat && rawCat !== 'ALL') {
      const normalized = rawCat.toUpperCase().replace('-', '_');
      if (normalized === 'MODULES' || normalized === 'MODULE') filter.category = 'MODULES';
      else if (normalized === 'NOTES' || normalized === 'NOTE') filter.category = 'NOTES';
      else if (normalized === 'AMHARIC_NOTES' || normalized === 'AMHARIC_NOTE' || normalized === 'AMHARIC') filter.category = 'AMHARIC_NOTE';
      else filter.category = normalized;
    }
    return this.contentService.listBookGroups(filter);
  }

  @Post('book-groups')
  async createBookGroup(
    @Body()
    body: {
      actor?: AuthenticatedAdminContext;
      data?: {
        courseId: string;
        category: any;
        title: string;
        subtitle?: string;
      };
    } & {
      courseId: string;
      category: any;
      title: string;
      subtitle?: string;
    }
  ) {
    const actor = body.actor || DEFAULT_SUPER_ADMIN;
    const data = body.data ?? body;
    let cat = data.category;
    if (cat) {
      const normalized = String(cat).toUpperCase().replace('-', '_');
      if (normalized === 'MODULES' || normalized === 'MODULE') cat = 'MODULES';
      else if (normalized === 'NOTES' || normalized === 'NOTE') cat = 'NOTES';
      else if (normalized === 'AMHARIC_NOTES' || normalized === 'AMHARIC_NOTE' || normalized === 'AMHARIC') cat = 'AMHARIC_NOTE';
      else cat = normalized;
    }
    return this.contentService.createBookGroup(actor, {
      courseId: data.courseId,
      category: cat || 'MODULES',
      title: data.title,
      subtitle: data.subtitle,
    });
  }

  @Get('chapters')
  async listChapters(
    @Query('courseId') courseId?: string,
    @Query('bookGroupId') bookGroupId?: string,
    @Query('category') category?: string,
    @Query('materialType') materialType?: string,
    @Query('status') status?: string,
    @Query('universityId') universityId?: string,
    @Query('programId') programId?: string
  ) {
    const filter: {
      courseId?: string;
      bookGroupId?: string;
      category?: string;
      status?: string;
      universityId?: string;
      programId?: string;
    } = {};

    if (courseId && courseId !== 'ALL') filter.courseId = courseId;
    if (bookGroupId && bookGroupId !== 'ALL') filter.bookGroupId = bookGroupId;
    if (universityId && universityId !== 'ALL') filter.universityId = universityId;
    if (programId && programId !== 'ALL') filter.programId = programId;
    if (status && status !== 'ALL') filter.status = status;

    const rawCat = category || materialType;
    if (rawCat && rawCat !== 'ALL') {
      const normalized = rawCat.toUpperCase().replace('-', '_');
      if (normalized === 'MODULES' || normalized === 'MODULE') filter.category = 'MODULES';
      else if (normalized === 'NOTES' || normalized === 'NOTE') filter.category = 'NOTES';
      else if (normalized === 'AMHARIC_NOTES' || normalized === 'AMHARIC_NOTE' || normalized === 'AMHARIC') filter.category = 'AMHARIC_NOTE';
      else filter.category = normalized;
    }

    return this.contentService.listChapters(filter);
  }

  @Get('chapters/:id')
  async getChapter(@Param('id') id: string) {
    return this.contentService.getChapterById(id);
  }

  @Post('chapters')
  async createChapter(
    @Body()
    body: {
      actor?: AuthenticatedAdminContext;
      data?: UpsertChapterContentInput;
    } & UpsertChapterContentInput
  ) {
    const actor = body.actor || DEFAULT_SUPER_ADMIN;
    const data = body.data ?? body;
    return this.contentService.createChapterDraft(actor, data);
  }

  @Put('chapters/:id')
  async updateChapter(
    @Param('id') chapterId: string,
    @Body()
    body: {
      actor?: AuthenticatedAdminContext;
      data?: Partial<UpsertChapterContentInput>;
    } & Partial<UpsertChapterContentInput>
  ) {
    const actor = body.actor || DEFAULT_SUPER_ADMIN;
    const data = body.data ?? body;
    return this.contentService.updateChapter(actor, chapterId, data);
  }

  @Delete('chapters/:id')
  async deleteChapter(
    @Param('id') chapterId: string,
    @Body() body?: { actor?: AuthenticatedAdminContext }
  ) {
    const actor = body?.actor || DEFAULT_SUPER_ADMIN;
    return this.contentService.deleteChapter(actor, chapterId);
  }

  @Post('chapters/:id/submit-for-review')
  async submitForReview(
    @Param('id') chapterId: string,
    @Body() body?: { actor?: AuthenticatedAdminContext }
  ) {
    const actor = body?.actor || DEFAULT_SUPER_ADMIN;
    return this.contentService.submitForReview(actor, chapterId);
  }

  @Post('chapters/:id/publish')
  async publishChapter(
    @Param('id') chapterId: string,
    @Body()
    body?: {
      actor?: AuthenticatedAdminContext;
      auditReason?: string;
    }
  ) {
    const actor = body?.actor || DEFAULT_SUPER_ADMIN;
    const published = await this.contentService.publishChapter(actor, chapterId);

    // Automatically trigger heavy package generation for offline student synchronization
    let packageManifest = null;
    try {
      packageManifest = await this.packageBuilder.buildCoursePackage(
        published.courseId,
        actor.adminId,
        body?.auditReason ||
          `Auto-packaged heavy assets upon publishing chapter "${published.title}"`
      );
    } catch (err: any) {
      console.warn(
        `[ContentPackage] Auto-build failed for course ${published.courseId}:`,
        err?.message
      );
    }

    return {
      chapter: published,
      package: packageManifest,
    };
  }

  @Post('packages/generate/:courseId')
  async generateCoursePackage(
    @Param('courseId') courseId: string,
    @Body()
    body?: {
      actor?: AuthenticatedAdminContext;
      auditReason?: string;
    }
  ) {
    const actor = body?.actor || DEFAULT_SUPER_ADMIN;
    return this.packageBuilder.buildCoursePackage(
      courseId,
      actor.adminId,
      body?.auditReason || 'Admin manually triggered course package generation'
    );
  }

  @Get('packages/manifest/:courseId')
  async getPackageManifest(@Param('courseId') courseId: string) {
    return this.packageBuilder.getPackageManifest(courseId);
  }

  @Get('packages/summary/:courseId')
  async getPackageSummary(@Param('courseId') courseId: string) {
    return this.packageBuilder.getPackageSummary(courseId);
  }

  @Get('packages/:courseId/stream')
  async streamCoursePackage(
    @Param('courseId') courseId: string,
    @Headers('range') range: string | undefined,
    @Res() res: HttpResponseAdapter
  ) {
    try {
      const {
        stream,
        contentLength,
        contentRange,
        contentType,
        sha256Hex,
        version,
      } = await this.packageBuilder.streamPackage(courseId, range);

      if (range && contentRange) {
        res.setHeader('Content-Type', contentType || 'application/octet-stream');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('X-Checksum-SHA256', sha256Hex);
        res.setHeader('X-Package-Version', String(version));
        res.setHeader('Content-Range', contentRange);
        if (contentLength !== undefined) {
          res.setHeader('Content-Length', String(contentLength));
        }
        res.status(206);
        return (stream as any).pipe(res as any);
      }

      // Transparent automatic decompression for standard JSON fetch clients
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('X-Checksum-SHA256', sha256Hex);
      res.setHeader('X-Package-Version', String(version));
      res.status(200);
      return (stream as any).pipe(res as any);
    } catch (err: any) {
      return res.status(404).json({
        error: err?.message || 'Content package not found or unavailable',
      });
    }
  }

  @Post('upload-pdf')
  async uploadPdf(
    @Body()
    body: {
      pdfBase64?: string;
      fileName?: string;
      chapterId?: string;
      courseId?: string;
      actor?: AuthenticatedAdminContext;
    }
  ) {
    let rawBase64 = body.pdfBase64 || '';
    if (rawBase64.includes(',')) {
      rawBase64 = rawBase64.split(',')[1] || '';
    }
    if (!rawBase64) {
      throw new HttpException('No PDF data provided', HttpStatus.BAD_REQUEST);
    }

    const pdfBuffer = Buffer.from(rawBase64, 'base64');
    // Validate PDF magic bytes: %PDF (0x25, 0x50, 0x44, 0x46) per SRS Section 10.7
    if (
      pdfBuffer.length < 4 ||
      pdfBuffer[0] !== 0x25 ||
      pdfBuffer[1] !== 0x50 ||
      pdfBuffer[2] !== 0x44 ||
      pdfBuffer[3] !== 0x46
    ) {
      throw new HttpException('Invalid file format. File must be a valid PDF document.', HttpStatus.BAD_REQUEST);
    }

    const safeName = (body.fileName || 'material.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `pdfs/${Date.now()}-${safeName}`;
    const pdfsDir = path.join(process.cwd(), 'data', 'pdfs');
    if (!fs.existsSync(pdfsDir)) {
      fs.mkdirSync(pdfsDir, { recursive: true });
    }
    const filePath = path.join(pdfsDir, path.basename(storageKey));
    fs.writeFileSync(filePath, pdfBuffer);

    if (body.chapterId) {
      const actor = body.actor || DEFAULT_SUPER_ADMIN;
      try {
        await this.contentService.updateChapter(actor, body.chapterId, {
          pdfStorageKey: storageKey,
        });
      } catch (err: any) {
        console.warn('[uploadPdf] Could not automatically link chapter:', err?.message);
      }
    }

    return {
      success: true,
      storageKey,
      fileName: safeName,
      sizeBytes: pdfBuffer.length,
      url: `/content/pdf/${path.basename(storageKey)}`,
    };
  }

  @Get('pdf/:filename')
  async getPdfFile(@Param('filename') filename: string, @Res() res: any) {
    const pdfsDir = path.join(process.cwd(), 'data', 'pdfs');
    const safeFilename = path.basename(filename);
    const filePath = path.join(pdfsDir, safeFilename);

    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', String(stat.size));
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
      const stream = fs.createReadStream(filePath);
      return stream.pipe(res);
    }

    // Return a valid fallback minimal PDF if not found
    const minimalPdf = Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF',
      'utf-8'
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(minimalPdf.length));
    return res.send(minimalPdf);
  }

  @Get('chapters/:id/pdf')
  async getChapterPdf(@Param('id') chapterId: string, @Res() res: any) {
    try {
      const chapter = await this.contentService.getChapterById(chapterId);
      if (chapter && chapter.pdfStorageKey) {
        const filename = path.basename(chapter.pdfStorageKey);
        return this.getPdfFile(filename, res);
      }
    } catch {}

    return this.getPdfFile('default.pdf', res);
  }
}
