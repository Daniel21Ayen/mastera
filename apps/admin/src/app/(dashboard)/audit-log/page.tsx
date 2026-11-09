'use client';

import React, { useState } from 'react';
import { Search, Shield, Eye, Clock, User, Filter } from 'lucide-react';
import { ADMIN_THEMES, RADIUS, SPACING } from '@mastera/ui-tokens';
import { PaginatedTable } from '@/components/shared/PaginatedTable';

interface AuditEntry {
  id: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetEntity: string;
  targetId: string;
  ipAddress: string;
  timestamp: string;
  diffSummary: string;
}

export default function AuditLogPage(): React.ReactElement {
  const tokens = ADMIN_THEMES.light;
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  const [logs, setLogs] = useState<AuditEntry[]>([
    {
      id: 'aud-1',
      actorEmail: 'superadmin@mastera.et',
      actorRole: 'SUPER_ADMIN',
      action: 'ORDER_APPROVED',
      targetEntity: 'Order',
      targetId: 'ord-101 (MS0001)',
      ipAddress: '197.156.104.22',
      timestamp: '2024-11-06 14:14:22',
      diffSummary: 'Verified 270 ETB CBE slip. Generated MS0001 code and issued student claim secret.',
    },
    {
      id: 'aud-2',
      actorEmail: 'ops@mastera.et',
      actorRole: 'OPERATIONS_ADMIN',
      action: 'DEVICE_REVOKED',
      targetEntity: 'Student',
      targetId: 'MS0002 (Dawit Bekele)',
      ipAddress: '197.156.104.45',
      timestamp: '2024-11-06 13:05:10',
      diffSummary: 'Cleared hardware binding hash SM-A145F upon verified lost phone support ticket.',
    },
    {
      id: 'aud-3',
      actorEmail: 'content@mastera.et',
      actorRole: 'ACADEMIC_ADMIN',
      action: 'CHAPTER_PUBLISHED',
      targetEntity: 'Chapter',
      targetId: 'ch-math-101-02',
      ipAddress: '196.189.12.98',
      timestamp: '2024-11-06 11:20:00',
      diffSummary: 'Published Calculus Chapter 2 with 52 KaTeX formulas and attached 15-question quiz.',
    },
    {
      id: 'aud-4',
      actorEmail: 'superadmin@mastera.et',
      actorRole: 'SUPER_ADMIN',
      action: 'PRICING_UPDATED',
      targetEntity: 'PaymentSettings',
      targetId: 'config-v2',
      ipAddress: '197.156.104.22',
      timestamp: '2024-11-05 16:30:00',
      diffSummary: 'Changed single course unit price to 60 ETB and adjusted 120-day semester bundle to 270 ETB.',
    },
  ]);

  const filtered = logs.filter(
    (l) =>
      l.actorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.targetEntity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.targetId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      key: 'timestamp',
      header: 'Timestamp & Actor',
      render: (entry: AuditEntry) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: RADIUS.md,
              backgroundColor: tokens.surfaceSubtle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: tokens.primary,
            }}
          >
            <Shield size={16} strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: tokens.textPrimary }}>
              {entry.actorEmail}
            </div>
            <div style={{ fontSize: 12, color: tokens.textMuted }}>
              {entry.timestamp} • {entry.ipAddress}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action & Target',
      render: (entry: AuditEntry) => (
        <div>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: RADIUS.pill,
              backgroundColor: tokens.surfaceSubtle,
              color: tokens.primary,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {entry.action}
          </span>
          <div style={{ fontSize: 12, color: tokens.textPrimary, marginTop: 2 }}>
            {entry.targetEntity}: <strong>{entry.targetId}</strong>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Actor Role',
      render: (entry: AuditEntry) => (
        <span
          style={{
            padding: '2px 6px',
            borderRadius: RADIUS.sm,
            backgroundColor: tokens.surfaceSubtle,
            color: tokens.textMuted,
            fontSize: 11,
            fontWeight: 500,
          }}
        >
          {entry.actorRole}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Diff Inspection',
      render: (entry: AuditEntry) => (
        <button
          type="button"
          onClick={() => setSelectedEntry(entry)}
          style={{
            padding: '4px 8px',
            borderRadius: RADIUS.sm,
            border: `1px solid ${tokens.border}`,
            backgroundColor: tokens.surface,
            color: tokens.primary,
            fontSize: 12,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Eye size={12} strokeWidth={2} /> View Diff
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: tokens.textPrimary, margin: 0 }}>
            Audit Trail & Security Log
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: tokens.textMuted }}>
            Immutable administrative action log capturing approvals, revocations, and authoring edits.
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: SPACING.md,
          backgroundColor: tokens.surface,
          padding: SPACING.md,
          borderRadius: RADIUS.lg,
          border: `1px solid ${tokens.border}`,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.xs,
            flex: 1,
            backgroundColor: tokens.surfaceSubtle,
            padding: `${SPACING.xs}px ${SPACING.sm}px`,
            borderRadius: RADIUS.md,
          }}
        >
          <Search size={16} strokeWidth={2} color={tokens.textMuted} />
          <input
            type="text"
            placeholder="Search audit trail by actor, action, target..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
      </div>

      <PaginatedTable
        columns={columns}
        data={{
          items: filtered,
          total: filtered.length,
          page: currentPage,
          pageSize: 10,
          totalPages: Math.ceil(filtered.length / 10) || 1,
        }}
        rowKey={(l) => l.id}
        onPageChange={setCurrentPage}
      />

      {/* Diff Modal */}
      {selectedEntry && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: tokens.surface,
              borderRadius: RADIUS.lg,
              padding: SPACING.xl,
              width: 500,
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.md,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: tokens.textPrimary }}>
              Audit Log Detail: {selectedEntry.action}
            </h3>

            <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: SPACING.xs }}>
              <div><span style={{ color: tokens.textMuted }}>Actor:</span> {selectedEntry.actorEmail} ({selectedEntry.actorRole})</div>
              <div><span style={{ color: tokens.textMuted }}>Timestamp:</span> {selectedEntry.timestamp}</div>
              <div><span style={{ color: tokens.textMuted }}>Client IP:</span> {selectedEntry.ipAddress}</div>
              <div><span style={{ color: tokens.textMuted }}>Target Entity:</span> {selectedEntry.targetEntity} #{selectedEntry.targetId}</div>
            </div>

            <div style={{ marginTop: SPACING.sm }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textPrimary, marginBottom: SPACING.xs }}>
                Payload / Action Summary:
              </label>
              <div
                style={{
                  padding: SPACING.md,
                  backgroundColor: tokens.surfaceSubtle,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: tokens.textPrimary,
                }}
              >
                {selectedEntry.diffSummary}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: SPACING.sm }}>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                style={{
                  padding: `${SPACING.sm}px ${SPACING.md}px`,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
