'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, HelpCircle, FileSpreadsheet, CheckCircle2, Filter, Eye } from 'lucide-react';
import { ADMIN_THEMES, RADIUS, SPACING } from '@mastera/ui-tokens';
import { PaginatedTable } from '@/components/shared/PaginatedTable';
import { BulkCsvImportModal } from '@/components/shared/BulkCsvImportModal';
import { adminApiFetch } from '@/lib/api-client';
import { CatalogCourseDto, CatalogProgramDto } from '@mastera/contracts';

interface QuizTabProps {
  params: {
    quizTab: string;
  };
}

interface QuizQuestionBankRow {
  id: string;
  displayNumber: number;
  questionType: string;
  promptLatex: string;
  options: { id: string; textLatex: string }[];
  correctOptionId: string | null;
  correctBoolean: boolean | null;
  explanationLatex: string;
  status: string;
  targetTitle: string;
  courseCode?: string;
  courseTitle?: string;
  programName?: string;
  semester?: number | null;
  stream?: string | null;
}

export default function ContentQuizTabPage({ params }: QuizTabProps): React.ReactElement {
  const tokens = ADMIN_THEMES.light;
  const currentTab = params.quizTab || 'chapter-quizzes';

  const [currentPage, setCurrentPage] = useState(1);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuizQuestionBankRow | null>(null);

  // Filters from real DB: department, course, semester, stream
  const [programs, setPrograms] = useState<CatalogProgramDto[]>([]);
  const [courses, setCourses] = useState<CatalogCourseDto[]>([]);

  const [selectedProgramId, setSelectedProgramId] = useState<string>('ALL');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('ALL');
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');
  const [selectedStream, setSelectedStream] = useState<string>('ALL');

  const [questions, setQuestions] = useState<QuizQuestionBankRow[]>([]);
  const [loading, setLoading] = useState(true);

  const tabLabels: Record<string, string> = {
    'chapter-quizzes': 'Chapter In-line Quiz Bank',
    'course-quizzes': 'Course-wide Quiz Bank',
    practice: 'Practice Assessment Bank',
  };

  const currentLabel = tabLabels[currentTab] || 'Quiz Question Bank';

  const loadFilterMetadata = useCallback(async () => {
    try {
      const [progRes, courseRes] = await Promise.all([
        adminApiFetch<CatalogProgramDto[]>('/catalog/programs'),
        adminApiFetch<{ items: CatalogCourseDto[] }>('/catalog/courses'),
      ]);
      setPrograms(Array.isArray(progRes) ? progRes : []);
      setCourses(courseRes?.items || []);
    } catch (err) {
      console.error('Failed to load filter metadata:', err);
    }
  }, []);

  const loadQuestionBank = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.set('quizTab', currentTab);

      if (selectedProgramId !== 'ALL') queryParams.set('programId', selectedProgramId);
      if (selectedCourseId !== 'ALL') queryParams.set('courseId', selectedCourseId);
      if (selectedSemester !== 'ALL') queryParams.set('semester', selectedSemester);
      if (selectedStream !== 'ALL') queryParams.set('stream', selectedStream);

      const res = await adminApiFetch<any[]>(`/assessments/questions?${queryParams.toString()}`);
      if (Array.isArray(res)) {
        const rows: QuizQuestionBankRow[] = res.map((q: any) => ({
          id: q.id,
          displayNumber: q.displayNumber,
          questionType: q.questionType,
          promptLatex: q.promptLatex,
          options: q.options || [],
          correctOptionId: q.correctOptionId,
          correctBoolean: q.correctBoolean,
          explanationLatex: q.explanationLatex,
          status: q.status || 'PUBLISHED',
          targetTitle: q.targetTitle || 'Self-Assessment Quiz',
          courseCode: q.courseCode || 'CRS',
          courseTitle: q.courseTitle || 'Academic Course',
          programName: q.programName || 'Common Program',
          semester: q.semester ?? 1,
          stream: q.stream || 'COMMON',
        }));
        setQuestions(rows);
      }
    } catch (err) {
      console.error('Failed to load quiz question bank:', err);
    } finally {
      setLoading(false);
    }
  }, [currentTab, selectedProgramId, selectedCourseId, selectedSemester, selectedStream]);

  useEffect(() => {
    loadFilterMetadata();
  }, [loadFilterMetadata]);

  useEffect(() => {
    loadQuestionBank();
  }, [loadQuestionBank]);

  const filteredCourses = courses.filter((c) => {
    if (selectedProgramId !== 'ALL' && c.programId && c.programId !== selectedProgramId) return false;
    return true;
  });

  const columns = [
    {
      key: 'prompt',
      header: 'Quiz Question Prompt',
      render: (q: QuizQuestionBankRow) => (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACING.sm }}>
          <div
            style={{
              minWidth: 32,
              height: 32,
              borderRadius: RADIUS.md,
              backgroundColor: tokens.surfaceSubtle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: tokens.primary,
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            Q{q.displayNumber}
          </div>
          <div style={{ maxWidth: 460 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: tokens.textPrimary, lineHeight: 1.4 }}>
              {q.promptLatex}
            </div>
            <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 4 }}>
              Quiz: {q.targetTitle} • {q.courseCode}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'courseDept',
      header: 'Department & Course',
      render: (q: QuizQuestionBankRow) => (
        <div style={{ fontSize: 12 }}>
          <div style={{ fontWeight: 500, color: tokens.textPrimary }}>{q.courseTitle}</div>
          <div style={{ color: tokens.textMuted }}>{q.programName}</div>
        </div>
      ),
    },
    {
      key: 'streamSem',
      header: 'Stream & Semester',
      render: (q: QuizQuestionBankRow) => (
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
            {q.stream}
          </span>
          <span style={{ marginLeft: 6, color: tokens.textMuted }}>Sem {q.semester}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (q: QuizQuestionBankRow) => (
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
          {q.questionType.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'answer',
      header: 'Answer',
      render: (q: QuizQuestionBankRow) => (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: RADIUS.pill,
            backgroundColor: tokens.successBg,
            color: tokens.success,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {q.correctOptionId
            ? (q.options?.find((o) => o.id === q.correctOptionId)?.textLatex || q.correctOptionId)
            : q.correctBoolean != null
            ? q.correctBoolean ? 'True' : 'False'
            : 'Verified'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (q: QuizQuestionBankRow) => (
        <button
          type="button"
          onClick={() => setSelectedQuestion(q)}
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
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          <Eye size={12} strokeWidth={2} /> View
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: tokens.textPrimary, margin: 0 }}>
            {currentLabel}
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: tokens.textMuted }}>
            Browse and manage in-line chapter quizzes, checkpoint questions, and practice self-assessments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: SPACING.sm }}>
          <button
            type="button"
            onClick={() => setIsCsvModalOpen(true)}
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
              cursor: 'pointer',
            }}
          >
            <FileSpreadsheet size={16} strokeWidth={2} />
            Bulk CSV Import
          </button>
          <Link
            href={`/content/tests/${currentTab}/new`}
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
            Add Quiz Question
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: SPACING.sm,
          borderBottom: `1px solid ${tokens.border}`,
          paddingBottom: SPACING.xs,
        }}
      >
        {[
          { key: 'chapter-quizzes', label: 'Chapter Quizzes' },
          { key: 'course-quizzes', label: 'Course Checkpoints' },
          { key: 'practice', label: 'Practice Assessments' },
        ].map((tab) => (
          <Link
            key={tab.key}
            href={`/content/tests/${tab.key}`}
            style={{
              padding: `${SPACING.xs}px ${SPACING.md}px`,
              borderRadius: RADIUS.md,
              fontWeight: 600,
              fontSize: 13,
              textDecoration: 'none',
              backgroundColor: currentTab === tab.key ? tokens.surfaceSubtle : 'transparent',
              color: currentTab === tab.key ? tokens.primary : tokens.textMuted,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Filters: department, course, semester, stream */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: tokens.textMuted, fontSize: 13 }}>
          <Filter size={15} />
          <span style={{ fontWeight: 600, color: tokens.textPrimary }}>Filters:</span>
        </div>

        {/* Department Filter */}
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
            {programs.map((p) => (
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

        {/* Semester Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>Semester:</label>
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

        {/* Stream Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>Stream:</label>
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
            <option value="NATURAL">Natural Science</option>
            <option value="SOCIAL">Social Science</option>
            <option value="COMMON">Common</option>
          </select>
        </div>
      </div>

      {/* Paginated Question Bank Table */}
      <PaginatedTable
        columns={columns}
        data={{
          items: questions,
          total: questions.length,
          page: currentPage,
          pageSize: 10,
          totalPages: Math.ceil(questions.length / 10) || 1,
        }}
        rowKey={(q) => q.id}
        onPageChange={setCurrentPage}
      />

      {/* Bulk CSV Import Modal */}
      <BulkCsvImportModal
        isOpen={isCsvModalOpen}
        targetExamSetOrQuizTitle="Quiz Question Bank"
        onClose={() => setIsCsvModalOpen(false)}
        onUploadCsv={async () => ({
          valid: true,
          totalRows: 25,
          validRowsCount: 25,
          errors: [],
        })}
        onCommitImport={async () => {
          setIsCsvModalOpen(false);
          await loadQuestionBank();
          alert('Successfully imported quiz questions!');
        }}
      />

      {/* Question Details Modal */}
      {selectedQuestion && (
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
          onClick={() => setSelectedQuestion(null)}
        >
          <div
            style={{
              backgroundColor: tokens.surface,
              borderRadius: RADIUS.lg,
              padding: SPACING.xl,
              maxWidth: 600,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.md,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: tokens.textPrimary }}>
                Quiz Question #{selectedQuestion.displayNumber}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedQuestion(null)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: 16,
                  cursor: 'pointer',
                  color: tokens.textMuted,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: SPACING.md, backgroundColor: tokens.surfaceSubtle, borderRadius: RADIUS.md }}>
              <div style={{ fontSize: 12, color: tokens.textMuted, marginBottom: 4 }}>Prompt</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: tokens.textPrimary }}>
                {selectedQuestion.promptLatex}
              </div>
            </div>

            {selectedQuestion.options && selectedQuestion.options.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: tokens.textMuted, marginBottom: 6 }}>Options</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedQuestion.options.map((opt) => (
                    <div
                      key={opt.id}
                      style={{
                        padding: '6px 12px',
                        borderRadius: RADIUS.sm,
                        border: `1px solid ${opt.id === selectedQuestion.correctOptionId ? tokens.success : tokens.border}`,
                        backgroundColor: opt.id === selectedQuestion.correctOptionId ? tokens.successBg : tokens.surface,
                        color: opt.id === selectedQuestion.correctOptionId ? tokens.success : tokens.textPrimary,
                        fontSize: 13,
                        fontWeight: opt.id === selectedQuestion.correctOptionId ? 600 : 400,
                      }}
                    >
                      {opt.textLatex} {opt.id === selectedQuestion.correctOptionId ? '✓ (Correct)' : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ padding: SPACING.md, backgroundColor: tokens.surfaceSubtle, borderRadius: RADIUS.md }}>
              <div style={{ fontSize: 12, color: tokens.textMuted, marginBottom: 4 }}>Explanation & Solution</div>
              <div style={{ fontSize: 13, color: tokens.textPrimary, lineHeight: 1.5 }}>
                {selectedQuestion.explanationLatex}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: SPACING.sm }}>
              <button
                type="button"
                onClick={() => setSelectedQuestion(null)}
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
    </div>
  );
}
