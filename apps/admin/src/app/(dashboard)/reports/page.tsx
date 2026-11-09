'use client';

import React, { useState } from 'react';
import { Download, FileText, BarChart3, TrendingUp, Users, DollarSign, ShieldCheck } from 'lucide-react';
import { ADMIN_THEMES, RADIUS, SPACING } from '@mastera/ui-tokens';

interface ReportExportItem {
  id: string;
  name: string;
  description: string;
  recordsCount: number;
  lastGenerated: string;
  category: 'FINANCIAL' | 'ACADEMIC' | 'SECURITY';
}

export default function ReportsAnalyticsPage(): React.ReactElement {
  const tokens = ADMIN_THEMES.light;
  const [selectedRange, setSelectedRange] = useState('LAST_30_DAYS');

  const reportItems: ReportExportItem[] = [
    {
      id: 'rep-fin',
      name: 'Financial Revenue & Reconciliation Report',
      description: 'Transaction-level records for CBE, Telebirr, slip approvals, refunds, and revenue breakdown.',
      recordsCount: 420,
      lastGenerated: '2024-11-06 18:00',
      category: 'FINANCIAL',
    },
    {
      id: 'rep-students',
      name: 'Student Enrollment & Course Access Report',
      description: 'Active paid students, university breakdown, semester bundles, and upcoming expiry cohorts.',
      recordsCount: 420,
      lastGenerated: '2024-11-06 18:00',
      category: 'ACADEMIC',
    },
    {
      id: 'rep-assess',
      name: 'Assessment Completion & Score Analytics',
      description: 'Quiz attempts, mid/final exam completions, passing benchmarks, and topic failure clusters.',
      recordsCount: 1840,
      lastGenerated: '2024-11-06 17:30',
      category: 'ACADEMIC',
    },
    {
      id: 'rep-sec',
      name: 'Device Binding & Revocation Audit Log',
      description: 'Audit records of all device hardware revocations, reason codes, and authorized admin signatures.',
      recordsCount: 38,
      lastGenerated: '2024-11-06 15:45',
      category: 'SECURITY',
    },
  ];

  const handleExportCsv = (reportName: string) => {
    // Generate dummy CSV download
    const csvContent = 'data:text/csv;charset=utf-8,ID,Timestamp,Category,Metric,Value\n1,2024-11-06,Revenue,ETB,128450\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
          </p>
        </div>

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
          <option value="TODAY">Today</option>
          <option value="LAST_7_DAYS">Last 7 Days</option>
          <option value="LAST_30_DAYS">Last 30 Days (Current Term)</option>
          <option value="ALL_TIME">All Time</option>
        </select>
      </div>

      {/* KPI Cards */}
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
          <div style={{ fontSize: 20, fontWeight: 700, color: tokens.textPrimary }}>128,450 ETB</div>
          <div style={{ fontSize: 11, color: tokens.success, fontWeight: 600 }}>+14.2% vs last week</div>
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
            <span style={{ fontSize: 12, color: tokens.textMuted, fontWeight: 500 }}>Paid Students</span>
            <Users size={16} strokeWidth={2} color={tokens.primary} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: tokens.textPrimary }}>420</div>
          <div style={{ fontSize: 11, color: tokens.textMuted }}>Across 4 Universities</div>
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
            <span style={{ fontSize: 12, color: tokens.textMuted, fontWeight: 500 }}>Quiz Pass Rate</span>
            <TrendingUp size={16} strokeWidth={2} color={tokens.success} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: tokens.textPrimary }}>78.4%</div>
          <div style={{ fontSize: 11, color: tokens.textMuted }}>1,840 Total Submissions</div>
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
            <span style={{ fontSize: 12, color: tokens.textMuted, fontWeight: 500 }}>Hardware Bindings</span>
            <ShieldCheck size={16} strokeWidth={2} color={tokens.primary} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: tokens.textPrimary }}>99.2%</div>
          <div style={{ fontSize: 11, color: tokens.textMuted }}>38 Device Revocations</div>
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
          Exportable Datasets & Reports
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
                    {r.description} • {r.recordsCount} Rows • Updated {r.lastGenerated}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleExportCsv(r.name)}
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
