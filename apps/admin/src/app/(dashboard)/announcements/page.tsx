'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Bell, AlertTriangle, Info, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { ADMIN_THEMES, RADIUS, SPACING } from '@mastera/ui-tokens';
import { PaginatedTable } from '@/components/shared/PaginatedTable';
import { adminApiFetch } from '@/lib/api-client';

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
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newAnn, setNewAnn] = useState({
    title: '',
    body: '',
    scopeType: 'ALL' as 'ALL' | 'UNIVERSITY' | 'PROGRAM' | 'COURSE',
    scopeTargetName: 'All Students',
    priority: 'NORMAL' as 'NORMAL' | 'HIGH' | 'URGENT',
    expiresAt: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0] ?? '',
  });

  const loadAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApiFetch<AnnouncementItem[]>('/announcements');
      if (Array.isArray(res)) {
        setAnnouncements(res);
      }
    } catch (err) {
      console.error('Failed to load announcements from API:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnn.title.trim() || !newAnn.body.trim()) return;

    try {
      setIsSubmitting(true);
      await adminApiFetch('/announcements', {
        method: 'POST',
        body: { data: newAnn },
      });
      setIsAddModalOpen(false);
      setNewAnn({
        title: '',
        body: '',
        scopeType: 'ALL',
        scopeTargetName: 'All Students',
        priority: 'NORMAL',
        expiresAt: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0] ?? '',
      });
      await loadAnnouncements();
    } catch (err: any) {
      console.error('Failed to create announcement:', err);
      alert(`Failed to create announcement: ${err?.message || 'Server error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    const target = announcements.find((a) => a.id === id);
    if (!target) return;

    try {
      await adminApiFetch(`/announcements/${id}`, {
        method: 'PUT',
        body: { data: { isActive: !target.isActive } },
      });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
      );
    } catch (err: any) {
      console.error('Failed to toggle status:', err);
      alert(`Failed to update status: ${err?.message || 'Server error'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this broadcast announcement?')) return;
    try {
      await adminApiFetch(`/announcements/${id}`, { method: 'DELETE' });
      await loadAnnouncements();
    } catch (err: any) {
      console.error('Failed to delete announcement:', err);
      alert(`Failed to delete announcement: ${err?.message || 'Server error'}`);
    }
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

      {/* Add Announcement Modal */}
      {isAddModalOpen && (
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
        >
          <div
            style={{
              backgroundColor: tokens.surface,
              borderRadius: RADIUS.lg,
              width: '100%',
              maxWidth: 520,
              padding: SPACING.xl,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, color: tokens.textPrimary, margin: '0 0 16px 0' }}>
              Create New Announcement
            </h2>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textMuted, marginBottom: 4 }}>
                  Announcement Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Mid Exam Schedule Released"
                  value={newAnn.title}
                  onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: `${SPACING.sm}px ${SPACING.md}px`,
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textMuted, marginBottom: 4 }}>
                  Broadcast Message Body
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detailed broadcast notice for student mobile dashboard..."
                  value={newAnn.body}
                  onChange={(e) => setNewAnn({ ...newAnn, body: e.target.value })}
                  style={{
                    width: '100%',
                    padding: `${SPACING.sm}px ${SPACING.md}px`,
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: SPACING.md }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textMuted, marginBottom: 4 }}>
                    Audience Scope
                  </label>
                  <select
                    value={newAnn.scopeType}
                    onChange={(e: any) =>
                      setNewAnn({
                        ...newAnn,
                        scopeType: e.target.value,
                        scopeTargetName:
                          e.target.value === 'ALL'
                            ? 'All Students'
                            : e.target.value === 'UNIVERSITY'
                            ? 'All Universities'
                            : 'Department Students',
                      })
                    }
                    style={{
                      width: '100%',
                      padding: `${SPACING.sm}px ${SPACING.md}px`,
                      borderRadius: RADIUS.md,
                      border: `1px solid ${tokens.border}`,
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="ALL">All Enrolled Students</option>
                    <option value="UNIVERSITY">Specific University</option>
                    <option value="PROGRAM">Specific Department</option>
                    <option value="COURSE">Single Course Enrollees</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textMuted, marginBottom: 4 }}>
                    Priority Level
                  </label>
                  <select
                    value={newAnn.priority}
                    onChange={(e: any) => setNewAnn({ ...newAnn, priority: e.target.value })}
                    style={{
                      width: '100%',
                      padding: `${SPACING.sm}px ${SPACING.md}px`,
                      borderRadius: RADIUS.md,
                      border: `1px solid ${tokens.border}`,
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="NORMAL">Normal Notice</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Exam / System Alert</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textMuted, marginBottom: 4 }}>
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={newAnn.expiresAt}
                  onChange={(e) => setNewAnn({ ...newAnn, expiresAt: e.target.value })}
                  style={{
                    width: '100%',
                    padding: `${SPACING.sm}px ${SPACING.md}px`,
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.md }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: `${SPACING.sm}px ${SPACING.md}px`,
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: `${SPACING.sm}px ${SPACING.md}px`,
                    borderRadius: RADIUS.md,
                    border: 'none',
                    backgroundColor: tokens.primary,
                    color: tokens.surface,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
