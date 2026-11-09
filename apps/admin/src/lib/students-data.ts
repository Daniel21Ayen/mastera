import {
  AcademicStream,
  CatalogCourseDto,
} from '@mastera/contracts';
import { PaidStudentSummaryDto } from '@/components/students/PaidStudentsDirectory';

export interface StudentDetailRecord extends PaidStudentSummaryDto {
  universityFullName: string;
  registeredDate: string;
  totalSpentETB: number;
  boundHardwareDetails: string;
  recentOrders: Array<{
    id: string;
    referenceNumber: string;
    bank: string;
    amountETB: number;
    approvedAt: string;
    approvedBy: string;
  }>;
}

export const INITIAL_COURSES: CatalogCourseDto[] = [
  {
    id: 'course-math-1',
    code: 'MATH101',
    title: 'Applied Mathematics I',
    universityId: 'univ-aastu',
    programId: 'prog-fresh',
    semester: 1,
    stream: 'NATURAL',
    accent: 'blue',
    icon: 'calculator',
    freeAccess: false,
    freeTrialCount: 2,
    priceETB: 60,
    contentVersion: 3,
    isActive: true,
  },
  {
    id: 'course-phys-1',
    code: 'PHYS101',
    title: 'General Physics I',
    universityId: 'univ-aastu',
    programId: 'prog-fresh',
    semester: 1,
    stream: 'NATURAL',
    accent: 'amber',
    icon: 'zap',
    freeAccess: false,
    freeTrialCount: 1,
    priceETB: 60,
    contentVersion: 2,
    isActive: true,
  },
  {
    id: 'course-engl-1',
    code: 'ENGL101',
    title: 'Communicative English Skills',
    universityId: null,
    programId: null,
    semester: 1,
    stream: 'COMMON',
    accent: 'teal',
    icon: 'book',
    freeAccess: true,
    freeTrialCount: 0,
    priceETB: 0,
    contentVersion: 1,
    isActive: true,
  },
  {
    id: 'course-econ-1',
    code: 'ECON101',
    title: 'Introduction to Economics',
    universityId: 'univ-aau',
    programId: 'prog-social',
    semester: 1,
    stream: 'SOCIAL',
    accent: 'indigo',
    icon: 'book',
    freeAccess: false,
    freeTrialCount: 1,
    priceETB: 60,
    contentVersion: 1,
    isActive: true,
  },
  {
    id: 'course-psyc-1',
    code: 'PSYC101',
    title: 'General Psychology',
    universityId: 'univ-hu',
    programId: 'prog-hu-soc',
    semester: 1,
    stream: 'SOCIAL',
    accent: 'indigo',
    icon: 'book',
    freeAccess: false,
    freeTrialCount: 1,
    priceETB: 60,
    contentVersion: 1,
    isActive: true,
  },
  {
    id: 'course-math-2',
    code: 'MATH102',
    title: 'Applied Mathematics II',
    universityId: 'univ-astu',
    programId: 'prog-astu-eng',
    semester: 2,
    stream: 'NATURAL',
    accent: 'blue',
    icon: 'calculator',
    freeAccess: false,
    freeTrialCount: 1,
    priceETB: 60,
    contentVersion: 2,
    isActive: true,
  },
];

export const INITIAL_STUDENTS: StudentDetailRecord[] = [
  {
    studentId: 'stu-1',
    studentCode: 'MS0001',
    fullName: 'Abebe Bikila',
    identifier: '+251 911 022 344',
    universityShortName: 'AASTU',
    universityFullName: 'Addis Ababa Science & Technology University',
    programName: 'Freshman Engineering',
    semester: 1,
    stream: 'NATURAL',
    coursesCount: 2,
    deviceBound: true,
    boundHardwareDetails: 'Samsung Galaxy A14 (SM-A145F) [Android 14]',
    deviceBoundDateLabel: '2024-09-15',
    deviceLastSeenLabel: '2024-11-06 14:22',
    registeredDate: '2024-09-15',
    totalSpentETB: 350,
    enrolledCourses: [
      {
        courseId: 'course-math-1',
        courseTitle: 'Applied Mathematics I',
        stream: 'NATURAL',
        accessStatus: 'Paid',
        expiresDateLabel: '2025-02-15',
      },
      {
        courseId: 'course-phys-1',
        courseTitle: 'General Physics I',
        stream: 'NATURAL',
        accessStatus: 'Paid',
        expiresDateLabel: '2025-02-15',
      },
    ],
    recentOrders: [
      {
        id: 'ord-101',
        referenceNumber: 'FT2428909123',
        bank: 'Commercial Bank of Ethiopia (CBE)',
        amountETB: 350,
        approvedAt: '2024-09-15 10:14:00',
        approvedBy: 'Admin (superadmin@mastera.et)',
      },
    ],
  },
  {
    studentId: 'stu-2',
    studentCode: 'MS0002',
    fullName: 'Fatuma Roba',
    identifier: '+251 922 144 556',
    universityShortName: 'AAU',
    universityFullName: 'Addis Ababa University',
    programName: 'Freshman Social Science',
    semester: 1,
    stream: 'SOCIAL',
    coursesCount: 1,
    deviceBound: true,
    boundHardwareDetails: 'Tecno Spark 10 Pro (KI7) [Android 13]',
    deviceBoundDateLabel: '2024-09-18',
    deviceLastSeenLabel: '2024-11-07 09:15',
    registeredDate: '2024-09-18',
    totalSpentETB: 120,
    enrolledCourses: [
      {
        courseId: 'course-econ-1',
        courseTitle: 'Introduction to Economics',
        stream: 'SOCIAL',
        accessStatus: 'Paid',
        expiresDateLabel: '2025-01-30',
      },
    ],
    recentOrders: [
      {
        id: 'ord-102',
        referenceNumber: 'FT2429011223',
        bank: 'Bank of Abyssinia (BOA)',
        amountETB: 120,
        approvedAt: '2024-09-18 14:20:00',
        approvedBy: 'Admin (finance@mastera.et)',
      },
    ],
  },
  {
    studentId: 'stu-3',
    studentCode: 'MS0003',
    fullName: 'Haile Gebrselassie',
    identifier: '+251 933 555 777',
    universityShortName: 'ASTU',
    universityFullName: 'Adama Science and Technology University',
    programName: 'Applied Engineering',
    semester: 2,
    stream: 'NATURAL',
    coursesCount: 2,
    deviceBound: true,
    boundHardwareDetails: 'Infinix Hot 30 (X669) [Android 13]',
    deviceBoundDateLabel: '2024-10-01',
    deviceLastSeenLabel: '2024-11-06 18:40',
    registeredDate: '2024-10-01',
    totalSpentETB: 420,
    enrolledCourses: [
      {
        courseId: 'course-math-2',
        courseTitle: 'Applied Mathematics II',
        stream: 'NATURAL',
        accessStatus: 'Paid',
        expiresDateLabel: '2025-03-01',
      },
      {
        courseId: 'course-phys-1',
        courseTitle: 'General Physics I',
        stream: 'NATURAL',
        accessStatus: 'Paid',
        expiresDateLabel: '2025-03-01',
      },
    ],
    recentOrders: [
      {
        id: 'ord-103',
        referenceNumber: 'FT2430099881',
        bank: 'Telebirr SuperApp',
        amountETB: 420,
        approvedAt: '2024-10-01 11:05:00',
        approvedBy: 'System (Automated Claim)',
      },
    ],
  },
  {
    studentId: 'stu-4',
    studentCode: 'MS0004',
    fullName: 'Derartu Tulu',
    identifier: '+251 944 888 999',
    universityShortName: 'HU',
    universityFullName: 'Hawassa University',
    programName: 'Social Studies',
    semester: 1,
    stream: 'SOCIAL',
    coursesCount: 1,
    deviceBound: false,
    boundHardwareDetails: 'None (Unbound)',
    deviceBoundDateLabel: '2024-10-05',
    deviceLastSeenLabel: '2024-11-05 11:10',
    registeredDate: '2024-10-05',
    totalSpentETB: 180,
    enrolledCourses: [
      {
        courseId: 'course-psyc-1',
        courseTitle: 'General Psychology',
        stream: 'SOCIAL',
        accessStatus: 'Paid',
        expiresDateLabel: '2025-02-01',
      },
    ],
    recentOrders: [
      {
        id: 'ord-104',
        referenceNumber: 'FT2430554433',
        bank: 'Awash Bank',
        amountETB: 180,
        approvedAt: '2024-10-05 16:30:00',
        approvedBy: 'Admin (superadmin@mastera.et)',
      },
    ],
  },
  {
    studentId: 'stu-5',
    studentCode: 'MS0005',
    fullName: 'Kenenisa Bekele',
    identifier: '+251 912 345 678',
    universityShortName: 'AASTU',
    universityFullName: 'Addis Ababa Science & Technology University',
    programName: 'Freshman Engineering',
    semester: 1,
    stream: 'NATURAL',
    coursesCount: 1,
    deviceBound: true,
    boundHardwareDetails: 'Xiaomi Redmi Note 12 [Android 14]',
    deviceBoundDateLabel: '2024-09-20',
    deviceLastSeenLabel: '2024-11-07 10:02',
    registeredDate: '2024-09-20',
    totalSpentETB: 300,
    enrolledCourses: [
      {
        courseId: 'course-math-1',
        courseTitle: 'Applied Mathematics I',
        stream: 'NATURAL',
        accessStatus: 'Paid',
        expiresDateLabel: '2025-02-15',
      },
    ],
    recentOrders: [
      {
        id: 'ord-105',
        referenceNumber: 'FT2429443322',
        bank: 'Commercial Bank of Ethiopia (CBE)',
        amountETB: 300,
        approvedAt: '2024-09-20 09:15:00',
        approvedBy: 'Admin (superadmin@mastera.et)',
      },
    ],
  },
  {
    studentId: 'stu-6',
    studentCode: 'MS0006',
    fullName: 'Tirunesh Dibaba',
    identifier: '+251 915 678 901',
    universityShortName: 'AAU',
    universityFullName: 'Addis Ababa University',
    programName: 'Freshman Natural Science',
    semester: 1,
    stream: 'COMMON',
    coursesCount: 1,
    deviceBound: true,
    boundHardwareDetails: 'Samsung Galaxy A24 [Android 14]',
    deviceBoundDateLabel: '2024-09-22',
    deviceLastSeenLabel: '2024-11-06 20:15',
    registeredDate: '2024-09-22',
    totalSpentETB: 60,
    enrolledCourses: [
      {
        courseId: 'course-engl-1',
        courseTitle: 'Communicative English Skills',
        stream: 'COMMON',
        accessStatus: 'Paid',
        expiresDateLabel: '2025-06-30',
      },
    ],
    recentOrders: [
      {
        id: 'ord-106',
        referenceNumber: 'FT2429665544',
        bank: 'Commercial Bank of Ethiopia (CBE)',
        amountETB: 60,
        approvedAt: '2024-09-22 17:00:00',
        approvedBy: 'Admin (superadmin@mastera.et)',
      },
    ],
  },
];

export const FALLBACK_STUDENT: StudentDetailRecord = INITIAL_STUDENTS[0] as StudentDetailRecord;

export function getStudentById(studentIdOrCode: string): StudentDetailRecord {
  const found = INITIAL_STUDENTS.find(
    (s) =>
      s.studentId.toLowerCase() === studentIdOrCode.toLowerCase() ||
      s.studentCode.toLowerCase() === studentIdOrCode.toLowerCase()
  );
  return found ?? FALLBACK_STUDENT;
}
