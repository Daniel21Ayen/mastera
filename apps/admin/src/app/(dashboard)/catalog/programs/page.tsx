'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, GraduationCap, CheckCircle2, XCircle } from 'lucide-react';
import { ADMIN_THEMES, RADIUS, SPACING } from '@mastera/ui-tokens';
import { CatalogProgramDto, CatalogUniversityDto } from '@mastera/contracts';
import { PaginatedTable } from '@/components/shared/PaginatedTable';
import { adminApiFetch } from '@/lib/api-client';

export default function ProgramsCatalogPage(): React.ReactElement {
  const tokens = ADMIN_THEMES.light;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnivFilter, setSelectedUnivFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [universities, setUniversities] = useState<CatalogUniversityDto[]>([]);
  const [programs, setPrograms] = useState<CatalogProgramDto[]>([]);
  const [newProg, setNewProg] = useState({
    universityId: '',
    name: '',
  });

  const loadData = useCallback(async () => {
    try {
      const [univRes, progRes] = await Promise.all([
        adminApiFetch<{ items: CatalogUniversityDto[] }>('/catalog/universities'),
        adminApiFetch<{ items: CatalogProgramDto[] }>('/catalog/programs'),
      ]);
      const univs = univRes?.items || [];
      setUniversities(univs);
      setPrograms(progRes?.items || []);
      if (univs.length > 0 && !newProg.universityId) {
        setNewProg((prev) => ({ ...prev, universityId: univs[0]?.id || '' }));
      }
    } catch (err) {
      console.error('Failed to load programs/universities:', err);
    }
  }, [newProg.universityId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProg.name.trim() || !newProg.universityId) return;
    try {
      setIsSubmitting(true);
      setModalError(null);
      await adminApiFetch('/catalog/programs', {
        method: 'POST',
        body: {
          universityId: newProg.universityId,
          name: newProg.name.trim(),
          isActive: true,
        },
      });
      await loadData();
      setNewProg((prev) => ({ ...prev, name: '' }));
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error('Failed to add program:', err);
      setModalError(err?.message || 'Failed to add department. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    const target = programs.find((p) => p.id === id);
    if (!target) return;
    const newStatus = !target.isActive;
    setPrograms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: newStatus } : p))
    );
    try {
      await adminApiFetch(`/catalog/programs/${id}`, {
        method: 'PUT',
        body: { isActive: newStatus },
      });
    } catch (err) {
      console.error('Failed to toggle program status:', err);
      setPrograms((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: target.isActive } : p))
      );
    }
  };

  const universityMap = new Map(universities.map((u) => [u.id, u.shortName || u.name]));

  const filtered = programs.filter((p) => {
    const matchesUniv =
      selectedUnivFilter === 'ALL' || p.universityId === selectedUnivFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (universityMap.get(p.universityId) || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesUniv && matchesSearch;
  });

  const columns = [
    {
      key: 'name',
      header: 'Department / Program',
      render: (p: CatalogProgramDto) => (
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
            <GraduationCap size={16} strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: tokens.textPrimary }}>
              {p.name}
            </div>
            <div style={{ fontSize: 12, color: tokens.textMuted }}>Version: v{p.version}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'university',
      header: 'University',
      render: (p: CatalogProgramDto) => (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: RADIUS.sm,
            backgroundColor: tokens.surfaceSubtle,
            color: tokens.primary,
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          {universityMap.get(p.universityId) || p.universityId.slice(0, 8)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p: CatalogProgramDto) => (
        <button
          type="button"
          onClick={() => handleToggleActive(p.id)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: RADIUS.pill,
            border: 'none',
            backgroundColor: p.isActive ? tokens.successBg : tokens.dangerBg,
            color: p.isActive ? tokens.success : tokens.danger,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {p.isActive ? (
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
            Academic Programs
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: tokens.textMuted }}>
            Configure university curricula, faculties, and department-specific pathways.
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
          Add Program
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
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.xs,
            flex: 1,
            minWidth: 260,
            backgroundColor: tokens.surfaceSubtle,
            padding: `${SPACING.xs}px ${SPACING.sm}px`,
            borderRadius: RADIUS.md,
          }}
        >
          <Search size={16} strokeWidth={2} color={tokens.textMuted} />
          <input
            type="text"
            placeholder="Search departments by name or university..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
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

        <div style={{ width: 240 }}>
          <select
            value={selectedUnivFilter}
            onChange={(e) => {
              setSelectedUnivFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: '100%',
              padding: `${SPACING.xs}px ${SPACING.sm}px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surfaceSubtle,
              fontSize: 13,
              color: tokens.textPrimary,
              cursor: 'pointer',
              height: 36,
            }}
          >
            <option value="ALL">All Universities ({universities.length})</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.shortName} - {u.name}
              </option>
            ))}
          </select>
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
        rowKey={(p) => p.id}
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
              Add Academic Program / Department
            </h2>

            {modalError && (
              <div
                style={{
                  backgroundColor: tokens.dangerBg,
                  color: tokens.danger,
                  padding: `${SPACING.sm}px ${SPACING.md}px`,
                  borderRadius: RADIUS.md,
                  fontSize: 12,
                  marginBottom: SPACING.md,
                  fontWeight: 500,
                }}
              >
                {modalError}
              </div>
            )}

            {universities.length === 0 ? (
              <div
                style={{
                  backgroundColor: tokens.surfaceSubtle,
                  padding: SPACING.lg,
                  borderRadius: RADIUS.md,
                  textAlign: 'center',
                }}
              >
                <p style={{ margin: '0 0 12px 0', fontSize: 13, color: tokens.textMuted }}>
                  No universities exist yet. Please register at least one university before adding departments.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: `${SPACING.sm}px ${SPACING.md}px`,
                    borderRadius: RADIUS.md,
                    border: 'none',
                    backgroundColor: tokens.primary,
                    color: tokens.surface,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddProgram} style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: tokens.textPrimary }}>
                    University
                  </label>
                  <select
                    required
                    value={newProg.universityId}
                    onChange={(e) => setNewProg({ ...newProg, universityId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: `${SPACING.sm}px`,
                      borderRadius: RADIUS.sm,
                      border: `1px solid ${tokens.border}`,
                      fontSize: 13,
                      boxSizing: 'border-box',
                      backgroundColor: tokens.surface,
                    }}
                  >
                    {universities.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.shortName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: tokens.textPrimary }}>
                    Program / Department Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Electrical and Computer Engineering"
                    value={newProg.name}
                    onChange={(e) => setNewProg({ ...newProg, name: e.target.value })}
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
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setModalError(null);
                    }}
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
                    disabled={isSubmitting}
                    style={{
                      padding: `${SPACING.sm}px ${SPACING.lg}px`,
                      borderRadius: RADIUS.md,
                      border: 'none',
                      backgroundColor: isSubmitting ? tokens.textMuted : tokens.primary,
                      color: tokens.surface,
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Program'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
