'use client';

import React, { useState, useEffect } from 'react';
import { ADMIN_THEMES, SPACING, RADIUS } from '@mastera/ui-tokens';
import { adminApiFetch } from '@/lib/api-client';

export default function AdminDashboardPage(): React.ReactElement {
  const tokens = ADMIN_THEMES.light;
  const [activeStudentsCount, setActiveStudentsCount] = useState<number>(3);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState<number>(8);
  const [activeCoursesCount, setActiveCoursesCount] = useState<number>(8);

  useEffect(() => {
    async function fetchDashboardMetrics() {
      try {
        const [studentsRes, paymentsRes, coursesRes] = await Promise.all([
          adminApiFetch<any>('/students'),
          adminApiFetch<any[]>('/orders/payments'),
          adminApiFetch<any>('/catalog/courses'),
        ]);
        if (studentsRes?.total !== undefined) {
          setActiveStudentsCount(studentsRes.total);
        }
        if (Array.isArray(paymentsRes)) {
          const pending = paymentsRes.filter((p: any) => p.status === 'PENDING').length;
          setPendingPaymentsCount(pending);
        }
        if (coursesRes?.total !== undefined) {
          setActiveCoursesCount(coursesRes.total);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      }
    }
    fetchDashboardMetrics();
  }, []);

  const kpis = [
    { label: 'Active students', value: String(activeStudentsCount) },
    { label: 'Pending payments', value: String(pendingPaymentsCount) },
    { label: 'Active courses', value: String(activeCoursesCount) },
    { label: 'Expiring in 7 days', value: '0' },
  ];

  const daysOfWeek = [
    { day: 'Sat', count: 0 },
    { day: 'Sun', count: 0 },
    { day: 'Mon', count: 0 },
    { day: 'Tue', count: 0 },
    { day: 'Wed', count: 0 },
    { day: 'Thu', count: 0 },
    { day: 'Fri', count: activeStudentsCount },
  ];

  const needsAttentionItems = [
    { label: 'Payments waiting for review', count: pendingPaymentsCount, isAlert: pendingPaymentsCount > 0 },
    { label: 'Duplicate reference warnings', count: 0, isAlert: false },
    { label: 'Scan jobs failed', count: 0, isAlert: false },
    { label: 'Content in draft', count: 0, isAlert: false },
  ];

  const recentActivity = [
    {
      title: 'Question published · Question a5612c66-4d78-4699-beb8-6d74703ddad1 (No. 2) · Quiz 1 · Applied Mathematics I',
      time: 'Just now',
    },
    {
      title: 'Question created · Question 14bab450-0331-40d8-bc45-b7bd47936f08 (No. 1) · Quiz 1 · Applied Mathematics I',
      time: '1 hour ago',
    },
    {
      title: 'Student registered · MS0001 (Abebe Kebede) · Software Engineering · AASTU',
      time: '2 hours ago',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xl }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: tokens.textPrimary }}>
        Dashboard
      </h1>

      {/* 4 KPI Cards in a Row (Screenshot 1) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: SPACING.lg,
        }}
      >
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            style={{
              backgroundColor: tokens.surface,
              borderRadius: RADIUS.lg,
              border: `1px solid ${tokens.border}`,
              padding: SPACING.lg,
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.xs,
            }}
          >
            <div style={{ fontSize: 13, color: tokens.textMuted }}>{kpi.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: tokens.textPrimary }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Middle Row: New Students chart & Needs Attention */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: SPACING.lg,
        }}
      >
        {/* New students this week (Screenshot 1) */}
        <div
          style={{
            backgroundColor: tokens.surface,
            borderRadius: RADIUS.lg,
            border: `1px solid ${tokens.border}`,
            padding: SPACING.lg,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.md,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: tokens.textPrimary }}>
            New students this week
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: 140,
              paddingTop: SPACING.md,
              borderBottom: `1px solid ${tokens.border}`,
            }}
          >
            {daysOfWeek.map((d) => (
              <div
                key={d.day}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: SPACING.xs,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: d.count > 0 ? 80 : 4,
                    backgroundColor: d.count > 0 ? tokens.primary : tokens.surfaceSubtle,
                    borderRadius: RADIUS.sm,
                  }}
                />
                <span style={{ fontSize: 11, color: tokens.textMuted }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Needs attention (Screenshot 1) */}
        <div
          style={{
            backgroundColor: tokens.surface,
            borderRadius: RADIUS.lg,
            border: `1px solid ${tokens.border}`,
            padding: SPACING.lg,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.md,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: tokens.textPrimary }}>
            Needs attention
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
            {needsAttentionItems.map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: `${SPACING.sm}px ${SPACING.md}px`,
                  borderRadius: RADIUS.md,
                  backgroundColor: tokens.surfaceSubtle,
                  fontSize: 13,
                }}
              >
                <span style={{ color: tokens.textPrimary }}>{item.label}</span>
                <span
                  style={{
                    padding: `2px 8px`,
                    borderRadius: RADIUS.pill,
                    fontSize: 12,
                    fontWeight: 600,
                    backgroundColor: item.isAlert ? tokens.dangerBg : tokens.surface,
                    color: item.isAlert ? tokens.danger : tokens.textMuted,
                    border: `1px solid ${item.isAlert ? tokens.danger : tokens.border}`,
                  }}
                >
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity (Screenshot 1) */}
      <div
        style={{
          backgroundColor: tokens.surface,
          borderRadius: RADIUS.lg,
          border: `1px solid ${tokens.border}`,
          padding: SPACING.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.md,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: tokens.textPrimary }}>
          Recent activity
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
          {recentActivity.map((act, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: `${SPACING.sm}px 0`,
                borderBottom: index < recentActivity.length - 1 ? `1px solid ${tokens.border}` : 'none',
                fontSize: 13,
              }}
            >
              <span style={{ color: tokens.textPrimary }}>{act.title}</span>
              <span style={{ color: tokens.textMuted, fontSize: 12 }}>{act.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
