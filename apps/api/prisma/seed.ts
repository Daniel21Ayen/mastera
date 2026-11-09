import { PrismaClient, AdminRole, AcademicStream, ContentCategory, ExamCategory, ContentStatus, QuestionType, OrderProductType, OrderStatus, EntitlementStatus } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = 'mastera_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

async function main() {
  console.log('--- Starting Mastera Database Seeding ---');

  // 1. Counters
  await prisma.counter.upsert({
    where: { key: 'student_code' },
    update: { value: 6 },
    create: { key: 'student_code', value: 6 },
  });

  // 2. Admin Users
  const superAdmin = await prisma.adminUser.upsert({
    where: { email: 'admin@mastara.demo' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@mastara.demo',
      passwordHash: hashPassword('MasteraAdmin@2026!'),
      adminRole: AdminRole.SUPER_ADMIN,
      isActive: true,
      lastLoginAt: new Date(),
    },
  });

  const academicAdmin = await prisma.adminUser.upsert({
    where: { email: 'academic@mastara.demo' },
    update: {},
    create: {
      name: 'Academic Coordinator',
      email: 'academic@mastara.demo',
      passwordHash: hashPassword('MasteraAcademic@2026!'),
      adminRole: AdminRole.ACADEMIC_ADMIN,
      isActive: true,
      lastLoginAt: new Date(Date.now() - 3600000 * 24 * 4),
    },
  });

  const opsAdmin = await prisma.adminUser.upsert({
    where: { email: 'ops@mastara.demo' },
    update: {},
    create: {
      name: 'Operations Admin',
      email: 'ops@mastara.demo',
      passwordHash: hashPassword('MasteraOps@2026!'),
      adminRole: AdminRole.OPERATIONS_ADMIN,
      isActive: true,
      lastLoginAt: new Date(Date.now() - 3600000 * 24 * 3),
    },
  });

  console.log('Seeded Admins: admin@mastara.demo, academic@mastara.demo, ops@mastara.demo');

  // 3. Universities (Matching Screenshots: AASTU, AAU, ASTU, HU, BDU)
  const aastu = await prisma.university.upsert({
    where: { shortName: 'AASTU' },
    update: { isActive: true },
    create: {
      name: 'Addis Ababa Science & Technology University',
      shortName: 'AASTU',
      isActive: true,
      version: 1,
    },
  });

  const aau = await prisma.university.upsert({
    where: { shortName: 'AAU' },
    update: { isActive: true },
    create: {
      name: 'Addis Ababa University',
      shortName: 'AAU',
      isActive: true,
      version: 1,
    },
  });

  const astu = await prisma.university.upsert({
    where: { shortName: 'ASTU' },
    update: { isActive: true },
    create: {
      name: 'Adama Science and Technology University',
      shortName: 'ASTU',
      isActive: true,
      version: 1,
    },
  });

  const hu = await prisma.university.upsert({
    where: { shortName: 'HU' },
    update: { isActive: true },
    create: {
      name: 'Hawassa University',
      shortName: 'HU',
      isActive: true,
      version: 1,
    },
  });

  const bdu = await prisma.university.upsert({
    where: { shortName: 'BDU' },
    update: { isActive: true },
    create: {
      name: 'Bahir Dar University',
      shortName: 'BDU',
      isActive: true,
      version: 1,
    },
  });

  console.log('Seeded Universities: AASTU, AAU, ASTU, HU, BDU');

  // 4. Programs
  const progSoftwareEng = await prisma.program.upsert({
    where: { id: '00000000-0000-0000-0000-000000000101' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000101',
      universityId: aastu.id,
      name: 'Software Engineering',
      isActive: true,
      version: 1,
    },
  });

  const progFreshEng = await prisma.program.upsert({
    where: { id: '00000000-0000-0000-0000-000000000102' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000102',
      universityId: aastu.id,
      name: 'Freshman Engineering',
      isActive: true,
      version: 1,
    },
  });

  const progFreshRemedial = await prisma.program.upsert({
    where: { id: '00000000-0000-0000-0000-000000000103' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000103',
      universityId: aau.id,
      name: 'Freshman Remedial',
      isActive: true,
      version: 1,
    },
  });

  const progFreshSocial = await prisma.program.upsert({
    where: { id: '00000000-0000-0000-0000-000000000104' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000104',
      universityId: aau.id,
      name: 'Freshman Social Science',
      isActive: true,
      version: 1,
    },
  });

  const progAppliedEng = await prisma.program.upsert({
    where: { id: '00000000-0000-0000-0000-000000000105' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000105',
      universityId: astu.id,
      name: 'Applied Engineering',
      isActive: true,
      version: 1,
    },
  });

  console.log('Seeded Programs: Software Engineering, Freshman Engineering, Freshman Remedial, etc.');

  // 5. Courses (Exact matching screenshots: ENG101, MATH101, PHYS101, CALC101, ANTH101, BIO102, ECON101, PHIL101, etc.)
  const courseEnglish = await prisma.course.upsert({
    where: { code: 'ENG101' },
    update: {},
    create: {
      code: 'ENG101',
      title: 'Communicative English Language Skills',
      universityId: null,
      programId: null,
      semester: 1,
      stream: AcademicStream.COMMON,
      accent: 'teal',
      icon: 'book',
      freeAccess: true,
      freeTrialCount: 0,
      priceETB: 0,
      isActive: true,
      contentVersion: 1,
    },
  });

  const courseMath = await prisma.course.upsert({
    where: { code: 'MATH101' },
    update: {},
    create: {
      code: 'MATH101',
      title: 'Applied Mathematics I',
      universityId: aastu.id,
      programId: progFreshEng.id,
      semester: 1,
      stream: AcademicStream.NATURAL,
      accent: 'blue',
      icon: 'calculator',
      freeAccess: false,
      freeTrialCount: 2,
      priceETB: 60,
      isActive: true,
      contentVersion: 3,
    },
  });

  const coursePhys = await prisma.course.upsert({
    where: { code: 'PHYS101' },
    update: {},
    create: {
      code: 'PHYS101',
      title: 'General Physics',
      universityId: aastu.id,
      programId: progFreshEng.id,
      semester: 1,
      stream: AcademicStream.NATURAL,
      accent: 'amber',
      icon: 'zap',
      freeAccess: false,
      freeTrialCount: 1,
      priceETB: 60,
      isActive: true,
      contentVersion: 2,
    },
  });

  const courseCalc = await prisma.course.upsert({
    where: { code: 'CALC101' },
    update: {},
    create: {
      code: 'CALC101',
      title: 'Calculus I (Applied Mathematics I)',
      universityId: aastu.id,
      programId: progSoftwareEng.id,
      semester: 1,
      stream: AcademicStream.NATURAL,
      accent: 'blue',
      icon: 'calculator',
      freeAccess: false,
      freeTrialCount: 2,
      priceETB: 60,
      isActive: true,
      contentVersion: 1,
    },
  });

  const courseAnth = await prisma.course.upsert({
    where: { code: 'ANTH101' },
    update: {},
    create: {
      code: 'ANTH101',
      title: 'Social Anthropology',
      universityId: aau.id,
      programId: progFreshRemedial.id,
      semester: 1,
      stream: AcademicStream.SOCIAL,
      accent: 'indigo',
      icon: 'book',
      freeAccess: false,
      freeTrialCount: 1,
      priceETB: 60,
      isActive: true,
      contentVersion: 1,
    },
  });

  const courseBio = await prisma.course.upsert({
    where: { code: 'BIO102' },
    update: {},
    create: {
      code: 'BIO102',
      title: 'General Biology',
      universityId: aastu.id,
      programId: progSoftwareEng.id,
      semester: 1,
      stream: AcademicStream.NATURAL,
      accent: 'cobalt',
      icon: 'book',
      freeAccess: false,
      freeTrialCount: 1,
      priceETB: 60,
      isActive: true,
      contentVersion: 1,
    },
  });

  const courseEcon = await prisma.course.upsert({
    where: { code: 'ECON101' },
    update: {},
    create: {
      code: 'ECON101',
      title: 'Introduction to Economics',
      universityId: aau.id,
      programId: progFreshSocial.id,
      semester: 1,
      stream: AcademicStream.SOCIAL,
      accent: 'indigo',
      icon: 'book',
      freeAccess: false,
      freeTrialCount: 1,
      priceETB: 60,
      isActive: true,
      contentVersion: 1,
    },
  });

  const courseLogic = await prisma.course.upsert({
    where: { code: 'PHIL101' },
    update: {},
    create: {
      code: 'PHIL101',
      title: 'Logic and Critical Thinking',
      universityId: null,
      programId: null,
      semester: 1,
      stream: AcademicStream.COMMON,
      accent: 'slate',
      icon: 'book',
      freeAccess: false,
      freeTrialCount: 1,
      priceETB: 60,
      isActive: true,
      contentVersion: 1,
    },
  });

  console.log('Seeded Courses: ENG101, MATH101, PHYS101, CALC101, ANTH101, BIO102, ECON101, PHIL101');

  // 6. BookGroups & Chapters (Modules, Notes, Amharic Notes)
  // For Anth101 (matching Screenshot 11)
  const bgAnthModules = await prisma.bookGroup.upsert({
    where: { id: '00000000-0000-0000-0000-000000000201' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000201',
      courseId: courseAnth.id,
      category: ContentCategory.MODULES,
      code: 'BG-ANTH-MOD',
      title: 'Social Anthropology Modules',
      subtitle: 'Core Curriculum',
      orderIndex: 1,
      version: 1,
    },
  });

  const chAnth1 = await prisma.content.upsert({
    where: { id: '00000000-0000-0000-0000-000000000301' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000301',
      courseId: courseAnth.id,
      bookGroupId: bgAnthModules.id,
      category: ContentCategory.MODULES,
      orderIndex: 1,
      title: 'Chapter 1: Integral Calculus & Vector Space',
      bodyMarkdownLatex: '# Chapter 1: Foundations\n\nIntroduction to Anthropological principles and concepts.\n\n$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
      reviewedById: academicAdmin.id,
      version: 1,
    },
  });

  const chAnth2 = await prisma.content.upsert({
    where: { id: '00000000-0000-0000-0000-000000000302' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000302',
      courseId: courseAnth.id,
      bookGroupId: bgAnthModules.id,
      category: ContentCategory.MODULES,
      orderIndex: 2,
      title: 'Chapter 2: Fundamental Theorem of Calculus',
      bodyMarkdownLatex: '# Chapter 2: Cultural Diversity\n\nStudy of human culture and society.',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
      reviewedById: academicAdmin.id,
      version: 1,
    },
  });

  const chAnth3 = await prisma.content.upsert({
    where: { id: '00000000-0000-0000-0000-000000000303' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000303',
      courseId: courseAnth.id,
      bookGroupId: bgAnthModules.id,
      category: ContentCategory.MODULES,
      orderIndex: 3,
      title: 'Chapter 3: Key Principles of Social Anthropology',
      bodyMarkdownLatex: '# Chapter 3: Social Institutions\n\nKinship, marriage, and family systems.',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
      reviewedById: academicAdmin.id,
      version: 1,
    },
  });

  // Notes & Amharic Notes for Anth, Calc, Phys, Math
  const bgAnthNotes = await prisma.bookGroup.upsert({
    where: { id: '00000000-0000-0000-0000-000000000203' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000203',
      courseId: courseAnth.id,
      category: ContentCategory.NOTES,
      code: 'BG-ANTH-NOTE',
      title: 'Social Anthropology Revision Notes',
      subtitle: 'High-Yield Notes',
      orderIndex: 2,
      version: 1,
    },
  });

  await prisma.content.upsert({
    where: { id: '00000000-0000-0000-0000-000000000305' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000305',
      courseId: courseAnth.id,
      bookGroupId: bgAnthNotes.id,
      category: ContentCategory.NOTES,
      orderIndex: 1,
      title: 'Chapter 1: Anthropological Thought & Schools of Theory',
      bodyMarkdownLatex: '# Theory Summary\n\nEvolutionism, functionalism, and structuralism in classical anthropology.',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
      reviewedById: academicAdmin.id,
      version: 1,
    },
  });

  const bgAnthAmharic = await prisma.bookGroup.upsert({
    where: { id: '00000000-0000-0000-0000-000000000204' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000204',
      courseId: courseAnth.id,
      category: ContentCategory.AMHARIC_NOTE,
      code: 'BG-ANTH-AMH',
      title: 'Social Anthropology Amharic Edition',
      subtitle: 'የአማርኛ ማስታወሻ',
      orderIndex: 3,
      version: 1,
    },
  });

  await prisma.content.upsert({
    where: { id: '00000000-0000-0000-0000-000000000306' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000306',
      courseId: courseAnth.id,
      bookGroupId: bgAnthAmharic.id,
      category: ContentCategory.AMHARIC_NOTE,
      orderIndex: 1,
      title: 'ምዕራፍ 1: የሶሻል አንትሮፖሎጂ መግቢያ እና ፅንሰ ሀሳቦች (Amharic Notes)',
      bodyMarkdownLatex: '# ምዕራፍ 1: መግቢያ\n\nሶሻል አንትሮፖሎጂ የሰውን ልጅ ባህል፣ ቋንቋ እና ማህበራዊ አደረጃጀት የሚያጠና የሳይንስ ዘርፍ ነው።',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
      reviewedById: academicAdmin.id,
      version: 1,
    },
  });

  // Calculus Modules, Notes, Amharic
  const bgCalcMods = await prisma.bookGroup.upsert({
    where: { id: '00000000-0000-0000-0000-000000000205' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000205',
      courseId: courseCalc.id,
      category: ContentCategory.MODULES,
      code: 'BG-CALC-MOD',
      title: 'Calculus I Modules',
      subtitle: 'Core Curriculum',
      orderIndex: 1,
      version: 1,
    },
  });

  await prisma.content.upsert({
    where: { id: '00000000-0000-0000-0000-000000000307' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000307',
      courseId: courseCalc.id,
      bookGroupId: bgCalcMods.id,
      category: ContentCategory.MODULES,
      orderIndex: 1,
      title: 'Chapter 1: Limits, Continuity, and Formal Delta-Epsilon Proofs',
      bodyMarkdownLatex: '# Limits\n\n$$\\lim_{x \\to c} f(x) = L \\iff \\forall \\epsilon > 0, \\exists \\delta > 0 \\text{ s.t. } 0 < |x-c| < \\delta \\implies |f(x)-L| < \\epsilon$$',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
      reviewedById: academicAdmin.id,
      version: 1,
    },
  });

  const bgCalcNotes = await prisma.bookGroup.upsert({
    where: { id: '00000000-0000-0000-0000-000000000206' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000206',
      courseId: courseCalc.id,
      category: ContentCategory.NOTES,
      code: 'BG-CALC-NOTE',
      title: 'Calculus I Formula Sheets',
      subtitle: 'Exam Ready',
      orderIndex: 2,
      version: 1,
    },
  });

  await prisma.content.upsert({
    where: { id: '00000000-0000-0000-0000-000000000308' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000308',
      courseId: courseCalc.id,
      bookGroupId: bgCalcNotes.id,
      category: ContentCategory.NOTES,
      orderIndex: 1,
      title: 'Chapter 1: Derivatives and Differentiation Rules Table',
      bodyMarkdownLatex: '# High-Yield Differentiation Table\n\n$$\\frac{d}{dx}[\\sin x] = \\cos x, \\quad \\frac{d}{dx}[\\ln x] = \\frac{1}{x}$$',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
      reviewedById: academicAdmin.id,
      version: 1,
    },
  });

  const bgCalcAmh = await prisma.bookGroup.upsert({
    where: { id: '00000000-0000-0000-0000-000000000207' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000207',
      courseId: courseCalc.id,
      category: ContentCategory.AMHARIC_NOTE,
      code: 'BG-CALC-AMH',
      title: 'Calculus I Amharic Guide',
      subtitle: 'የካልኩለስ ማጠቃለያ',
      orderIndex: 3,
      version: 1,
    },
  });

  await prisma.content.upsert({
    where: { id: '00000000-0000-0000-0000-000000000309' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000309',
      courseId: courseCalc.id,
      bookGroupId: bgCalcAmh.id,
      category: ContentCategory.AMHARIC_NOTE,
      orderIndex: 1,
      title: 'ምዕራፍ 1: የሊሚት እና የዴሪቫቲቭ መሰረታዊ ፅንሰ ሀሳቦች (Amharic Notes)',
      bodyMarkdownLatex: '# ካልኩለስ በአማርኛ\n\nሊሚት ማለት አንድ ፈንክሽን ወደ አንድ የተወሰነ ቁጥር ሲቃረብ የሚኖረው ዋጋ ነው።',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
      reviewedById: academicAdmin.id,
      version: 1,
    },
  });

  // Physics Modules, Notes, Amharic
  const bgPhysMods = await prisma.bookGroup.upsert({
    where: { id: '00000000-0000-0000-0000-000000000208' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000208',
      courseId: coursePhys.id,
      category: ContentCategory.MODULES,
      code: 'BG-PHYS-MOD',
      title: 'General Physics Modules',
      subtitle: 'Mechanics & Dynamics',
      orderIndex: 1,
      version: 1,
    },
  });

  await prisma.content.upsert({
    where: { id: '00000000-0000-0000-0000-000000000310' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000310',
      courseId: coursePhys.id,
      bookGroupId: bgPhysMods.id,
      category: ContentCategory.MODULES,
      orderIndex: 1,
      title: 'Chapter 1: Vectors, Dot Products, and Cross Products',
      bodyMarkdownLatex: '# Vectors\n\n$$\\vec{A} \\cdot \\vec{B} = |A||B|\\cos\\theta, \\quad \\vec{A} \\times \\vec{B} = |A||B|\\sin\\theta \\,\\hat{n}$$',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
      reviewedById: academicAdmin.id,
      version: 1,
    },
  });

  const bgPhysNotes = await prisma.bookGroup.upsert({
    where: { id: '00000000-0000-0000-0000-000000000209' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000209',
      courseId: coursePhys.id,
      category: ContentCategory.NOTES,
      code: 'BG-PHYS-NOTE',
      title: 'Physics I Formula Summary',
      subtitle: 'Quick Reference',
      orderIndex: 2,
      version: 1,
    },
  });

  await prisma.content.upsert({
    where: { id: '00000000-0000-0000-0000-000000000311' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000311',
      courseId: coursePhys.id,
      bookGroupId: bgPhysNotes.id,
      category: ContentCategory.NOTES,
      orderIndex: 1,
      title: 'Chapter 1: Kinematics Equations & Free Fall Summary',
      bodyMarkdownLatex: '# Kinematic Equations\n\n$$v = v_0 + at, \\quad x = x_0 + v_0 t + \\frac{1}{2}at^2, \\quad v^2 = v_0^2 + 2a\\Delta x$$',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
      reviewedById: academicAdmin.id,
      version: 1,
    },
  });

  const bgPhysAmh = await prisma.bookGroup.upsert({
    where: { id: '00000000-0000-0000-0000-000000000210' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000210',
      courseId: coursePhys.id,
      category: ContentCategory.AMHARIC_NOTE,
      code: 'BG-PHYS-AMH',
      title: 'Physics I Amharic Edition',
      subtitle: 'የፊዚክስ ማጠቃለያ',
      orderIndex: 3,
      version: 1,
    },
  });

  await prisma.content.upsert({
    where: { id: '00000000-0000-0000-0000-000000000312' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000312',
      courseId: coursePhys.id,
      bookGroupId: bgPhysAmh.id,
      category: ContentCategory.AMHARIC_NOTE,
      orderIndex: 1,
      title: 'ምዕራፍ 1: የኒውተን የእንቅስቃሴ ህጎች (Amharic Physics Notes)',
      bodyMarkdownLatex: '# የኒውተን ህጎች\n\nአንደኛው ህግ: ማንኛውም አካል የውጭ ኃይል ካልተጫነው በስተቀር ባለበት ፀንቶ ይቆያል።',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
      reviewedById: academicAdmin.id,
      version: 1,
    },
  });

  // For General Biology (Matching Screenshot 14)
  const bgBioQuiz = await prisma.bookGroup.upsert({
    where: { id: '00000000-0000-0000-0000-000000000202' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000202',
      courseId: courseBio.id,
      category: ContentCategory.QUIZ_3,
      code: 'BG-BIO-Q3',
      title: 'General Biology Quiz 3',
      subtitle: 'Cellular processes',
      orderIndex: 1,
      version: 1,
    },
  });

  const chBioQuiz = await prisma.content.upsert({
    where: { id: '00000000-0000-0000-0000-000000000304' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000304',
      courseId: courseBio.id,
      bookGroupId: bgBioQuiz.id,
      category: ContentCategory.QUIZ_3,
      orderIndex: 1,
      title: 'Chapter 1.1: Key Principles of General Biology',
      bodyMarkdownLatex: 'Quiz 3 Assessment for Biology.',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
      reviewedById: academicAdmin.id,
      version: 1,
    },
  });

  // Seed question for Quiz 3
  await prisma.question.upsert({
    where: { quizChapterId_displayNumber: { quizChapterId: chBioQuiz.id, displayNumber: 1 } },
    update: {},
    create: {
      quizChapterId: chBioQuiz.id,
      displayNumber: 1,
      questionType: QuestionType.MULTIPLE_CHOICE,
      promptLatex: 'What is the primary function of mitochondria in eukaryotic cells?',
      optionsJson: [
        { id: 'opt-a', label: 'A', text: 'ATP energy synthesis' },
        { id: 'opt-b', label: 'B', text: 'Protein packaging in Golgi' },
        { id: 'opt-c', label: 'C', text: 'Lipid synthesis in ER' },
        { id: 'opt-d', label: 'D', text: 'DNA transcription in nucleolus' },
      ],
      correctOptionId: 'opt-a',
      explanationLatex: 'Mitochondria generate most of the cell\'s chemical energy stored in adenosine triphosphate ($ATP$).',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
      reviewedById: academicAdmin.id,
    },
  });

  // 7. ExamSets (Mid Exams, Final Exams, COC Exams, Mock Exams - matching Screenshots 30, 34, 39, 40, 41)
  const examMidPhysics = await prisma.examSet.upsert({
    where: { examSetCode: 'EXAM-MID-PHYS-2024' },
    update: {},
    create: {
      examSetCode: 'EXAM-MID-PHYS-2024',
      category: ExamCategory.MID,
      universityId: aastu.id,
      programId: progSoftwareEng.id,
      courseId: coursePhys.id,
      semester: 1,
      stream: AcademicStream.NATURAL,
      year: '2024 / 2025',
      title: 'General Physics Mid Exam',
      timeAllowedMinutes: 90,
      isFreeSample: false,
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
      reviewedById: academicAdmin.id,
    },
  });

  await prisma.question.upsert({
    where: { examSetId_displayNumber: { examSetId: examMidPhysics.id, displayNumber: 1 } },
    update: {},
    create: {
      examSetId: examMidPhysics.id,
      displayNumber: 1,
      questionType: QuestionType.MULTIPLE_CHOICE,
      promptLatex: 'What is the significance of property #4 in General Physics (Chapter 4)?',
      optionsJson: [
        { id: 'opt-a', label: 'A', text: 'Primary concept option A for Q4' },
        { id: 'opt-b', label: 'B', text: 'Secondary concept option B for Q4' },
        { id: 'opt-c', label: 'C', text: 'Alternative option C for Q4' },
        { id: 'opt-d', label: 'D', text: 'None of the above' },
      ],
      correctOptionId: 'opt-b',
      explanationLatex: 'Property 4 states the conservation of linear momentum under net zero external force: $$\\sum \\vec{F} = \\frac{d\\vec{p}}{dt} = 0$$',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
    },
  });

  // Additional questions for Mid Physics
  await prisma.question.upsert({
    where: { examSetId_displayNumber: { examSetId: examMidPhysics.id, displayNumber: 2 } },
    update: {},
    create: {
      examSetId: examMidPhysics.id,
      displayNumber: 2,
      questionType: QuestionType.MULTIPLE_CHOICE,
      promptLatex: 'A particle moves along the x-axis with position given by $x(t) = 3t^2 - 12t + 5$. At what time $t$ is the particle momentarily at rest?',
      optionsJson: [
        { id: 'opt-a', label: 'A', text: '$t = 1\\text{ s}$' },
        { id: 'opt-b', label: 'B', text: '$t = 2\\text{ s}$' },
        { id: 'opt-c', label: 'C', text: '$t = 4\\text{ s}$' },
        { id: 'opt-d', label: 'D', text: '$t = 6\\text{ s}$' },
      ],
      correctOptionId: 'opt-b',
      explanationLatex: 'Velocity is $v(t) = \\frac{dx}{dt} = 6t - 12$. Setting $v(t) = 0$ yields $6t = 12 \\implies t = 2\\text{ s}$.',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
    },
  });

  await prisma.question.upsert({
    where: { examSetId_displayNumber: { examSetId: examMidPhysics.id, displayNumber: 3 } },
    update: {},
    create: {
      examSetId: examMidPhysics.id,
      displayNumber: 3,
      questionType: QuestionType.TRUE_FALSE,
      promptLatex: 'The work done by a conservative force along any closed path is strictly zero: $\\oint \\vec{F} \\cdot d\\vec{r} = 0$.',
      optionsJson: [
        { id: 'opt-t', label: 'True', text: 'True' },
        { id: 'opt-f', label: 'False', text: 'False' },
      ],
      correctOptionId: 'opt-t',
      correctBoolean: true,
      explanationLatex: 'By definition of conservative vector fields, curl $\\vec{F} = \\vec{0}$, meaning work is path independent and $\\oint \\vec{F} \\cdot d\\vec{r} = 0$.',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
    },
  });

  // Additional ExamSets & Questions
  const examMidCalc = await prisma.examSet.upsert({
    where: { examSetCode: 'EXAM-MID-CALC-2024' },
    update: {},
    create: {
      examSetCode: 'EXAM-MID-CALC-2024',
      category: ExamCategory.MID,
      universityId: aastu.id,
      programId: progSoftwareEng.id,
      courseId: courseCalc.id,
      semester: 1,
      stream: AcademicStream.NATURAL,
      year: '2024 / 2025',
      title: 'Calculus I Mid-Semester Examination',
      timeAllowedMinutes: 90,
      isFreeSample: true,
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
      reviewedById: academicAdmin.id,
    },
  });

  await prisma.question.upsert({
    where: { examSetId_displayNumber: { examSetId: examMidCalc.id, displayNumber: 1 } },
    update: {},
    create: {
      examSetId: examMidCalc.id,
      displayNumber: 1,
      questionType: QuestionType.MULTIPLE_CHOICE,
      promptLatex: 'Evaluate the limit: $\\lim_{x \\to 0} \\frac{\\sin(5x)}{\\tan(2x)}$.',
      optionsJson: [
        { id: 'opt-a', label: 'A', text: '$\\frac{5}{2}$' },
        { id: 'opt-b', label: 'B', text: '$\\frac{2}{5}$' },
        { id: 'opt-c', label: 'C', text: '$1$' },
        { id: 'opt-d', label: 'D', text: '$0$' },
      ],
      correctOptionId: 'opt-a',
      explanationLatex: '$\\lim_{x \\to 0} \\frac{\\sin(5x)}{\\tan(2x)} = \\lim_{x \\to 0} \\frac{5 \\cdot \\frac{\\sin(5x)}{5x}}{2 \\cdot \\frac{\\tan(2x)}{2x}} = \\frac{5(1)}{2(1)} = \\frac{5}{2}$.',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
    },
  });

  await prisma.question.upsert({
    where: { examSetId_displayNumber: { examSetId: examMidCalc.id, displayNumber: 2 } },
    update: {},
    create: {
      examSetId: examMidCalc.id,
      displayNumber: 2,
      questionType: QuestionType.MULTIPLE_CHOICE,
      promptLatex: 'Find $\\frac{dy}{dx}$ if $y = e^{x^2 \\cos x}$.',
      optionsJson: [
        { id: 'opt-a', label: 'A', text: '$e^{x^2 \\cos x} (2x \\cos x - x^2 \\sin x)$' },
        { id: 'opt-b', label: 'B', text: '$2x e^{x^2} \\cos x$' },
        { id: 'opt-c', label: 'C', text: '$-x^2 \\sin x \\, e^{x^2 \\cos x}$' },
        { id: 'opt-d', label: 'D', text: '$e^{x^2 \\cos x}$' },
      ],
      correctOptionId: 'opt-a',
      explanationLatex: 'Apply chain and product rules: $\\frac{d}{dx}[x^2 \\cos x] = 2x \\cos x - x^2 \\sin x$. Thus $\\frac{dy}{dx} = e^{x^2 \\cos x}(2x \\cos x - x^2 \\sin x)$.',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
    },
  });

  const examFinalCalc = await prisma.examSet.upsert({
    where: { examSetCode: 'EXAM-FINAL-CALC-2024' },
    update: {},
    create: {
      examSetCode: 'EXAM-FINAL-CALC-2024',
      category: ExamCategory.FINAL,
      universityId: aastu.id,
      programId: progSoftwareEng.id,
      courseId: courseCalc.id,
      semester: 1,
      stream: AcademicStream.NATURAL,
      year: '2024 / 2025',
      title: 'Calculus I (Applied Mathematics I) Final Exam',
      timeAllowedMinutes: 120,
      isFreeSample: false,
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
      reviewedById: academicAdmin.id,
    },
  });

  await prisma.question.upsert({
    where: { examSetId_displayNumber: { examSetId: examFinalCalc.id, displayNumber: 1 } },
    update: {},
    create: {
      examSetId: examFinalCalc.id,
      displayNumber: 1,
      questionType: QuestionType.MULTIPLE_CHOICE,
      promptLatex: 'Compute the definite integral: $\\int_{0}^{1} x e^{x} \\, dx$.',
      optionsJson: [
        { id: 'opt-a', label: 'A', text: '$1$' },
        { id: 'opt-b', label: 'B', text: '$e - 1$' },
        { id: 'opt-c', label: 'C', text: '$e$' },
        { id: 'opt-d', label: 'D', text: '$2e - 1$' },
      ],
      correctOptionId: 'opt-a',
      explanationLatex: 'Using integration by parts $\\int u \\, dv = uv - \\int v \\, du$: let $u=x, dv=e^x dx \\implies [x e^x]_0^1 - \\int_0^1 e^x dx = e - (e-1) = 1$.',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
    },
  });

  await prisma.question.upsert({
    where: { examSetId_displayNumber: { examSetId: examFinalCalc.id, displayNumber: 2 } },
    update: {},
    create: {
      examSetId: examFinalCalc.id,
      displayNumber: 2,
      questionType: QuestionType.MULTIPLE_CHOICE,
      promptLatex: 'Determine whether the series $\\sum_{n=1}^{\\infty} \\frac{1}{n^2 + 1}$ converges or diverges.',
      optionsJson: [
        { id: 'opt-a', label: 'A', text: 'Converges by direct comparison with $\\sum \\frac{1}{n^2}$' },
        { id: 'opt-b', label: 'B', text: 'Diverges by ratio test' },
        { id: 'opt-c', label: 'C', text: 'Diverges by integral test' },
        { id: 'opt-d', label: 'D', text: 'Cannot be determined' },
      ],
      correctOptionId: 'opt-a',
      explanationLatex: 'Since $\\frac{1}{n^2 + 1} < \\frac{1}{n^2}$ and $\\sum \\frac{1}{n^2}$ is a convergent p-series ($p=2 > 1$), the series converges.',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
    },
  });

  const examCocNational = await prisma.examSet.upsert({
    where: { examSetCode: 'EXAM-COC-NAT-2026' },
    update: {},
    create: {
      examSetCode: 'EXAM-COC-NAT-2026',
      category: ExamCategory.COC,
      universityId: null,
      programId: null,
      courseId: null,
      semester: 1,
      stream: AcademicStream.COMMON,
      year: '2026',
      title: 'National Remedial COC Assessment',
      timeAllowedMinutes: 120,
      isFreeSample: true,
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
      reviewedById: academicAdmin.id,
    },
  });

  await prisma.question.upsert({
    where: { examSetId_displayNumber: { examSetId: examCocNational.id, displayNumber: 1 } },
    update: {},
    create: {
      examSetId: examCocNational.id,
      displayNumber: 1,
      questionType: QuestionType.MULTIPLE_CHOICE,
      promptLatex: 'Under Ethiopian National Qualification Framework (ENQF), which competency level corresponds to a Bachelor Degree?',
      optionsJson: [
        { id: 'opt-a', label: 'A', text: 'Level IV' },
        { id: 'opt-b', label: 'B', text: 'Level V' },
        { id: 'opt-c', label: 'C', text: 'Level VII' },
        { id: 'opt-d', label: 'D', text: 'Level VIII' },
      ],
      correctOptionId: 'opt-c',
      explanationLatex: 'Under the Ethiopian National Qualification Framework (ENQF), Level VII designates an Undergraduate Bachelor Degree.',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
    },
  });

  await prisma.question.upsert({
    where: { examSetId_displayNumber: { examSetId: examCocNational.id, displayNumber: 2 } },
    update: {},
    create: {
      examSetId: examCocNational.id,
      displayNumber: 2,
      questionType: QuestionType.TRUE_FALSE,
      promptLatex: 'Evidence-based portfolio assessments are permissible during practical COC evaluations.',
      optionsJson: [
        { id: 'opt-t', label: 'True', text: 'True' },
        { id: 'opt-f', label: 'False', text: 'False' },
      ],
      correctOptionId: 'opt-t',
      correctBoolean: true,
      explanationLatex: 'Candidate portfolios demonstrating on-the-job competencies are recognized evidence in Ethiopian TVET/COC regulations.',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
    },
  });

  const examMockFresh = await prisma.examSet.upsert({
    where: { examSetCode: 'EXAM-MOCK-FRESH-2026' },
    update: {},
    create: {
      examSetCode: 'EXAM-MOCK-FRESH-2026',
      category: ExamCategory.MOCK,
      universityId: aastu.id,
      programId: progFreshEng.id,
      courseId: courseMath.id,
      semester: 1,
      stream: AcademicStream.NATURAL,
      year: '2026',
      title: 'Freshman Engineering Mathematics Mock Exam',
      timeAllowedMinutes: 120,
      isFreeSample: false,
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
      reviewedById: academicAdmin.id,
    },
  });

  await prisma.question.upsert({
    where: { examSetId_displayNumber: { examSetId: examMockFresh.id, displayNumber: 1 } },
    update: {},
    create: {
      examSetId: examMockFresh.id,
      displayNumber: 1,
      questionType: QuestionType.MULTIPLE_CHOICE,
      promptLatex: 'Find the eigenvalues of the matrix $A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}$.',
      optionsJson: [
        { id: 'opt-a', label: 'A', text: '$\\lambda_1 = 3, \\lambda_2 = 1$' },
        { id: 'opt-b', label: 'B', text: '$\\lambda_1 = 4, \\lambda_2 = 0$' },
        { id: 'opt-c', label: 'C', text: '$\\lambda_1 = 2, \\lambda_2 = 2$' },
        { id: 'opt-d', label: 'D', text: '$\\lambda_1 = 5, \\lambda_2 = -1$' },
      ],
      correctOptionId: 'opt-a',
      explanationLatex: 'Characteristic equation: $\\det(A - \\lambda I) = (2-\\lambda)^2 - 1 = \\lambda^2 - 4\\lambda + 3 = (\\lambda-3)(\\lambda-1) = 0 \\implies \\lambda = 3, 1$.',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
    },
  });

  await prisma.question.upsert({
    where: { examSetId_displayNumber: { examSetId: examMockFresh.id, displayNumber: 2 } },
    update: {},
    create: {
      examSetId: examMockFresh.id,
      displayNumber: 2,
      questionType: QuestionType.MULTIPLE_CHOICE,
      promptLatex: 'What is the divergence of $\\vec{F}(x,y,z) = x^2\\hat{i} + 2y\\hat{j} + z^3\\hat{k}$ at the point $(1, 1, 1)$?',
      optionsJson: [
        { id: 'opt-a', label: 'A', text: '$7$' },
        { id: 'opt-b', label: 'B', text: '$5$' },
        { id: 'opt-c', label: 'C', text: '$3$' },
        { id: 'opt-d', label: 'D', text: '$1$' },
      ],
      correctOptionId: 'opt-a',
      explanationLatex: '$\\nabla \\cdot \\vec{F} = \\frac{\\partial}{\\partial x}(x^2) + \\frac{\\partial}{\\partial y}(2y) + \\frac{\\partial}{\\partial z}(z^3) = 2x + 2 + 3z^2$. At $(1,1,1)$, $2(1) + 2 + 3(1)^2 = 7$.',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
    },
  });

  // Quiz Questions for chAnth1 (Quiz on Anthropology Chapter 1)
  await prisma.question.upsert({
    where: { quizChapterId_displayNumber: { quizChapterId: chAnth1.id, displayNumber: 1 } },
    update: {},
    create: {
      quizChapterId: chAnth1.id,
      displayNumber: 1,
      questionType: QuestionType.MULTIPLE_CHOICE,
      promptLatex: 'Which sub-discipline of Anthropology investigates human biological variation and fossil hominid evolution?',
      optionsJson: [
        { id: 'opt-a', label: 'A', text: 'Biological (Physical) Anthropology' },
        { id: 'opt-b', label: 'B', text: 'Socio-cultural Anthropology' },
        { id: 'opt-c', label: 'C', text: 'Linguistic Anthropology' },
        { id: 'opt-d', label: 'D', text: 'Archaeology' },
      ],
      correctOptionId: 'opt-a',
      explanationLatex: 'Biological/Physical anthropology studies human biological evolution, genetics, and fossil remains.',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
    },
  });

  await prisma.question.upsert({
    where: { quizChapterId_displayNumber: { quizChapterId: chAnth1.id, displayNumber: 2 } },
    update: {},
    create: {
      quizChapterId: chAnth1.id,
      displayNumber: 2,
      questionType: QuestionType.TRUE_FALSE,
      promptLatex: 'Ethnocentrism is the tendency to judge other cultures solely by the values and standards of one’s own culture.',
      optionsJson: [
        { id: 'opt-t', label: 'True', text: 'True' },
        { id: 'opt-f', label: 'False', text: 'False' },
      ],
      correctOptionId: 'opt-t',
      correctBoolean: true,
      explanationLatex: 'Ethnocentrism evaluates other societies against one’s own cultural norms, as opposed to cultural relativism.',
      status: ContentStatus.PUBLISHED,
      authoredById: superAdmin.id,
    },
  });

  console.log('Seeded Exam Sets: Mid Physics, Final Calculus, COC National, Mock Freshman');

  // 8. Students (Matching Screenshots: Abebe Kebede MS0001, Chaltu Desta MS0002, Yared Tadesse MS0003)
  const student1 = await prisma.student.upsert({
    where: { studentCode: 'MS0001' },
    update: {},
    create: {
      id: '5766218a-b1a9-4680-bdc5-4a6dc86ac523',
      studentCode: 'MS0001',
      localAccountId: '11111111-1111-1111-1111-111111111111',
      fullName: 'Abebe Kebede',
      identifier: '+251911223344',
      passwordHash: hashPassword('Student1Pass!'),
      universityId: aastu.id,
      programId: progSoftwareEng.id,
      semester: 1,
      stream: AcademicStream.NATURAL,
      boundDeviceHardware: 'Samsung Galaxy A14 (SM-A145F) [Android 14]',
      deviceBoundAt: new Date(Date.now() - 3600000 * 24 * 15),
      deviceLastSeenAt: new Date(Date.now() - 3600000 * 2),
      isActive: true,
    },
  });

  const student2 = await prisma.student.upsert({
    where: { studentCode: 'MS0002' },
    update: {},
    create: {
      id: '6766218a-b1a9-4680-bdc5-4a6dc86ac524',
      studentCode: 'MS0002',
      localAccountId: '22222222-2222-2222-2222-222222222222',
      fullName: 'Chaltu Desta',
      identifier: '+251922144556',
      passwordHash: hashPassword('Student2Pass!'),
      universityId: aau.id,
      programId: progFreshSocial.id,
      semester: 1,
      stream: AcademicStream.SOCIAL,
      boundDeviceHardware: 'Tecno Spark 10 Pro (KI7) [Android 13]',
      deviceBoundAt: new Date(Date.now() - 3600000 * 24 * 10),
      deviceLastSeenAt: new Date(Date.now() - 3600000 * 5),
      isActive: true,
    },
  });

  const student3 = await prisma.student.upsert({
    where: { studentCode: 'MS0003' },
    update: {},
    create: {
      id: '7766218a-b1a9-4680-bdc5-4a6dc86ac525',
      studentCode: 'MS0003',
      localAccountId: '33333333-3333-3333-3333-333333333333',
      fullName: 'Yared Tadesse',
      identifier: '+251933555777',
      passwordHash: hashPassword('Student3Pass!'),
      universityId: bdu.id,
      programId: progFreshSocial.id,
      semester: 2,
      stream: AcademicStream.SOCIAL,
      boundDeviceHardware: 'Infinix Hot 30 (X669) [Android 13]',
      deviceBoundAt: new Date(Date.now() - 3600000 * 24 * 5),
      deviceLastSeenAt: new Date(Date.now() - 3600000 * 8),
      isActive: true,
    },
  });

  console.log('Seeded Students: MS0001 (Abebe Kebede), MS0002 (Chaltu Desta), MS0003 (Yared Tadesse)');

  // 9. Active Entitlements for Student 1 (Matching Screenshot 4)
  const coursesForStudent1 = [
    { course: courseEnglish, days: 150 },
    { course: courseLogic, days: 150 },
    { course: courseAnth, days: 150 },
    { course: courseEcon, days: 150 },
    { course: courseCalc, days: 150 },
    { course: courseBio, days: 150 },
  ];

  for (const item of coursesForStudent1) {
    const startsAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + item.days);

    await prisma.entitlement.upsert({
      where: { id: `00000000-0000-0000-0000-${item.course.id.slice(24)}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-${item.course.id.slice(24)}`,
        studentId: student1.id,
        courseId: item.course.id,
        productType: OrderProductType.EXTRA_SINGLE_COURSE,
        startsAt,
        expiresAt,
        status: EntitlementStatus.ACTIVE,
      },
    });
  }

  // 10. Pricing Configuration (Matching Screenshots 46, 47, 48)
  await prisma.pricingConfig.upsert({
    where: { configVersion: 1 },
    update: {},
    create: {
      configVersion: 1,
      singleCoursesEnabled: true,
      renewalWindowDays: 14,
      quoteExpiryMinutes: 60,
      maxReceiptSizeBytes: 307200,
      bundlesJson: {
        semesterBundle: { priceETB: 150, minCourses: 3, maxCourses: 10, durationDays: 150 },
        fullFreshmanPackage: { singleStreamETB: 350, bothStreamsETB: 700, durationDays: 365 },
      },
      bothStreamsPriceETB: 700,
      bothStreamsDuration: 365,
      extraCourseTiersJson: [
        { ordinal: 1, priceETB: 100 },
        { ordinal: 2, priceETB: 76 },
        { ordinal: 3, priceETB: 60 },
      ],
      paymentMethodsJson: [
        { id: 'cbe', name: 'CBE Mobile Banking', accountNumber: '1000123456789' },
        { id: 'telebirr', name: 'Telebirr', merchantId: 'TB-123456' },
        { id: 'cbe_birr', name: 'CBE Birr', phoneNumber: '0911223344' },
      ],
      isActive: true,
      updatedByAdminId: superAdmin.id,
      changeReason: 'Initial verified system pricing configuration',
    },
  });

  // 11. Orders & Payments (Matching Screenshot 43: FT2426163930, FT2426147529, FT2418234636, etc.)
  const pendingReferences = [
    { ref: 'FT2426163930', daysAgo: 1, product: OrderProductType.EXTRA_SINGLE_COURSE, amount: 60 },
    { ref: 'FT2426147529', daysAgo: 1, product: OrderProductType.EXTRA_SINGLE_COURSE, amount: 60 },
    { ref: 'FT2418234636', daysAgo: 2, product: OrderProductType.EXTRA_SINGLE_COURSE, amount: 60 },
    { ref: 'FT2413176038', daysAgo: 2, product: OrderProductType.EXTRA_SINGLE_COURSE, amount: 60 },
    { ref: 'FT2413053775', daysAgo: 3, product: OrderProductType.EXTRA_SINGLE_COURSE, amount: 60 },
    { ref: 'FT2413039512', daysAgo: 3, product: OrderProductType.EXTRA_SINGLE_COURSE, amount: 60 },
    { ref: 'FT2412899432', daysAgo: 4, product: OrderProductType.SEMESTER_BUNDLE, amount: 150 },
    { ref: 'FT2411984210', daysAgo: 5, product: OrderProductType.EXTRA_SINGLE_COURSE, amount: 60 },
  ];

  for (const p of pendingReferences) {
    const createdAt = new Date(Date.now() - 3600000 * 24 * p.daysAgo);
    await prisma.order.upsert({
      where: { transactionReference: p.ref },
      update: {},
      create: {
        studentId: student1.id,
        localAccountId: student1.localAccountId,
        claimSecretHash: hashPassword(p.ref),
        pendingProfileJson: { fullName: student1.fullName, phone: student1.identifier },
        pendingPasswordHash: hashPassword('OrderStudentPass123'),
        deviceHardwareId: 'Samsung-Galaxy-A14-HW-ID',
        quoteSnapshotJson: { amountETB: p.amount, reference: p.ref },
        configVersion: 1,
        orderType: p.product,
        expectedAmountETB: p.amount,
        durationDays: 150,
        paymentMethodId: 'cbe',
        transactionReference: p.ref,
        receiptStorageKey: `receipts/${p.ref}.jpg`,
        status: OrderStatus.PENDING,
        createdAt,
      },
    });
  }

  console.log('Seeded Orders: 8 Pending CBE receipts matching design sheets');

  console.log('--- Mastera Database Seeding Complete! ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
