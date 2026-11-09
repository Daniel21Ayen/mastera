import React, { useState } from 'react';
import {
  ADMIN_THEMES,
  SPACING,
  RADIUS,
  ThemeMode,
} from '@mastera/ui-tokens';

export interface LatexInputHelperProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  themeMode?: ThemeMode;
}

export function LatexInputHelper({
  value,
  onChange,
  label = 'LaTeX Formula / Math Content',
  placeholder = 'e.g. f(x) = \\int_{0}^{1} x^2 dx',
  themeMode = 'light',
}: LatexInputHelperProps): React.ReactElement {
  const [showPreview, setShowPreview] = useState(true);
  const tokens = ADMIN_THEMES[themeMode];

  const insertSymbol = (sym: string) => {
    onChange(`${value} ${sym} `);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowPreview((p) => !p)}
          style={{
            background: 'none',
            border: 'none',
            color: tokens.primary,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {showPreview ? 'Hide Preview' : 'Show Live Preview'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: SPACING.xs, flexWrap: 'wrap' }}>
        {['\\frac{a}{b}', '\\sqrt{x}', '\\lim_{x \\to \\infty}', '\\sum_{i=1}^{n}', '\\int', '\\theta', '\\pi'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => insertSymbol(s)}
            style={{
              padding: `2px ${SPACING.sm}px`,
              borderRadius: RADIUS.sm,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surfaceSubtle,
              color: tokens.textPrimary,
              fontSize: 11,
              fontFamily: 'monospace',
              cursor: 'pointer',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={{
          width: '100%',
          padding: SPACING.sm,
          borderRadius: RADIUS.md,
          border: `1px solid ${tokens.border}`,
          backgroundColor: tokens.surface,
          color: tokens.textPrimary,
          fontFamily: 'monospace',
          fontSize: 13,
          boxSizing: 'border-box',
        }}
      />

      {showPreview && value.trim().length > 0 && (
        <div
          style={{
            padding: SPACING.md,
            borderRadius: RADIUS.md,
            border: `1px dashed ${tokens.border}`,
            backgroundColor: tokens.surfaceSubtle,
            color: tokens.textPrimary,
            fontSize: 14,
            overflowX: 'auto',
          }}
        >
          <div style={{ fontSize: 11, color: tokens.textMuted, marginBottom: 4 }}>Live Math Preview:</div>
          <div style={{ fontFamily: 'serif' }}>{value}</div>
        </div>
      )}
    </div>
  );
}
