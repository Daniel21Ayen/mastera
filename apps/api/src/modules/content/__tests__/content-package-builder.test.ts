import test from 'node:test';
import assert from 'node:assert';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { ContentPackageBuilderService } from '../content-package-builder.service';

test('Phase 2 ContentPackageBuilderService: Assembles course, gzip-compresses, SHA-256 hashes, and streams', async () => {
  const mockCourseId = 'course-1234-5678';
  const mockCourse = {
    id: mockCourseId,
    code: 'ENG101',
    title: 'Communicative English Language Skills',
    contentVersion: 3,
    semester: 1,
    stream: 'NATURAL' as const,
    university: { name: 'Bahir Dar University' },
    program: { name: 'Freshman Department' },
  };

  const mockChapters = [
    {
      id: 'ch-1',
      bookGroupId: 'bg-1',
      category: 'MODULES',
      orderIndex: 1,
      title: 'Chapter 1: Academic Study Skills',
      bodyMarkdownLatex: '# Academic Study Skills\nFormula: $E = mc^2$',
      pdfStorageKey: null,
      isFree: true,
      timeAllowedMinutes: null,
      estimatedSizeBytes: 120,
      version: 2,
      status: 'PUBLISHED',
      bookGroup: { title: 'English Course Module' },
    },
    {
      id: 'ch-2',
      bookGroupId: 'bg-1',
      category: 'MODULES',
      orderIndex: 2,
      title: 'Chapter 2: Writing Mechanics',
      bodyMarkdownLatex: '## Paragraph Structure',
      pdfStorageKey: 'pdfs/eng101-ch2.pdf',
      isFree: false,
      timeAllowedMinutes: null,
      estimatedSizeBytes: 240,
      version: 1,
      status: 'PUBLISHED',
      bookGroup: { title: 'English Course Module' },
    },
  ];

  const mockExamSets = [
    {
      id: 'exam-1',
      examSetCode: 'EXAM-ENG-MID-2026',
      title: 'Communicative English Mid Exam 2026',
      category: 'MID',
      year: '2026',
      timeAllowedMinutes: 60,
      isFreeSample: true,
      version: 1,
      questions: [
        {
          id: 'q-1',
          displayNumber: 1,
          questionType: 'MULTIPLE_CHOICE',
          promptLatex: 'Choose the correct tense: She ___ to university daily.',
          optionsJson: ['goes', 'went', 'going', 'gone'],
          correctOptionId: '0',
          explanationLatex: 'Present simple indicates habitual action.',
        },
      ],
    },
  ];

  const uploadedObjects = new Map<string, Buffer>();

  const mockS3: any = {
    uploadPackageBuffer: async (key: string, buffer: Buffer) => {
      uploadedObjects.set(key, buffer);
      return { key, sizeBytes: buffer.byteLength };
    },
    getPresignedDownloadUrl: async (key: string) => {
      return `https://s3.mastera.internal/${key}?token=mock-presigned`;
    },
    getObjectStream: async (key: string, range?: string) => {
      const buf = uploadedObjects.get(key) || Buffer.from('test');
      return {
        stream: {
          pipe: (dest: any) => dest,
        },
        contentLength: buf.byteLength,
        contentRange: range ? `bytes 0-10/${buf.byteLength}` : undefined,
        contentType: 'application/octet-stream',
      };
    },
  };

  const storedPackages = new Map<string, any>();

  const mockPrisma: any = {
    course: {
      findUnique: async ({ where }: any) => {
        if (where.id === mockCourseId) return mockCourse;
        return null;
      },
    },
    content: {
      findMany: async ({ where }: any) => {
        if (where.courseId === mockCourseId) return mockChapters;
        return [];
      },
    },
    examSet: {
      findMany: async ({ where }: any) => {
        if (where.courseId === mockCourseId) return mockExamSets;
        return [];
      },
    },
    courseContentPackage: {
      upsert: async ({ where, create, update }: any) => {
        const key = `${create.courseId}_${create.version}`;
        const record = {
          id: 'pkg-uuid-001',
          courseId: create.courseId,
          version: create.version,
          sizeBytes: create.sizeBytes,
          storageKey: create.storageKey,
          sha256Hex: create.sha256Hex,
          chaptersCount: create.chaptersCount,
          examsCount: create.examsCount,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        storedPackages.set(key, record);
        return record;
      },
      findUnique: async ({ where }: any) => {
        if (where.id) {
          for (const rec of storedPackages.values()) {
            if (rec.id === where.id) return rec;
          }
        }
        if (where.courseId_version) {
          const key = `${where.courseId_version.courseId}_${where.courseId_version.version}`;
          return storedPackages.get(key) || null;
        }
        return null;
      },
    },
  };

  const auditEvents: any[] = [];
  const mockAudit: any = {
    record: async (evt: any) => {
      auditEvents.push(evt);
    },
  };

  const builder = new ContentPackageBuilderService(mockPrisma, mockS3, mockAudit);

  // 1. Build package
  const manifest = await builder.buildCoursePackage(
    mockCourseId,
    'admin-super-01',
    'Testing package generation'
  );

  assert.strictEqual(manifest.courseId, mockCourseId);
  assert.strictEqual(manifest.courseCode, 'ENG101');
  assert.strictEqual(manifest.contentVersion, 3);
  assert.strictEqual(manifest.chaptersCount, 2);
  assert.strictEqual(manifest.examsCount, 1);
  assert.ok(manifest.sizeBytes > 0, 'Package size must be > 0 bytes');
  assert.ok(manifest.sha256Checksum.length === 64, 'SHA-256 checksum must be 64 hex chars');
  assert.ok(manifest.downloadUrl.includes('ENG101') || manifest.downloadUrl.includes('package-v3.pkg'));

  // 2. Verify archive content can be unzipped and matches original payload
  const expectedKey = `packages/${mockCourseId}/package-v3.pkg`;
  const uploadedBuffer = uploadedObjects.get(expectedKey);
  assert.ok(uploadedBuffer, 'Package archive must be uploaded to S3');

  // Verify SHA-256 matches uploaded bytes
  const computedHash = crypto.createHash('sha256').update(uploadedBuffer).digest('hex');
  assert.strictEqual(manifest.sha256Checksum, computedHash);

  // Decompress and check payload
  const decompressedJson = zlib.gunzipSync(uploadedBuffer).toString('utf8');
  const payload = JSON.parse(decompressedJson);
  assert.strictEqual(payload.courseCode, 'ENG101');
  assert.strictEqual(payload.chapters.length, 2);
  assert.strictEqual(payload.chapters[0].title, 'Chapter 1: Academic Study Skills');
  assert.strictEqual(payload.exams.length, 1);
  assert.strictEqual(payload.exams[0].questions[0].displayNumber, 1);

  // 3. Verify audit record
  assert.strictEqual(auditEvents.length, 1);
  assert.strictEqual(auditEvents[0].action, 'COURSE_PACKAGE_GENERATED');

  // 4. Verify Manifest and Summary retrieval
  const retrievedManifest = await builder.getPackageManifest(mockCourseId);
  assert.ok(retrievedManifest);
  assert.strictEqual(retrievedManifest.sha256Checksum, manifest.sha256Checksum);

  const summary = await builder.getPackageSummary(mockCourseId);
  assert.strictEqual(summary.isReady, true);
  assert.strictEqual(summary.version, 3);
  assert.strictEqual(summary.sha256Hex, manifest.sha256Checksum);

  // 5. Verify Streaming
  const streamResult = await builder.streamPackage(mockCourseId);
  assert.strictEqual(streamResult.sha256Hex, manifest.sha256Checksum);
  assert.strictEqual(streamResult.version, 3);
  assert.strictEqual(streamResult.sizeBytes, manifest.sizeBytes);
});
