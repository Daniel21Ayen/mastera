'use client';

import React, { useState } from 'react';
import { Plus, Bell, AlertTriangle, Info, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { ADMIN_THEMES, RADIUS, SPACING } from '@mastera/ui-tokens';
import { PaginatedTable } from '@/components/shared/PaginatedTable';

interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  scopeType: 'ALL' | 'UNIVERSITY' | 'PROGRAM' | 'COURSE';
  scopeTargetName: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  isActive: boolean;
  publishedAt: string;
  expiresAt: string;
}

export default function AnnouncementsPage(): React.ReactElement {
  const tokens = ADMIN_THEMES.light;
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([
    {
      id: 'ann-1',
      title: 'First Semester Mid Exams Schedule Released',
      body: 'All AASTU freshman students: Mid examinations begin next Monday. Ensure your offline materials are downloaded.',
      scopeType: 'UNIVERSITY',
      scopeTargetName: 'AASTU',
      priority: 'HIGH',
      isActive: true,
      publishedAt: '2024-11-01',
      expiresAt: '2024-11-15',
    },
    {
      id: 'ann-2',
      title: 'Platform Maintenance on Sunday 2:00 AM - 4:00 AM',
      body: 'Payment verification and receipt uploads will be briefly paused for database maintenance.',
      scopeType: 'ALL',
      scopeTargetName: 'All Students',
      priority: 'NORMAL',
      isActive: true,
      publishedAt: '2024-11-05',
      expiresAt: '2024-11-10',
    },
    {
      id: 'ann-3',
      title: 'Applied Math I Chapter 4 Calculus Quiz Live',
      body: 'Test your knowledge on differential applications. Pass mark is 70%.',
      scopeType: 'COURSE',
      scopeTargetName: 'MATH101',
      priority: 'NORMAL',
      isActive: true,
      publishedAt: '2024-11-06',
      expiresAt: '2024-11-20',
    },
  ]);

  const [newAnn, setNewAnn] = useState({
    title: '',
    body: '',
    scopeType: 'ALL' as 'ALL' | 'UNIVERSITY' | 'PROGRAM' | 'COURSE',
    scopeTargetName: 'All Students',
    priority: 'NORMAL' as 'NORMAL' | 'HIGH' | 'URGENT',
    expiresAt: '2024-11-30',
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnn.title || !newAnn.body) return;
    const item: AnnouncementItem = {
      id: `ann-${Date.now()}`,
      title: newAnn.title.trim(),
      body: newAnn.body.trim(),
      scopeType: newAnn.scopeType,
      scopeTargetName: newAnn.scopeTargetName,
      priority: newAnn.priority,
      isActive: true,
      publishedAt: new Date().toISOString().split('T')[0] ?? '',
      expiresAt: newAnn.expiresAt,
    };
    setAnnouncements((prev) => [item, ...prev]);
    setIsAddModalOpen(false);
    setNewAnn({
      title: '',
      body: '',
      scopeType: 'ALL',
      scopeTargetName: 'All Students',
      priority: 'NORMAL',
      expiresAt: '2024-11-30',
    });
  };

  const handleToggleActive = (id: string) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  const handleDelete = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  const columns = [
    {
      key: 'title',
      header: 'Announcement',
      render: (a: AnnouncementItem) => (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACING.sm }}>
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
              marginTop: 2,
            }}
          >
            <Bell size={16} strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: tokens.textPrimary }}>
              {a.title}
            </div>
            <div
              style={{
                fontSize: 12,
                color: tokens.textMuted,
                maxWidth: 400,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {a.body}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'scope',
      header: 'Audience Scope',
      render: (a: AnnouncementItem) => (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: RADIUS.pill,
            backgroundColor: tokens.surfaceSubtle,
            color: tokens.textPrimary,
            fontSize: 11,
            fontWeight: 500,
          }}
        >
          {a.scopeTargetName}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (a: AnnouncementItem) => {
        const bg =
          a.priority === 'URGENT'
            ? tokens.dangerBg
            : a.priority === 'HIGH'
            ? tokens.warningBg
            : tokens.surfaceSubtle;
        const color =
          a.priority === 'URGENT'
            ? tokens.danger
            : a.priority === 'HIGH'
            ? tokens.warning
            : tokens.textMuted;
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: RADIUS.pill,
              backgroundColor: bg,
              color,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {a.priority}
          </span>
        );
      },
    },
    {
      key: 'dates',
      header: 'Valid Window',
      render: (a: AnnouncementItem) => (
        <div style={{ fontSize: 12, color: tokens.textMuted }}>
          {a.publishedAt} → {a.expiresAt}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a: AnnouncementItem) => (
        <button
          type="button"
          onClick={() => handleToggleActive(a.id)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: RADIUS.pill,
            border: 'none',
            backgroundColor: a.isActive ? tokens.successBg : tokens.dangerBg,
            color: a.isActive ? tokens.success : tokens.danger,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {a.isActive ? (
            <>
              <CheckCircle2 size={12} strokeWidth={2} /> Active
            </>
          ) : (
            <>
              <XCircle size={12} strokeWidth={2} /> Inactive
            </>
          )}
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (a: AnnouncementItem) => (
        <button
          type="button"
          onClick={() => handleDelete(a.id)}
          title="Delete Announcement"
          style={{
            padding: 4,
            borderRadius: RADIUS.sm,
            border: `1px solid ${tokens.border}`,
            backgroundColor: tokens.surface,
            color: tokens.danger,
            cursor: 'pointer',
          }}
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: tokens.textPrimary, margin: 0 }}>
            Announcements & Notifications
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: tokens.textMuted }}>
            Broadcast localized news, examination timetables, and critical alerts to mobile devices.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          style={{
            padding: `${SPACING.sm}px ${SPACING.md}px`,
            borderRadius: RADIUS.md,
            border: 'none',
            backgroundColor: tokens.primary,
            color: tokens.surface,
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: SPACING.xs,
          }}
        >
          <Plus size={16} strokeWidth={2} />
          Create Announcement
        </button>
      </div>

      <PaginatedTable
        columns={columns}
        data={{
          items: announcements,
          total: announcements.length,
          page: currentPage,
          pageSize: 10,
          totalPages: Math.ceil(announcements.length / 10) || 1,
        }}
        rowKey={(a) => a.id}
        onPageChange={setCurrentPage}
      />

      {isAddModalOpen && (
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
          <form
            onSubmit={handleAdd}
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
              Create Scoped Announcement
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textPrimary, marginBottom: SPACING.xs }}>
                Title *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Mid Examinations Schedule Announced"
                value={newAnn.title}
                onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: SPACING.sm,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textPrimary, marginBottom: SPACING.xs }}>
                Announcement Message *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Write message details for the mobile announcement banner..."
                value={newAnn.body}
                onChange={(e) => setNewAnn({ ...newAnn, body: e.target.value })}
                style={{
                  width: '100%',
                  padding: SPACING.sm,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  fontSize: 13,
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACING.sm }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textPrimary, marginBottom: SPACING.xs }}>
                  Audience Scope
                </label>
                <select
                  value={newAnn.scopeType}
                  onChange={(e) => {
                    const st = e.target.value as any;
                    setNewAnn({
                      ...newAnn,
                      scopeType: st,
                      scopeTargetName: st === 'ALL' ? 'All Students' : st,
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: SPACING.sm,
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    fontSize: 13,
                    backgroundColor: tokens.surface,
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="ALL">All Enrolled Students</option>
                  <option value="UNIVERSITY">Specific University (AASTU / AAU)</option>
                  <option value="PROGRAM">Specific Department</option>
                  <option value="COURSE">Single Course Enrollees</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textPrimary, marginBottom: SPACING.xs }}>
                  Priority Level
                </label>
                <select
                  value={newAnn.priority}
                  onChange={(e) => setNewAnn({ ...newAnn, priority: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: SPACING.sm,
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    fontSize: 13,
                    backgroundColor: tokens.surface,
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="NORMAL">Normal Notice</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent Banner Alert</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.sm }}>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  padding: `${SPACING.sm}px ${SPACING.md}px`,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: `${SPACING.sm}px ${SPACING.md}px`,
                  borderRadius: RADIUS.md,
                  border: 'none',
                  backgroundColor: tokens.primary,
                  color: tokens.surface,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Publish Announcement
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
