'use client';

import React, { useState } from 'react';
import { AdminShell } from '@/components/shell/AdminShell';
import {
  ADMIN_THEMES,
  RADIUS,
  SPACING,
  ThemeMode,
} from '@mastera/ui-tokens';

export default function AdminDashboardPage() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const tokens = ADMIN_THEMES[themeMode];

  return (
    <AdminShell
      currentPath="/dashboard"
      adminName="System Super Admin"
      adminRole="SUPER_ADMIN"
      themeMode={themeMode}
      onToggleTheme={() =>
        setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'))
      }
      globalSearchQuery={searchQuery}
      onGlobalSearchChange={setSearchQuery}
    >
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: `0 0 ${SPACING.md}px 0`, color: tokens.textPrimary }}>
          Mastera Operations Dashboard
        </h1>
        <p style={{ color: tokens.textMuted, marginBottom: SPACING.xl }}>
          Academic catalog management, question authoring, payment reviews, and student access administration.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: SPACING.md,
          }}
        >
          <div
            style={{
              padding: SPACING.lg,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              color: tokens.textPrimary,
            }}
          >
            <div style={{ fontSize: 13, color: tokens.textMuted, fontWeight: 600 }}>Active Courses</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: SPACING.xs }}>12</div>
          </div>

          <div
            style={{
              padding: SPACING.lg,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              color: tokens.textPrimary,
            }}
          >
            <div style={{ fontSize: 13, color: tokens.textMuted, fontWeight: 600 }}>Pending Orders</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: SPACING.xs }}>4</div>
          </div>

          <div
            style={{
              padding: SPACING.lg,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              color: tokens.textPrimary,
            }}
          >
            <div style={{ fontSize: 13, color: tokens.textMuted, fontWeight: 600 }}>Active Students</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: SPACING.xs }}>1,420</div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
