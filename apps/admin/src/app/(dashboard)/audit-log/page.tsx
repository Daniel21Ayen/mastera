'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Shield, Eye, Clock, User, Filter, X } from 'lucide-react';
import { ADMIN_THEMES, RADIUS, SPACING } from '@mastera/ui-tokens';
import { PaginatedTable } from '@/components/shared/PaginatedTable';
import { adminApiFetch } from '@/lib/api-client';

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
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState('ALL');

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      query.set('page', currentPage.toString());
      query.set('limit', '10');
      if (searchQuery.trim()) query.set('search', searchQuery.trim());
      if (selectedAction !== 'ALL') query.set('action', selectedAction);

      const res = await adminApiFetch<{
        total: number;
        items: AuditEntry[];
        totalPages: number;
      }>(`/audit/logs?${query.toString()}`);

      if (res && Array.isArray(res.items)) {
        setLogs(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages || Math.ceil(res.total / 10) || 1);
      }
    } catch (err) {
      console.error('Failed to load audit logs from API:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, selectedAction]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

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
            <div style={{ fontSize: 11, color: tokens.textMuted }}>
              {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'} • {entry.ipAddress}
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
          <div style={{ fontSize: 12, color: tokens.textPrimary, marginTop: 4 }}>
            {entry.targetEntity}: <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{entry.targetId}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (entry: AuditEntry) => (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: RADIUS.pill,
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
      key: 'summary',
      header: 'Details & Mutation Reason',
      render: (entry: AuditEntry) => (
        <div
          style={{
            fontSize: 12,
            color: tokens.textMuted,
            maxWidth: 360,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {entry.diffSummary}
        </div>
      ),
    },
    {
      key: 'view',
      header: 'Action',
      render: (entry: AuditEntry) => (
        <button
          type="button"
          onClick={() => setSelectedEntry(entry)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: RADIUS.sm,
            border: `1px solid ${tokens.border}`,
            backgroundColor: tokens.surface,
            color: tokens.textPrimary,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Eye size={13} strokeWidth={2} /> View
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: tokens.textPrimary, margin: 0 }}>
            System Audit Trail
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: tokens.textMuted }}>
            Immutable chronological record of administrative actions, approvals, device releases, and catalog mutations.
          </p>
        </div>
      </div>

      {/* Filter and search bar */}
      <div style={{ display: 'flex', gap: SPACING.md, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: tokens.textMuted,
            }}
          />
          <input
            type="text"
            placeholder="Search audit trail by actor, action, resource ID, or reason..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              padding: `${SPACING.sm}px ${SPACING.md}px ${SPACING.sm}px 36px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              fontSize: 13,
              backgroundColor: tokens.surface,
              boxSizing: 'border-box',
            }}
          />
        </div>

        <select
          value={selectedAction}
          onChange={(e) => {
            setSelectedAction(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            padding: `${SPACING.sm}px ${SPACING.md}px`,
            borderRadius: RADIUS.md,
            border: `1px solid ${tokens.border}`,
            fontSize: 13,
            backgroundColor: tokens.surface,
            color: tokens.textPrimary,
          }}
        >
          <option value="ALL">All Actions</option>
          <option value="ORDER">Orders & Payments</option>
          <option value="DEVICE">Device Releases</option>
          <option value="CSV">CSV Imports</option>
          <option value="QUESTION">Question Bank</option>
          <option value="ANNOUNCEMENT">Announcements</option>
          <option value="TICKET">Support Tickets</option>
        </select>
      </div>

      <PaginatedTable
        columns={columns}
        data={{
          items: logs,
          total,
          page: currentPage,
          pageSize: 10,
          totalPages,
        }}
        rowKey={(l) => l.id}
        onPageChange={setCurrentPage}
      />

      {/* Audit Detail Modal */}
      {selectedEntry && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 24,
          }}
          onClick={() => setSelectedEntry(null)}
        >
          <div
            style={{
              backgroundColor: tokens.surface,
              borderRadius: RADIUS.lg,
              width: '100%',
              maxWidth: 580,
              padding: SPACING.xl,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
                <Shield size={20} color={tokens.primary} />
                <h2 style={{ fontSize: 18, fontWeight: 700, color: tokens.textPrimary, margin: 0 }}>
                  Audit Trail Record
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md, fontSize: 13 }}>
              <div>
                <span style={{ color: tokens.textMuted, display: 'block', fontSize: 11, marginBottom: 2 }}>
                  ACTION & TARGET
                </span>
                <strong style={{ color: tokens.primary }}>{selectedEntry.action}</strong> on{' '}
                <strong>{selectedEntry.targetEntity}</strong> ({selectedEntry.targetId})
              </div>

              <div>
                <span style={{ color: tokens.textMuted, display: 'block', fontSize: 11, marginBottom: 2 }}>
                  ACTOR & ROLE
                </span>
                {selectedEntry.actorEmail} ({selectedEntry.actorRole})
              </div>

              <div>
                <span style={{ color: tokens.textMuted, display: 'block', fontSize: 11, marginBottom: 2 }}>
                  TIMESTAMP & IP ADDRESS
                </span>
                {new Date(selectedEntry.timestamp).toLocaleString()} • IP: {selectedEntry.ipAddress}
              </div>

              <div>
                <span style={{ color: tokens.textMuted, display: 'block', fontSize: 11, marginBottom: 2 }}>
                  MUTATION REASON & AUDIT PAYLOAD
                </span>
                <div
                  style={{
                    padding: SPACING.md,
                    borderRadius: RADIUS.md,
                    backgroundColor: tokens.surfaceSubtle,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {selectedEntry.diffSummary}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: SPACING.xl }}>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                style={{
                  padding: `${SPACING.sm}px ${SPACING.lg}px`,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                  fontSize: 13,
                  fontWeight: 600,
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
