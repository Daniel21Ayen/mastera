import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { STUDENT_MOBILE_PALETTE } from '@mastera/ui-tokens';

export type MasteraIconName =
  | 'home'
  | 'book-open'
  | 'bar-chart-2'
  | 'user'
  | 'lock'
  | 'unlock'
  | 'download'
  | 'check-circle'
  | 'x-circle'
  | 'flag'
  | 'clock'
  | 'wifi-off'
  | 'refresh-cw'
  | 'search'
  | 'sliders'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'chevron-up'
  | 'more-vertical'
  | 'bell'
  | 'shopping-bag'
  | 'award'
  | 'lightbulb'
  | 'eye'
  | 'eye-off'
  | 'plus'
  | 'trash-2'
  | 'smartphone'
  | 'info'
  | 'moon'
  | 'sun';

export type masteraIconName = MasteraIconName;

export interface MasteraIconProps {
  name: MasteraIconName;
  size?: number;
  color?: string;
  strokeWidth?: number; // Default 2px per Design System spec
}

export type masteraIconProps = MasteraIconProps;

const LUCIDE_PATHS: Record<MasteraIconName, string[]> = {
  home: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
  'book-open': [
    'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z',
    'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
  ],
  'bar-chart-2': [
    'M18 20V10',
    'M12 20V4',
    'M6 20v-6',
  ],
  user: [
    'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2',
    'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  ],
  lock: [
    'M7 11V7a5 5 0 0 1 10 0v4',
    'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z',
  ],
  unlock: [
    'M7 11V7a5 5 0 0 1 9.9-1',
    'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z',
  ],
  download: [
    'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4',
    'M7 10l5 5 5-5',
    'M12 15V3',
  ],
  'check-circle': [
    'M22 11.08V12a10 10 0 1 1-5.93-9.14',
    'M22 4L12 14.01l-3-3',
  ],
  'x-circle': [
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    'M15 9l-6 6',
    'M9 9l6 6',
  ],
  flag: [
    'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z',
    'M4 22v-7',
  ],
  clock: [
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    'M12 6v6l4 2',
  ],
  'wifi-off': [
    'M1 1l22 22',
    'M16.72 11.06A10.94 10.94 0 0 1 19 12.55',
    'M5 12.55a10.94 10.94 0 0 1 5.17-2.39',
    'M10.71 5.05A16 16 0 0 1 22.58 9',
    'M1.42 9a15.91 15.91 0 0 1 4.7-2.88',
    'M8.53 16.11a6 6 0 0 1 6.95 0',
    'M12 20h.01',
  ],
  'refresh-cw': [
    'M23 4v6h-6',
    'M1 20v-6h6',
    'M3.51 9a9 9 0 0 1 14.85-3.36L23 10',
    'M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  ],
  search: [
    'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
    'M21 21l-4.35-4.35',
  ],
  sliders: [
    'M4 21v-7',
    'M4 10V3',
    'M12 21v-9',
    'M12 8V3',
    'M20 21v-5',
    'M20 12V3',
    'M1 14h6',
    'M9 8h6',
    'M17 16h6',
  ],
  'chevron-left': ['M15 18l-6-6 6-6'],
  'chevron-right': ['M9 18l6-6-6-6'],
  'chevron-down': ['M6 9l6 6 6-6'],
  'chevron-up': ['M18 15l-6-6-6 6'],
  'more-vertical': [
    'M12 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
    'M12 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
    'M12 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  ],
  bell: [
    'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9',
    'M13.73 21a2 2 0 0 1-3.46 0',
  ],
  'shopping-bag': [
    'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z',
    'M3 6h18',
    'M16 10a4 4 0 0 1-8 0',
  ],
  award: [
    'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z',
    'M8.21 13.89L7 23l5-3 5 3-1.21-9.12',
  ],
  lightbulb: [
    'M9 18h6',
    'M10 22h4',
    'M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z',
  ],
  eye: [
    'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z',
    'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  ],
  'eye-off': [
    'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24',
    'M1 1l22 22',
  ],
  plus: ['M12 5v14', 'M5 12h14'],
  'trash-2': [
    'M3 6h18',
    'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    'M10 11v6',
    'M14 11v6',
  ],
  smartphone: [
    'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z',
    'M12 18h.01',
  ],
  info: [
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    'M12 16v-4',
    'M12 8h.01',
  ],
  moon: ['M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'],
  sun: [
    'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
    'M12 1v2',
    'M12 21v2',
  ],
};

export function MasteraIcon({
  name,
  size = 18,
  color = STUDENT_MOBILE_PALETTE.navyInk,
  strokeWidth = 2,
}: MasteraIconProps): React.ReactElement {
  const paths = LUCIDE_PATHS[name] ?? LUCIDE_PATHS.info;
  const strokeColor = color === 'currentColor' ? STUDENT_MOBILE_PALETTE.navyInk : color;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths.map((d, idx) => (
        <Path key={idx} d={d} />
      ))}
    </Svg>
  );
}

export const masteraIcon = MasteraIcon;