'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, RotateCcw, Eye } from 'lucide-react';
import {
  AcademicStream,
  CatalogCourseDto,
  PaginatedResponseDto,
} from '@mastera/contracts';
import {
  ADMIN_THEMES,
  RADIUS,
  SPACING,
  ThemeMode,
} from '@mastera/ui-tokens';
import { PaginatedTable, TableColumn } from '../shared/PaginatedTable';

export interface PaidStudentSummaryDto {
  studentId: string;
  studentCode: string; // MS0001+ (FR-G45, FR-G48)
  fullName: string;
  universityShortName: string;
  programName: string;
  semester: 1 | 2;
  stream: AcademicStream;
  identifier: string;
  coursesCount: number;
  deviceBound: boolean;
  deviceBoundDateLabel: string;
  deviceLastSeenLabel: string;
  enrolledCourses: Array<{
    courseId: string;
    courseTitle: string;
    stream: AcademicStream;
    accessStatus: 'Paid' | 'Pending';
    expiresDateLabel: string;
  }>;
}

export interface PaidStudentsDirectoryProps {
  studentsPage: PaginatedResponseDto<PaidStudentSummaryDto>;
  availableCourses: CatalogCourseDto[];
  onPageChange: (page: number) => void;
  onExportCsv: () => void;
  onRevokeDevice: (studentId: string, reason: string) => void;
  onGrantOrExtendAccess: (
    studentId: string,
    courseId: string,
    days: number,
    reason: string
  ) => void;
  onViewStudent?: (studentId: string) => void;
  themeMode?: ThemeMode;
}

export function PaidStudentsDirectory({
  studentsPage,
  availableCourses,
  onPageChange,
  onExportCsv,
  onRevokeDevice,
  onGrantOrExtendAccess,
  onViewStudent,
  themeMode = 'light',
}: PaidStudentsDirectoryProps): React.ReactElement {
  const router = useRouter();
  const tokens = ADMIN_THEMES[themeMode];

  const [selectedStudent, setSelectedStudent] =
    useState<PaidStudentSummaryDto | null>(null);
  const [grantCourseId, setGrantCourseId] = useState<string>(
    availableCourses[0]?.id ?? ''
  );
  const [grantDays, setGrantDays] = useState<number>(30);
  const [grantReason, setGrantReason] = useState<string>('');

  // Search & Filter state
  const [searchInput, setSearchInput] = useState<string>('');
  const [activeSearch, setActiveSearch] = useState<string>('');
  const [selectedUniversity, setSelectedUniversity] = useState<string>('ALL');
  const [selectedStream, setSelectedStream] = useState<string>('ALL');

  // Trigger search on button click or Enter key
  const handleApplySearch = () => {
    setActiveSearch(searchInput.trim());
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setActiveSearch('');
    setSelectedUniversity('ALL');
    setSelectedStream('ALL');
  };

  const hasActiveFilters =
    Boolean(activeSearch) ||
    Boolean(searchInput) ||
    selectedUniversity !== 'ALL' ||
    selectedStream !== 'ALL';

  // Dynamically resolve distinct universities from students list with standard defaults
  const universityOptions = useMemo(() => {
    const defaultUnivs = ['AASTU', 'AAU', 'ASTU', 'HU'];
    const fromItems = studentsPage.items.map((s) => s.universityShortName);
    const set = new Set([...defaultUnivs, ...fromItems]);
    return Array.from(set).filter(Boolean);
  }, [studentsPage.items]);

  // Client-side filtering across current items
  const filteredStudents = useMemo(() => {
    return studentsPage.items.filter((student) => {
      // 1. Search Query
      if (activeSearch) {
        const query = activeSearch.toLowerCase();
        const matchesCode = student.studentCode.toLowerCase().includes(query);
        const matchesName = student.fullName.toLowerCase().includes(query);
        const matchesPhone = student.identifier.toLowerCase().includes(query);
        const matchesUniv = student.universityShortName.toLowerCase().includes(query);
        if (!matchesCode && !matchesName && !matchesPhone && !matchesUniv) {
          return false;
        }
      }

      // 2. University Filter
      if (selectedUniversity !== 'ALL') {
        if (student.universityShortName.toUpperCase() !== selectedUniversity.toUpperCase()) {
          return false;
        }
      }

      // 3. Stream Filter
      if (selectedStream !== 'ALL') {
        if (student.stream !== selectedStream) {
          return false;
        }
      }

      return true;
    });
  }, [studentsPage.items, activeSearch, selectedUniversity, selectedStream]);

  const filteredPageData: PaginatedResponseDto<PaidStudentSummaryDto> = {
    ...studentsPage,
    total: filteredStudents.length,
    totalPages: Math.max(1, Math.ceil(filteredStudents.length / (studentsPage.pageSize || 10))),
    items: filteredStudents,
  };

  // Student Profile View (/students/[studentId] inline fallback)
  if (selectedStudent) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setSelectedStudent(null)}
          style={{
            background: 'none',
            border: 'none',
            color: tokens.primary,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: SPACING.sm,
            padding: 0,
          }}
        >
          ← Back to students
        </button>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.lg,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
            <h1 style={{ margin: 0, fontSize: 22 }}>
              {selectedStudent.fullName} · {selectedStudent.studentCode}
            </h1>
            <span
              style={{
                padding: `2px ${SPACING.sm}px`,
                borderRadius: RADIUS.pill,
                backgroundColor: tokens.surfaceSubtle,
                color: tokens.primary,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Active
            </span>
          </div>

          <div style={{ display: 'flex', gap: SPACING.sm }}>
            <button
              type="button"
              onClick={() =>
                onRevokeDevice(
                  selectedStudent.studentId,
                  'Admin revoked device binding from profile'
                )
              }
              style={{
                padding: `${SPACING.sm}px ${SPACING.lg}px`,
                borderRadius: RADIUS.md,
                border: 'none',
                backgroundColor: tokens.danger,
                color: tokens.sidebarText,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Revoke device
            </button>
          </div>
        </div>

        {/* Profile & Device Binding Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: SPACING.lg,
            marginBottom: SPACING.xl,
          }}
        >
          <div
            style={{
              backgroundColor: tokens.surface,
              border: `1px solid ${tokens.border}`,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              rowGap: SPACING.md,
              fontSize: 14,
            }}
          >
            <h3 style={{ gridColumn: '1 / -1', margin: 0 }}>Profile</h3>

            {/* FR-G48: MS ID shown first */}
            <span style={{ color: tokens.textMuted }}>ID</span>
            <span
              style={{
                textAlign: 'right',
                fontWeight: 700,
                color: tokens.primary,
              }}
            >
              {selectedStudent.studentCode}
            </span>

            <span style={{ color: tokens.textMuted }}>University</span>
            <span style={{ textAlign: 'right', fontWeight: 600 }}>
              {selectedStudent.universityShortName}
            </span>

            <span style={{ color: tokens.textMuted }}>Program</span>
            <span style={{ textAlign: 'right', fontWeight: 600 }}>
              {selectedStudent.programName}
            </span>

            <span style={{ color: tokens.textMuted }}>Semester · Stream</span>
            <span style={{ textAlign: 'right', fontWeight: 600 }}>
              {selectedStudent.semester} · {selectedStudent.stream}
            </span>

            <span style={{ color: tokens.textMuted }}>Phone or email</span>
            <span style={{ textAlign: 'right', fontWeight: 600 }}>
              {selectedStudent.identifier}
            </span>
          </div>

          <div
            style={{
              backgroundColor: tokens.surface,
              border: `1px solid ${tokens.border}`,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              rowGap: SPACING.md,
              fontSize: 14,
            }}
          >
            <h3 style={{ gridColumn: '1 / -1', margin: 0 }}>Device</h3>

            <span style={{ color: tokens.textMuted }}>Status</span>
            <span
              style={{
                textAlign: 'right',
                fontWeight: 600,
                color: tokens.primary,
              }}
            >
              {selectedStudent.deviceBound ? 'Bound' : 'Unbound'}
            </span>

            <span style={{ color: tokens.textMuted }}>Bound on</span>
            <span style={{ textAlign: 'right', fontWeight: 600 }}>
              {selectedStudent.deviceBoundDateLabel}
            </span>

            <span style={{ color: tokens.textMuted }}>Last seen</span>
            <span style={{ textAlign: 'right', fontWeight: 600 }}>
              {selectedStudent.deviceLastSeenLabel}
            </span>
          </div>
        </div>

        {/* Course (My Course List) */}
        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            marginBottom: SPACING.xl,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Course (My Course List)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: tokens.surfaceSubtle,
                  textAlign: 'left',
                  fontSize: 12,
                }}
              >
                <th style={{ padding: SPACING.sm }}>Course</th>
                <th style={{ padding: SPACING.sm }}>Stream</th>
                <th style={{ padding: SPACING.sm }}>Access</th>
                <th style={{ padding: SPACING.sm }}>Expires</th>
              </tr>
            </thead>
            <tbody>
              {selectedStudent.enrolledCourses.map((c) => (
                <tr
                  key={c.courseId}
                  style={{ borderBottom: `1px solid ${tokens.border}` }}
                >
                  <td style={{ padding: SPACING.sm, fontWeight: 500 }}>
                    {c.courseTitle}
                  </td>
                  <td style={{ padding: SPACING.sm }}>{c.stream}</td>
                  <td style={{ padding: SPACING.sm }}>
                    <span
                      style={{
                        padding: `2px ${SPACING.sm}px`,
                        borderRadius: RADIUS.pill,
                        backgroundColor: tokens.surfaceSubtle,
                        color: tokens.primary,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {c.accessStatus}
                    </span>
                  </td>
                  <td style={{ padding: SPACING.sm }}>{c.expiresDateLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Grant or extend access (Section 4.3: Reason required) */}
        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Grant or extend access</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 100px 2fr auto',
              gap: SPACING.md,
              alignItems: 'end',
            }}
          >
            <label style={{ fontSize: 12, fontWeight: 600 }}>
              Course
              <select
                value={grantCourseId}
                onChange={(e) => setGrantCourseId(e.target.value)}
                style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
              >
                {availableCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ fontSize: 12, fontWeight: 600 }}>
              Days
              <input
                type="number"
                min={1}
                value={grantDays}
                onChange={(e) => setGrantDays(Number(e.target.value))}
                style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
              />
            </label>

            <label style={{ fontSize: 12, fontWeight: 600 }}>
              Reason (required)
              <input
                type="text"
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                placeholder="Reason for manual access grant..."
                style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
              />
            </label>

            <button
              type="button"
              disabled={grantReason.trim().length < 3}
              onClick={() => {
                onGrantOrExtendAccess(
                  selectedStudent.studentId,
                  grantCourseId,
                  grantDays,
                  grantReason.trim()
                );
                setGrantReason('');
              }}
              style={{
                padding: `${SPACING.sm}px ${SPACING.lg}px`,
                borderRadius: RADIUS.md,
                border: 'none',
                backgroundColor: tokens.primary,
                color: tokens.sidebarText,
                fontWeight: 600,
                opacity: grantReason.trim().length < 3 ? 0.5 : 1,
                cursor:
                  grantReason.trim().length < 3 ? 'not-allowed' : 'pointer',
              }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Paid-Only Directory Table (/students)
  const columns: TableColumn<PaidStudentSummaryDto>[] = [
    {
      key: 'studentCode',
      header: 'ID', // FR-G48: MS ID shown first
      render: (s) => (
        <span style={{ fontWeight: 700, color: tokens.primary }}>
          {s.studentCode}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (s) => <span style={{ fontWeight: 600, color: tokens.textPrimary }}>{s.fullName}</span>,
    },
    {
      key: 'university',
      header: 'University',
      render: (s) => (
        <span
          style={{
            padding: `2px ${SPACING.sm}px`,
            borderRadius: RADIUS.sm,
            backgroundColor: tokens.surfaceSubtle,
            fontWeight: 600,
            fontSize: 12,
            color: tokens.primary,
          }}
        >
          {s.universityShortName}
        </span>
      ),
    },
    {
      key: 'stream',
      header: 'Stream',
      render: (s) => (
        <span style={{ fontSize: 12, fontWeight: 500 }}>
          {s.stream}
        </span>
      ),
    },
    {
      key: 'courses',
      header: 'Courses',
      render: (s) => s.coursesCount,
    },
    {
      key: 'device',
      header: 'Device',
      render: (s) => (
        <span
          style={{
            padding: `2px ${SPACING.sm}px`,
            borderRadius: RADIUS.pill,
            backgroundColor: s.deviceBound ? tokens.successBg : tokens.surfaceSubtle,
            color: s.deviceBound ? tokens.success : tokens.textMuted,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {s.deviceBound ? 'Bound' : 'Released'}
        </span>
      ),
    },
    {
      key: 'access',
      header: 'Access',
      render: () => (
        <span
          style={{
            padding: `2px ${SPACING.sm}px`,
            borderRadius: RADIUS.pill,
            backgroundColor: tokens.surfaceSubtle,
            color: tokens.primary,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Paid
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (s) => (
        <button
          type="button"
          onClick={() => {
            if (onViewStudent) {
              onViewStudent(s.studentId);
            } else {
              router.push(`/students/${s.studentId}`);
            }
          }}
          style={{
            padding: `${SPACING.xs}px ${SPACING.md}px`,
            borderRadius: RADIUS.md,
            border: `1px solid ${tokens.primary}`,
            backgroundColor: tokens.surface,
            color: tokens.primary,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
          }}
        >
          <Eye size={13} strokeWidth={2} />
          View
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: tokens.textPrimary }}>
            Students Directory
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: tokens.textMuted }}>
            Manage paid active students, device hardware bindings, and course entitlements.
          </p>
        </div>

        <button
          type="button"
          onClick={onExportCsv}
          style={{
            padding: `${SPACING.sm}px ${SPACING.lg}px`,
            borderRadius: RADIUS.md,
            border: `1px solid ${tokens.primary}`,
            backgroundColor: tokens.surface,
            color: tokens.primary,
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Export to CSV
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: SPACING.md,
          backgroundColor: tokens.surface,
          padding: SPACING.md,
          borderRadius: RADIUS.lg,
          border: `1px solid ${tokens.border}`,
          alignItems: 'center',
        }}
      >
        {/* Search input with icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.xs,
            flex: '1 1 280px',
            backgroundColor: tokens.surfaceSubtle,
            padding: `${SPACING.xs}px ${SPACING.sm}px`,
            borderRadius: RADIUS.md,
            border: `1px solid ${tokens.border}`,
          }}
        >
          <Search size={16} strokeWidth={2} color={tokens.textMuted} />
          <input
            type="text"
            placeholder="Search by student code (e.g. MS0001), name, or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleApplySearch();
              }
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

        {/* Explicit Search Button */}
        <button
          type="button"
          onClick={handleApplySearch}
          style={{
            padding: `${SPACING.xs}px ${SPACING.lg}px`,
            borderRadius: RADIUS.md,
            border: 'none',
            backgroundColor: tokens.primary,
            color: tokens.sidebarText,
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: SPACING.xs,
            height: 36,
          }}
        >
          <Search size={14} strokeWidth={2} />
          Search
        </button>

        {/* Filter by University */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
          <Filter size={14} strokeWidth={2} color={tokens.textMuted} />
          <select
            value={selectedUniversity}
            onChange={(e) => setSelectedUniversity(e.target.value)}
            aria-label="Filter by University"
            style={{
              padding: `${SPACING.xs}px ${SPACING.sm}px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              fontSize: 13,
              backgroundColor: tokens.surface,
              color: tokens.textPrimary,
              height: 36,
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Universities</option>
            {universityOptions.map((univ) => (
              <option key={univ} value={univ}>
                {univ}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Stream */}
        <select
          value={selectedStream}
          onChange={(e) => setSelectedStream(e.target.value)}
          aria-label="Filter by Stream"
          style={{
            padding: `${SPACING.xs}px ${SPACING.sm}px`,
            borderRadius: RADIUS.md,
            border: `1px solid ${tokens.border}`,
            fontSize: 13,
            backgroundColor: tokens.surface,
            color: tokens.textPrimary,
            height: 36,
            cursor: 'pointer',
          }}
        >
          <option value="ALL">All Streams</option>
          <option value="NATURAL">Natural Science</option>
          <option value="SOCIAL">Social Science</option>
          <option value="COMMON">Common Course</option>
        </select>

        {/* Reset / Clear Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              padding: `${SPACING.xs}px ${SPACING.sm}px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surfaceSubtle,
              color: tokens.textMuted,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              height: 36,
            }}
          >
            <RotateCcw size={12} strokeWidth={2} />
            Reset
          </button>
        )}

        <div style={{ marginLeft: 'auto', fontSize: 12, color: tokens.textMuted }}>
          Showing {filteredStudents.length} of {studentsPage.items.length} students
        </div>
      </div>

      <PaginatedTable
        columns={columns}
        data={filteredPageData}
        rowKey={(s) => s.studentId}
        onPageChange={onPageChange}
        themeMode={themeMode}
      />
    </div>
  );
}
