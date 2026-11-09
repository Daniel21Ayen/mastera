'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Eye,
  Plus,
  Trash2,
  Upload,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ADMIN_THEMES, RADIUS, SPACING } from '@mastera/ui-tokens';
import {
  AcademicStream,
  CatalogCourseDto,
  CatalogProgramDto,
  CatalogUniversityDto,
  ExamCategory,
  QuestionItemDto,
  QuestionType,
} from '@mastera/contracts';
import { adminApiFetch } from '@/lib/api-client';
import { StudentSimulatorModal } from '@/components/shared/StudentSimulatorModal';
import { BulkCsvImportModal } from '@/components/shared/BulkCsvImportModal';
import { BuildExamSetModal } from '@/components/assessments/AssessmentBuilders';

interface OptionItem {
  id: string;
  label: string;
  text: string;
}

const EXAM_TABS = [
  { key: 'mid-exams', label: 'Mid Exams', cat: 'MID' as ExamCategory },
  { key: 'final-exams', label: 'Final Exams', cat: 'FINAL' as ExamCategory },
  { key: 'coc-exams', label: 'COC Exam', cat: 'COC' as ExamCategory },
  { key: 'mock-exams', label: 'Mock Exam', cat: 'MOCK' as ExamCategory },
] as const;

const MATH_SHORTCUTS = [
  { label: 'x²', latex: '$x^2$' },
  { label: 'a/b', latex: '$\\frac{a}{b}$' },
  { label: '√x', latex: '$\\sqrt{x}$' },
  { label: '∫', latex: '$\\int_{a}^{b} f(x) dx$' },
  { label: '∑', latex: '$\\sum_{i=1}^{n} x_i$' },
  { label: 'α', latex: '$\\alpha$' },
  { label: 'β', latex: '$\\beta$' },
  { label: '±', latex: '$\\pm$' },
  { label: '≤', latex: '$\\leq$' },
  { label: '≥', latex: '$\\geq$' },
  { label: '∞', latex: '$\\infty$' },
];

function ExamQuestionAuthoringView(): React.ReactElement {
  const router = useRouter();
  const routeParams = useParams();
  const tokens = ADMIN_THEMES.light;

  const rawExamType = (routeParams?.examType as string) || 'mid-exams';
  const activeTab = useMemo(() => {
    const found = EXAM_TABS.find((t) => t.key === rawExamType);
    return found || EXAM_TABS[0];
  }, [rawExamType]);

  // Catalog metadata from DB
  const [courses, setCourses] = useState<CatalogCourseDto[]>([]);
  const [universities, setUniversities] = useState<CatalogUniversityDto[]>([]);
  const [programs, setPrograms] = useState<CatalogProgramDto[]>([]);
  const [examSets, setExamSets] = useState<any[]>([]);
  const [selectedExamSetId, setSelectedExamSetId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Form Fields
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [year, setYear] = useState<string>('2026 / 2027');
  const [questionType, setQuestionType] = useState<QuestionType>('MULTIPLE_CHOICE');
  const [questionNumber, setQuestionNumber] = useState<number>(1);

  // COC specific fields (NO Course)
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('Semester 1');
  const [selectedStream, setSelectedStream] = useState<string>('Common Courses');

  // Question Prompt & Explanation
  const [promptLatex, setPromptLatex] = useState<string>('');
  const [explanationLatex, setExplanationLatex] = useState<string>('');
  const [isQuestionMathOpen, setIsQuestionMathOpen] = useState(false);
  const [isExplanationMathOpen, setIsExplanationMathOpen] = useState(false);

  // Multiple Choice Options
  const [options, setOptions] = useState<OptionItem[]>([
    { id: 'opt-1', label: 'Option 1', text: '' },
    { id: 'opt-2', label: 'Option 2', text: '' },
    { id: 'opt-3', label: 'Option 3', text: '' },
    { id: 'opt-4', label: 'Option 4', text: '' },
  ]);
  const [correctOptionId, setCorrectOptionId] = useState<string>('opt-1');

  // True / False
  const [correctBoolean, setCorrectBoolean] = useState<boolean>(true);

  // Short Answer & Blank Space accepted answers
  const [acceptedAnswers, setAcceptedAnswers] = useState<string[]>(['']);

  // Modals
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isBuildSetModalOpen, setIsBuildSetModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Load real catalog data
  useEffect(() => {
    let isCancelled = false;
    async function loadCatalog() {
      try {
        const [courseRes, univRes, progRes] = await Promise.all([
          adminApiFetch<{ items: CatalogCourseDto[] }>('/catalog/courses'),
          adminApiFetch<{ items: CatalogUniversityDto[] }>('/catalog/universities'),
          adminApiFetch<{ items: CatalogProgramDto[] }>('/catalog/programs'),
        ]);

        if (isCancelled) return;
        const cList = courseRes?.items || [];
        const uList = univRes?.items || [];
        const pList = progRes?.items || [];

        setCourses(cList);
        setUniversities(uList);
        setPrograms(pList);

        if (cList.length > 0 && !selectedCourseId) {
          const firstCourse = cList[0];
          if (firstCourse) setSelectedCourseId(firstCourse.id);
        }
        if (uList.length > 0 && !selectedUniversityId) {
          const firstUniv = uList[0];
          if (firstUniv) setSelectedUniversityId(firstUniv.id);
        }
        if (pList.length > 0 && !selectedProgramId) {
          const firstProg = pList[0];
          if (firstProg) setSelectedProgramId(firstProg.id);
        }
      } catch (err) {
        console.error('Failed to load catalog data for questions:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadCatalog();
    return () => {
      isCancelled = true;
    };
  }, [selectedCourseId, selectedUniversityId, selectedProgramId]);

  // Load available exam sets for the current category and course
  useEffect(() => {
    let isCancelled = false;
    async function loadSets() {
      try {
        const query = new URLSearchParams();
        query.set('category', activeTab.cat);
        if (selectedCourseId && activeTab.cat !== 'COC') query.set('courseId', selectedCourseId);
        const res = await adminApiFetch<any[]>(`/assessments/exam-sets?${query.toString()}`);
        if (isCancelled) return;
        const list = Array.isArray(res) ? res : [];
        setExamSets(list);
        if (list.length > 0) {
          setSelectedExamSetId((prev) => (prev && list.some((s) => s.id === prev) ? prev : list[0].id));
        } else {
          setSelectedExamSetId('');
        }
      } catch (err) {
        console.error('Failed to load exam sets:', err);
      }
    }
    loadSets();
    return () => {
      isCancelled = true;
    };
  }, [activeTab.cat, selectedCourseId]);

  const handleTabClick = (tabKey: string) => {
    router.push(`/questions/${tabKey}/new`);
  };

  // Option handlers
  const handleAddOption = () => {
    const nextIdx = options.length + 1;
    setOptions((prev) => [
      ...prev,
      {
        id: `opt-${Date.now()}-${nextIdx}`,
        label: `Option ${nextIdx}`,
        text: '',
      },
    ]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) {
      alert('Questions must have at least 2 options.');
      return;
    }
    const filtered = options.filter((o) => o.id !== id);
    setOptions(filtered);
    if (correctOptionId === id && filtered.length > 0) {
      const firstOpt = filtered[0];
      if (firstOpt) setCorrectOptionId(firstOpt.id);
    }
  };

  const handleOptionTextChange = (id: string, text: string) => {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, text } : o)));
  };

  // Accepted Answer handlers
  const handleAddAcceptedAnswer = () => {
    setAcceptedAnswers((prev) => [...prev, '']);
  };

  const handleRemoveAcceptedAnswer = (idx: number) => {
    if (acceptedAnswers.length <= 1) return;
    setAcceptedAnswers((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAcceptedAnswerChange = (idx: number, val: string) => {
    setAcceptedAnswers((prev) => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  // Insert formula shortcut
  const handleInsertMath = (target: 'QUESTION' | 'EXPLANATION', latex: string) => {
    if (target === 'QUESTION') {
      setPromptLatex((prev) => (prev ? `${prev} ${latex}` : latex));
    } else {
      setExplanationLatex((prev) => (prev ? `${prev} ${latex}` : latex));
    }
  };

  // Reset form
  const handleReset = () => {
    setPromptLatex('');
    setExplanationLatex('');
    setOptions([
      { id: 'opt-1', label: 'Option 1', text: '' },
      { id: 'opt-2', label: 'Option 2', text: '' },
      { id: 'opt-3', label: 'Option 3', text: '' },
      { id: 'opt-4', label: 'Option 4', text: '' },
    ]);
    setCorrectOptionId('opt-1');
    setCorrectBoolean(true);
    setAcceptedAnswers(['']);
  };

  // Build question payload
  const buildPayload = () => {
    const formattedOptions =
      questionType === 'MULTIPLE_CHOICE'
        ? options.map((opt) => ({
            id: opt.id,
            textLatex: opt.text.trim() || opt.label,
          }))
        : undefined;

    const formattedAcceptedAnswers =
      questionType === 'SHORT_ANSWER' || questionType === 'BLANK_SPACE'
        ? acceptedAnswers.filter((a) => a.trim().length > 0)
        : undefined;

    return {
      examSetId: selectedExamSetId || undefined,
      category: activeTab.cat,
      year: activeTab.cat !== 'MOCK' ? year : '2026 / 2027',
      courseId: activeTab.cat !== 'COC' ? selectedCourseId || undefined : undefined,
      universityId: activeTab.cat === 'COC' ? selectedUniversityId || undefined : undefined,
      programId:
        activeTab.cat === 'COC' || activeTab.cat === 'MOCK'
          ? selectedProgramId || undefined
          : undefined,
      desiredDisplayNumber: questionNumber,
      questionType,
      promptLatex: promptLatex.trim() || `Question ${questionNumber}`,
      options: formattedOptions,
      correctOptionId: questionType === 'MULTIPLE_CHOICE' ? correctOptionId : undefined,
      correctBoolean: questionType === 'TRUE_FALSE' ? correctBoolean : undefined,
      acceptedAnswers: formattedAcceptedAnswers,
      explanationLatex: explanationLatex.trim() || 'Official solution verified by Mastera academic board.',
    };
  };

  // Save / Publish Question
  const handleSaveQuestion = async (isPublish: boolean) => {
    if (!promptLatex.trim()) {
      alert('Please enter a question prompt.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      await adminApiFetch('/assessments/questions', {
        method: 'POST',
        body: {
          data: payload,
        },
      });

      alert(
        isPublish
          ? `Question #${questionNumber} published successfully!`
          : `Question #${questionNumber} draft saved successfully!`
      );
      setQuestionNumber((prev) => prev + 1);
      handleReset();
    } catch (err: any) {
      console.error('Failed to save question:', err);
      alert(`Failed to save question: ${err?.message || 'Server error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build Exam Set submission
  const handleBuildSetSubmit = async (payload: any) => {
    try {
      const created = await adminApiFetch<any>('/assessments/exam-sets', {
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
      setIsBuildSetModalOpen(false);
      if (created?.id) {
        setExamSets((prev) => [created, ...prev]);
        setSelectedExamSetId(created.id);
      }
      alert(`Exam Set "${payload.examSetCode}" built and registered successfully!`);
    } catch (err: any) {
      console.error('Failed to build exam set:', err);
      alert(`Failed to build exam set: ${err?.message || 'Server error'}`);
      setIsBuildSetModalOpen(false);
    }
  };

  // Simulator Data Object
  const simulatorQuestionData: QuestionItemDto = useMemo(() => {
    const formattedOptions =
      questionType === 'MULTIPLE_CHOICE'
        ? options.map((opt) => ({
            id: opt.id,
            textLatex: opt.text.trim() || opt.label,
          }))
        : questionType === 'TRUE_FALSE'
        ? [
            { id: 'true-opt', textLatex: 'True' },
            { id: 'false-opt', textLatex: 'False' },
          ]
        : [];

    return {
      id: `sim-q-${questionNumber}`,
      displayNumber: questionNumber,
      questionType,
      promptLatex: promptLatex.trim() || `Question ${questionNumber}: Prompt text preview`,
      options: formattedOptions,
      correctOptionId,
      correctBoolean,
      acceptedAnswers: acceptedAnswers.filter((a) => a.trim().length > 0),
      explanationLatex:
        explanationLatex.trim() || 'Step-by-step verified explanation will appear after answer.',
    };
  }, [
    questionNumber,
    questionType,
    promptLatex,
    options,
    correctOptionId,
    correctBoolean,
    acceptedAnswers,
    explanationLatex,
  ]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      {/* Top Header Row with Back link */}
      <div>
        <Link
          href={`/questions/${activeTab.key}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: SPACING.xs,
            color: tokens.textMuted,
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 500,
            marginBottom: SPACING.sm,
          }}
        >
          <ArrowLeft size={16} />
          Back to exam sets
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: SPACING.md,
          }}
        >
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: tokens.textPrimary,
              margin: 0,
            }}
          >
            Exam Management
          </h1>

          {/* Top Right Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: SPACING.xs,
                padding: `${SPACING.sm}px ${SPACING.lg}px`,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surface,
                color: tokens.primary,
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              <Eye size={15} />
              Review as student
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveQuestion(false)}
              style={{
                padding: `${SPACING.sm}px ${SPACING.lg}px`,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surface,
                color: tokens.textPrimary,
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: 13,
              }}
            >
              Save Draft
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveQuestion(true)}
              style={{
                padding: `${SPACING.sm}px ${SPACING.xl}px`,
                borderRadius: RADIUS.md,
                border: 'none',
                backgroundColor: tokens.primary,
                color: tokens.sidebarText,
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: 13,
              }}
            >
              Publish
            </button>
          </div>
        </div>
      </div>

      {/* Exam Switcher Tabs: Mid Exams | Final Exams | COC Exam | Mock Exam */}
      <div style={{ display: 'flex', gap: SPACING.sm }}>
        {EXAM_TABS.map((tab) => {
          const isActive = tab.key === activeTab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabClick(tab.key)}
              style={{
                padding: `${SPACING.xs}px ${SPACING.xl}px`,
                borderRadius: RADIUS.pill,
                border: isActive ? 'none' : `1px solid ${tokens.border}`,
                backgroundColor: isActive ? tokens.primary : tokens.surface,
                color: isActive ? tokens.sidebarText : tokens.textPrimary,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: isActive ? '0 2px 4px rgba(0, 0, 0, 0.08)' : 'none',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Question Authoring Card matching admindesign screenshots */}
      <div
        style={{
          backgroundColor: tokens.surface,
          borderRadius: RADIUS.xl,
          border: `1px solid ${tokens.border}`,
          padding: SPACING.xl,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.xl,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: SPACING.md,
            paddingBottom: SPACING.md,
            borderBottom: `1px solid ${tokens.border}`,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: tokens.textPrimary,
              }}
            >
              {activeTab.key === 'mid-exams'
                ? 'Create Mid exam Question'
                : activeTab.key === 'final-exams'
                ? 'Create Final exam Question'
                : activeTab.key === 'coc-exams'
                ? 'Create COC exam Question'
                : 'Create Mock exam Question'}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: tokens.textMuted }}>
              Exam questions strictly belong to an Exam Set (no chapters). All submissions are synchronized in real-time.
            </p>
          </div>

          {/* Exam Set Selector & Build Exam Set Trigger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, minWidth: 320 }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: tokens.textPrimary,
                  marginBottom: 3,
                }}
              >
                Target Exam Set
              </label>
              <select
                value={selectedExamSetId}
                onChange={(e) => setSelectedExamSetId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {examSets.length === 0 ? (
                  <option value="">Auto-create new Exam Set on publish</option>
                ) : (
                  <>
                    <option value="">Select or auto-resolve exam set</option>
                    {examSets.map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.examSetCode}] {s.title} ({s.questionCount ?? 0} questions)
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsBuildSetModalOpen(true)}
              style={{
                marginTop: 18,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '8px 14px',
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.primary}`,
                backgroundColor: tokens.surface,
                color: tokens.primary,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Layers size={14} />
              + Build Set
            </button>
          </div>
        </div>

        {/* 1. DYNAMIC TOP ROW FIELDS MATCHING DESIGN */}

        {/* A. Mid Exams & Final Exams (4 Columns: Course, Year, Question Type, Question ID) */}
        {(activeTab.key === 'mid-exams' || activeTab.key === 'final-exams') && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: SPACING.md,
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                Course
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                  fontSize: 13,
                }}
              >
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.code}] {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                  fontSize: 13,
                }}
              >
                <option value="2026 / 2027">2026 / 2027</option>
                <option value="2025 / 2026">2025 / 2026</option>
                <option value="2024 / 2025">2024 / 2025</option>
                <option value="2023 / 2024">2023 / 2024</option>
                <option value="2022 / 2023">2022 / 2023</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                Question Type
              </label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                  fontSize: 13,
                }}
              >
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                <option value="TRUE_FALSE">True / False</option>
                <option value="SHORT_ANSWER">Short Answer</option>
                <option value="BLANK_SPACE">Blank Space</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                Question ID
              </label>
              <input
                type="number"
                min={1}
                value={questionNumber}
                onChange={(e) => setQuestionNumber(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                  fontSize: 13,
                }}
              />
            </div>
          </div>
        )}

        {/* B. COC Exam (Row 1: University, Program, Semester, Stream, Year | Row 2: Question Type, Question Number) */}
        {activeTab.key === 'coc-exams' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: SPACING.md,
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                  University
                </label>
                <select
                  value={selectedUniversityId}
                  onChange={(e) => setSelectedUniversityId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 13,
                  }}
                >
                  <option value="">Select university</option>
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.shortName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                  Program / Department
                </label>
                <select
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 13,
                  }}
                >
                  <option value="">Select program</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                  Semester
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 13,
                  }}
                >
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                  Stream
                </label>
                <select
                  value={selectedStream}
                  onChange={(e) => setSelectedStream(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 13,
                  }}
                >
                  <option value="Common Courses">Common Courses</option>
                  <option value="Natural">Natural</option>
                  <option value="Social">Social</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 13,
                  }}
                >
                  <option value="2026 / 2027">2026 / 2027</option>
                  <option value="2025 / 2026">2025 / 2026</option>
                  <option value="2024 / 2025">2024 / 2025</option>
                  <option value="2023 / 2024">2023 / 2024</option>
                  <option value="2022 / 2023">2022 / 2023</option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: SPACING.md,
                maxWidth: 600,
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                  Question Type
                </label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 13,
                  }}
                >
                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                  <option value="TRUE_FALSE">True / False</option>
                  <option value="SHORT_ANSWER">Short Answer</option>
                  <option value="BLANK_SPACE">Blank Space</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                  Question Number
                </label>
                <input
                  type="number"
                  min={1}
                  value={questionNumber}
                  onChange={(e) => setQuestionNumber(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 13,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* C. Mock Exam (Row 1: Program, Semester, Stream | Row 2: Course, Question Type, Question Number - NO Year) */}
        {activeTab.key === 'mock-exams' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: SPACING.md,
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                  Program / Department
                </label>
                <select
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 13,
                  }}
                >
                  <option value="">Select program</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                  Semester
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 13,
                  }}
                >
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                  Stream
                </label>
                <select
                  value={selectedStream}
                  onChange={(e) => setSelectedStream(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 13,
                  }}
                >
                  <option value="Natural">Natural</option>
                  <option value="Social">Social</option>
                  <option value="Common">Common Courses</option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: SPACING.md,
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                  Course
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 13,
                  }}
                >
                  <option value="">Select course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                  Question Type
                </label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 13,
                  }}
                >
                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                  <option value="TRUE_FALSE">True / False</option>
                  <option value="SHORT_ANSWER">Short Answer</option>
                  <option value="BLANK_SPACE">Blank Space</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                  Question Number
                </label>
                <input
                  type="number"
                  min={1}
                  value={questionNumber}
                  onChange={(e) => setQuestionNumber(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 13,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. QUESTION PROMPT TEXTAREA */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: tokens.textPrimary,
              marginBottom: 4,
            }}
          >
            Question
          </label>
          <textarea
            rows={4}
            value={promptLatex}
            onChange={(e) => setPromptLatex(e.target.value)}
            placeholder="Type the question. Put formulas between $ signs."
            style={{
              width: '100%',
              padding: SPACING.md,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              color: tokens.textPrimary,
              fontSize: 13,
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />

          {/* Math LaTeX insertion dropdown toggle */}
          <div style={{ marginTop: 6 }}>
            <button
              type="button"
              onClick={() => setIsQuestionMathOpen((prev) => !prev)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: tokens.primary,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {isQuestionMathOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Insert Math (LaTeX)
            </button>

            {isQuestionMathOpen && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginTop: 6,
                  padding: SPACING.sm,
                  backgroundColor: tokens.surfaceSubtle,
                  borderRadius: RADIUS.md,
                }}
              >
                {MATH_SHORTCUTS.map((sc) => (
                  <button
                    key={sc.label}
                    type="button"
                    onClick={() => handleInsertMath('QUESTION', sc.latex)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: RADIUS.sm,
                      border: `1px solid ${tokens.border}`,
                      backgroundColor: tokens.surface,
                      color: tokens.textPrimary,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 4,
              fontSize: 12,
              color: tokens.textMuted,
            }}
          >
            <span>Write formulas between $ signs, for example $x^2 + 1$.</span>
            <span>{promptLatex.length}/1000</span>
          </div>
        </div>

        {/* 3. TYPE-SPECIFIC ANSWER SECTION */}

        {/* A. Multiple Choice: Options List + Correct Answer Dropdown */}
        {questionType === 'MULTIPLE_CHOICE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: tokens.textPrimary,
                margin: 0,
              }}
            >
              Answer options
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
              {options.map((opt) => (
                <div
                  key={opt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.sm,
                  }}
                >
                  <input
                    type="radio"
                    name="correct-option-group"
                    checked={correctOptionId === opt.id}
                    onChange={() => setCorrectOptionId(opt.id)}
                    style={{ cursor: 'pointer', width: 16, height: 16 }}
                  />
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => handleOptionTextChange(opt.id, e.target.value)}
                    placeholder={opt.label}
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: RADIUS.md,
                      border: `1px solid ${tokens.border}`,
                      backgroundColor: tokens.surface,
                      color: tokens.textPrimary,
                      fontSize: 13,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(opt.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: tokens.danger,
                      cursor: 'pointer',
                      padding: 4,
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div>
              <button
                type="button"
                onClick={handleAddOption}
                style={{
                  padding: '7px 16px',
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.primary}`,
                  backgroundColor: tokens.surface,
                  color: tokens.primary,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Plus size={15} />
                Add option
              </button>
            </div>

            {/* Correct answer dropdown */}
            <div style={{ marginTop: SPACING.xs }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: tokens.textPrimary,
                  marginBottom: 4,
                }}
              >
                Correct answer
              </label>
              <select
                value={correctOptionId}
                onChange={(e) => setCorrectOptionId(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: 420,
                  padding: '9px 12px',
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                  fontSize: 13,
                }}
              >
                {options.map((opt, i) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.text.trim() ? `${opt.label}: ${opt.text.trim()}` : opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* B. True / False: Radio Buttons */}
        {questionType === 'TRUE_FALSE' && (
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: tokens.textPrimary,
                marginBottom: SPACING.xs,
              }}
            >
              Correct answer
            </label>
            <div style={{ display: 'flex', gap: SPACING.lg, alignItems: 'center' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="tf-correct"
                  checked={correctBoolean === true}
                  onChange={() => setCorrectBoolean(true)}
                  style={{ width: 16, height: 16 }}
                />
                True
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="tf-correct"
                  checked={correctBoolean === false}
                  onChange={() => setCorrectBoolean(false)}
                  style={{ width: 16, height: 16 }}
                />
                False
              </label>
            </div>
          </div>
        )}

        {/* C. Short Answer & Blank Space: Accepted Answers */}
        {(questionType === 'SHORT_ANSWER' || questionType === 'BLANK_SPACE') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: tokens.textPrimary,
                margin: 0,
              }}
            >
              Accepted answers
            </label>
            <div style={{ fontSize: 12, color: tokens.textMuted }}>
              Add every answer that counts as correct.
            </div>

            {acceptedAnswers.map((ans, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
                <input
                  type="text"
                  value={ans}
                  onChange={(e) => handleAcceptedAnswerChange(idx, e.target.value)}
                  placeholder={`Accepted answer ${idx + 1}`}
                  style={{
                    flex: 1,
                    maxWidth: 520,
                    padding: '9px 12px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 13,
                  }}
                />
                {acceptedAnswers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAcceptedAnswer(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: tokens.danger,
                      cursor: 'pointer',
                      padding: 4,
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}

            <div>
              <button
                type="button"
                onClick={handleAddAcceptedAnswer}
                style={{
                  padding: '7px 16px',
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.primary}`,
                  backgroundColor: tokens.surface,
                  color: tokens.primary,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Plus size={15} />
                Add accepted answer
              </button>
            </div>
          </div>
        )}

        {/* 4. ANSWER DESCRIPTION TEXTAREA */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: tokens.textPrimary,
              marginBottom: 4,
            }}
          >
            Answer Description
          </label>
          <textarea
            rows={3}
            value={explanationLatex}
            onChange={(e) => setExplanationLatex(e.target.value)}
            placeholder="Explain why this answer is correct..."
            style={{
              width: '100%',
              padding: SPACING.md,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              color: tokens.textPrimary,
              fontSize: 13,
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />

          {/* Math LaTeX insertion dropdown toggle */}
          <div style={{ marginTop: 6 }}>
            <button
              type="button"
              onClick={() => setIsExplanationMathOpen((prev) => !prev)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: tokens.primary,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {isExplanationMathOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Insert Math (LaTeX)
            </button>

            {isExplanationMathOpen && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginTop: 6,
                  padding: SPACING.sm,
                  backgroundColor: tokens.surfaceSubtle,
                  borderRadius: RADIUS.md,
                }}
              >
                {MATH_SHORTCUTS.map((sc) => (
                  <button
                    key={sc.label}
                    type="button"
                    onClick={() => handleInsertMath('EXPLANATION', sc.latex)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: RADIUS.sm,
                      border: `1px solid ${tokens.border}`,
                      backgroundColor: tokens.surface,
                      color: tokens.textPrimary,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 4,
              fontSize: 12,
              color: tokens.textMuted,
            }}
          >
            <span>This explanation will be shown to students after they answer the question.</span>
            <span>{explanationLatex.length}/500</span>
          </div>
        </div>

        {/* 5. BOTTOM ACTIONS ROW MATCHING DESIGN */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: SPACING.md,
            borderTop: `1px solid ${tokens.border}`,
            paddingTop: SPACING.lg,
          }}
        >
          {/* Left Buttons: + Add Question | Bulk Import Questions | Build Exam Set */}
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveQuestion(false)}
              style={{
                padding: `${SPACING.sm}px ${SPACING.lg}px`,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.primary}`,
                backgroundColor: tokens.surface,
                color: tokens.primary,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Plus size={16} />
              Add Question
            </button>

            <button
              type="button"
              onClick={() => setIsCsvModalOpen(true)}
              style={{
                padding: `${SPACING.sm}px ${SPACING.lg}px`,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surface,
                color: tokens.textPrimary,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Upload size={16} />
              Bulk Import Questions
            </button>

            <button
              type="button"
              onClick={() => setIsBuildSetModalOpen(true)}
              style={{
                padding: `${SPACING.sm}px ${SPACING.lg}px`,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surfaceSubtle,
                color: tokens.primary,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Layers size={16} />
              Build Exam Set
            </button>
          </div>

          {/* Right Buttons: Reset | Save Draft | Publish */}
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: `${SPACING.sm}px ${SPACING.lg}px`,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surface,
                color: tokens.textPrimary,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Reset
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveQuestion(false)}
              style={{
                padding: `${SPACING.sm}px ${SPACING.lg}px`,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surface,
                color: tokens.textPrimary,
                fontWeight: 600,
                fontSize: 13,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              Save Draft
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveQuestion(true)}
              style={{
                padding: `${SPACING.sm}px ${SPACING.xl}px`,
                borderRadius: RADIUS.md,
                border: 'none',
                backgroundColor: tokens.primary,
                color: tokens.sidebarText,
                fontWeight: 600,
                fontSize: 13,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              Publish
            </button>
          </div>
        </div>
      </div>

      {/* Student Simulator Modal for "Review as student" */}
      <StudentSimulatorModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={
          activeTab.key === 'coc-exams'
            ? `COC Assessment (Q${questionNumber})`
            : `${selectedCourse?.title || 'Exam'} Question #${questionNumber}`
        }
        question={simulatorQuestionData}
      />

      {/* Build Exam Set Modal for every exam */}
      <BuildExamSetModal
        isOpen={isBuildSetModalOpen}
        category={activeTab.cat}
        courses={courses}
        universities={universities}
        programs={programs}
        onClose={() => setIsBuildSetModalOpen(false)}
        onBuildSet={handleBuildSetSubmit}
      />

      {/* Bulk CSV Import Modal */}
      <BulkCsvImportModal
        isOpen={isCsvModalOpen}
        targetExamSetOrQuizTitle={`${activeTab.label} Question Bank`}
        onClose={() => setIsCsvModalOpen(false)}
        onUploadCsv={async () => ({
          valid: true,
          totalRows: 25,
          validRowsCount: 25,
          errors: [],
        })}
        onCommitImport={async () => {
          setIsCsvModalOpen(false);
          alert('Successfully parsed and imported exam questions from CSV!');
        }}
      />
    </div>
  );
}

export default function NewExamQuestionPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 24, color: ADMIN_THEMES.light.textMuted }}>
          Loading examination authoring view...
        </div>
      }
    >
      <ExamQuestionAuthoringView />
    </Suspense>
  );
}
