import {
  CatalogBookGroupDto,
  CatalogChapterMetaDto,
  CatalogCourseDto,
  CatalogExamSetMetaDto,
  CatalogProgramDto,
  CatalogSnapshotResponseDto,
  CatalogUniversityDto,
  PaymentMethodEntryDto,
  QuestionItemDto,
} from '@mastera/contracts';

// Minimal bundled initial snapshot (universities and departments shell only)
const bundledSnapshotRaw = require('../../assets/bundled-catalog-snapshot.json') as CatalogSnapshotResponseDto;

export interface RealAppDataState {
  universities: CatalogUniversityDto[];
  programs: CatalogProgramDto[];
  courses: CatalogCourseDto[];
  bookGroups: CatalogBookGroupDto[];
  chapters: CatalogChapterMetaDto[];
  chaptersByBookId: Record<string, any[]>;
  chapterBodyByChapterId: Record<
    string,
    { bodyText: string; formulaLatex: string; keyIdeaSummary: string }
  >;
  questionsByChapterId: Record<string, QuestionItemDto[]>;
  questionsByExamSetId: Record<string, QuestionItemDto[]>;
  examSets: CatalogExamSetMetaDto[];
  paymentMethods: PaymentMethodEntryDto[];
}

export function buildDataStateFromSnapshot(
  snapshot: CatalogSnapshotResponseDto,
  questionsList: any[] = [],
  contentBodiesList: any[] = []
): RealAppDataState {
  const universities = snapshot.universities || [];
  const programs = snapshot.programs || [];
  const courses = snapshot.courses || [];
  const bookGroups = snapshot.bookGroups || [];
  const chapters = snapshot.chapters || [];
  const examSets = snapshot.examSets || [];
  const paymentMethods = snapshot.paymentMethods || (bundledSnapshotRaw as any).paymentMethods || [];

  // 1. Group chapters by book group
  const chaptersByBookId: Record<string, any[]> = {};
  for (const ch of chapters) {
    if (!chaptersByBookId[ch.bookGroupId]) {
      chaptersByBookId[ch.bookGroupId] = [];
    }
    chaptersByBookId[ch.bookGroupId]!.push({
      item: {
        id: ch.id,
        bookId: ch.bookGroupId,
        courseId: ch.courseId,
        title: ch.title,
        description: `${ch.category} · Order ${ch.orderIndex}`,
        chapterNumber: ch.orderIndex,
        contentVersion: ch.version,
        isActive: true,
        priceETB: 0,
      },
      canOpenNow: true,
      accessBadge: ch.isFree ? 'Free' : 'Included',
      updateAvailable: false,
    });
  }

  // 2. Build chapter body dictionary
  const chapterBodyByChapterId: Record<
    string,
    { bodyText: string; formulaLatex: string; keyIdeaSummary: string }
  > = {};

  for (const cb of contentBodiesList) {
    chapterBodyByChapterId[cb.id] = {
      bodyText:
        cb.bodyMarkdownLatex ||
        `${cb.title} — Comprehensive study module for higher education semester curriculum.`,
      formulaLatex: "\\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h} = f'(x)",
      keyIdeaSummary: `Key theoretical concepts and learning outcomes for ${cb.title}.`,
    };
  }

  // Fallback for any chapters missing in contentBodiesList
  for (const ch of chapters) {
    if (!chapterBodyByChapterId[ch.id]) {
      chapterBodyByChapterId[ch.id] = {
        bodyText: `${ch.title} — Official university course curriculum material.`,
        formulaLatex: "E = mc^2",
        keyIdeaSummary: `Master the foundational methods and derivations for ${ch.title}.`,
      };
    }
  }

  // 3. Group questions by quiz chapter and exam set
  const questionsByChapterId: Record<string, QuestionItemDto[]> = {};
  const questionsByExamSetId: Record<string, QuestionItemDto[]> = {};

  for (const q of questionsList) {
    const item: QuestionItemDto = {
      id: q.id,
      displayNumber: q.displayNumber || 1,
      questionType: q.questionType || 'MULTIPLE_CHOICE',
      promptLatex: q.promptLatex || '',
      options: Array.isArray(q.options)
        ? q.options.map((opt: any, idx: number) => ({
            id: opt.id || String.fromCharCode(65 + idx),
            textLatex: opt.textLatex || opt.text || opt.label || '',
          }))
        : [
            { id: 'A', textLatex: 'Option A' },
            { id: 'B', textLatex: 'Option B' },
          ],
      correctOptionId: q.correctOptionId || 'A',
      correctBoolean: q.correctBoolean,
      acceptedAnswers: q.acceptedAnswers,
      explanationLatex:
        q.explanationLatex || 'Detailed explanation for this official examination question.',
    };

    const chapterId = q.quizChapterId || (q.targetType === 'QUIZ_CHAPTER' ? q.targetId : null);
    if (chapterId) {
      if (!questionsByChapterId[chapterId]) {
        questionsByChapterId[chapterId] = [];
      }
      questionsByChapterId[chapterId].push(item);
    }

    const examId = q.examSetId || (q.targetType === 'EXAM_SET' ? q.targetId : null);
    if (examId) {
      if (!questionsByExamSetId[examId]) {
        questionsByExamSetId[examId] = [];
      }
      questionsByExamSetId[examId].push(item);
    }
  }

  // Ensure every exam set key is present in questionsByExamSetId
  for (const es of examSets) {
    if (!questionsByExamSetId[es.id]) {
      questionsByExamSetId[es.id] = [];
    }
  }

  return {
    universities,
    programs,
    courses,
    bookGroups,
    chapters,
    chaptersByBookId,
    chapterBodyByChapterId,
    questionsByChapterId,
    questionsByExamSetId,
    examSets,
    paymentMethods,
  };
}

// Initial state loaded synchronously from database bundle (0ms cold start)
export const initialRealAppData = buildDataStateFromSnapshot(bundledSnapshotRaw);

/**
 * Merges an incremental delta snapshot into the current in-memory catalog state.
 * Removes deleted or deactivated items in `deletedItemIds` and updates all entity collections.
 */
export function mergeDeltaIntoState(
  currentState: RealAppDataState,
  delta: CatalogSnapshotResponseDto
): RealAppDataState {
  const deletedSet = new Set(delta.deletedItemIds || []);

  // 1. Universities
  const uniMap = new Map(currentState.universities.map((u) => [u.id, u]));
  for (const u of delta.universities) {
    uniMap.set(u.id, u);
  }
  const universities = Array.from(uniMap.values()).filter(
    (u) => !deletedSet.has(u.id)
  );

  // 2. Programs
  const progMap = new Map(currentState.programs.map((p) => [p.id, p]));
  for (const p of delta.programs) {
    progMap.set(p.id, p);
  }
  const programs = Array.from(progMap.values()).filter(
    (p) => !deletedSet.has(p.id)
  );

  // 3. Courses
  const courseMap = new Map(currentState.courses.map((c) => [c.id, c]));
  for (const c of delta.courses) {
    courseMap.set(c.id, c);
  }
  const courses = Array.from(courseMap.values()).filter(
    (c) => !deletedSet.has(c.id)
  );

  // 4. Book Groups
  const bgMap = new Map(currentState.bookGroups.map((b) => [b.id, b]));
  for (const b of delta.bookGroups) {
    bgMap.set(b.id, b);
  }
  const bookGroups = Array.from(bgMap.values()).filter(
    (b) => !deletedSet.has(b.id)
  );

  // 5. Chapters
  const chMap = new Map(currentState.chapters.map((ch) => [ch.id, ch]));
  for (const ch of delta.chapters) {
    chMap.set(ch.id, ch);
  }
  const chapters = Array.from(chMap.values()).filter(
    (ch) => !deletedSet.has(ch.id)
  );

  // 6. Exam Sets
  const esMap = new Map(currentState.examSets.map((e) => [e.id, e]));
  for (const e of delta.examSets) {
    esMap.set(e.id, e);
  }
  const examSets = Array.from(esMap.values()).filter(
    (e) => !deletedSet.has(e.id)
  );

  // 7. Payment Methods
  const paymentMethods =
    delta.paymentMethods && delta.paymentMethods.length > 0
      ? delta.paymentMethods
      : currentState.paymentMethods;

  // 8. Rebuild chapters by book group
  const chaptersByBookId: Record<string, any[]> = {};
  for (const ch of chapters) {
    if (!chaptersByBookId[ch.bookGroupId]) {
      chaptersByBookId[ch.bookGroupId] = [];
    }
    chaptersByBookId[ch.bookGroupId]!.push({
      item: {
        id: ch.id,
        bookId: ch.bookGroupId,
        courseId: ch.courseId,
        title: ch.title,
        description: `${ch.category} · Order ${ch.orderIndex}`,
        chapterNumber: ch.orderIndex,
        contentVersion: ch.version,
        isActive: true,
        priceETB: 0,
      },
      canOpenNow: true,
      accessBadge: ch.isFree ? 'Free' : 'Included',
      updateAvailable: false,
    });
  }

  return {
    ...currentState,
    universities,
    programs,
    courses,
    bookGroups,
    chapters,
    chaptersByBookId,
    examSets,
    paymentMethods,
  };
}

/**
 * Unpacks an encrypted or streamed course package (.pkg) payload directly
 * into volatile memory for offline viewing in the reader and quiz engine.
 */
export function unpackPackageIntoState(
  currentState: RealAppDataState,
  packagePayload: any
): RealAppDataState {
  const updatedBodies = { ...currentState.chapterBodyByChapterId };
  const updatedExams = { ...currentState.questionsByExamSetId };

  for (const ch of packagePayload.chapters || []) {
    updatedBodies[ch.id] = {
      bodyText: ch.bodyMarkdownLatex || ch.title,
      formulaLatex: "\\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h} = f'(x)",
      keyIdeaSummary: `Key theoretical concepts and learning outcomes for ${ch.title}.`,
    };
  }

  for (const ex of packagePayload.exams || []) {
    if (Array.isArray(ex.questions) && ex.questions.length > 0) {
      updatedExams[ex.id] = ex.questions.map((q: any) => ({
        id: q.id,
        displayNumber: q.displayNumber || 1,
        questionType: q.questionType || 'MULTIPLE_CHOICE',
        promptLatex: q.promptLatex || '',
        options: Array.isArray(q.optionsJson)
          ? q.optionsJson.map((opt: any, idx: number) => ({
              id: String.fromCharCode(65 + idx),
              textLatex: typeof opt === 'string' ? opt : opt.text || '',
            }))
          : [
              { id: 'A', textLatex: 'Option A' },
              { id: 'B', textLatex: 'Option B' },
            ],
        correctOptionId: q.correctOptionId || 'A',
        explanationLatex: q.explanationLatex || '',
      }));
    }
  }

  return {
    ...currentState,
    chapterBodyByChapterId: updatedBodies,
    questionsByExamSetId: updatedExams,
  };
}

/**
 * Candidate backend API endpoints for live dynamic content syncing.
 * Detects Metro host IP dynamically from React Native runtime, falling back to machine Wi-Fi host IP.
 * Includes both port 3000 (direct NestJS API) and port 8081 (Metro API proxy) to guarantee connectivity.
 */
export function getCandidateHosts(): string[] {
  const hosts: string[] = [];

  const addHostPair = (ip: string) => {
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      hosts.push(`http://${ip}:53317`); // UFW firewall pre-whitelisted port
      hosts.push(`http://${ip}:8081`); // Metro proxy fallback (UFW allowed)
      hosts.push(`http://${ip}:3000`); // Direct API port
    }
  };

  // 1. Detect Metro Host dynamically from Expo Constants
  try {
    const Constants =
      require('expo-constants')?.default || require('expo-constants');
    const hostUri =
      Constants?.expoConfig?.hostUri ||
      Constants?.manifest2?.extra?.expoClient?.hostUri ||
      Constants?.manifest?.debuggerHost ||
      Constants?.experienceUrl;
    if (hostUri && typeof hostUri === 'string') {
      const cleanIp = hostUri
        .replace(/^[a-zA-Z]+:\/\//, '')
        .split('/')[0]
        ?.split(':')[0];
      if (cleanIp) addHostPair(cleanIp);
    }
  } catch {}

  // 2. Detect Metro host from SourceCode module
  try {
    const { NativeModules } = require('react-native');
    const scriptURL = NativeModules?.SourceCode?.scriptURL as string | undefined;
    if (scriptURL) {
      const cleanIp = scriptURL
        .replace(/^[a-zA-Z]+:\/\//, '')
        .split('/')[0]
        ?.split(':')[0];
      if (cleanIp) addHostPair(cleanIp);
    }
  } catch {}

  // 3. Known machine local IPs and development fallbacks
  addHostPair('172.16.132.37');
  hosts.push('http://localhost:53317');
  hosts.push('http://localhost:8081');
  hosts.push('http://localhost:3000');
  hosts.push('http://10.0.2.2:53317');
  hosts.push('http://10.0.2.2:8081');
  hosts.push('http://10.0.2.2:3000');
  return [...new Set(hosts)];
}

/**
 * Attempts to fetch latest catalog snapshot from running backend API.
 */
export async function syncLiveCatalogFromApi(): Promise<RealAppDataState | null> {
  const candidateHosts = getCandidateHosts();

  for (const host of candidateHosts) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1800);

      const snapRes = await fetch(`${host}/catalog/snapshot`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      clearTimeout(timer);

      if (snapRes.ok) {
        const liveSnapshot = (await snapRes.json()) as CatalogSnapshotResponseDto;
        console.log(
          `[LiveCatalog] Successfully fetched snapshot from ${host} (${liveSnapshot.courses?.length ?? 0} courses, ${liveSnapshot.bookGroups?.length ?? 0} books)`
        );

        let liveQuestions: any[] = [];
        try {
          const qController = new AbortController();
          const qTimer = setTimeout(() => qController.abort(), 1500);
          const qRes = await fetch(`${host}/assessments/questions`, {
            signal: qController.signal,
            headers: { Accept: 'application/json' },
          });
          clearTimeout(qTimer);
          if (qRes.ok) {
            liveQuestions = await qRes.json();
          }
        } catch {
          // Gracefully continue with empty questions list — questions load on demand
        }
        return buildDataStateFromSnapshot(liveSnapshot, liveQuestions, []);
      }
    } catch {
      // Continue trying next candidate host
    }
  }

  return null;
}

/**
 * Fetches incremental catalog delta from backend with ETag caching and sinceVersion.
 */
export async function syncCatalogDeltaFromApi(
  sinceVersion: number,
  currentEtag?: string
): Promise<{
  notModified: boolean;
  delta?: CatalogSnapshotResponseDto | undefined;
  etag?: string | undefined;
} | null> {
  const candidateHosts = getCandidateHosts();

  for (const host of candidateHosts) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);

      const headers: Record<string, string> = { Accept: 'application/json' };
      if (currentEtag) headers['if-none-match'] = currentEtag;

      const res = await fetch(
        `${host}/catalog/delta?sinceVersion=${sinceVersion}`,
        {
          signal: controller.signal,
          headers,
        }
      );

      clearTimeout(timer);

      if (res.status === 304) {
        return { notModified: true, etag: currentEtag };
      }

      if (res.ok) {
        const delta = (await res.json()) as CatalogSnapshotResponseDto;
        const etag = res.headers.get('etag') || undefined;
        return { notModified: false, delta, etag };
      }
    } catch {
      // Offline fallback
    }
  }

  return null;
}

/**
 * Fetches latest active payment methods directly from backend commerce endpoint.
 */
export async function fetchLivePaymentMethods(): Promise<PaymentMethodEntryDto[] | null> {
  const candidateHosts = getCandidateHosts();

  for (const host of candidateHosts) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${host}/commerce/payment-methods`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      clearTimeout(timer);

      if (res.ok) {
        const methods = (await res.json()) as PaymentMethodEntryDto[];
        if (Array.isArray(methods) && methods.length > 0) {
          console.log(`[LiveCatalog] Successfully fetched ${methods.length} payment methods from ${host}`);
          return methods;
        }
      }
    } catch {
      // Continue trying candidate hosts
    }
  }

  return null;
}

/**
 * Downloads course package JSON payload from backend API streaming endpoint.
 */
export async function fetchCoursePackageFromApi(
  courseId: string
): Promise<any | null> {
  const candidateHosts = getCandidateHosts();

  for (const host of candidateHosts) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${host}/content/packages/${courseId}/stream`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      clearTimeout(timer);

      if (res.ok) {
        try {
          return await res.json();
        } catch {
          const text = await res.text();
          try {
            return JSON.parse(text);
          } catch {
            return null;
          }
        }
      }
    } catch {
      // Try next host
    }
  }

  return null;
}

