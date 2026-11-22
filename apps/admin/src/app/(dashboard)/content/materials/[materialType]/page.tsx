'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Scan, ArrowRight, FileText, Globe, Eye, Edit3, Trash2 } from 'lucide-react';
import { ADMIN_THEMES, RADIUS, SPACING } from '@mastera/ui-tokens';
import { CatalogCourseDto, CatalogUniversityDto, CatalogProgramDto } from '@mastera/contracts';
import { PaginatedTable } from '@/components/shared/PaginatedTable';
import { RowActionMenu } from '@/components/shared/RowActionMenu';
import { adminApiFetch } from '@/lib/api-client';

interface MaterialTypePageProps {
  params: {
    materialType: string;
  };
}

interface ChapterRow {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  universityName?: string;
  programName?: string;
  category: string;
  bookGroupTitle?: string;
  chapterNumber: number;
  chapterTitle: string;
  estimatedPages: number;
  hasQuiz: boolean;
  status: 'PUBLISHED' | 'DRAFT';
  updatedAt: string;
}

export default function DynamicMaterialsPage({ params }: MaterialTypePageProps): React.ReactElement {
  const tokens = ADMIN_THEMES.light;
  const currentMaterialType = params.materialType || 'modules';

  const [universities, setUniversities] = useState<CatalogUniversityDto[]>([]);
  const [programs, setPrograms] = useState<CatalogProgramDto[]>([]);
  const [courses, setCourses] = useState<CatalogCourseDto[]>([]);

  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('ALL');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('ALL');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('ALL');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [loading, setLoading] = useState(true);

  // View & Delete Modal states
  const [selectedViewChapter, setSelectedViewChapter] = useState<ChapterRow | null>(null);
  const [viewChapterDetail, setViewChapterDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleteConfirmChapter, setDeleteConfirmChapter] = useState<ChapterRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Material type metadata configuration
  const materialMetaMap: Record<string, { label: string; icon: any; categoryKey: string; desc: string }> = {
    modules: {
      label: 'Learning Modules',
      icon: BookOpen,
      categoryKey: 'MODULES',
      desc: 'Structured textbook modules, core curriculum chapters, and formulas.',
    },
    notes: {
      label: 'Lecture Notes',
      icon: FileText,
      categoryKey: 'NOTES',
      desc: 'High-yield formula summaries, revision cheat-sheets, and study guides.',
    },
    'amharic-notes': {
      label: 'Amharic Notes',
      icon: Globe,
      categoryKey: 'AMHARIC_NOTE',
      desc: 'Localized Amharic study notes and translated concept summaries (የአማርኛ ማስታወሻዎች).',
    },
  };

  const meta = materialMetaMap[currentMaterialType] || {
    label: `${currentMaterialType.charAt(0).toUpperCase() + currentMaterialType.slice(1)} Materials`,
    icon: BookOpen,
    categoryKey: currentMaterialType.toUpperCase().replace('-', '_'),
    desc: 'Course materials, structured chapters, and documentation.',
  };

  const IconComponent = meta.icon;

  const loadFilters = useCallback(async () => {
    try {
      const [uniRes, progRes, courseRes] = await Promise.all([
        adminApiFetch<CatalogUniversityDto[]>('/catalog/universities'),
        adminApiFetch<CatalogProgramDto[]>('/catalog/programs'),
        adminApiFetch<{ items: CatalogCourseDto[] }>('/catalog/courses'),
      ]);
      setUniversities(Array.isArray(uniRes) ? uniRes : []);
      setPrograms(Array.isArray(progRes) ? progRes : []);
      setCourses(courseRes?.items || []);
    } catch (err) {
      console.error('Failed to load filter metadata:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.set('category', meta.categoryKey);
      if (selectedUniversityId !== 'ALL') queryParams.set('universityId', selectedUniversityId);
      if (selectedProgramId !== 'ALL') queryParams.set('programId', selectedProgramId);
      if (selectedCourseId !== 'ALL') queryParams.set('courseId', selectedCourseId);

      const chaptersRes = await adminApiFetch<any[]>(`/content/chapters?${queryParams.toString()}`);
      if (Array.isArray(chaptersRes)) {
        const rows: ChapterRow[] = chaptersRes.map((ch: any) => ({
          id: ch.id,
          courseId: ch.courseId,
          courseCode: ch.courseCode || 'CRS',
          courseTitle: ch.courseTitle || 'Academic Course',
          universityName: ch.universityName || 'National',
          programName: ch.programName || 'Common Program',
          category: ch.category || meta.categoryKey,
          bookGroupTitle: ch.bookGroupTitle || 'Default Set',
          chapterNumber: ch.orderIndex || 1,
          chapterTitle: ch.title,
          estimatedPages: Math.max(8, Math.round((ch.estimatedSizeBytes || 16000) / 1200)),
          hasQuiz: Boolean(ch.timeAllowedMinutes),
          status: ch.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
          updatedAt: '2026-11-08',
        }));
        setChapters(rows);
      }
    } catch (err) {
      console.error('Failed to load material chapters:', err);
    } finally {
      setLoading(false);
    }
  }, [meta.categoryKey, selectedUniversityId, selectedProgramId, selectedCourseId]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load full chapter content when viewing details
  useEffect(() => {
    if (!selectedViewChapter) {
      setViewChapterDetail(null);
      return;
    }
    let isMounted = true;
    setLoadingDetail(true);
    adminApiFetch<any>(`/content/chapters/${selectedViewChapter.id}`)
      .then((data) => {
        if (isMounted) setViewChapterDetail(data);
      })
      .catch((err) => {
        console.error('Failed to load chapter content:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingDetail(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedViewChapter]);

  const handleDeleteChapter = async (id: string) => {
    try {
      setIsDeleting(true);
      await adminApiFetch(`/content/chapters/${id}`, { method: 'DELETE' });
      setChapters((prev) => prev.filter((ch) => ch.id !== id));
      setDeleteConfirmChapter(null);
    } catch (err: any) {
      console.error('Failed to delete chapter:', err);
      alert(`Failed to delete chapter: ${err?.message || 'Server error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter program choices based on university
  const filteredPrograms = programs.filter(
    (p) => selectedUniversityId === 'ALL' || p.universityId === selectedUniversityId
  );

  // Filter course choices based on program
  const filteredCourses = courses.filter((c) => {
    if (selectedUniversityId !== 'ALL' && c.universityId && c.universityId !== selectedUniversityId) return false;
    if (selectedProgramId !== 'ALL' && c.programId && c.programId !== selectedProgramId) return false;
    return true;
  });

  const columns = [
    {
      key: 'chapter',
      header: 'Chapter & Title',
      render: (item: ChapterRow) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: RADIUS.md,
              backgroundColor: tokens.surfaceSubtle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: tokens.primary,
            }}
          >
            <IconComponent size={16} strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: tokens.textPrimary }}>
              Chapter {item.chapterNumber}: {item.chapterTitle}
            </div>
            <div style={{ fontSize: 12, color: tokens.textMuted }}>
              {item.courseCode} • {item.courseTitle}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'hierarchy',
      header: 'University & Department',
      render: (item: ChapterRow) => (
        <div style={{ fontSize: 12 }}>
          <div style={{ fontWeight: 500, color: tokens.textPrimary }}>{item.universityName}</div>
          <div style={{ color: tokens.textMuted }}>{item.programName}</div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type & Scope',
      render: (item: ChapterRow) => (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: RADIUS.sm,
            backgroundColor: tokens.surfaceSubtle,
            color: tokens.textPrimary,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {item.category.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'bookGroup',
      header: 'Material Set',
      render: (item: ChapterRow) => (
        <span style={{ fontSize: 13, fontWeight: 500, color: tokens.textPrimary }}>
          {item.bookGroupTitle || 'Default Set'}
        </span>
      ),
    },
    {
      key: 'pages',
      header: 'Est. Pages',
      render: (item: ChapterRow) => (
        <span style={{ fontSize: 12, color: tokens.textMuted }}>{item.estimatedPages} pages</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: ChapterRow) => (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: RADIUS.pill,
            backgroundColor: item.status === 'PUBLISHED' ? tokens.successBg : tokens.surfaceSubtle,
            color: item.status === 'PUBLISHED' ? tokens.success : tokens.textMuted,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: 70,
      align: 'center' as const,
      render: (item: ChapterRow) => (
        <RowActionMenu
          onView={() => setSelectedViewChapter(item)}
          editHref={`/content/materials/${currentMaterialType}/new?chapterId=${item.id}&courseId=${item.courseId}`}
          onDelete={() => setDeleteConfirmChapter(item)}
        />
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: tokens.textPrimary, margin: 0 }}>
            {meta.label}
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: tokens.textMuted }}>
            {meta.desc}
          </p>
        </div>

        <div style={{ display: 'flex', gap: SPACING.sm }}>
          <Link
            href="/scan-to-pdf"
            style={{
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              color: tokens.textPrimary,
              fontWeight: 600,
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: SPACING.xs,
              textDecoration: 'none',
            }}
          >
            <Scan size={16} strokeWidth={2} />
            Scan to PDF Wizard
          </Link>
          <Link
            href={`/content/materials/${currentMaterialType}/new`}
            style={{
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              borderRadius: RADIUS.md,
              border: 'none',
              backgroundColor: tokens.primary,
              color: tokens.surface,
              fontWeight: 600,
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: SPACING.xs,
              textDecoration: 'none',
            }}
          >
            <Plus size={16} strokeWidth={2} />
            Add New Material
          </Link>
        </div>
      </div>

      {/* Tabs Bar for Dynamic Routing */}
      <div
        style={{
          display: 'flex',
          gap: SPACING.sm,
          borderBottom: `1px solid ${tokens.border}`,
          paddingBottom: SPACING.xs,
        }}
      >
        {[
          { key: 'modules', label: 'Modules' },
          { key: 'notes', label: 'Notes' },
          { key: 'amharic-notes', label: 'Amharic Notes' },
        ].map((tab) => (
          <Link
            key={tab.key}
            href={`/content/materials/${tab.key}`}
            style={{
              padding: `${SPACING.xs}px ${SPACING.md}px`,
              borderRadius: RADIUS.md,
              fontWeight: 600,
              fontSize: 13,
              textDecoration: 'none',
              backgroundColor: currentMaterialType === tab.key ? tokens.surfaceSubtle : 'transparent',
              color: currentMaterialType === tab.key ? tokens.primary : tokens.textMuted,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Real Dropdown Filter Bar */}
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
        {/* University Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>University:</label>
          <select
            value={selectedUniversityId}
            onChange={(e) => {
              setSelectedUniversityId(e.target.value);
              setSelectedProgramId('ALL');
              setSelectedCourseId('ALL');
            }}
            style={{
              padding: `${SPACING.xs}px ${SPACING.sm}px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              fontSize: 13,
              backgroundColor: tokens.surface,
              color: tokens.textPrimary,
            }}
          >
            <option value="ALL">All Universities</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.shortName} - {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Program / Department Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>Department:</label>
          <select
            value={selectedProgramId}
            onChange={(e) => {
              setSelectedProgramId(e.target.value);
              setSelectedCourseId('ALL');
            }}
            style={{
              padding: `${SPACING.xs}px ${SPACING.sm}px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              fontSize: 13,
              backgroundColor: tokens.surface,
              color: tokens.textPrimary,
            }}
          >
            <option value="ALL">All Departments</option>
            {filteredPrograms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Course Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>Course:</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            style={{
              padding: `${SPACING.xs}px ${SPACING.sm}px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              fontSize: 13,
              backgroundColor: tokens.surface,
              color: tokens.textPrimary,
            }}
          >
            <option value="ALL">All Courses</option>
            {filteredCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Real Materials Table */}
      <PaginatedTable
        columns={columns}
        data={{
          items: chapters,
          total: chapters.length,
          page: currentPage,
          pageSize: 10,
          totalPages: Math.ceil(chapters.length / 10) || 1,
        }}
        rowKey={(c) => c.id}
        onPageChange={setCurrentPage}
      />

      {/* Chapter View Details Modal */}
      {selectedViewChapter && (
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
          onClick={() => setSelectedViewChapter(null)}
        >
          <div
            style={{
              backgroundColor: tokens.surface,
              borderRadius: RADIUS.lg,
              padding: SPACING.xl,
              maxWidth: 680,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.md,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: RADIUS.pill,
                    backgroundColor: tokens.surfaceSubtle,
                    color: tokens.primary,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {selectedViewChapter.category.replace('_', ' ')}
                </span>
                <h3 style={{ margin: '6px 0 0 0', fontSize: 18, fontWeight: 700, color: tokens.textPrimary }}>
                  Chapter {selectedViewChapter.chapterNumber}: {selectedViewChapter.chapterTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedViewChapter(null)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: 18,
                  cursor: 'pointer',
                  color: tokens.textMuted,
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: SPACING.sm,
                backgroundColor: tokens.surfaceSubtle,
                padding: SPACING.md,
                borderRadius: RADIUS.md,
                fontSize: 12,
              }}
            >
              <div>
                <span style={{ color: tokens.textMuted }}>Course: </span>
                <span style={{ fontWeight: 600, color: tokens.textPrimary }}>
                  {selectedViewChapter.courseCode} - {selectedViewChapter.courseTitle}
                </span>
              </div>
              <div>
                <span style={{ color: tokens.textMuted }}>Material Set: </span>
                <span style={{ fontWeight: 600, color: tokens.textPrimary }}>
                  {selectedViewChapter.bookGroupTitle || 'Default Set'}
                </span>
              </div>
              <div>
                <span style={{ color: tokens.textMuted }}>Institution: </span>
                <span style={{ fontWeight: 600, color: tokens.textPrimary }}>
                  {selectedViewChapter.universityName} • {selectedViewChapter.programName}
                </span>
              </div>
              <div>
                <span style={{ color: tokens.textMuted }}>Pages & Status: </span>
                <span style={{ fontWeight: 600, color: tokens.textPrimary }}>
                  {selectedViewChapter.estimatedPages} pages • {selectedViewChapter.status}
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary, marginBottom: 6 }}>
                Content Preview
              </div>
              <div
                style={{
                  padding: SPACING.md,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  maxHeight: 280,
                  overflowY: 'auto',
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: tokens.textPrimary,
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {loadingDetail
                  ? 'Loading content...'
                  : viewChapterDetail?.bodyMarkdownLatex ||
                    'No raw LaTeX or markdown content drafted for this chapter yet.'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.xs }}>
              <Link
                href={`/content/materials/${currentMaterialType}/new?chapterId=${selectedViewChapter.id}&courseId=${selectedViewChapter.courseId}`}
                style={{
                  padding: `${SPACING.sm}px ${SPACING.lg}px`,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  color: tokens.primary,
                  fontWeight: 600,
                  fontSize: 13,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Edit3 size={14} /> Edit Material
              </Link>
              <button
                type="button"
                onClick={() => setSelectedViewChapter(null)}
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chapter Delete Confirmation Modal */}
      {deleteConfirmChapter && (
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
          onClick={() => !isDeleting && setDeleteConfirmChapter(null)}
        >
          <div
            style={{
              backgroundColor: tokens.surface,
              borderRadius: RADIUS.lg,
              padding: SPACING.xl,
              maxWidth: 480,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.md,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: RADIUS.pill,
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                }}
              >
                <Trash2 size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: tokens.textPrimary }}>
                Delete Chapter?
              </h3>
            </div>

            <p style={{ margin: 0, fontSize: 13, color: tokens.textMuted, lineHeight: 1.5 }}>
              Are you sure you want to delete chapter{' '}
              <strong style={{ color: tokens.textPrimary }}>
                &quot;{deleteConfirmChapter.chapterTitle}&quot;
              </strong>
              ? This action will remove the chapter material, formulas, and any attached in-line quiz questions.
              This cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.sm }}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmChapter(null)}
                style={{
                  padding: `${SPACING.sm}px ${SPACING.lg}px`,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDeleteChapter(deleteConfirmChapter.id)}
                style={{
                  padding: `${SPACING.sm}px ${SPACING.lg}px`,
                  borderRadius: RADIUS.md,
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Chapter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
