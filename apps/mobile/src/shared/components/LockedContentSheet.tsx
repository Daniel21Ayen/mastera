import React from 'react';
import {
  RADIUS,
  SPACING,
  STUDENT_THEMES,
  ThemeMode,
} from '@mastera/ui-tokens';
import { MasteraIcon } from './MasteraIcon';

export interface LockedContentSheetProps {
  isOpen: boolean;
  mode: 'PAYWALL_LOCKED' | 'OFFLINE_NOT_DOWNLOADED';
  courseTitle: string;
  onPurchaseCourse: () => void;
  onCancel: () => void;
  themeMode?: ThemeMode;
}

export function LockedContentSheet({
  isOpen,
  mode,
  courseTitle,
  onPurchaseCourse,
  onCancel,
  themeMode = 'light',
}: LockedContentSheetProps): React.ReactElement | null {
  if (!isOpen) return null;
  const tokens = STUDENT_THEMES[themeMode];

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        backgroundColor: tokens.surface,
        color: tokens.textPrimary,
        padding: SPACING.xl,
        borderRadius: RADIUS.xl,
        border: `2px solid ${tokens.border}`,
        maxWidth: 400,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.md,
          marginBottom: SPACING.md,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: RADIUS.md,
            backgroundColor: tokens.amberSoft,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MasteraIcon
            name={mode === 'PAYWALL_LOCKED' ? 'lock' : 'wifi-off'}
            size={20}
            color={tokens.amber}
          />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
            Locked Content
          </h3>
          <div style={{ fontSize: 12, color: tokens.textMuted }}>
            {mode === 'PAYWALL_LOCKED'
              ? 'You cannot access this content.'
              : "You're offline. Download this item while online to read it offline."}
          </div>
        </div>
      </div>

      {mode === 'PAYWALL_LOCKED' && (
        <p
          style={{
            fontSize: 13,
            color: tokens.textMuted,
            lineHeight: 1.5,
            marginBottom: SPACING.lg,
          }}
        >
          {courseTitle} is locked. Purchase a course or semester bundle to
          unlock all modules, notes, Amharic notes, quizzes, and university
          exams.
        </p>
      )}

      {mode === 'PAYWALL_LOCKED' && (
        <button
          type="button"
          onClick={onPurchaseCourse}
          style={{
            width: '100%',
            padding: SPACING.md,
            borderRadius: RADIUS.md,
            border: 'none',
            backgroundColor: tokens.primary,
            color: tokens.surface,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: SPACING.xs,
            marginBottom: SPACING.sm,
            cursor: 'pointer',
          }}
        >
          <MasteraIcon name="shopping-bag" size={16} color={tokens.surface} />
          <span>Purchase Course</span>
        </button>
      )}

      <button
        type="button"
        onClick={onCancel}
        style={{
          width: '100%',
          padding: SPACING.md,
          borderRadius: RADIUS.md,
          border: `1.5px solid ${tokens.primary}`,
          backgroundColor: tokens.surface,
          color: tokens.primary,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Cancel
      </button>
    </div>
  );
}