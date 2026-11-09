'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Scan, ArrowRight, FileText, Globe } from 'lucide-react';
import { ADMIN_THEMES, RADIUS, SPACING } from '@mastera/ui-tokens';
import { CatalogCourseDto, CatalogUniversityDto, CatalogProgramDto } from '@mastera/contracts';
import { PaginatedTable } from '@/components/shared/PaginatedTable';
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
      render: (item: ChapterRow) => (
        <Link
          href={`/content/materials/${currentMaterialType}/new?chapterId=${item.id}&courseId=${item.courseId}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            borderRadius: RADIUS.sm,
            border: `1px solid ${tokens.border}`,
            backgroundColor: tokens.surface,
            color: tokens.primary,
            fontSize: 12,
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Edit Material <ArrowRight size={12} strokeWidth={2} />
        </Link>
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
    </div>
  );
}
