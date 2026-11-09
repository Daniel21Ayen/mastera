import React, { useState } from 'react';
import {
  AcademicStream,
  AdminRole,
  CatalogCourseDto,
  CatalogProgramDto,
  CatalogUniversityDto,
  ExamCategory,
  QuestionType,
} from '@mastera/contracts';
import {
  ADMIN_THEMES,
  RADIUS,
  SPACING,
  ThemeMode,
} from '@mastera/ui-tokens';
import { AuthoringActionBar } from '../shared/AuthoringActionBar';

export interface BuildExamSetModalProps {
  isOpen: boolean;
  category: ExamCategory;
  courses: CatalogCourseDto[];
  universities?: CatalogUniversityDto[] | undefined;
  programs?: CatalogProgramDto[] | undefined;
  onClose: () => void;
  onBuildSet: (payload: {
    category: ExamCategory;
    courseId: string | null;
    universityId?: string | null | undefined;
    programId?: string | null | undefined;
    semester: 1 | 2;
    stream: AcademicStream;
    year: string;
    examSetCode: string;
    timeAllowedMinutes: number;
    isFreeSample: boolean;
  }) => void;
  themeMode?: ThemeMode | undefined;
}

export function BuildExamSetModal({
  isOpen,
  category,
  courses,
  universities = [],
  programs = [],
  onClose,
  onBuildSet,
  themeMode = 'light',
}: BuildExamSetModalProps): React.ReactElement | null {
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>(
    universities[0]?.id ?? ''
  );
  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    programs[0]?.id ?? ''
  );
  const [courseId, setCourseId] = useState<string>(courses[0]?.id ?? '');
  const [semester, setSemester] = useState<1 | 2>(1);
  const [stream, setStream] = useState<AcademicStream>('NATURAL');
  const [year, setYear] = useState('2026 / 2027');
  const [examSetCode, setExamSetCode] = useState('');
  const [timeAllowedMinutes, setTimeAllowedMinutes] = useState(60);
  const [isFreeSample, setIsFreeSample] = useState(false);

  if (!isOpen) return null;

  const tokens = ADMIN_THEMES[themeMode];

  const modalTitle =
    category === 'MID'
      ? 'Build Mid Exam Set'
      : category === 'FINAL'
      ? 'Build Final Exam Set'
      : category === 'MOCK'
      ? 'Build Mock Exam Set'
      : 'Build COC Set';

  const isMock = category === 'MOCK';
  const isCoc = category === 'COC';

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: tokens.surface,
          borderRadius: RADIUS.xl,
          padding: SPACING.xl,
          width: 720,
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: `1px solid ${tokens.border}`,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 20, fontWeight: 700, color: tokens.textPrimary }}>
          {modalTitle}
        </h2>
        <p style={{ color: tokens.textMuted, fontSize: 13, marginTop: -4, marginBottom: SPACING.lg }}>
          Define the target academic scope, course and parameters for this new exam set.
        </p>

        {/* 1. TARGET ACADEMIC SCOPE */}
        <div
          style={{
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            marginBottom: SPACING.md,
            backgroundColor: tokens.surface,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: '0.05em', color: tokens.textPrimary, marginBottom: SPACING.md }}>
            1. TARGET ACADEMIC SCOPE
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMock ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
              gap: SPACING.md,
            }}
          >
            {/* University (Except for Mock) */}
            {!isMock && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                  University
                </label>
                <select
                  value={selectedUniversityId}
                  onChange={(e) => setSelectedUniversityId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    fontSize: 13,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
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
            )}

            {/* Program / Department */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                Program / Department
              </label>
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  fontSize: 13,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
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

            {/* Semester */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value) as 1 | 2)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  fontSize: 13,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                }}
              >
                <option value={1}>Semester 1</option>
                <option value={2}>Semester 2</option>
              </select>
            </div>

            {/* Stream */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                Stream
              </label>
              <select
                value={stream}
                onChange={(e) => setStream(e.target.value as AcademicStream)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  fontSize: 13,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                }}
              >
                <option value="NATURAL">Natural</option>
                <option value="SOCIAL">Social</option>
                <option value="COMMON">Common Courses</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. COURSE & ASSESSMENT YEAR */}
        <div
          style={{
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            marginBottom: SPACING.md,
            backgroundColor: tokens.surface,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: '0.05em', color: tokens.textPrimary, marginBottom: SPACING.md }}>
            2. COURSE & ASSESSMENT YEAR
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isCoc || isMock ? '1fr' : '1fr 1fr',
              gap: SPACING.md,
            }}
          >
            {/* Course (Except for COC) */}
            {!isCoc && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                  Course
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    fontSize: 13,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
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
            )}

            {/* Year (Except for Mock) */}
            {!isMock && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                  Year
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    fontSize: 13,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                  }}
                >
                  <option value="2026 / 2027">2026 / 2027</option>
                  <option value="2025 / 2026">2025 / 2026</option>
                  <option value="2024 / 2025">2024 / 2025</option>
                  <option value="2023 / 2024">2023 / 2024</option>
                  <option value="2022 / 2023">2022 / 2023</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* 3. EXAM PARAMETERS */}
        <div
          style={{
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            marginBottom: SPACING.xl,
            backgroundColor: tokens.surface,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: '0.05em', color: tokens.textPrimary, marginBottom: SPACING.md }}>
            3. EXAM PARAMETERS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: SPACING.md }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                Exam Set ID
              </label>
              <input
                type="text"
                value={examSetCode}
                onChange={(e) => setExamSetCode(e.target.value)}
                placeholder="Exam Set ID"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  fontSize: 13,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                Allowed Time (minutes)
              </label>
              <input
                type="number"
                min={1}
                value={timeAllowedMinutes}
                onChange={(e) => setTimeAllowedMinutes(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  fontSize: 13,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: tokens.textPrimary, marginBottom: 4 }}>
                Access / Permission
              </label>
              <select
                value={isFreeSample ? 'FREE' : 'PAID'}
                onChange={(e) => setIsFreeSample(e.target.value === 'FREE')}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  fontSize: 13,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                }}
              >
                <option value="PAID">Paid course only</option>
                <option value="FREE">Free trial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: SPACING.md }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: `${SPACING.sm}px ${SPACING.xl}px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
              backgroundColor: tokens.surface,
              color: tokens.textPrimary,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onBuildSet({
                category,
                courseId: isCoc ? null : courseId || null,
                universityId: !isMock ? selectedUniversityId || null : null,
                programId: selectedProgramId || null,
                semester,
                stream,
                year: !isMock ? year : '2026 / 2027',
                examSetCode: examSetCode || `SET-${category}-${Date.now().toString().slice(-4)}`,
                timeAllowedMinutes,
                isFreeSample,
              });
            }}
            style={{
              padding: `${SPACING.sm}px ${SPACING.xxl}px`,
              borderRadius: RADIUS.md,
              border: 'none',
              backgroundColor: tokens.primary,
              color: tokens.sidebarText,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Build set
          </button>
        </div>
      </div>
    </div>
  );
}

export interface QuestionAuthoringFormProps {
  nextSuggestedQuestionNumber: number; // FR-G11: restarts at 1 per set
  actorRole: AdminRole;
  canPublish: boolean;
  onOpenBulkCsvImport: () => void;
  onSubmitQuestion: (payload: {
    displayNumber: number;
    questionType: QuestionType;
    promptLatex: string;
    options?: { id: string; textLatex: string }[];
    correctOptionId?: string;
    correctBoolean?: boolean;
    acceptedAnswers?: string[];
    explanationLatex: string;
    publishImmediately: boolean;
  }) => void;
  themeMode?: ThemeMode;
}

export function QuestionAuthoringForm({
  nextSuggestedQuestionNumber,
  actorRole,
  canPublish,
  onOpenBulkCsvImport,
  onSubmitQuestion,
  themeMode = 'light',
}: QuestionAuthoringFormProps): React.ReactElement {
  const [displayNumber, setDisplayNumber] = useState<number>(
    nextSuggestedQuestionNumber
  );
  const [questionType, setQuestionType] =
    useState<QuestionType>('MULTIPLE_CHOICE');
  const [promptLatex, setPromptLatex] = useState('');
  const [options, setOptions] = useState([
    { id: 'A', textLatex: '' },
    { id: 'B', textLatex: '' },
    { id: 'C', textLatex: '' },
    { id: 'D', textLatex: '' },
  ]);
  const [correctOptionId, setCorrectOptionId] = useState('A');
  const [correctBoolean, setCorrectBoolean] = useState(true);
  const [acceptedAnswers, setAcceptedAnswers] = useState<string[]>(['']);
  const [explanationLatex, setExplanationLatex] = useState('');

  const tokens = ADMIN_THEMES[themeMode];

  const handleReset = () => {
    setPromptLatex('');
    setExplanationLatex('');
    setAcceptedAnswers(['']);
  };

  const triggerSubmit = (publishImmediately: boolean) => {
    onSubmitQuestion({
      displayNumber,
      questionType,
      promptLatex,
      ...(questionType === 'MULTIPLE_CHOICE'
        ? { options, correctOptionId }
        : {}),
      ...(questionType === 'TRUE_FALSE' ? { correctBoolean } : {}),
      ...(questionType === 'SHORT_ANSWER' || questionType === 'BLANK_SPACE'
        ? { acceptedAnswers: acceptedAnswers.filter((a) => a.trim().length > 0) }
        : {}),
      explanationLatex,
      publishImmediately,
    });
  };

  return (
    <div
      style={{
        backgroundColor: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: SPACING.lg,
          marginBottom: SPACING.lg,
        }}
      >
        <label style={{ fontSize: 13, fontWeight: 600 }}>
          Question Type
          <select
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value as QuestionType)}
            style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
          >
            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
            <option value="TRUE_FALSE">True / False</option>
            <option value="SHORT_ANSWER">Short Answer</option>
            <option value="BLANK_SPACE">Blank Space</option>
          </select>
        </label>

        {/* FR-G11: Question Number restarts at 1 per set; Admin MAY change to unused whole number */}
        <label style={{ fontSize: 13, fontWeight: 600 }}>
          Question Number
          <input
            type="number"
            min={1}
            value={displayNumber}
            onChange={(e) => setDisplayNumber(Number(e.target.value))}
            style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
          />
        </label>
      </div>

      <label
        style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 600,
          marginBottom: SPACING.md,
        }}
      >
        Question
        <textarea
          rows={4}
          maxLength={1000}
          value={promptLatex}
          onChange={(e) => setPromptLatex(e.target.value)}
          placeholder="Type the question. Put formulas between $ signs, e.g. $x^2 + 1$."
          style={{ width: '100%', padding: SPACING.md, marginTop: 4 }}
        />
        <span style={{ fontSize: 11, color: tokens.textMuted }}>
          Write formulas between $ signs, for example $x^2 + 1$. ({promptLatex.length}/1000)
        </span>
      </label>

      {questionType === 'MULTIPLE_CHOICE' && (
        <div style={{ marginBottom: SPACING.lg }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: SPACING.xs }}>
            Answer options
          </div>
          {options.map((opt, idx) => (
            <div
              key={opt.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.sm,
                marginBottom: SPACING.xs,
              }}
            >
              <input
                type="radio"
                name="correctOption"
                checked={correctOptionId === opt.id}
                onChange={() => setCorrectOptionId(opt.id)}
              />
              <input
                type="text"
                value={opt.textLatex}
                onChange={(e) => {
                  const next = [...options];
                  next[idx] = { id: opt.id, textLatex: e.target.value };
                  setOptions(next);
                }}
                placeholder={`Option ${idx + 1}`}
                style={{ flex: 1, padding: SPACING.sm }}
              />
            </div>
          ))}
        </div>
      )}

      {questionType === 'TRUE_FALSE' && (
        <div style={{ marginBottom: SPACING.lg }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: SPACING.xs }}>
            Correct answer
          </div>
          <label style={{ marginRight: SPACING.lg }}>
            <input
              type="radio"
              checked={correctBoolean === true}
              onChange={() => setCorrectBoolean(true)}
            />{' '}
            True
          </label>
          <label>
            <input
              type="radio"
              checked={correctBoolean === false}
              onChange={() => setCorrectBoolean(false)}
            />{' '}
            False
          </label>
        </div>
      )}

      {(questionType === 'SHORT_ANSWER' || questionType === 'BLANK_SPACE') && (
        <div style={{ marginBottom: SPACING.lg }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: SPACING.xs }}>
            Accepted answers (Add every answer that counts as correct)
          </div>
          {acceptedAnswers.map((ans, idx) => (
            <input
              key={idx}
              type="text"
              value={ans}
              onChange={(e) => {
                const next = [...acceptedAnswers];
                next[idx] = e.target.value;
                setAcceptedAnswers(next);
              }}
              placeholder={`Accepted answer ${idx + 1}`}
              style={{
                width: '100%',
                padding: SPACING.sm,
                marginBottom: SPACING.xs,
              }}
            />
          ))}
          <button
            type="button"
            onClick={() => setAcceptedAnswers([...acceptedAnswers, ''])}
            style={{
              padding: `${SPACING.xs}px ${SPACING.md}px`,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.primary}`,
              backgroundColor: tokens.surface,
              color: tokens.primary,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Add accepted answer
          </button>
        </div>
      )}

      <label
        style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 600,
          marginBottom: SPACING.md,
        }}
      >
        Answer Description
        <textarea
          rows={3}
          maxLength={500}
          value={explanationLatex}
          onChange={(e) => setExplanationLatex(e.target.value)}
          placeholder="Explain why this answer is correct..."
          style={{ width: '100%', padding: SPACING.md, marginTop: 4 }}
        />
        <span style={{ fontSize: 11, color: tokens.textMuted }}>
          This explanation will be shown to students after they answer the
          question. ({explanationLatex.length}/500)
        </span>
      </label>

      <AuthoringActionBar
        actorRole={actorRole}
        canPublish={canPublish}
        onAdd={() => triggerSubmit(false)}
        onBulkImport={onOpenBulkCsvImport}
        onReset={handleReset}
        onSaveDraft={() => triggerSubmit(false)}
        onSubmitReview={() => triggerSubmit(false)}
        onPublish={() => triggerSubmit(true)}
        themeMode={themeMode}
      />
    </div>
  );
}