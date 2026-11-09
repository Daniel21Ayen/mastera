import React from 'react';
import {
  STUDENT_THEMES,
  SPACING,
  RADIUS,
  ThemeMode,
  StudentAccessBadgeType,
  StudentActionChipType,
} from '@mastera/ui-tokens';
import { MasteraIcon } from './MasteraIcon';

export interface AccessBadgeProps {
  badgeType: StudentAccessBadgeType;
  actionChip?: StudentActionChipType;
  themeMode?: ThemeMode;
  onActionPress?: () => void;
}

export function AccessBadge({
  badgeType,
  actionChip,
  themeMode = 'light',
  onActionPress,
}: AccessBadgeProps): React.ReactElement {
  const tokens = STUDENT_THEMES[themeMode];

  const isLocked = badgeType === 'Locked';
  const isFree = badgeType === 'Free';
  const isDownloaded = badgeType === 'Downloaded';

  const badgeBg = isFree
    ? tokens.primarySoft
    : isDownloaded
    ? tokens.amberSoft
    : isLocked
    ? tokens.surface
    : tokens.surface;

  const badgeColor = isFree
    ? tokens.primary
    : isDownloaded
    ? tokens.amber
    : isLocked
    ? tokens.textMuted
    : tokens.textPrimary;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: SPACING.xs,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: `2px ${SPACING.sm}px`,
          borderRadius: RADIUS.sm,
          backgroundColor: badgeBg,
          color: badgeColor,
          fontSize: 11,
          fontWeight: 600,
          border: `1px solid ${isLocked ? tokens.border : 'transparent'}`,
        }}
      >
        {isLocked && <MasteraIcon name="lock" size={10} color={badgeColor} />}
        {isDownloaded && <MasteraIcon name="check-circle" size={10} color={badgeColor} />}
        {badgeType}
      </span>

      {actionChip && (
        <button
          type="button"
          onClick={onActionPress}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: `2px ${SPACING.sm}px`,
            borderRadius: RADIUS.pill,
            backgroundColor: tokens.primary,
            color: tokens.surface,
            border: 'none',
            fontSize: 11,
            fontWeight: 700,
            cursor: onActionPress ? 'pointer' : 'default',
          }}
        >
          {actionChip}
        </button>
      )}
    </div>
  );
}
