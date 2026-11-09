import React from 'react';
import { AdminRole } from '@mastera/contracts';
import {
  ADMIN_THEMES,
  RADIUS,
  SPACING,
  ThemeMode,
} from '@mastera/ui-tokens';

export interface AuthoringActionBarProps {
  actorRole: AdminRole;
  canPublish: boolean;
  onAdd?: () => void;
  onBulkImport?: () => void;
  onReset: () => void;
  onSaveDraft: () => void;
  onSubmitReview?: () => void;
  onPublish: () => void;
  addLabel?: string;
  themeMode?: ThemeMode;
}

export function AuthoringActionBar({
  actorRole,
  canPublish,
  onAdd,
  onBulkImport,
  onReset,
  onSaveDraft,
  onSubmitReview,
  onPublish,
  addLabel = '+ Add Question',
  themeMode = 'light',
}: AuthoringActionBarProps): React.ReactElement {
  const tokens = ADMIN_THEMES[themeMode];

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: SPACING.lg,
        marginTop: SPACING.lg,
        borderTop: `1px solid ${tokens.border}`,
      }}
    >
      <div style={{ display: 'flex', gap: SPACING.sm }}>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            style={{
              padding: `${SPACING.sm}px ${SPACING.lg}px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.primary}`,
              backgroundColor: tokens.surface,
              color: tokens.primary,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {addLabel}
          </button>
        )}

        {onBulkImport && (
          <button
            type="button"
            onClick={onBulkImport}
            style={{
              padding: `${SPACING.sm}px ${SPACING.lg}px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.primary}`,
              backgroundColor: tokens.surface,
              color: tokens.primary,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Bulk Import Questions
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: SPACING.sm }}>
        <button
          type="button"
          onClick={onReset}
          style={{
            padding: `${SPACING.sm}px ${SPACING.lg}px`,
            borderRadius: RADIUS.md,
            border: `1px solid ${tokens.border}`,
            backgroundColor: tokens.surface,
            color: tokens.textPrimary,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Reset
        </button>

        <button
          type="button"
          onClick={onSaveDraft}
          style={{
            padding: `${SPACING.sm}px ${SPACING.lg}px`,
            borderRadius: RADIUS.md,
            border: `1px solid ${tokens.primary}`,
            backgroundColor: tokens.surface,
            color: tokens.primary,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Save Draft
        </button>

        {actorRole === 'ACADEMIC_ADMIN' && onSubmitReview && (
          <button
            type="button"
            onClick={onSubmitReview}
            style={{
              padding: `${SPACING.sm}px ${SPACING.lg}px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.warning}`,
              backgroundColor: tokens.warningBg,
              color: tokens.textPrimary,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Submit for Review
          </button>
        )}

        {canPublish && (
          <button
            type="button"
            onClick={onPublish}
            style={{
              padding: `${SPACING.sm}px ${SPACING.lg}px`,
              borderRadius: RADIUS.md,
              border: 'none',
              backgroundColor: tokens.primary,
              color: tokens.sidebarText,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Publish
          </button>
        )}
      </div>
    </div>
  );
}