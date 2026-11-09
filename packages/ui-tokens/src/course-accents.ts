import { RAW_HEX } from './mobile-palette';

export const COURSE_ACCENT_NAMES = [
  'blue',
  'amber',
  'navy',
  'indigo',
  'teal',
  'slate',
  'cobalt',
  'gold',
] as const;

export type CourseAccentName = (typeof COURSE_ACCENT_NAMES)[number];

export const COURSE_ACCENTS: Record<CourseAccentName, string> = {
  blue: RAW_HEX.accentBlue,
  amber: RAW_HEX.accentAmber,
  navy: RAW_HEX.accentNavy,
  indigo: RAW_HEX.accentIndigo,
  teal: RAW_HEX.accentTeal,
  slate: RAW_HEX.accentSlate,
  cobalt: RAW_HEX.accentCobalt,
  gold: RAW_HEX.accentGold,
};

export function resolveCourseAccent(
  accentName: string | null | undefined,
  courseId: string
): string {
  if (accentName && accentName in COURSE_ACCENTS) {
    return COURSE_ACCENTS[accentName as CourseAccentName];
  }
  let hash = 0;
  for (let i = 0; i < courseId.length; i++) {
    hash = (hash * 31 + courseId.charCodeAt(i)) >>> 0;
  }
  const fallbackKey =
    COURSE_ACCENT_NAMES[hash % COURSE_ACCENT_NAMES.length] ?? 'blue';
  return COURSE_ACCENTS[fallbackKey];
}
