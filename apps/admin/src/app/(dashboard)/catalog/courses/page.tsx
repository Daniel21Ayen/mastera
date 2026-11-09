'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, BookOpen, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { ADMIN_THEMES, RADIUS, SPACING } from '@mastera/ui-tokens';
import { CatalogCourseDto, CatalogProgramDto, CatalogUniversityDto, AcademicStream } from '@mastera/contracts';
import { AddCourseModal, AddCourseModalSubmitPayload } from '@/components/catalog/CatalogModals';
import { PaginatedTable } from '@/components/shared/PaginatedTable';
import { StudentSimulatorModal } from '@/components/shared/StudentSimulatorModal';
import { adminApiFetch } from '@/lib/api-client';

export default function CoursesCatalogPage(): React.ReactElement {
  const tokens = ADMIN_THEMES.light;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [simulatorCourse, setSimulatorCourse] = useState<CatalogCourseDto | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStream, setSelectedStream] = useState<string>('ALL');
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [universities, setUniversities] = useState<CatalogUniversityDto[]>([]);
  const [programs, setPrograms] = useState<CatalogProgramDto[]>([]);
  const [courses, setCourses] = useState<CatalogCourseDto[]>([]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [univRes, progRes, coursesRes] = await Promise.all([
        adminApiFetch<{ items: CatalogUniversityDto[] }>('/catalog/universities'),
        adminApiFetch<{ items: CatalogProgramDto[] }>('/catalog/programs'),
        adminApiFetch<{ items: CatalogCourseDto[] }>('/catalog/courses'),
      ]);
      setUniversities(univRes?.items || []);
      setPrograms(progRes?.items || []);
      setCourses(coursesRes?.items || []);
    } catch (err) {
      console.error('Failed to load courses catalog data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddCourse = async (payload: AddCourseModalSubmitPayload) => {
    try {
      await adminApiFetch<CatalogCourseDto>('/catalog/courses', {
        method: 'POST',
        body: { data: payload },
      });
      await loadData();
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error('Failed to create course:', err);
      alert(`Failed to create course: ${err?.message || 'Server error'}`);
    }
  };

  const handleToggleActive = async (courseId: string) => {
    const target = courses.find((c) => c.id === courseId);
    if (!target) return;
    try {
      await adminApiFetch(`/catalog/courses/${courseId}`, {
        method: 'PUT',
        body: { isActive: !target.isActive },
      });
      await loadData();
    } catch (err) {
      console.error('Failed to toggle course active status:', err);
      setCourses((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, isActive: !c.isActive } : c))
      );
    }
  };

  const filteredCourses = courses.filter((c) => {
    const matchSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStream = selectedStream === 'ALL' || c.stream === selectedStream;
    const matchSemester =
      selectedSemester === 'ALL' || c.semester.toString() === selectedSemester;
    return matchSearch && matchStream && matchSemester;
  });

  const columns = [
    {
      key: 'code',
      header: 'Code & Title',
      render: (course: CatalogCourseDto) => (
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
            <BookOpen size={16} strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: tokens.textPrimary }}>
              {course.code}
            </div>
            <div style={{ fontSize: 12, color: tokens.textMuted }}>{course.title}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'stream',
      header: 'Stream & Semester',
      render: (course: CatalogCourseDto) => (
        <div style={{ fontSize: 12 }}>
          <span
            style={{
              padding: '2px 6px',
              borderRadius: RADIUS.sm,
              backgroundColor: tokens.surfaceSubtle,
              color: tokens.textPrimary,
              fontWeight: 500,
            }}
          >
            {course.stream}
          </span>
          <span style={{ marginLeft: 6, color: tokens.textMuted }}>Sem {course.semester}</span>
        </div>
      ),
    },
    {
      key: 'pricing',
      header: 'Access & Price',
      render: (course: CatalogCourseDto) => (
        <div style={{ fontSize: 12 }}>
          {course.freeAccess ? (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: RADIUS.pill,
                backgroundColor: tokens.successBg,
                color: tokens.success,
                fontWeight: 600,
              }}
            >
              Free Access
            </span>
          ) : (
            <span style={{ fontWeight: 600, color: tokens.primary }}>
              {course.priceETB} ETB
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (course: CatalogCourseDto) => (
        <button
          type="button"
          onClick={() => handleToggleActive(course.id)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: RADIUS.pill,
            border: 'none',
            backgroundColor: course.isActive ? tokens.successBg : tokens.dangerBg,
            color: course.isActive ? tokens.success : tokens.danger,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {course.isActive ? (
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
      render: (course: CatalogCourseDto) => (
        <div style={{ display: 'flex', gap: SPACING.xs }}>
          <button
            type="button"
            onClick={() => setSimulatorCourse(course)}
            title="Student Simulator Preview"
            style={{
              padding: '4px 8px',
              borderRadius: RADIUS.sm,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              color: tokens.textPrimary,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
            }}
          >
            <Eye size={14} strokeWidth={2} /> Simulate
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: tokens.textPrimary, margin: 0 }}>
            Courses Management
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: tokens.textMuted }}>
            Create and maintain academic courses, syllabus metadata, and trial limits.
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
          Add Course
        </button>
      </div>

      {/* Filter and Search Bar */}
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
            border: `1px solid ${tokens.border}`,
          }}
        >
          <Search size={16} strokeWidth={2} color={tokens.textMuted} />
          <input
            type="text"
            placeholder="Search courses by code or title..."
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

        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
          <Filter size={16} strokeWidth={2} color={tokens.textMuted} />
          <select
            value={selectedStream}
            onChange={(e) => setSelectedStream(e.target.value)}
            style={{
              padding: `${SPACING.xs}px ${SPACING.sm}px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              fontSize: 13,
              backgroundColor: tokens.surface,
              color: tokens.textPrimary,
            }}
          >
            <option value="ALL">All Streams</option>
            <option value="COMMON">Common Course</option>
            <option value="NATURAL">Natural Science</option>
            <option value="SOCIAL">Social Science</option>
          </select>
        </div>

        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          style={{
            padding: `${SPACING.xs}px ${SPACING.sm}px`,
            borderRadius: RADIUS.md,
            border: `1px solid ${tokens.border}`,
            fontSize: 13,
            backgroundColor: tokens.surface,
            color: tokens.textPrimary,
          }}
        >
          <option value="ALL">All Semesters</option>
          <option value="1">Semester 1</option>
          <option value="2">Semester 2</option>
        </select>
      </div>

      {/* Courses Table */}
      <PaginatedTable
        columns={columns}
        data={{
          items: filteredCourses,
          total: filteredCourses.length,
          page: currentPage,
          pageSize: 10,
          totalPages: Math.ceil(filteredCourses.length / 10) || 1,
        }}
        rowKey={(c) => c.id}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Add Course Modal */}
      <AddCourseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddCourse}
        universities={universities}
        programs={programs}
        canEditCommercialFlags={true}
      />

      {/* Student Simulator Modal */}
      {simulatorCourse && (
        <StudentSimulatorModal
          isOpen={true}
          onClose={() => setSimulatorCourse(null)}
          title={`${simulatorCourse.code} - ${simulatorCourse.title}`}
        />
      )}
    </div>
  );
}
