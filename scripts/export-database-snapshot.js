const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportSnapshot() {
  console.log('Querying real data from PostgreSQL...');

  const [universities, programs, courses, bookGroups, chapters, examSets, questions, pricingConfig] = await Promise.all([
    prisma.university.findMany({ where: { isActive: true } }),
    prisma.program.findMany(),
    prisma.course.findMany({ where: { deletedAt: null } }),
    prisma.bookGroup.findMany(),
    prisma.content.findMany({ where: { deletedAt: null } }),
    prisma.examSet.findMany({
      where: { deletedAt: null, status: 'PUBLISHED' },
      include: { questions: true }
    }),
    prisma.question.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        examSet: { include: { course: true } },
        quizChapter: { include: { course: true } }
      }
    }),
    prisma.pricingConfig.findFirst({ orderBy: { createdAt: 'desc' } })
  ]);

  console.log(`Found: ${courses.length} courses, ${examSets.length} exam sets, ${questions.length} questions.`);

  const catalogSnapshot = {
    snapshotVersion: 2,
    generatedAt: new Date().toISOString(),
    universities: universities.map(u => ({
      id: u.id,
      name: u.name,
      shortName: u.shortName,
      slug: u.slug,
      logoStorageKey: u.logoStorageKey || null,
      isActive: u.isActive,
      version: u.version
    })),
    programs: programs.map(p => ({
      id: p.id,
      universityId: p.universityId,
      name: p.name,
      degreeLevel: p.degreeLevel,
      durationYears: p.durationYears,
      version: p.version
    })),
    courses: courses.map(c => ({
      id: c.id,
      universityId: c.universityId,
      programId: c.programId,
      code: c.code,
      title: c.title,
      semester: c.semester,
      stream: c.stream,
      accent: c.accent,
      icon: c.icon,
      freeAccess: c.freeAccess,
      priceETB: c.priceETB,
      contentVersion: c.contentVersion,
      version: 1
    })),
    bookGroups: bookGroups.map(bg => ({
      id: bg.id,
      courseId: bg.courseId,
      category: bg.category,
      code: bg.code,
      title: bg.title,
      subtitle: bg.subtitle,
      orderIndex: bg.orderIndex,
      version: bg.version
    })),
    chapters: chapters.map(ch => ({
      id: ch.id,
      courseId: ch.courseId,
      bookGroupId: ch.bookGroupId,
      category: ch.category,
      orderIndex: ch.orderIndex,
      title: ch.title,
      summary: ch.summary || null,
      estimatedMinutes: ch.estimatedMinutes || 15,
      isFree: ch.isFree,
      version: ch.version
    })),
    examSets: examSets.map(es => ({
      id: es.id,
      examSetCode: es.examSetCode,
      category: es.category,
      universityId: es.universityId,
      programId: es.programId,
      courseId: es.courseId,
      semester: es.semester || 1,
      stream: es.stream || 'NATURAL',
      year: es.year,
      title: es.title,
      questionCount: es.questions.length || (es.title.includes('25') ? 25 : 20),
      timeAllowedMinutes: es.timeAllowedMinutes,
      isFreeSample: es.isFreeSample,
      version: es.version,
      status: es.status
    })),
    paymentMethods: pricingConfig?.paymentMethodsJson || [],
    deletedItemIds: []
  };

  const formattedQuestions = questions.map(q => {
    const parentCourse = q.examSet?.course || q.quizChapter?.course;
    return {
      id: q.id,
      displayNumber: q.displayNumber,
      questionType: q.questionType,
      promptLatex: q.promptLatex,
      options: q.optionsJson || [],
      correctOptionId: q.correctOptionId,
      correctBoolean: q.correctBoolean,
      acceptedAnswers: q.acceptedAnswers,
      explanationLatex: q.explanationLatex,
      status: q.status,
      targetType: q.examSetId ? 'EXAM_SET' : 'QUIZ_CHAPTER',
      targetId: q.examSetId || q.quizChapterId,
      targetTitle: q.examSet?.title || q.quizChapter?.title,
      category: q.examSet?.category || q.quizChapter?.category || 'EXAM',
      courseId: parentCourse?.id || null,
      courseCode: parentCourse?.code || null,
      courseTitle: parentCourse?.title || null,
      year: q.examSet?.year || '2024'
    };
  });

  const snapshotPath = path.resolve(__dirname, '../apps/mobile/src/assets/bundled-catalog-snapshot.json');

  fs.writeFileSync(snapshotPath, JSON.stringify(catalogSnapshot, null, 2));

  console.log(`Successfully exported snapshot to ${snapshotPath}`);

  await prisma.$disconnect();
}

exportSnapshot().catch(err => {
  console.error(err);
  process.exit(1);
});
