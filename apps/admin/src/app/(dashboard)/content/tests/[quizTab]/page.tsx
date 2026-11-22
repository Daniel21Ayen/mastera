'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, HelpCircle, FileSpreadsheet, CheckCircle2, Filter, Eye, Edit3, Trash2 } from 'lucide-react';
import { ADMIN_THEMES, RADIUS, SPACING } from '@mastera/ui-tokens';
import { PaginatedTable } from '@/components/shared/PaginatedTable';
import { RowActionMenu } from '@/components/shared/RowActionMenu';
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
  const currentTab = params.quizTab || 'quiz-1';

  const [currentPage, setCurrentPage] = useState(1);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuizQuestionBankRow | null>(null);

  // Edit Question State
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestionBankRow | null>(null);
  const [editPromptLatex, setEditPromptLatex] = useState('');
  const [editExplanationLatex, setEditExplanationLatex] = useState('');
  const [editOptions, setEditOptions] = useState<{ id: string; textLatex: string }[]>([]);
  const [editCorrectOptionId, setEditCorrectOptionId] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete Question State
  const [deleteConfirmQuestion, setDeleteConfirmQuestion] = useState<QuizQuestionBankRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    'quiz-1': 'Quiz 1 Question Bank',
    'quiz-2': 'Quiz 2 Question Bank',
    'quiz-3': 'Quiz 3 Question Bank',
    'chapter-quizzes': 'Chapter In-line Quiz Bank',
    'course-quizzes': 'Course-wide Quiz Bank',
    practice: 'Practice Assessment Bank',
  };

  const currentLabel = tabLabels[currentTab] || 'Quiz Question Bank';

  const handleOpenEdit = (q: QuizQuestionBankRow) => {
    setEditingQuestion(q);
    setEditPromptLatex(q.promptLatex);
    setEditExplanationLatex(q.explanationLatex || '');
    setEditOptions(
      q.options && q.options.length > 0
        ? JSON.parse(JSON.stringify(q.options))
        : [
            { id: 'opt_1', textLatex: '' },
            { id: 'opt_2', textLatex: '' },
            { id: 'opt_3', textLatex: '' },
            { id: 'opt_4', textLatex: '' },
          ]
    );
    setEditCorrectOptionId(q.correctOptionId || (q.options?.[0]?.id || ''));
  };

  const handleSaveEdit = async () => {
    if (!editingQuestion) return;
    try {
      setIsSavingEdit(true);
      await adminApiFetch(`/assessments/questions/${editingQuestion.id}`, {
        method: 'PUT',
        body: {
          promptLatex: editPromptLatex,
          explanationLatex: editExplanationLatex,
          options: editOptions,
          correctOptionId: editCorrectOptionId || null,
        },
      });
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === editingQuestion.id
            ? {
                ...item,
                promptLatex: editPromptLatex,
                explanationLatex: editExplanationLatex,
                options: editOptions,
                correctOptionId: editCorrectOptionId || null,
              }
            : item
        )
      );
      setEditingQuestion(null);
    } catch (err: any) {
      console.error('Failed to update question:', err);
      alert(`Failed to save question: ${err?.message || 'Server error'}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      setIsDeleting(true);
      await adminApiFetch(`/assessments/questions/${id}`, { method: 'DELETE' });
      await loadQuestionBank();
      setDeleteConfirmQuestion(null);
    } catch (err: any) {
      console.error('Failed to delete question:', err);
      alert(`Failed to delete question: ${err?.message || 'Server error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadCsv = async (
    csvText: string,
    targetChapterId?: string,
    courseId?: string
  ) => {
    const base64Content = typeof window !== 'undefined'
      ? btoa(unescape(encodeURIComponent(csvText)))
      : Buffer.from(csvText, 'utf-8').toString('base64');

    const normalizedCategory = currentTab.toUpperCase().replace('-', '_');

    const res = await adminApiFetch<{ report: any }>('/questions/csv-dry-run', {
      method: 'POST',
      body: {
        csvContentBase64: base64Content,
        targetType: 'QUIZ_CHAPTER',
        targetId: targetChapterId || null,
        category: normalizedCategory,
        courseId: courseId || (selectedCourseId !== 'ALL' ? selectedCourseId : null),
        programId: selectedProgramId !== 'ALL' ? selectedProgramId : null,
        semester: selectedSemester !== 'ALL' ? selectedSemester : null,
      },
    });

    return res.report;
  };

  const handleCommitImport = async (
    csvText: string,
    targetChapterId?: string,
    courseId?: string
  ) => {
    const base64Content = typeof window !== 'undefined'
      ? btoa(unescape(encodeURIComponent(csvText)))
      : Buffer.from(csvText, 'utf-8').toString('base64');

    const normalizedCategory = currentTab.toUpperCase().replace('-', '_');

    await adminApiFetch('/questions/csv-import', {
      method: 'POST',
      body: {
        csvContentBase64: base64Content,
        targetType: 'QUIZ_CHAPTER',
        targetId: targetChapterId || null,
        category: normalizedCategory,
        courseId: courseId || (selectedCourseId !== 'ALL' ? selectedCourseId : null),
        programId: selectedProgramId !== 'ALL' ? selectedProgramId : null,
      },
    });

    setIsCsvModalOpen(false);
    await loadQuestionBank();
    alert('Successfully imported quiz questions into database question bank!');
  };

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
      width: 70,
      align: 'center' as const,
      render: (q: QuizQuestionBankRow) => (
        <RowActionMenu
          onView={() => setSelectedQuestion(q)}
          onEdit={() => handleOpenEdit(q)}
          onDelete={() => setDeleteConfirmQuestion(q)}
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
          { key: 'quiz-1', label: 'Quiz 1' },
          { key: 'quiz-2', label: 'Quiz 2' },
          { key: 'quiz-3', label: 'Quiz 3' },
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
        targetExamSetOrQuizTitle={currentLabel}
        targetType="QUIZ_CHAPTER"
        availableCourses={courses.map((c) => ({ id: c.id, code: c.code, title: c.title }))}
        sampleTemplateUrl="/samples/quizzes_sample.csv"
        sampleCsvContent={`question_type,prompt_latex,option_a,option_b,option_c,option_d,correct_answer,explanation_latex
MULTIPLE_CHOICE,"Which of the following data structures operates on a First-In, First-Out (FIFO) access policy?","Stack","Queue","Binary Search Tree","Max-Heap",B,"A Queue follows the FIFO principle where elements are enqueued at the rear and dequeued from the front."
MULTIPLE_CHOICE,"What is the output of the logical expression $(P \\land \\neg P)$ for any boolean truth value of $P$?","Always True (Tautology)","Always False (Contradiction)","Contingent on $P$","Undefined",B,"The conjunction of a proposition and its negation is a logical contradiction and is false under all assignments."
TRUE_FALSE,"In object-oriented programming, an interface can instantiate concrete objects directly without an implementing class.",True,False,,,FALSE,"Interfaces define contracts and cannot be directly instantiated without a concrete class implementation."
MULTIPLE_CHOICE,"In communicative English, which grammatical voice places the receiver of the action in the subject position?","Active Voice","Passive Voice","Imperative Voice","Subjunctive Voice",B,"In passive voice (e.g., 'The report was written by John'), the recipient of the action functions as the grammatical subject."
MULTIPLE_CHOICE,"Solve for $x$: $2^{x + 3} = 32$.","$2$","$3$","$5$","$8$",A,"Since $32 = 2^5$, equate exponents: $x + 3 = 5 \\implies x = 2$."`}
        onClose={() => setIsCsvModalOpen(false)}
        onUploadCsv={handleUploadCsv}
        onCommitImport={handleCommitImport}
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

      {/* Edit Question Modal */}
      {editingQuestion && (
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
          onClick={() => !isSavingEdit && setEditingQuestion(null)}
        >
          <div
            style={{
              backgroundColor: tokens.surface,
              borderRadius: RADIUS.lg,
              padding: SPACING.xl,
              maxWidth: 640,
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
                  <Edit3 size={16} />
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: tokens.textPrimary }}>
                  Edit Question #{editingQuestion.displayNumber}
                </h3>
              </div>
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={() => setEditingQuestion(null)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: 18,
                  cursor: isSavingEdit ? 'not-allowed' : 'pointer',
                  color: tokens.textMuted,
                }}
              >
                ✕
              </button>
            </div>

            {/* Prompt LaTeX */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                Question Prompt (LaTeX Supported)
              </label>
              <textarea
                value={editPromptLatex}
                onChange={(e) => setEditPromptLatex(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: SPACING.sm,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
                placeholder="Enter question prompt..."
              />
            </div>

            {/* Options */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textPrimary, marginBottom: 6 }}>
                Answer Options (select the radio button next to the correct answer)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}>
                {editOptions.map((opt, idx) => {
                  const optLetter = String.fromCharCode(65 + idx);
                  const isCorrect = opt.id === editCorrectOptionId;
                  return (
                    <div
                      key={opt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: SPACING.sm,
                        padding: '6px 10px',
                        borderRadius: RADIUS.md,
                        border: `1px solid ${isCorrect ? tokens.success : tokens.border}`,
                        backgroundColor: isCorrect ? tokens.successBg : tokens.surface,
                      }}
                    >
                      <input
                        type="radio"
                        id={`opt_radio_${opt.id}`}
                        name="correctOptionRadio"
                        checked={isCorrect}
                        onChange={() => setEditCorrectOptionId(opt.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <label
                        htmlFor={`opt_radio_${opt.id}`}
                        style={{
                          fontWeight: 700,
                          fontSize: 12,
                          color: isCorrect ? tokens.success : tokens.textPrimary,
                          cursor: 'pointer',
                          minWidth: 20,
                        }}
                      >
                        {optLetter}.
                      </label>
                      <input
                        type="text"
                        value={opt.textLatex}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditOptions((prev) =>
                            prev.map((o) => (o.id === opt.id ? { ...o, textLatex: val } : o))
                          );
                        }}
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          borderRadius: RADIUS.sm,
                          border: `1px solid ${tokens.border}`,
                          fontSize: 13,
                          backgroundColor: tokens.surface,
                        }}
                        placeholder={`Option ${optLetter} text...`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation LaTeX */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                Explanation & Solution (LaTeX Supported)
              </label>
              <textarea
                value={editExplanationLatex}
                onChange={(e) => setEditExplanationLatex(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: SPACING.sm,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
                placeholder="Enter step-by-step solution / explanation..."
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.xs }}>
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={() => setEditingQuestion(null)}
                style={{
                  padding: `${SPACING.sm}px ${SPACING.lg}px`,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: isSavingEdit ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={handleSaveEdit}
                style={{
                  padding: `${SPACING.sm}px ${SPACING.lg}px`,
                  borderRadius: RADIUS.md,
                  border: 'none',
                  backgroundColor: tokens.primary,
                  color: tokens.surface,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: isSavingEdit ? 'not-allowed' : 'pointer',
                  opacity: isSavingEdit ? 0.7 : 1,
                }}
              >
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Question Confirmation Modal */}
      {deleteConfirmQuestion && (
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
          onClick={() => !isDeleting && setDeleteConfirmQuestion(null)}
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
                Delete Question #{deleteConfirmQuestion.displayNumber}?
              </h3>
            </div>

            <p style={{ margin: 0, fontSize: 13, color: tokens.textMuted, lineHeight: 1.5 }}>
              Are you sure you want to delete question #{deleteConfirmQuestion.displayNumber} (&quot;
              {deleteConfirmQuestion.promptLatex.slice(0, 80)}...&quot;)?
              Subsequent questions in this set will be automatically renumbered to maintain a continuous 1..N order.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.sm }}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmQuestion(null)}
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
                onClick={() => handleDeleteQuestion(deleteConfirmQuestion.id)}
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
                {isDeleting ? 'Deleting...' : 'Delete Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
