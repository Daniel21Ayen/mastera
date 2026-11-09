export type ThemeMode = 'light' | 'dark';

/**
 * Single authoritative hex palette (Design System card in preview (4).webp).
 * No file outside packages/ui-tokens may contain a hex literal (D31, NFR-20).
 */
export const RAW_HEX = {
  royalBlue: '#1E40AF',
  royalBlueLight: '#3B82F6',
  royalBlueSoftBgLight: '#EFF6FF',
  royalBlueSoftBgDark: '#172554',
  navyInk: '#0B1B4D',
  navyInkSurfaceDark: '#112255',
  navyInkBorderDark: '#1E3A8A',
  navyInkMutedLight: '#475569',
  navyInkMutedDark: '#CBD5E1',
  pureBlack: '#000000',
  pureWhite: '#FFFFFF',
  offWhiteSurface: '#F8FAFC',
  lightBorder: '#DBEAFE',
  amber: '#F5A524',
  amberDark: '#D97706',
  amberSoftBgLight: '#FEF3C7',
  amberSoftBgDark: '#3B2F13',
  // Admin semantic tokens (DR-01, Section 10.8)
  adminSuccess: '#15803D',
  adminSuccessSoftLight: '#DCFCE7',
  adminSuccessSoftDark: '#14532D',
  adminDanger: '#B91C1C',
  adminDangerSoftLight: '#FEE2E2',
  adminDangerSoftDark: '#450A0A',
  // 8 Named Course Accents (Section 10.8, D31)
  accentBlue: '#1E40AF',
  accentAmber: '#F5A524',
  accentNavy: '#0B1B4D',
  accentIndigo: '#4338CA',
  accentTeal: '#0F766E',
  accentSlate: '#334155',
  accentCobalt: '#2563EB',
  accentGold: '#B45309',
} as const;

export const ACTIVE_NAVIGATION_TOKEN = RAW_HEX.royalBlue;

export const STUDENT_MOBILE_PALETTE = {
  royalBlue: RAW_HEX.royalBlue,
  navyInk: RAW_HEX.navyInk,
  white: RAW_HEX.pureWhite,
  amber: RAW_HEX.amber,
  canvasNeutral: RAW_HEX.offWhiteSurface,
  borderSoft: RAW_HEX.lightBorder,
  mutedGray: RAW_HEX.navyInkMutedLight,
} as const;

export interface StudentThemeTokens {
  mode: ThemeMode;
  primary: string;
  primarySoft: string;
  ink: string;
  textPrimary: string;
  textMuted: string;
  background: string;
  surface: string;
  border: string;
  amber: string;
  amberButton: string;
  amberSoft: string;
  activeTab: string;
  correctIndicator: string; // DR-01: Royal Blue + check icon
  wrongIndicator: string;   // DR-01: Amber + cross/flag icon
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  badgeBg: string;
  badgeText: string;
  white: string;
  black: string;
}

export const STUDENT_THEMES: Record<ThemeMode, StudentThemeTokens> = {
  light: {
    mode: 'light',
    primary: RAW_HEX.royalBlue,
    primarySoft: RAW_HEX.royalBlueSoftBgLight,
    ink: RAW_HEX.navyInk,
    textPrimary: RAW_HEX.navyInk,
    textMuted: RAW_HEX.navyInkMutedLight,
    background: RAW_HEX.offWhiteSurface,
    surface: RAW_HEX.pureWhite,
    border: RAW_HEX.lightBorder,
    amber: RAW_HEX.amber,
    amberButton: RAW_HEX.amber,
    amberSoft: RAW_HEX.amberSoftBgLight,
    activeTab: ACTIVE_NAVIGATION_TOKEN,
    correctIndicator: RAW_HEX.royalBlue,
    wrongIndicator: RAW_HEX.amber,
    success: RAW_HEX.adminSuccess,
    successSoft: RAW_HEX.adminSuccessSoftLight,
    danger: RAW_HEX.adminDanger,
    dangerSoft: RAW_HEX.adminDangerSoftLight,
    badgeBg: RAW_HEX.royalBlueSoftBgLight,
    badgeText: RAW_HEX.royalBlue,
    white: RAW_HEX.pureWhite,
    black: RAW_HEX.pureBlack,
  },
  dark: {
    mode: 'dark',
    primary: RAW_HEX.royalBlueLight,
    primarySoft: RAW_HEX.royalBlueSoftBgDark,
    ink: RAW_HEX.navyInk,
    textPrimary: RAW_HEX.pureWhite,
    textMuted: RAW_HEX.navyInkMutedDark,
    background: RAW_HEX.navyInk,
    surface: RAW_HEX.navyInkSurfaceDark,
    border: RAW_HEX.navyInkBorderDark,
    amber: RAW_HEX.amber,
    amberButton: RAW_HEX.amber,
    amberSoft: RAW_HEX.amberSoftBgDark,
    activeTab: ACTIVE_NAVIGATION_TOKEN,
    correctIndicator: RAW_HEX.royalBlueLight,
    wrongIndicator: RAW_HEX.amber,
    success: RAW_HEX.adminSuccess,
    successSoft: RAW_HEX.adminSuccessSoftDark,
    danger: RAW_HEX.adminDanger,
    dangerSoft: RAW_HEX.adminDangerSoftDark,
    badgeBg: RAW_HEX.royalBlueSoftBgDark,
    badgeText: RAW_HEX.royalBlueLight,
    white: RAW_HEX.pureWhite,
    black: RAW_HEX.pureBlack,
  },
};
