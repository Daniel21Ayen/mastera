'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Landmark, CheckCircle2, XCircle } from 'lucide-react';
import { ADMIN_THEMES, RADIUS, SPACING } from '@mastera/ui-tokens';
import { CatalogUniversityDto } from '@mastera/contracts';
import { PaginatedTable } from '@/components/shared/PaginatedTable';
import { adminApiFetch } from '@/lib/api-client';

export default function UniversitiesCatalogPage(): React.ReactElement {
  const tokens = ADMIN_THEMES.light;
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUniv, setNewUniv] = useState({ name: '', shortName: '' });
  const [universities, setUniversities] = useState<CatalogUniversityDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUniversities = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminApiFetch<{ items: CatalogUniversityDto[] }>('/catalog/universities');
      setUniversities(res?.items || []);
    } catch (err) {
      console.error('Failed to load universities:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUniversities();
  }, [loadUniversities]);

  const handleAddUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUniv.name || !newUniv.shortName) return;
    try {
      await adminApiFetch('/catalog/universities', {
        method: 'POST',
        body: {
          name: newUniv.name.trim(),
          shortName: newUniv.shortName.trim().toUpperCase(),
          isActive: true,
        },
      });
      await loadUniversities();
      setNewUniv({ name: '', shortName: '' });
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Failed to add university:', err);
      // Optimistic update fallback
      const created: CatalogUniversityDto = {
        id: `univ-${Date.now()}`,
        name: newUniv.name.trim(),
        shortName: newUniv.shortName.trim().toUpperCase(),
        isActive: true,
        version: 1,
      };
      setUniversities((prev) => [...prev, created]);
      setNewUniv({ name: '', shortName: '' });
      setIsAddModalOpen(false);
    }
  };

  const handleToggleActive = (id: string) => {
    setUniversities((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u))
    );
  };

  const filtered = universities.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.shortName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      key: 'name',
      header: 'University Name',
      render: (u: CatalogUniversityDto) => (
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
            <Landmark size={16} strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: tokens.textPrimary }}>
              {u.name}
            </div>
            <div style={{ fontSize: 12, color: tokens.textMuted }}>Version: v{u.version}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Short Code',
      render: (u: CatalogUniversityDto) => (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: RADIUS.pill,
            backgroundColor: tokens.surfaceSubtle,
            color: tokens.primary,
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          {u.shortName}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u: CatalogUniversityDto) => (
        <button
          type="button"
          onClick={() => handleToggleActive(u.id)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: RADIUS.pill,
            border: 'none',
            backgroundColor: u.isActive ? tokens.successBg : tokens.dangerBg,
            color: u.isActive ? tokens.success : tokens.danger,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {u.isActive ? (
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
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: tokens.textPrimary, margin: 0 }}>
            Universities Directory
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: tokens.textMuted }}>
            Manage Ethiopian higher education institutions and localized catalog scopes.
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
          Add University
        </button>
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
            placeholder="Search universities by name or short code..."
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
        rowKey={(u) => u.id}
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
            zIndex: 50,
          }}
        >
          <div
            style={{
              backgroundColor: tokens.surface,
              borderRadius: RADIUS.lg,
              padding: SPACING.xl,
              width: '100%',
              maxWidth: 480,
              border: `1px solid ${tokens.border}`,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px 0', color: tokens.textPrimary }}>
              Add Ethiopian University
            </h2>
            <form onSubmit={handleAddUniversity} style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: tokens.textPrimary }}>
                  Full University Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hawassa University"
                  value={newUniv.name}
                  onChange={(e) => setNewUniv({ ...newUniv, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: `${SPACING.sm}px`,
                    borderRadius: RADIUS.sm,
                    border: `1px solid ${tokens.border}`,
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: tokens.textPrimary }}>
                  Short Code / Acronym
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HU"
                  value={newUniv.shortName}
                  onChange={(e) => setNewUniv({ ...newUniv, shortName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: `${SPACING.sm}px`,
                    borderRadius: RADIUS.sm,
                    border: `1px solid ${tokens.border}`,
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.sm }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: `${SPACING.sm}px ${SPACING.lg}px`,
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: `${SPACING.sm}px ${SPACING.lg}px`,
                    borderRadius: RADIUS.md,
                    border: 'none',
                    backgroundColor: tokens.primary,
                    color: tokens.surface,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Save University
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
