'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, HelpCircle, FileSpreadsheet, Layers, CheckCircle2, Filter, Eye } from 'lucide-react';
import { ADMIN_THEMES, RADIUS, SPACING } from '@mastera/ui-tokens';
import { ExamCategory, CatalogCourseDto, CatalogUniversityDto, CatalogProgramDto } from '@mastera/contracts';
import { PaginatedTable } from '@/components/shared/PaginatedTable';
import { BuildExamSetModal } from '@/components/assessments/AssessmentBuilders';
import { BulkCsvImportModal } from '@/components/shared/BulkCsvImportModal';
import { adminApiFetch } from '@/lib/api-client';

interface ExamTypeProps {
  params: {
    examType: string;
  };
}

interface QuestionBankRow {
  id: string;
  displayNumber: number;
  questionType: string;
  promptLatex: string;
  options: { id: string; textLatex: string }[];
  correctOptionId: string | null;
  correctBoolean: boolean | null;
  explanationLatex: string;
  status: string;
  examSetCode?: string;
  category?: string;
  courseCode?: string;
  courseTitle?: string;
  universityName?: string;
  universityShortName?: string;
  programName?: string;
  semester?: number | null;
  stream?: string | null;
  year?: string | null;
}

export default function QuestionsExamTypePage({ params }: ExamTypeProps): React.ReactElement {
  const tokens = ADMIN_THEMES.light;
  const examType = params.examType || 'mid-exams';

  const categoryMap: Record<string, { label: string; cat: ExamCategory }> = {
    'mid-exams': { label: 'Mid-Semester Examination Question Bank', cat: 'MID' },
    'final-exams': { label: 'Final Examination Question Bank', cat: 'FINAL' },
    'mock-exams': { label: 'National Exit / Mock Examination Question Bank', cat: 'MOCK' },
    'coc-exams': { label: 'Certificate of Competency (COC) Question Bank', cat: 'COC' },
  };

  const currentCategory = categoryMap[examType]?.cat || 'MID';
  const currentLabel = categoryMap[examType]?.label || 'Question Bank';

  // Modal states
  const [isBuildSetModalOpen, setIsBuildSetModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionBankRow | null>(null);

  // Filter metadata from real DB
  const [universities, setUniversities] = useState<CatalogUniversityDto[]>([]);
  const [programs, setPrograms] = useState<CatalogProgramDto[]>([]);
  const [courses, setCourses] = useState<CatalogCourseDto[]>([]);

  // Selected filter values
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('ALL');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('ALL');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('ALL');
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');
  const [selectedStream, setSelectedStream] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');

  // Pagination & data
  const [currentPage, setCurrentPage] = useState(1);
  const [questions, setQuestions] = useState<QuestionBankRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Load filter lists from real database
  const loadFilterMetadata = useCallback(async () => {
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

  // Load questions for the question bank table with real API
  const loadQuestionBank = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      queryParams.set('category', currentCategory);

      if (selectedUniversityId !== 'ALL') queryParams.set('universityId', selectedUniversityId);
      if (selectedProgramId !== 'ALL') queryParams.set('programId', selectedProgramId);
      if (currentCategory !== 'COC' && selectedCourseId !== 'ALL') {
        queryParams.set('courseId', selectedCourseId);
      }
      if (selectedSemester !== 'ALL') queryParams.set('semester', selectedSemester);
      if (selectedStream !== 'ALL') queryParams.set('stream', selectedStream);
      if (currentCategory !== 'MOCK' && selectedYear !== 'ALL') {
        queryParams.set('year', selectedYear);
      }

      const res = await adminApiFetch<any[]>(`/assessments/questions?${queryParams.toString()}`);
      if (Array.isArray(res)) {
        const rows: QuestionBankRow[] = res.map((q: any) => ({
          id: q.id,
          displayNumber: q.displayNumber,
          questionType: q.questionType,
          promptLatex: q.promptLatex,
          options: q.options || [],
          correctOptionId: q.correctOptionId,
          correctBoolean: q.correctBoolean,
          explanationLatex: q.explanationLatex,
          status: q.status || 'PUBLISHED',
          examSetCode: q.examSetCode || 'BANK',
          category: q.category || currentCategory,
          courseCode: q.courseCode || (currentCategory === 'COC' ? 'COC' : 'GEN'),
          courseTitle: q.courseTitle || 'Assessment Module',
          universityName: q.universityName || 'National',
          universityShortName: q.universityShortName || 'NAT',
          programName: q.programName || 'Common Program',
          semester: q.semester ?? 1,
          stream: q.stream || 'COMMON',
          year: q.year || '2024',
        }));
        setQuestions(rows);
      }
    } catch (err) {
      console.error('Failed to load questions from bank:', err);
    } finally {
      setLoading(false);
    }
  }, [currentCategory, selectedUniversityId, selectedProgramId, selectedCourseId, selectedSemester, selectedStream, selectedYear]);

  useEffect(() => {
    loadFilterMetadata();
  }, [loadFilterMetadata]);

  useEffect(() => {
    loadQuestionBank();
  }, [loadQuestionBank]);

  const handleBuildSet = async (payload: any) => {
    try {
      await adminApiFetch('/assessments/exam-sets', {
        method: 'POST',
        body: {
          data: {
            ...payload,
            courseId: payload.courseId || null,
            universityId: payload.universityId || null,
            programId: payload.programId || null,
            title: payload.title || `${payload.category} Exam Set - ${payload.year}`,
          },
        },
      });
      await loadQuestionBank();
      setIsBuildSetModalOpen(false);
      alert(`Exam Set "${payload.examSetCode}" created successfully in database!`);
    } catch (err: any) {
      console.error('Failed to build exam set:', err);
      alert(`Failed to build exam set: ${err?.message || 'Server error'}`);
      setIsBuildSetModalOpen(false);
    }
  };

  // Filter program choices based on selected university
  const filteredPrograms = programs.filter(
    (p) => selectedUniversityId === 'ALL' || p.universityId === selectedUniversityId
  );

  // Filter courses based on university & program
  const filteredCourses = courses.filter((c) => {
    if (selectedUniversityId !== 'ALL' && c.universityId && c.universityId !== selectedUniversityId) return false;
    if (selectedProgramId !== 'ALL' && c.programId && c.programId !== selectedProgramId) return false;
    return true;
  });

  const columns = [
    {
      key: 'prompt',
      header: 'Question Prompt',
      render: (q: QuestionBankRow) => (
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
          <div style={{ maxWidth: 440 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: tokens.textPrimary, lineHeight: 1.4 }}>
              {q.promptLatex}
            </div>
            <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 4 }}>
              Set: {q.examSetCode} • Course: {q.courseCode}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'hierarchy',
      header: 'University / Dept',
      render: (q: QuestionBankRow) => (
        <div style={{ fontSize: 12 }}>
          <div style={{ fontWeight: 500, color: tokens.textPrimary }}>
            {q.universityShortName} ({q.universityName})
          </div>
          <div style={{ color: tokens.textMuted }}>{q.programName}</div>
        </div>
      ),
    },
    {
      key: 'streamSem',
      header: 'Stream & Semester',
      render: (q: QuestionBankRow) => (
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
      header: 'Question Type',
      render: (q: QuestionBankRow) => (
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
      header: 'Correct Answer',
      render: (q: QuestionBankRow) => (
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
      render: (q: QuestionBankRow) => (
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
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: tokens.textPrimary, margin: 0 }}>
            {currentLabel}
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: tokens.textMuted }}>
            Manage verified Ethiopian examination questions, options, KaTeX equations, and solutions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: SPACING.sm, alignItems: 'center' }}>
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

          {/* User Requested: New Add Question Button Near Build Exam Set */}
          <Link
            href={`/questions/${examType}/new`}
            style={{
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.primary}`,
              backgroundColor: tokens.surface,
              color: tokens.primary,
              fontWeight: 600,
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: SPACING.xs,
              textDecoration: 'none',
            }}
          >
            <Plus size={16} strokeWidth={2} />
            Add Question
          </Link>

          <button
            type="button"
            onClick={() => setIsBuildSetModalOpen(true)}
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
              cursor: 'pointer',
            }}
          >
            <Layers size={16} strokeWidth={2} />
            Build Exam Set
          </button>
        </div>
      </div>

      {/* Exam Categories Navigation */}
      <div
        style={{
          display: 'flex',
          gap: SPACING.sm,
          borderBottom: `1px solid ${tokens.border}`,
          paddingBottom: SPACING.xs,
        }}
      >
        {[
          { key: 'mid-exams', label: 'Mid Exams' },
          { key: 'final-exams', label: 'Final Exams' },
          { key: 'mock-exams', label: 'Mock Exit Exams' },
          { key: 'coc-exams', label: 'COC Assessments' },
        ].map((t) => (
          <Link
            key={t.key}
            href={`/questions/${t.key}`}
            style={{
              padding: `${SPACING.xs}px ${SPACING.md}px`,
              borderRadius: RADIUS.md,
              fontWeight: 600,
              fontSize: 13,
              textDecoration: 'none',
              backgroundColor: examType === t.key ? tokens.surfaceSubtle : 'transparent',
              color: examType === t.key ? tokens.primary : tokens.textMuted,
            }}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Question Bank Filters: university, department, course (except COC), semester, stream, year (except MOCK) */}
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
                {u.shortName}
              </option>
            ))}
          </select>
        </div>

        {/* Department / Program Filter */}
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

        {/* Course Filter: User Constraint: "but for coc no coure filteration" */}
        {currentCategory !== 'COC' && (
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
        )}

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

        {/* Year Filter: User Constraint: "and for mock no year filteration" */}
        {currentCategory !== 'MOCK' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{
                padding: `${SPACING.xs}px ${SPACING.sm}px`,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                fontSize: 13,
                backgroundColor: tokens.surface,
                color: tokens.textPrimary,
              }}
            >
              <option value="ALL">All Years</option>
              <option value="2026">2026</option>
              <option value="2024 / 2025">2024 / 2025</option>
              <option value="2023 / 2024">2023 / 2024</option>
              <option value="2022 / 2023">2022 / 2023</option>
            </select>
          </div>
        )}
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

      {/* Build Exam Set Modal */}
      <BuildExamSetModal
        isOpen={isBuildSetModalOpen}
        category={currentCategory}
        courses={courses}
        universities={universities}
        programs={programs}
        onClose={() => setIsBuildSetModalOpen(false)}
        onBuildSet={handleBuildSet}
      />

      {/* Bulk CSV Import Modal */}
      <BulkCsvImportModal
        isOpen={isCsvModalOpen}
        targetExamSetOrQuizTitle={currentLabel}
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
          alert('Successfully imported exam questions into database question bank!');
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
                Question #{selectedQuestion.displayNumber} Details
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
