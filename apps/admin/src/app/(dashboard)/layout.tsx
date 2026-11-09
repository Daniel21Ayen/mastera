'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdminShell } from '@/components/shell/AdminShell';
import { ThemeMode } from '@mastera/ui-tokens';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <AdminShell
      currentPath={pathname}
      adminName="Super Administrator"
      adminRole="SUPER_ADMIN"
      themeMode={themeMode}
      onToggleTheme={() =>
        setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'))
      }
      globalSearchQuery={searchQuery}
      onGlobalSearchChange={setSearchQuery}
    >
      {children}
    </AdminShell>
  );
}
