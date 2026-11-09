export type UiLanguage = 'en' | 'am';

export interface AppStrings {
  homeTab: string;
  coursesTab: string;
  progressTab: string;
  profileTab: string;
  offlineBanner: string;
  lockedPaywallTitle: string;
  purchaseCourseButton: string;
  downloadCourseButton: string;
  takeQuizButton: string;
  examRunnerTitle: string;
}

export const STRINGS: Record<UiLanguage, AppStrings> = {
  en: {
    homeTab: 'Home',
    coursesTab: 'Courses',
    progressTab: 'Progress',
    profileTab: 'Profile',
    offlineBanner: 'Offline Mode',
    lockedPaywallTitle: 'Content Locked',
    purchaseCourseButton: 'Buy Access',
    downloadCourseButton: 'Download for Offline',
    takeQuizButton: 'Take Quiz',
    examRunnerTitle: 'Exam Runner',
  },
  am: {
    homeTab: 'ዋና ገጽ',
    coursesTab: 'ኮርሶች',
    progressTab: 'ውጤት',
    profileTab: 'መገለጫ',
    offlineBanner: 'ከመስመር ውጭ ሁነታ',
    lockedPaywallTitle: 'ይዘቱ ተቆልፏል',
    purchaseCourseButton: 'ይግዙ',
    downloadCourseButton: 'ያውርዱ',
    takeQuizButton: 'ጥያቄዎችን ይጀምሩ',
    examRunnerTitle: 'ፈተና',
  },
};
