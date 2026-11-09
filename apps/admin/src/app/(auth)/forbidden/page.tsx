'use client';

import React from 'react';
import Link from 'next/link';
import { ADMIN_THEMES, SPACING, RADIUS } from '@mastera/ui-tokens';

export default function ForbiddenPage(): React.ReactElement {
  const tokens = ADMIN_THEMES.light;

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tokens.background,
        color: tokens.textPrimary,
        padding: SPACING.lg,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: tokens.surface,
          borderRadius: RADIUS.xl,
          border: `1px solid ${tokens.border}`,
          padding: SPACING.xxl,
          textAlign: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        }}
      >
        <span
          style={{
            fontSize: 48,
            display: 'block',
            marginBottom: SPACING.md,
          }}
        >
          🛡️
        </span>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: tokens.danger,
            margin: 0,
          }}
        >
          403 Access Denied
        </h1>
        <p
          style={{
            fontSize: 14,
            color: tokens.textMuted,
            margin: `${SPACING.md}px 0 ${SPACING.xl}px`,
            lineHeight: 1.5,
          }}
        >
          Your current administrator role or assigned academic scope does not permit access
          to this resource (SRS Section 4.2 & 4.3). Denied actions are logged to the immutable audit trail.
        </p>

        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            padding: `${SPACING.md}px ${SPACING.xl}px`,
            backgroundColor: tokens.primary,
            color: tokens.surface,
            borderRadius: RADIUS.md,
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
