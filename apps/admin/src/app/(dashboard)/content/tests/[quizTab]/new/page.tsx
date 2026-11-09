'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  Search,
  BookOpen,
} from 'lucide-react';
import { ADMIN_THEMES, RADIUS, SPACING } from '@mastera/ui-tokens';
import {
  CatalogCourseDto,
  CatalogProgramDto,
  CatalogUniversityDto,
  QuestionType,
} from '@mastera/contracts';
import { StudentSimulatorModal } from '@/components/shared/StudentSimulatorModal';
import { adminApiFetch } from '@/lib/api-client';

interface QuizOption {
  id: string;
  label: string;
  text: string;
}

const QUIZ_TABS = [
  { key: 'quiz-1', category: 'QUIZ_1', label: 'Quiz 1' },
  { key: 'quiz-2', category: 'QUIZ_2', label: 'Quiz 2' },
  { key: 'quiz-3', category: 'QUIZ_3', label: 'Quiz 3' },
] as const;

export default function NewQuizQuestionPage({
  params,
}: {
  params: { quizTab: string };
}): React.ReactElement {
  const router = useRouter();
  const routeParams = useParams();
  const tokens = ADMIN_THEMES.light;

  const currentTabKey =
    (routeParams?.quizTab as string) || params?.quizTab || 'quiz-1';
  const [activeTabKey, setActiveTabKey] = useState<string>(
    QUIZ_TABS.some((t) => t.key === currentTabKey) ? currentTabKey : 'quiz-1'
  );

  const activeQuiz = useMemo(
    () => QUIZ_TABS.find((t) => t.key === activeTabKey) || QUIZ_TABS[0],
    [activeTabKey]
  );

  // Catalog state
  const [courses, setCourses] = useState<CatalogCourseDto[]>([]);
  const [universities, setUniversities] = useState<CatalogUniversityDto[]>([]);
  const [programs, setPrograms] = useState<CatalogProgramDto[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  // Chapters state for selected course
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [chapterFilter, setChapterFilter] = useState('');
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [isSubmittingChapter, setIsSubmittingChapter] = useState(false);

  // Question form state
  const [questionType, setQuestionType] = useState<QuestionType>('MULTIPLE_CHOICE');
  const [promptLatex, setPromptLatex] = useState('');
  const [isMathHelperOpen, setIsMathHelperOpen] = useState(false);
  const [options, setOptions] = useState<QuizOption[]>([
    { id: 'opt-a', label: 'A', text: '' },
    { id: 'opt-b', label: 'B', text: '' },
    { id: 'opt-c', label: 'C', text: '' },
    { id: 'opt-d', label: 'D', text: '' },
  ]);
  const [correctOptionId, setCorrectOptionId] = useState('opt-a');
  const [correctBoolean, setCorrectBoolean] = useState(true);
  const [acceptedAnswers, setAcceptedAnswers] = useState('');
  const [explanationLatex, setExplanationLatex] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Load catalog data
  useEffect(() => {
    async function loadCatalog() {
      try {
        const [courseRes, univRes, progRes] = await Promise.all([
          adminApiFetch<{ items: CatalogCourseDto[] }>('/catalog/courses'),
          adminApiFetch<{ items: CatalogUniversityDto[] }>('/catalog/universities'),
          adminApiFetch<{ items: CatalogProgramDto[] }>('/catalog/programs'),
        ]);
        const items = courseRes?.items || [];
        setCourses(items);
        setUniversities(univRes?.items || []);
        setPrograms(progRes?.items || []);
        if (items.length > 0 && items[0]) {
          setSelectedCourseId(items[0].id);
        }
      } catch (err) {
        console.error('Failed to load courses catalog:', err);
      } finally {
        setIsLoadingCatalog(false);
      }
    }
    loadCatalog();
  }, []);

  // Load chapters for selected course and specific quiz category
  useEffect(() => {
    let isCancelled = false;
    async function loadChapters() {
      if (!selectedCourseId) return;
      try {
        const res = await adminApiFetch<any[]>(
          `/content/chapters?courseId=${selectedCourseId}&category=${activeQuiz.category}`
        );
        if (isCancelled) return;
        const list = Array.isArray(res) ? res : [];
        setChapters(list);
        if (list.length > 0) {
          setSelectedChapterId(list[0].id);
        } else {
          setSelectedChapterId('');
        }
      } catch (err) {
        console.error('Failed to load chapters for quiz:', err);
      }
    }
    loadChapters();
    return () => {
      isCancelled = true;
    };
  }, [selectedCourseId, activeQuiz.category]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const selectedUniv = universities.find((u) => u.id === selectedCourse?.universityId);
  const selectedProg = programs.find((p) => p.id === selectedCourse?.programId);

  const filteredChapters = useMemo(() => {
    if (!chapterFilter.trim()) return chapters;
    const term = chapterFilter.toLowerCase();
    return chapters.filter(
      (ch) =>
        (ch.title && ch.title.toLowerCase().includes(term)) ||
        `chapter ${ch.orderIndex}`.includes(term)
    );
  }, [chapters, chapterFilter]);

  const currentChapter = chapters.find((c) => c.id === selectedChapterId);

  const handleTabClick = (tabKey: string) => {
    setActiveTabKey(tabKey);
    router.replace(`/content/tests/${tabKey}/new`);
  };

  const handleAddChapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim() || !selectedCourseId) return;
    setIsSubmittingChapter(true);
    try {
      const nextOrder = chapters.length + 1;
      const created = await adminApiFetch<any>('/content/chapters', {
        method: 'POST',
        body: {
          data: {
            courseId: selectedCourseId,
            category: activeQuiz.category,
            orderIndex: nextOrder,
            title: newChapterTitle.trim(),
            bodyMarkdownLatex: `# ${newChapterTitle.trim()}\nAssessment for ${activeQuiz.label}.`,
            isFree: false,
          },
        },
      });
      setChapters((prev) => [...prev, created]);
      setSelectedChapterId(created.id);
      setNewChapterTitle('');
      setIsAddingChapter(false);
    } catch (err: any) {
      console.error('Failed to create chapter:', err);
      alert(`Failed to create chapter: ${err?.message || 'Server error'}`);
    } finally {
      setIsSubmittingChapter(false);
    }
  };

  const handleOptionChange = (idx: number, text: string) => {
    setOptions((prev) =>
      prev.map((opt, i) => (i === idx ? { ...opt, text } : opt))
    );
  };

  const handleAddOption = () => {
    if (options.length >= 6) return;
    const nextIdx = options.length;
    const nextLabel = String.fromCharCode(65 + nextIdx);
    setOptions((prev) => [
      ...prev,
      { id: `opt-${nextLabel.toLowerCase()}`, label: nextLabel, text: '' },
    ]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) return;
    const remaining = options.filter((o) => o.id !== id);
    const reindexed = remaining.map((o, idx) => ({
      ...o,
      label: String.fromCharCode(65 + idx),
    }));
    setOptions(reindexed);
    if (correctOptionId === id) {
      setCorrectOptionId(reindexed[0]?.id || 'opt-a');
    }
  };

  const insertLatexSnippet = (snippet: string) => {
    setPromptLatex((prev) => prev + snippet);
  };

  const handleSaveQuestion = async (isPublish = false) => {
    if (!promptLatex.trim()) {
      alert('Please enter a question prompt.');
      return;
    }
    if (!selectedCourseId) {
      alert('Please select a course.');
      return;
    }
    if (!selectedChapterId) {
      alert(`Please create a chapter for ${activeQuiz.label} first by clicking '+ Add New Chapter'.`);
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        quizChapterId: selectedChapterId,
        courseId: selectedCourseId,
        universityId: selectedCourse?.universityId || undefined,
        programId: selectedCourse?.programId || undefined,
        questionType,
        promptLatex: promptLatex.trim(),
        explanationLatex: explanationLatex.trim() || 'No explanation provided.',
        status: isPublish ? 'PUBLISHED' : 'DRAFT',
      };

      if (questionType === 'MULTIPLE_CHOICE') {
        payload.options = options.map((opt) => ({
          id: opt.id,
          textLatex: opt.text,
          label: opt.label,
        }));
        payload.correctOptionId = correctOptionId;
      } else if (questionType === 'TRUE_FALSE') {
        payload.correctBoolean = correctBoolean;
      } else {
        payload.acceptedAnswers = acceptedAnswers
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }

      await adminApiFetch('/assessments/questions', {
        method: 'POST',
        body: { data: payload },
      });

      alert(
        isPublish
          ? 'Quiz question published successfully!'
          : 'Quiz question draft saved successfully!'
      );
      router.push(`/content/tests/${activeTabKey}`);
    } catch (err: any) {
      console.error('Failed to create quiz question:', err);
      alert(`Failed to save question: ${err?.message || 'Server error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const simulatorQuestionData = useMemo(() => {
    return {
      id: 'preview-q-1',
      displayNumber: 1,
      questionType,
      promptLatex: promptLatex || 'Question prompt preview...',
      options:
        questionType === 'MULTIPLE_CHOICE'
          ? options.map((o) => ({ id: o.id, textLatex: o.text || `Option ${o.label}` }))
          : undefined,
      correctOptionId,
      correctBoolean,
      acceptedAnswers: acceptedAnswers ? acceptedAnswers.split(',') : undefined,
      explanationLatex: explanationLatex || 'Solution explanation preview.',
    };
  }, [
    questionType,
    promptLatex,
    options,
    correctOptionId,
    correctBoolean,
    acceptedAnswers,
    explanationLatex,
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      {/* Top Header Row with Back link */}
      <div>
        <Link
          href={`/content/tests/${activeTabKey}`}
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
          Back to Test Management
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
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: tokens.textPrimary,
                margin: 0,
              }}
            >
              Create Question
            </h1>

            {/* Course Selector Dropdown */}
            {courses.length > 0 && (
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  fontSize: 13,
                  fontWeight: 500,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                  maxWidth: 420,
                  textOverflow: 'ellipsis',
                }}
              >
                {courses.map((c) => {
                  const p = programs.find((pr) => pr.id === c.programId);
                  const u = universities.find((un) => un.id === c.universityId);
                  const label = `${c.title} (${c.code}) - ${p?.name || 'Department'} - ${
                    u?.shortName || u?.name || 'University'
                  }`;
                  return (
                    <option key={c.id} value={c.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Action Buttons */}
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
              disabled={isSaving}
              onClick={() => handleSaveQuestion(false)}
              style={{
                padding: `${SPACING.sm}px ${SPACING.lg}px`,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surface,
                color: tokens.textPrimary,
                fontWeight: 600,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: 13,
              }}
            >
              Save Draft
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveQuestion(true)}
              style={{
                padding: `${SPACING.sm}px ${SPACING.xl}px`,
                borderRadius: RADIUS.md,
                border: 'none',
                backgroundColor: tokens.primary,
                color: tokens.sidebarText,
                fontWeight: 600,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: 13,
              }}
            >
              {isSaving ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      {/* Quiz Switcher Tabs: Quiz 1 | Quiz 2 | Quiz 3 */}
      <div style={{ display: 'flex', gap: SPACING.sm }}>
        {QUIZ_TABS.map((tab) => {
          const isActive = tab.key === activeTabKey;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabClick(tab.key)}
              style={{
                padding: `${SPACING.xs}px ${SPACING.xl}px`,
                borderRadius: RADIUS.md,
                border: `1px solid ${isActive ? tokens.primary : tokens.border}`,
                backgroundColor: isActive ? tokens.primary : tokens.surface,
                color: isActive ? tokens.sidebarText : tokens.primary,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Two-Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: SPACING.xl,
          alignItems: 'start',
        }}
      >
        {/* Left Column: Chapters Navigation */}
        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.xs,
              marginBottom: SPACING.sm,
            }}
          >
            <BookOpen size={16} color={tokens.primary} />
            <span style={{ fontSize: 13, fontWeight: 700, color: tokens.textPrimary }}>
              Chapters
            </span>
          </div>

          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: tokens.textPrimary,
              marginBottom: SPACING.md,
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.xs,
            }}
          >
            <FileText size={16} color={tokens.textMuted} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedCourse?.title || 'Selected Course'}
            </span>
          </div>

          <label
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 600,
              color: tokens.textMuted,
              marginBottom: SPACING.xs,
            }}
          >
            Search chapters
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.xs,
              padding: '6px 10px',
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              marginBottom: SPACING.lg,
            }}
          >
            <Search size={14} color={tokens.textMuted} />
            <input
              type="text"
              value={chapterFilter}
              onChange={(e) => setChapterFilter(e.target.value)}
              placeholder="Filter chapters..."
              style={{
                border: 'none',
                outline: 'none',
                fontSize: 13,
                width: '100%',
                backgroundColor: 'transparent',
                color: tokens.textPrimary,
              }}
            />
          </div>

          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: tokens.textMuted,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: SPACING.sm,
            }}
          >
            Chapters
          </div>

          {/* Chapters List */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.xs,
              marginBottom: SPACING.lg,
              maxHeight: 380,
              overflowY: 'auto',
            }}
          >
            {filteredChapters.length === 0 ? (
              <div
                style={{
                  fontSize: 12,
                  color: tokens.textMuted,
                  padding: SPACING.md,
                  textAlign: 'center',
                  backgroundColor: tokens.surfaceSubtle,
                  borderRadius: RADIUS.md,
                  lineHeight: 1.5,
                }}
              >
                No chapters created yet for {activeQuiz.label}. Click &apos;+ Add New Chapter&apos; below to create one.
              </div>
            ) : (
              filteredChapters.map((ch) => {
                const isSelected = ch.id === selectedChapterId;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setSelectedChapterId(ch.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: SPACING.sm,
                      padding: `${SPACING.sm}px ${SPACING.md}px`,
                      borderRadius: RADIUS.md,
                      border: `1px solid ${isSelected ? tokens.primary : tokens.border}`,
                      backgroundColor: isSelected ? tokens.primary : tokens.surface,
                      color: isSelected ? tokens.sidebarText : tokens.textPrimary,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: RADIUS.sm,
                        backgroundColor: isSelected
                          ? 'rgba(255, 255, 255, 0.2)'
                          : tokens.surfaceSubtle,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileText
                        size={15}
                        color={isSelected ? tokens.sidebarText : tokens.primary}
                      />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        Chapter {ch.orderIndex}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          opacity: isSelected ? 0.85 : 0.65,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {ch.title || `${selectedCourse?.title} - Chapter ${ch.orderIndex}`}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Add New Chapter Button & Inline Form */}
          {isAddingChapter ? (
            <form onSubmit={handleAddChapterSubmit} style={{ marginTop: SPACING.sm }}>
              <input
                type="text"
                autoFocus
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="e.g. Chapter 2: Cell Structure"
                style={{
                  width: '100%',
                  padding: SPACING.sm,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  fontSize: 13,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                  marginBottom: SPACING.xs,
                }}
              />
              <div style={{ display: 'flex', gap: SPACING.xs }}>
                <button
                  type="submit"
                  disabled={isSubmittingChapter}
                  style={{
                    flex: 1,
                    padding: `${SPACING.xs}px ${SPACING.sm}px`,
                    borderRadius: RADIUS.md,
                    border: 'none',
                    backgroundColor: tokens.primary,
                    color: tokens.sidebarText,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isSubmittingChapter ? 'Adding...' : 'Add Chapter'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingChapter(false);
                    setNewChapterTitle('');
                  }}
                  style={{
                    padding: `${SPACING.xs}px ${SPACING.sm}px`,
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingChapter(true)}
              style={{
                width: '100%',
                padding: SPACING.md,
                borderRadius: RADIUS.md,
                border: 'none',
                backgroundColor: tokens.primary,
                color: tokens.sidebarText,
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: SPACING.xs,
              }}
            >
              <Plus size={16} />
              Add New Chapter
            </button>
          )}
        </div>

        {/* Right Column: Question Authoring Panel */}
        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.xl,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.lg,
          }}
        >
          {/* Chapter Selector Dropdown */}
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
              Chapter
            </label>
            <select
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                fontSize: 13,
                backgroundColor: tokens.surface,
                color: tokens.textPrimary,
              }}
            >
              {chapters.length === 0 ? (
                <option value="">No chapters available (add one on left)</option>
              ) : (
                chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    Chapter {ch.orderIndex}: {ch.title}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Question Type Radio Pills */}
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
              Question type
            </label>
            <div style={{ display: 'flex', gap: SPACING.lg, flexWrap: 'wrap' }}>
              {(
                [
                  { id: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
                  { id: 'TRUE_FALSE', label: 'True / False' },
                  { id: 'SHORT_ANSWER', label: 'Short Answer' },
                  { id: 'BLANK_SPACE', label: 'Blank Space' },
                ] as const
              ).map((type) => {
                const isSelected = questionType === type.id;
                return (
                  <label
                    key={type.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: SPACING.xs,
                      fontSize: 13,
                      color: tokens.textPrimary,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="questionType"
                      value={type.id}
                      checked={isSelected}
                      onChange={() => setQuestionType(type.id)}
                    />
                    {type.label}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Question Prompt Field */}
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
              Question
            </label>
            <textarea
              rows={5}
              value={promptLatex}
              onChange={(e) => setPromptLatex(e.target.value.slice(0, 500))}
              placeholder="Enter question text here..."
              style={{
                width: '100%',
                padding: SPACING.md,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surface,
                color: tokens.textPrimary,
                fontSize: 14,
                fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
            />

            {/* Math / LaTeX Helper Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginTop: SPACING.xs,
              }}
            >
              <div>
                <button
                  type="button"
                  onClick={() => setIsMathHelperOpen(!isMathHelperOpen)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    color: tokens.primary,
                    cursor: 'pointer',
                  }}
                >
                  {isMathHelperOpen ? '▴ Hide Math (LaTeX)' : '▾ Insert Math (LaTeX)'}
                </button>
                <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 2 }}>
                  Write formulas between $ signs, for example $x^2 + 1$.
                </div>

                {isMathHelperOpen && (
                  <div
                    style={{
                      display: 'flex',
                      gap: SPACING.xs,
                      flexWrap: 'wrap',
                      marginTop: SPACING.xs,
                      padding: SPACING.xs,
                      backgroundColor: tokens.surfaceSubtle,
                      borderRadius: RADIUS.sm,
                    }}
                  >
                    {[
                      { label: 'x²', val: '$x^2$' },
                      { label: '√x', val: '$\\sqrt{x}$' },
                      { label: 'a/b', val: '$\\frac{a}{b}$' },
                      { label: '∫', val: '$\\int f(x)dx$' },
                      { label: 'π', val: '$\\pi$' },
                      { label: '∑', val: '$\\sum_{i=1}^n$' },
                      { label: 'α', val: '$\\alpha$' },
                      { label: 'θ', val: '$\\theta$' },
                    ].map((snip) => (
                      <button
                        key={snip.label}
                        type="button"
                        onClick={() => insertLatexSnippet(snip.val)}
                        style={{
                          padding: '2px 8px',
                          borderRadius: RADIUS.sm,
                          border: `1px solid ${tokens.border}`,
                          backgroundColor: tokens.surface,
                          color: tokens.textPrimary,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        {snip.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span style={{ fontSize: 12, color: tokens.textMuted }}>
                {promptLatex.length}/500
              </span>
            </div>
          </div>

          {/* Answer Options Section */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: tokens.textPrimary,
                marginBottom: SPACING.sm,
              }}
            >
              Answer options
            </label>

            {questionType === 'MULTIPLE_CHOICE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
                {options.map((opt, idx) => (
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
                      name="correctOption"
                      checked={correctOptionId === opt.id}
                      onChange={() => setCorrectOptionId(opt.id)}
                      title="Mark as correct answer"
                    />
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: RADIUS.pill,
                        backgroundColor:
                          correctOptionId === opt.id
                            ? tokens.primary
                            : tokens.surfaceSubtle,
                        color:
                          correctOptionId === opt.id
                            ? tokens.sidebarText
                            : tokens.textPrimary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {opt.label}
                    </div>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${opt.label} text or formula...`}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: RADIUS.md,
                        border: `1px solid ${tokens.border}`,
                        fontSize: 13,
                        backgroundColor: tokens.surface,
                        color: tokens.textPrimary,
                      }}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(opt.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: tokens.textMuted,
                          padding: 4,
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}

                {options.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: SPACING.xs,
                      padding: `${SPACING.xs}px ${SPACING.md}px`,
                      borderRadius: RADIUS.md,
                      border: `1px dashed ${tokens.border}`,
                      backgroundColor: 'transparent',
                      color: tokens.primary,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Plus size={14} />
                    Add Option
                  </button>
                )}
              </div>
            )}

            {questionType === 'TRUE_FALSE' && (
              <div style={{ display: 'flex', gap: SPACING.xl }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.xs,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    color: tokens.textPrimary,
                  }}
                >
                  <input
                    type="radio"
                    name="tfCorrect"
                    checked={correctBoolean === true}
                    onChange={() => setCorrectBoolean(true)}
                  />
                  True
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.xs,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    color: tokens.textPrimary,
                  }}
                >
                  <input
                    type="radio"
                    name="tfCorrect"
                    checked={correctBoolean === false}
                    onChange={() => setCorrectBoolean(false)}
                  />
                  False
                </label>
              </div>
            )}

            {(questionType === 'SHORT_ANSWER' || questionType === 'BLANK_SPACE') && (
              <div>
                <input
                  type="text"
                  value={acceptedAnswers}
                  onChange={(e) => setAcceptedAnswers(e.target.value)}
                  placeholder="Enter accepted answer(s), separated by commas (e.g. Mitochondria, mitochondria)"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    fontSize: 13,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                  }}
                />
              </div>
            )}
          </div>

          {/* Explanation Textarea */}
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
              Explanation (Optional)
            </label>
            <textarea
              rows={3}
              value={explanationLatex}
              onChange={(e) => setExplanationLatex(e.target.value)}
              placeholder="Explain why this answer is correct. Formulas use $...$"
              style={{
                width: '100%',
                padding: SPACING.md,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surface,
                color: tokens.textPrimary,
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>
      </div>

      {/* Simulator Modal for "Review as student" */}
      <StudentSimulatorModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={currentChapter?.title || selectedCourse?.title || 'Quiz Preview'}
        question={simulatorQuestionData as any}
      />
    </div>
  );
}
