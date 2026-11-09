import React from 'react';
import {
  STUDENT_THEMES,
  SPACING,
  RADIUS,
  ThemeMode,
} from '@mastera/ui-tokens';
import { MasteraIcon } from './MasteraIcon';

export interface OfflineBannerProps {
  isOffline: boolean;
  expiringDays?: number | null;
  themeMode?: ThemeMode;
  onRenewPress?: () => void;
}

export function OfflineBanner({
  isOffline,
  expiringDays,
  themeMode = 'light',
  onRenewPress,
}: OfflineBannerProps): React.ReactElement | null {
  const tokens = STUDENT_THEMES[themeMode];

  if (!isOffline && (expiringDays === null || expiringDays === undefined || expiringDays > 14)) {
    return null;
  }

  const isExpiring = expiringDays !== null && expiringDays !== undefined && expiringDays <= 14;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${SPACING.xs}px ${SPACING.md}px`,
        backgroundColor: tokens.amberSoft,
        borderBottom: `1px solid ${tokens.amber}`,
        color: tokens.textPrimary,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
        <MasteraIcon
          name={isOffline ? 'wifi-off' : 'clock'}
          size={14}
          color={tokens.amber}
        />
        <span>
          {isOffline
            ? 'Offline Mode — showing cached and downloaded content.'
            : `Bundle expires in ${expiringDays} days.`}
        </span>
      </div>

      {isExpiring && onRenewPress && (
        <button
          type="button"
          onClick={onRenewPress}
          style={{
            padding: `2px ${SPACING.sm}px`,
            borderRadius: RADIUS.pill,
            backgroundColor: tokens.amber,
            color: tokens.surface,
            border: 'none',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Renew
        </button>
      )}
    </div>
  );
}
