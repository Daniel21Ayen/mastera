import { ThemeMode, RAW_HEX, ACTIVE_NAVIGATION_TOKEN } from './mobile-palette';

export interface AdminThemeTokens {
  mode: ThemeMode;
  sidebarBg: string;
  sidebarText: string;
  activeSidebarChild: string;
  activeContentTab: string;
  primary: string;
  primaryStrong: string;
  background: string;
  surface: string;
  surfaceSubtle: string;
  textPrimary: string;
  textMuted: string;
  border: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
}

export const ADMIN_THEMES: Record<ThemeMode, AdminThemeTokens> = {
  light: {
    mode: 'light',
    sidebarBg: RAW_HEX.navyInk,
    sidebarText: RAW_HEX.pureWhite,
    activeSidebarChild: ACTIVE_NAVIGATION_TOKEN,
    activeContentTab: ACTIVE_NAVIGATION_TOKEN,
    primary: RAW_HEX.royalBlue,
    primaryStrong: RAW_HEX.navyInk,
    background: RAW_HEX.offWhiteSurface,
    surface: RAW_HEX.pureWhite,
    surfaceSubtle: RAW_HEX.royalBlueSoftBgLight,
    textPrimary: RAW_HEX.navyInk,
    textMuted: RAW_HEX.navyInkMutedLight,
    border: RAW_HEX.lightBorder,
    success: RAW_HEX.adminSuccess,
    successBg: RAW_HEX.adminSuccessSoftLight,
    warning: RAW_HEX.amberDark,
    warningBg: RAW_HEX.amberSoftBgLight,
    danger: RAW_HEX.adminDanger,
    dangerBg: RAW_HEX.adminDangerSoftLight,
  },
  dark: {
    mode: 'dark',
    sidebarBg: RAW_HEX.navyInk,
    sidebarText: RAW_HEX.pureWhite,
    activeSidebarChild: ACTIVE_NAVIGATION_TOKEN,
    activeContentTab: ACTIVE_NAVIGATION_TOKEN,
    primary: RAW_HEX.royalBlueLight,
    primaryStrong: RAW_HEX.pureWhite,
    background: RAW_HEX.navyInk,
    surface: RAW_HEX.navyInkSurfaceDark,
    surfaceSubtle: RAW_HEX.royalBlueSoftBgDark,
    textPrimary: RAW_HEX.pureWhite,
    textMuted: RAW_HEX.navyInkMutedDark,
    border: RAW_HEX.navyInkBorderDark,
    success: RAW_HEX.adminSuccess,
    successBg: RAW_HEX.adminSuccessSoftDark,
    warning: RAW_HEX.amber,
    warningBg: RAW_HEX.amberSoftBgDark,
    danger: RAW_HEX.adminDanger,
    dangerBg: RAW_HEX.adminDangerSoftDark,
  },
};
