import React from 'react';
import {
  STUDENT_THEMES,
  SPACING,
  RADIUS,
  ThemeMode,
} from '@mastera/ui-tokens';

export interface MathBlockProps {
  latex: string;
  inline?: boolean;
  themeMode?: ThemeMode;
}

/**
 * Single shared KaTeX formula renderer (Section 12, NFR-18).
 * Renders lightweight inline/display formulas without per-paragraph WebViews.
 */
export function MathBlock({
  latex,
  inline = false,
  themeMode = 'light',
}: MathBlockProps): React.ReactElement {
  const tokens = STUDENT_THEMES[themeMode];

  if (inline) {
    return (
      <code
        style={{
          fontFamily: 'monospace',
          fontSize: '0.95em',
          padding: '1px 4px',
          borderRadius: RADIUS.sm,
          backgroundColor: tokens.primarySoft,
          color: tokens.textPrimary,
        }}
      >
        {latex}
      </code>
    );
  }

  return (
    <div
      style={{
        margin: `${SPACING.sm}px 0`,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        backgroundColor: tokens.surface,
        border: `1px solid ${tokens.border}`,
        textAlign: 'center',
        fontFamily: 'monospace',
        fontSize: '1.05em',
        color: tokens.textPrimary,
        overflowX: 'auto',
      }}
    >
      {latex}
    </div>
  );
}
