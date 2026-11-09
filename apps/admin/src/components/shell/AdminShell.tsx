'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  Scan,
  HelpCircle,
  CreditCard,
  Tag,
  Headphones,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Bell,
  Search,
  BookOpen,
} from 'lucide-react';
import { AdminRole } from '@mastera/contracts';
import {
  ADMIN_THEMES,
  RADIUS,
  SPACING,
  ThemeMode,
} from '@mastera/ui-tokens';

export interface AdminShellProps {
  currentPath: string;
  adminName?: string;
  adminRole?: AdminRole;
  themeMode?: ThemeMode;
  onToggleTheme?: () => void;
  globalSearchQuery?: string;
  onGlobalSearchChange?: (q: string) => void;
  children: React.ReactNode;
}

export function AdminShell({
  currentPath,
  adminName = 'Super Admin',
  adminRole = 'SUPER_ADMIN',
  themeMode = 'light',
  onToggleTheme,
  globalSearchQuery = '',
  onGlobalSearchChange,
  children,
}: AdminShellProps): React.ReactElement {
  const tokens = ADMIN_THEMES[themeMode];

  // Collapsible sub-menus state matching the 50 design screenshots
  const [contentOpen, setContentOpen] = useState(
    currentPath.startsWith('/content')
  );
  const [questionsOpen, setQuestionsOpen] = useState(
    currentPath.startsWith('/questions')
  );

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: tokens.background,
        color: tokens.textPrimary,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Left Dark Navy Sidebar (matching exact screenshots) */}
      <aside
        style={{
          width: 256,
          backgroundColor: tokens.sidebarBg,
          color: tokens.sidebarText,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: `${SPACING.lg}px ${SPACING.lg}px ${SPACING.md}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.xs,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: RADIUS.md,
                backgroundColor: tokens.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: tokens.sidebarText,
              }}
            >
              <BookOpen size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.2, color: tokens.sidebarText }}>
                Mastara
              </div>
              <div style={{ fontSize: 11, color: tokens.textMuted }}>Admin portal</div>
            </div>
          </div>
          <span
            style={{
              alignSelf: 'flex-start',
              marginTop: 4,
              padding: `2px ${SPACING.sm}px`,
              borderRadius: RADIUS.pill,
              backgroundColor: tokens.surfaceSubtle,
              color: tokens.primary,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Super Admin
          </span>
        </div>

        {/* Navigation List */}
        <nav
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: `${SPACING.sm}px ${SPACING.md}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {/* Dashboard */}
          <Link
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md,
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              borderRadius: RADIUS.md,
              backgroundColor: currentPath === '/dashboard' ? tokens.primary : 'transparent',
              color: tokens.sidebarText,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: currentPath === '/dashboard' ? 600 : 500,
            }}
          >
            <LayoutDashboard size={18} strokeWidth={2} />
            <span>Dashboard</span>
          </Link>

          {/* Students */}
          <Link
            href="/students"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md,
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              borderRadius: RADIUS.md,
              backgroundColor: currentPath.startsWith('/students') ? tokens.primary : 'transparent',
              color: tokens.sidebarText,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: currentPath.startsWith('/students') ? 600 : 500,
            }}
          >
            <Users size={18} strokeWidth={2} />
            <span>Students</span>
          </Link>

          {/* Courses */}
          <Link
            href="/catalog/courses"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md,
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              borderRadius: RADIUS.md,
              backgroundColor: currentPath.startsWith('/catalog') ? tokens.primary : 'transparent',
              color: tokens.sidebarText,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: currentPath.startsWith('/catalog') ? 600 : 500,
            }}
          >
            <GraduationCap size={18} strokeWidth={2} />
            <span>Courses</span>
          </Link>

          {/* Content (Collapsible Group) */}
          <div>
            <button
              type="button"
              onClick={() => setContentOpen((prev) => !prev)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${SPACING.sm}px ${SPACING.md}px`,
                borderRadius: RADIUS.md,
                backgroundColor: currentPath.startsWith('/content') && !contentOpen ? tokens.primary : 'transparent',
                color: tokens.sidebarText,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: currentPath.startsWith('/content') ? 600 : 500,
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
                <FileText size={18} strokeWidth={2} />
                <span>Content</span>
              </div>
              {contentOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {contentOpen && (
              <div style={{ paddingLeft: SPACING.md, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: tokens.textMuted, padding: '4px 8px 2px' }}>
                  Material
                </div>
                <Link
                  href="/content/materials/modules"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.xs,
                    padding: `5px ${SPACING.sm}px`,
                    borderRadius: RADIUS.sm,
                    backgroundColor: currentPath.includes('/content/materials/modules') ? tokens.primary : 'transparent',
                    color: tokens.sidebarText,
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: currentPath.includes('/content/materials/modules') ? 600 : 400,
                  }}
                >
                  <span>• Modules</span>
                </Link>
                <Link
                  href="/content/materials/notes"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.xs,
                    padding: `5px ${SPACING.sm}px`,
                    borderRadius: RADIUS.sm,
                    backgroundColor: currentPath.includes('/content/materials/notes') ? tokens.primary : 'transparent',
                    color: tokens.sidebarText,
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: currentPath.includes('/content/materials/notes') ? 600 : 400,
                  }}
                >
                  <span>• Notes</span>
                </Link>
                <Link
                  href="/content/materials/amharic-notes"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.xs,
                    padding: `5px ${SPACING.sm}px`,
                    borderRadius: RADIUS.sm,
                    backgroundColor: currentPath.includes('/content/materials/amharic-notes') ? tokens.primary : 'transparent',
                    color: tokens.sidebarText,
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: currentPath.includes('/content/materials/amharic-notes') ? 600 : 400,
                  }}
                >
                  <span>• Amharic Notes</span>
                </Link>

                <div style={{ fontSize: 11, fontWeight: 700, color: tokens.textMuted, padding: '6px 8px 2px' }}>
                  Tests
                </div>
                <Link
                  href="/content/tests/quiz-1"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.xs,
                    padding: `5px ${SPACING.sm}px`,
                    borderRadius: RADIUS.sm,
                    backgroundColor: currentPath.includes('/tests/quiz-1') ? tokens.primary : 'transparent',
                    color: tokens.sidebarText,
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: currentPath.includes('/tests/quiz-1') ? 600 : 400,
                  }}
                >
                  <span>• Quiz 1</span>
                </Link>
                <Link
                  href="/content/tests/quiz-2"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.xs,
                    padding: `5px ${SPACING.sm}px`,
                    borderRadius: RADIUS.sm,
                    backgroundColor: currentPath.includes('/tests/quiz-2') ? tokens.primary : 'transparent',
                    color: tokens.sidebarText,
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: currentPath.includes('/tests/quiz-2') ? 600 : 400,
                  }}
                >
                  <span>• Quiz 2</span>
                </Link>
                <Link
                  href="/content/tests/quiz-3"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.xs,
                    padding: `5px ${SPACING.sm}px`,
                    borderRadius: RADIUS.sm,
                    backgroundColor: currentPath.includes('/tests/quiz-3') ? tokens.primary : 'transparent',
                    color: tokens.sidebarText,
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: currentPath.includes('/tests/quiz-3') ? 600 : 400,
                  }}
                >
                  <span>• Quiz 3</span>
                </Link>
              </div>
            )}
          </div>

          {/* Scan to PDF */}
          <Link
            href="/scan-to-pdf"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md,
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              borderRadius: RADIUS.md,
              backgroundColor: currentPath.startsWith('/scan-to-pdf') ? tokens.primary : 'transparent',
              color: tokens.sidebarText,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: currentPath.startsWith('/scan-to-pdf') ? 600 : 500,
            }}
          >
            <Scan size={18} strokeWidth={2} />
            <span>Scan to PDF</span>
          </Link>

          {/* Questions (Collapsible Group) */}
          <div>
            <button
              type="button"
              onClick={() => setQuestionsOpen((prev) => !prev)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${SPACING.sm}px ${SPACING.md}px`,
                borderRadius: RADIUS.md,
                backgroundColor: currentPath.startsWith('/questions') && !questionsOpen ? tokens.primary : 'transparent',
                color: tokens.sidebarText,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: currentPath.startsWith('/questions') ? 600 : 500,
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
                <HelpCircle size={18} strokeWidth={2} />
                <span>Questions</span>
              </div>
              {questionsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {questionsOpen && (
              <div style={{ paddingLeft: SPACING.md, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Link
                  href="/questions/mid-exams"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.xs,
                    padding: `5px ${SPACING.sm}px`,
                    borderRadius: RADIUS.sm,
                    backgroundColor: currentPath.includes('mid-exams') ? tokens.primary : 'transparent',
                    color: tokens.sidebarText,
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: currentPath.includes('mid-exams') ? 600 : 400,
                  }}
                >
                  <span>• Mid Exams</span>
                </Link>
                <Link
                  href="/questions/final-exams"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.xs,
                    padding: `5px ${SPACING.sm}px`,
                    borderRadius: RADIUS.sm,
                    backgroundColor: currentPath.includes('final-exams') ? tokens.primary : 'transparent',
                    color: tokens.sidebarText,
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: currentPath.includes('final-exams') ? 600 : 400,
                  }}
                >
                  <span>• Final Exams</span>
                </Link>
                <Link
                  href="/questions/mock-exams"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.xs,
                    padding: `5px ${SPACING.sm}px`,
                    borderRadius: RADIUS.sm,
                    backgroundColor: currentPath.includes('mock-exams') ? tokens.primary : 'transparent',
                    color: tokens.sidebarText,
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: currentPath.includes('mock-exams') ? 600 : 400,
                  }}
                >
                  <span>• Mock Exams</span>
                </Link>
                <Link
                  href="/questions/coc-exams"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.xs,
                    padding: `5px ${SPACING.sm}px`,
                    borderRadius: RADIUS.sm,
                    backgroundColor: currentPath.includes('coc-exams') ? tokens.primary : 'transparent',
                    color: tokens.sidebarText,
                    textDecoration: 'none',
                    fontSize: 12,
                    fontWeight: currentPath.includes('coc-exams') ? 600 : 400,
                  }}
                >
                  <span>• COC Exams</span>
                </Link>
              </div>
            )}
          </div>

          {/* Payments */}
          <Link
            href="/commerce/payments"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md,
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              borderRadius: RADIUS.md,
              backgroundColor: currentPath.startsWith('/commerce/payments') ? tokens.primary : 'transparent',
              color: tokens.sidebarText,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: currentPath.startsWith('/commerce/payments') ? 600 : 500,
            }}
          >
            <CreditCard size={18} strokeWidth={2} />
            <span>Payments</span>
          </Link>

          {/* Pricing */}
          <Link
            href="/commerce/pricing"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md,
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              borderRadius: RADIUS.md,
              backgroundColor: currentPath.startsWith('/commerce/pricing') ? tokens.primary : 'transparent',
              color: tokens.sidebarText,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: currentPath.startsWith('/commerce/pricing') ? 600 : 500,
            }}
          >
            <Tag size={18} strokeWidth={2} />
            <span>Pricing</span>
          </Link>

          {/* Support */}
          <Link
            href="/support"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md,
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              borderRadius: RADIUS.md,
              backgroundColor: currentPath.startsWith('/support') ? tokens.primary : 'transparent',
              color: tokens.sidebarText,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: currentPath.startsWith('/support') ? 600 : 500,
            }}
          >
            <Headphones size={18} strokeWidth={2} />
            <span>Support</span>
          </Link>

          {/* Admins & Roles */}
          <Link
            href="/admins"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md,
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              borderRadius: RADIUS.md,
              backgroundColor: currentPath.startsWith('/admins') ? tokens.primary : 'transparent',
              color: tokens.sidebarText,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: currentPath.startsWith('/admins') ? 600 : 500,
            }}
          >
            <ShieldCheck size={18} strokeWidth={2} />
            <span>Admins & Roles</span>
          </Link>
        </nav>

        {/* Bottom Theme & User Circle Button */}
        <div
          style={{
            padding: SPACING.md,
            borderTop: `1px solid ${tokens.surfaceSubtle}`,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={onToggleTheme}
            title="Toggle Theme"
            style={{
              width: 34,
              height: 34,
              borderRadius: RADIUS.pill,
              backgroundColor: tokens.background,
              color: tokens.textPrimary,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            N
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Bar matching Screenshot 1..50 */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: `${SPACING.sm}px ${SPACING.xl}px`,
            backgroundColor: tokens.surface,
            borderBottom: `1px solid ${tokens.border}`,
            height: 60,
          }}
        >
          {/* Top Search Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.xs,
              width: 320,
              backgroundColor: tokens.surface,
              border: `1px solid ${tokens.border}`,
              borderRadius: RADIUS.md,
              padding: `6px ${SPACING.sm}px`,
            }}
          >
            <Search size={15} color={tokens.textMuted} />
            <input
              type="text"
              value={globalSearchQuery}
              onChange={(e) => onGlobalSearchChange?.(e.target.value)}
              placeholder="Search students, courses, payments"
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: 13,
                color: tokens.textPrimary,
              }}
            />
          </div>

          {/* Right Header: Notification Bell + User Profile Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
            {/* Bell with red count badge 9 */}
            <div
              style={{
                position: 'relative',
                width: 34,
                height: 34,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backgroundColor: tokens.surface,
              }}
            >
              <Bell size={16} color={tokens.textPrimary} />
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 16,
                  height: 16,
                  borderRadius: RADIUS.pill,
                  backgroundColor: tokens.danger,
                  color: tokens.sidebarText,
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                9
              </span>
            </div>

            {/* User Profile Pill matching Screenshots */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.sm,
                padding: '4px 8px',
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surface,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: RADIUS.sm,
                  backgroundColor: tokens.primary,
                  color: tokens.sidebarText,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                SU
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary }}>
                  Super Admin
                </span>
                <span style={{ fontSize: 11, color: tokens.textMuted }}>
                  Super Admin
                </span>
              </div>
              <ChevronDown size={14} color={tokens.textMuted} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          style={{
            padding: SPACING.xl,
            flex: 1,
            overflowY: 'auto',
            backgroundColor: tokens.background,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
