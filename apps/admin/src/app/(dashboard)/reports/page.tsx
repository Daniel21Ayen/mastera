'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Download, FileText, BarChart3, TrendingUp, Users, DollarSign, ShieldCheck, RefreshCw } from 'lucide-react';
import { ADMIN_THEMES, RADIUS, SPACING } from '@mastera/ui-tokens';
import { adminApiFetch, resolveApiBaseUrl } from '@/lib/api-client';

interface OperationalMetrics {
  totalOrders: number;
  approvedOrders: number;
  pendingApprovals: number;
  rejectedOrders: number;
  totalRevenueETB: number;
  deviceBoundStudents: number;
  unboundStudents: number;
  totalRefunds: number;
  refundRate: number;
}

interface AcademicMetrics {
  activeCourses: number;
  universitiesCount: number;
  programsCount: number;
  totalQuestions: number;
  examSetsCount: number;
  chaptersCount: number;
  activeEntitlements: number;
  totalStudents: number;
  averageMastery: number;
}

export default function ReportsAnalyticsPage(): React.ReactElement {
  const tokens = ADMIN_THEMES.light;
  const [selectedRange, setSelectedRange] = useState('ALL_TIME');
  const [loading, setLoading] = useState(true);
  const [operational, setOperational] = useState<OperationalMetrics | null>(null);
  const [academic, setAcademic] = useState<AcademicMetrics | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const [opRes, acRes] = await Promise.all([
        adminApiFetch<{ metrics: OperationalMetrics; generatedAt: string }>('/audit/reports/operational'),
        adminApiFetch<{ metrics: AcademicMetrics; generatedAt: string }>('/audit/reports/academic'),
      ]);
      setOperational(opRes.metrics);
      setAcademic(acRes.metrics);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const reportItems = [
    {
      id: 'rep-fin',
      type: 'financial',
      name: 'Financial Revenue & Reconciliation Report',
      description: 'Transaction-level records for CBE, Telebirr, slip approvals, refunds, and revenue breakdown.',
      recordsCount: operational?.totalOrders ?? 0,
      category: 'FINANCIAL' as const,
    },
    {
      id: 'rep-students',
      type: 'students',
      name: 'Student Enrollment & Course Access Report',
      description: 'Active paid students, university breakdown, semester bundles, and phone registrations.',
      recordsCount: academic?.totalStudents ?? 0,
      category: 'ACADEMIC' as const,
    },
    {
      id: 'rep-assess',
      type: 'academic',
      name: 'Academic Catalog & Assessment Content Report',
      description: 'Course catalog coverage, chapter order indexes, exam sets, and question pool totals.',
      recordsCount: academic?.activeCourses ?? 0,
      category: 'ACADEMIC' as const,
    },
    {
      id: 'rep-sec',
      type: 'security',
      name: 'Device Binding & Security Audit Log',
      description: 'Audit records of all device hardware bindings, revocations, and authorized admin signatures.',
      recordsCount: operational?.deviceBoundStudents ?? 0,
      category: 'SECURITY' as const,
    },
  ];

  const handleExportCsv = (reportType: string, reportName: string) => {
    try {
      const baseUrl = resolveApiBaseUrl();
      const exportUrl = `${baseUrl}/audit/reports/export/${reportType}`;
      const link = document.createElement('a');
      link.href = exportUrl;
      link.setAttribute('download', `${reportName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(`Failed to export report: ${err?.message || 'Server error'}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xl }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: tokens.textPrimary, margin: 0 }}>
            Reports & Analytics
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: tokens.textMuted }}>
            Generate operational reconciliation reports, academic metrics, and audit logs.
            {lastUpdated && ` (Last synced: ${lastUpdated})`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
          <button
            type="button"
            onClick={loadMetrics}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: SPACING.xs,
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              color: tokens.textPrimary,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Sync Metrics
          </button>

          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            style={{
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              fontSize: 13,
              backgroundColor: tokens.surface,
              color: tokens.textPrimary,
            }}
          >
            <option value="ALL_TIME">All Time</option>
            <option value="LAST_30_DAYS">Last 30 Days (Current Term)</option>
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="TODAY">Today</option>
          </select>
        </div>
      </div>

      {/* KPI Cards from real Database */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: SPACING.md }}>
        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.md,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.xs,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: tokens.textMuted, fontWeight: 500 }}>Total Verified Revenue</span>
            <DollarSign size={16} strokeWidth={2} color={tokens.primary} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: tokens.textPrimary }}>
            {operational ? `${operational.totalRevenueETB.toLocaleString()} ETB` : '—'}
          </div>
          <div style={{ fontSize: 11, color: tokens.success, fontWeight: 600 }}>
            {operational ? `${operational.approvedOrders} Approved Orders` : 'Loading...'}
          </div>
        </div>

        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.md,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.xs,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: tokens.textMuted, fontWeight: 500 }}>Registered Students</span>
            <Users size={16} strokeWidth={2} color={tokens.primary} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: tokens.textPrimary }}>
            {academic ? academic.totalStudents.toLocaleString() : '—'}
          </div>
          <div style={{ fontSize: 11, color: tokens.textMuted }}>
            {academic ? `Across ${academic.universitiesCount} Universities` : 'Loading...'}
          </div>
        </div>

        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.md,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.xs,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: tokens.textMuted, fontWeight: 500 }}>Question Bank</span>
            <TrendingUp size={16} strokeWidth={2} color={tokens.success} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: tokens.textPrimary }}>
            {academic ? academic.totalQuestions.toLocaleString() : '—'}
          </div>
          <div style={{ fontSize: 11, color: tokens.textMuted }}>
            {academic ? `${academic.examSetsCount} Exam Sets · ${academic.chaptersCount} Chapters` : 'Loading...'}
          </div>
        </div>

        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.md,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.xs,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: tokens.textMuted, fontWeight: 500 }}>Device Bindings</span>
            <ShieldCheck size={16} strokeWidth={2} color={tokens.primary} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: tokens.textPrimary }}>
            {operational ? operational.deviceBoundStudents.toLocaleString() : '—'}
          </div>
          <div style={{ fontSize: 11, color: tokens.textMuted }}>
            {operational ? `${operational.unboundStudents} Unbound · ${operational.totalRefunds} Refunds` : 'Loading...'}
          </div>
        </div>
      </div>

      {/* Reports Export Center */}
      <div
        style={{
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.border}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.md,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, color: tokens.textPrimary, margin: 0 }}>
          Exportable Datasets & Reports (Live DB Data)
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
          {reportItems.map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: SPACING.md,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surfaceSubtle,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: RADIUS.md,
                    backgroundColor: tokens.surface,
                    border: `1px solid ${tokens.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: tokens.primary,
                  }}
                >
                  <FileText size={18} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: tokens.textPrimary }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 12, color: tokens.textMuted }}>
                    {r.description} • {r.recordsCount} Rows
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleExportCsv(r.type, r.name)}
                style={{
                  padding: `${SPACING.xs}px ${SPACING.md}px`,
                  borderRadius: RADIUS.sm,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  color: tokens.primary,
                  fontWeight: 600,
                  fontSize: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: SPACING.xs,
                  cursor: 'pointer',
                }}
              >
                <Download size={14} strokeWidth={2} />
                Export CSV
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
