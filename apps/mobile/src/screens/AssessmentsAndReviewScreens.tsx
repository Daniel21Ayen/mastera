import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import {
  CatalogBookGroupDto,
  CatalogChapterMetaDto,
  CatalogExamSetMetaDto,
  QuestionItemDto,
  QuizTarget,
  StudentAccountState,
} from '@mastera/contracts';
import {
  RADIUS,
  SPACING,
  STUDENT_THEMES,
  ThemeMode,
  COURSE_ACCENTS,
} from '@mastera/ui-tokens';
import { ResolvedCatalogRowView } from '../core/database/local-catalog-store';
import { MasteraIcon } from '../shared/components/MasteraIcon';

type QuizAttemptMode = 'PRACTICE' | 'EXAM';
type QuestionNavigationMode = 'PAGED' | 'SCROLL';

// ============================================================================
// 1. TESTS TAB: 3-STEP QUIZ FLOW
// ============================================================================

export interface CourseTestsTabProps {
  courseTitle: string;
  courseId?: string;
  courseChapters?: CatalogChapterMetaDto[];
  quizBooks: ResolvedCatalogRowView<CatalogBookGroupDto>[];
  chaptersByBookId: Record<
    string,
    ResolvedCatalogRowView<CatalogChapterMetaDto>[]
  >;
  questionsByChapterId: Record<string, QuestionItemDto[]>;
  onSwitchCourseTopTab: (tab: 'MATERIAL' | 'TESTS' | 'EXAMS') => void;
  onLockedItemTap: () => void;
  onDownloadChapterTap: (chapterId: string) => void;
  onCompleteQuizChapter: (
    chapterId: string,
    answers: Record<string, string>,
    mode?: QuizAttemptMode
  ) => void;
  onBackToCourses?: () => void;
  themeMode?: ThemeMode;
}

export function CourseTestsQuizFlowScreen({
  courseTitle,
  courseId,
  courseChapters,
  quizBooks,
  chaptersByBookId,
  questionsByChapterId,
  onSwitchCourseTopTab,
  onLockedItemTap,
  onDownloadChapterTap,
  onCompleteQuizChapter,
  onBackToCourses,
  themeMode = 'light',
}: CourseTestsTabProps): React.ReactElement {
  const [activeQuizTab, setActiveQuizTab] = useState<QuizTarget>('QUIZ_1');
  const [activeChapter, setActiveChapter] =
    useState<CatalogChapterMetaDto | null>(null);
  const [pendingChapter, setPendingChapter] =
    useState<CatalogChapterMetaDto | null>(null);
  const [quizMode, setQuizMode] = useState<'PRACTICE' | 'EXAM'>('PRACTICE');
  const [navMode, setNavMode] = useState<'PAGED' | 'SCROLL'>('PAGED');
  const [stage, setStage] = useState<'CHAPTERS' | 'RUNNING' | 'REVIEW'>('CHAPTERS');
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [quizMode, setQuizMode] = useState<QuizAttemptMode | null>(null);
  const [quizNavigationMode, setQuizNavigationMode] =
    useState<QuestionNavigationMode>('PAGED');
  const [quizFinished, setQuizFinished] = useState(false);

  const tokens = STUDENT_THEMES[themeMode];

  const quizTabLabel =
    activeQuizTab === 'QUIZ_1'
      ? 'Quiz 1'
      : activeQuizTab === 'QUIZ_2'
      ? 'Quiz 2'
      : 'Quiz 3';

  // ==========================================================================
  // STAGE 3: ANSWER REVIEW (Shown after Exam submission or Practice completion)
  // ==========================================================================
  if (stage === 'REVIEW' && activeChapter) {
    const questions = questionsByChapterId[activeChapter.id] ?? [];

    if (!quizMode) {
      return (
        <ScrollView
          style={[styles.container, { backgroundColor: tokens.background }]}
          contentContainerStyle={styles.scrollContent}
        >
          <TouchableOpacity
            onPress={() => setActiveChapter(null)}
            style={styles.backBtnRow}
          >
            <MasteraIcon name="chevron-left" size={18} color={tokens.textPrimary} />
            <Text style={[styles.backBtnText, { color: tokens.textPrimary }]}>Choose another quiz</Text>
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: tokens.textPrimary }]}>
            {activeChapter.title}
          </Text>
          <Text style={[styles.helperText, { color: tokens.textMuted }]}>Choose how you want to attempt this quiz.</Text>
          <View style={styles.modeChoiceCol}>
            {([
              ['PRACTICE', 'Practice Mode', 'See correctness and explanations immediately.'],
              ['EXAM', 'Exam Mode', 'See answers and explanations only after submitting.'],
            ] as const).map(([mode, title, description]) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setQuizMode(mode)}
                style={[styles.modeChoiceCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
              >
                <Text style={[styles.modeChoiceTitle, { color: tokens.textPrimary }]}>{title}</Text>
                <Text style={[styles.modeChoiceDescription, { color: tokens.textMuted }]}>{description}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.helperText, { color: tokens.textMuted, marginTop: SPACING.lg }]}>Question navigation</Text>
          <View style={styles.prevNextRow}>
            {(['PAGED', 'SCROLL'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setQuizNavigationMode(mode)}
                style={[styles.prevNextBtn, { backgroundColor: quizNavigationMode === mode ? tokens.primary : tokens.surface, borderColor: tokens.primary }]}
              >
                <Text style={[styles.prevNextBtnText, { color: quizNavigationMode === mode ? tokens.surface : tokens.primary }]}>
                  {mode === 'PAGED' ? 'Next / Previous' : 'Scroll all'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      );
    }

    if (quizFinished && quizMode === 'EXAM') {
      const score = questions.filter((q) => selectedAnswers[q.id] === q.correctOptionId).length;
      return (
        <ScrollView style={[styles.container, { backgroundColor: tokens.background }]} contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.screenTitle, { color: tokens.textPrimary }]}>Quiz submitted</Text>
          <Text style={[styles.helperText, { color: tokens.textMuted }]}>Score: {score} / {questions.length}</Text>
          {questions.map((q, index) => (
            <View key={q.id} style={[styles.reviewCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
              <Text style={[styles.reviewPrompt, { color: tokens.textPrimary }]}>{index + 1}. {q.promptLatex}</Text>
              <Text style={[styles.reviewAnswerMeta, { color: selectedAnswers[q.id] === q.correctOptionId ? tokens.success : tokens.danger }]}>Your answer: {selectedAnswers[q.id] ?? 'Skipped'} · Correct: {q.correctOptionId}</Text>
              <Text style={[styles.reviewExplanation, { color: tokens.textPrimary }]}>Explanation: {q.explanationLatex}</Text>
            </View>
          ))}
          <TouchableOpacity onPress={() => { setActiveChapter(null); setQuizMode(null); setQuizFinished(false); setSelectedAnswers({}); }} style={[styles.primaryActionBtn, { backgroundColor: tokens.primary }]}>
            <Text style={[styles.primaryActionBtnText, { color: tokens.surface }]}>Back to quizzes</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }
    const currentQ = questions[questionIndex] ?? questions[0];

          <View
            style={[
              styles.badgePill,
              {
                backgroundColor: isPassed
                  ? tokens.successSoft
                  : tokens.dangerSoft,
              },
            ]}
          >
            <Text
              style={[
                styles.badgePillText,
                { color: isPassed ? tokens.success : tokens.danger },
              ]}
            >
              {isPassed ? 'Passed' : 'Needs Review'}
            </Text>
          </View>
        </View>

        {/* Score & Completion Banner */}
        <View
          style={[
            styles.bannerBox,
            {
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              borderWidth: 1,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              marginVertical: SPACING.md,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 13, color: tokens.textMuted }}>
                {quizMode === 'EXAM' ? 'Exam Mode Results' : 'Practice Mode Summary'}
              </Text>
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: '800',
                  color: isPassed ? tokens.success : tokens.amber,
                  marginTop: 2,
                }}
              >
                {score} / {questions.length} ({percent}%)
              </Text>
            </View>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: isPassed ? tokens.successSoft : tokens.amberSoft,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <MasteraIcon
                name={isPassed ? 'check-circle' : 'award'}
                size={24}
                color={isPassed ? tokens.success : tokens.amber}
              />
            </View>
          </View>
          <Text style={{ fontSize: 13, color: tokens.textMuted, marginTop: 8 }}>
            {isPassed
              ? 'Great job! You have demonstrated mastery of these quiz concepts.'
              : 'Review the detailed explanations below to improve your understanding.'}
          </Text>
        </View>

        {/* Toggle All Explanations */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.sm,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: tokens.textPrimary,
            }}
          >
            Questions Breakdown ({questions.length})
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (expandedQuestionIds.size === questions.length) {
                setExpandedQuestionIds(new Set());
              } else {
                setExpandedQuestionIds(new Set(questions.map((q) => q.id)));
              }
            }}
            style={[styles.outlineSmallBtn, { borderColor: tokens.primary }]}
          >
            <Text style={[styles.outlineSmallBtnText, { color: tokens.primary }]}>
              {expandedQuestionIds.size === questions.length
                ? 'Hide all'
                : 'Show all explanations'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Per-Question Review Cards */}
        <View style={styles.reviewCol}>
          {questions.map((q, idx) => {
            const chosen = selectedAnswers[q.id];
            const isCorrect = chosen === q.correctOptionId;
            const isExpanded = expandedQuestionIds.has(q.id);

            return (
              <View
                key={q.id}
                style={[
                  styles.reviewCard,
                  {
                    backgroundColor: tokens.surface,
                    borderColor: isCorrect ? tokens.success : tokens.danger,
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <MasteraIcon
                    name={isCorrect ? 'check-circle' : 'x-circle'}
                    size={16}
                    color={isCorrect ? tokens.success : tokens.danger}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: isCorrect ? tokens.success : tokens.danger,
                      marginLeft: 6,
                    }}
                  >
                    Question {idx + 1} · {isCorrect ? 'Correct' : 'Incorrect'}
                  </Text>
                </View>

                <Text
                  style={[styles.reviewPrompt, { color: tokens.textPrimary }]}
                >
                  {q.promptLatex}
                </Text>

                <Text
                  style={[styles.reviewAnswerMeta, { color: tokens.textMuted }]}
                >
                  Your Answer:{' '}
                  <Text
                    style={{
                      fontWeight: '700',
                      color: isCorrect ? tokens.success : tokens.danger,
                    }}
                  >
                    {chosen ? `Option ${chosen}` : 'Unanswered'}
                  </Text>
                  {'  ·  '}Correct:{' '}
                  <Text style={{ fontWeight: '700', color: tokens.success }}>
                    Option {q.correctOptionId}
                  </Text>
                </Text>

                {isExpanded ? (
                  <View
                    style={{
                      marginTop: SPACING.xs,
                      padding: SPACING.sm,
                      borderRadius: RADIUS.sm,
                      backgroundColor: tokens.background,
                    }}
                  >
                    <Text
                      style={[
                        styles.reviewExplanation,
                        { color: tokens.textPrimary },
                      ]}
                    >
                      {q.explanationLatex ||
                        'Detailed academic explanation provided for this concept.'}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() =>
                      setExpandedQuestionIds((prev) => {
                        const next = new Set(prev);
                        next.add(q.id);
                        return next;
                      })
                    }
                    style={[
                      styles.explanationBtn,
                      { borderColor: tokens.primary, marginTop: SPACING.xs },
                    ]}
                  >
                    <Text
                      style={[
                        styles.explanationBtnText,
                        { color: tokens.primary },
                      ]}
                    >
                      Show explanation
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={() => {
            setStage('CHAPTERS');
            setActiveChapter(null);
          }}
          style={[
            styles.primaryActionBtn,
            { backgroundColor: tokens.primary, marginTop: SPACING.lg },
          ]}
        >
          <Text
            style={[styles.primaryActionBtnText, { color: tokens.surface }]}
          >
            Back to {quizTabLabel} Chapters
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ==========================================================================
  // STAGE 2: QUESTION RUNNER (Dual Modes: PRACTICE vs EXAM, Dual Nav: PAGED vs SCROLL)
  // ==========================================================================
  if (stage === 'RUNNING' && activeChapter) {
    const questions = questionsByChapterId[activeChapter.id] ?? [];

    if (questions.length === 0) {
      return (
        <ScrollView
          style={[styles.container, { backgroundColor: tokens.background }]}
          contentContainerStyle={styles.scrollContent}
        >
          <TouchableOpacity
            onPress={() => {
              setStage('CHAPTERS');
              setActiveChapter(null);
            }}
            style={styles.backBtnRow}
          >
            <MasteraIcon name="chevron-left" size={18} color={tokens.textPrimary} />
            <Text style={[styles.backBtnText, { color: tokens.textPrimary }]}>
              Back to {quizTabLabel} chapters
            </Text>
          </TouchableOpacity>
          <Text style={[styles.emptyPromptText, { color: tokens.textMuted }]}>
            No questions in this chapter yet.
          </Text>
        </ScrollView>
      );
    }

    const isPractice = quizMode === 'PRACTICE';
    const currentQ = questions[questionIndex] ?? questions[0]!;
    const chosenOptionId = selectedAnswers[currentQ.id];
    const showFeedback = quizMode === 'PRACTICE';
    const progressRatio =
      questions.length > 0 ? (questionIndex + 1) / questions.length : 1;

    if (quizNavigationMode === 'SCROLL') {
      return (
        <ScrollView style={[styles.container, { backgroundColor: tokens.background }]} contentContainerStyle={styles.scrollContent}>
          <View style={styles.topNavRow}>
            <TouchableOpacity onPress={() => { setActiveChapter(null); setQuizMode(null); setQuizFinished(false); }} style={styles.backBtnRow}>
              <MasteraIcon name="chevron-left" size={18} color={tokens.textPrimary} />
              <Text style={[styles.backBtnText, { color: tokens.textPrimary }]}>{quizTabLabel} · {quizMode === 'PRACTICE' ? 'Practice' : 'Exam'}</Text>
            </TouchableOpacity>
            <View style={[styles.badgePill, { backgroundColor: tokens.primarySoft }]}><Text style={[styles.badgePillText, { color: tokens.primary }]}>{questions.length} questions</Text></View>
          </View>
          {questions.map((q, index) => {
            const selected = selectedAnswers[q.id];
            return (
              <View key={q.id} style={[styles.reviewCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                <Text style={[styles.questionPrompt, { color: tokens.textPrimary, fontSize: 16 }]}>{index + 1}. {q.promptLatex}</Text>
                {(q.options ?? []).map((opt) => {
                  const selectedOption = selected === opt.id;
                  const correctOption = opt.id === q.correctOptionId;
                  const feedback = showFeedback && selected;
                  return (
                    <TouchableOpacity key={opt.id} onPress={() => setSelectedAnswers((prev) => ({ ...prev, [q.id]: opt.id }))} style={[styles.optionBtn, { backgroundColor: feedback && correctOption ? tokens.successSoft : feedback && selectedOption ? tokens.dangerSoft : tokens.surface, borderColor: selectedOption ? tokens.primary : tokens.border, borderWidth: selectedOption ? 2 : 1 }]}>
                      <Text style={[styles.optionText, { color: tokens.textPrimary }]}>{opt.id}. {opt.textLatex}</Text>
                    </TouchableOpacity>
                  );
                })}
                {showFeedback && selected && <Text style={[styles.reviewExplanation, { color: tokens.textPrimary }]}>Explanation: {q.explanationLatex}</Text>}
              </View>
            );
          })}
          <TouchableOpacity onPress={() => { onCompleteQuizChapter(activeChapter.id, selectedAnswers, quizMode); if (quizMode === 'EXAM') { setQuizFinished(true); } else { setActiveChapter(null); setQuizMode(null); } }} style={[styles.primaryActionBtn, { backgroundColor: tokens.primary }]}>
            <Text style={[styles.primaryActionBtnText, { color: tokens.surface }]}>{quizMode === 'EXAM' ? 'Submit quiz' : 'Finish Quiz'}</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Header Row */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            onPress={() => {
              setStage('CHAPTERS');
              setActiveChapter(null);
              setQuizMode(null);
              setQuizFinished(false);
              setQuestionIndex(0);
            }}
            style={styles.backBtnRow}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <View style={[styles.topBackArrowBtn, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
              <MasteraIcon name="chevron-left" size={18} color={tokens.textPrimary} />
            </View>
            <Text style={[styles.backBtnText, { color: tokens.textPrimary }]}>
              {quizTabLabel} · Ch {activeChapter.orderIndex}
            </Text>
          </TouchableOpacity>

          {/* Dual Navigation Switcher Pill: [ 📄 Pages | 📜 Scroll ] */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: tokens.surface,
              borderRadius: RADIUS.pill,
              borderWidth: 1,
              borderColor: tokens.border,
              padding: 2,
            }}
          >
            <TouchableOpacity
              onPress={() => setNavMode('PAGED')}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: RADIUS.pill,
                backgroundColor: navMode === 'PAGED' ? tokens.primary : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: navMode === 'PAGED' ? tokens.surface : tokens.textMuted,
                }}
              >
                📄 Pages
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setNavMode('SCROLL')}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: RADIUS.pill,
                backgroundColor: navMode === 'SCROLL' ? tokens.primary : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: navMode === 'SCROLL' ? tokens.surface : tokens.textMuted,
                }}
              >
                📜 Scroll
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mode Pill: Practice vs Exam */}
          <View
            style={[
              styles.badgePill,
              {
                backgroundColor: isPractice ? tokens.primarySoft : tokens.amberSoft,
              },
            ]}
          >
            <Text
              style={[
                styles.badgePillText,
                { color: isPractice ? tokens.primary : tokens.amber },
              ]}
            >
              {isPractice ? 'Practice' : 'Exam Mode'}
            </Text>
          </View>
        </View>

        {/* Question Prompt */}
        <Text style={[styles.questionPrompt, { color: tokens.textPrimary }]}>
          {currentQ.promptLatex}
        </Text>

        {/* Answer Options */}
        <View style={styles.optionsCol}>
          {(currentQ.options ?? []).map((opt) => {
            const isSelected = chosenOptionId === opt.id;
            const hasAnswered = !!chosenOptionId;
            const isCorrectOption = opt.id === currentQ.correctOptionId;

            let optBg = tokens.surface;
            let optBorder = tokens.border;
            let optTextColor = tokens.textPrimary;
            let optBadge: string | null = null;
            let optBadgeColor = tokens.textMuted;

            if (hasAnswered && showFeedback) {
              if (isCorrectOption) {
                optBg = tokens.successSoft;
                optBorder = tokens.success;
                optTextColor = tokens.success;
                optBadge = isSelected ? '✓ Correct (Your answer)' : '✓ Correct answer';
                optBadgeColor = tokens.success;
              } else if (isSelected) {
                optBg = tokens.dangerSoft;
                optBorder = tokens.danger;
                optTextColor = tokens.danger;
                optBadge = '✗ Your answer (Incorrect)';
                optBadgeColor = tokens.danger;
              }
            } else if (isSelected) {
              optBg = tokens.primarySoft;
              optBorder = tokens.primary;
              optTextColor = tokens.primary;
            }

            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() =>
                  setSelectedAnswers((prev) => ({
                    ...prev,
                    [currentQ.id]: opt.id,
                  }))
                }
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.round(progressRatio * 100)}%`,
                    backgroundColor: isPractice ? tokens.primary : tokens.amber,
                  },
                ]}
              />
            </View>

            <Text
              style={[
                styles.helperText,
                { color: tokens.textMuted, marginVertical: SPACING.xs },
              ]}
            >
              Question {questionIndex + 1} of {questions.length}
            </Text>

            {/* Question Prompt */}
            <Text style={[styles.questionPrompt, { color: tokens.textPrimary, fontSize: 17, marginBottom: SPACING.md }]}>
              {currentQ.promptLatex}
            </Text>

            {/* Answer Options */}
            <View style={styles.optionsCol}>
              {(currentQ.options ?? []).map((opt) => {
                const isSelected = chosenOptionId === opt.id;
                const hasAnswered = !!chosenOptionId;
                const isCorrectOption = opt.id === currentQ.correctOptionId;

                let optBg = tokens.surface;
                let optBorder = tokens.border;
                let optTextColor = tokens.textPrimary;
                let optBadge: string | null = null;
                let optBadgeColor = tokens.textMuted;

                if (isPractice && hasAnswered) {
                  if (isCorrectOption) {
                    optBg = tokens.successSoft;
                    optBorder = tokens.success;
                    optTextColor = tokens.success;
                    optBadge = isSelected ? '✓ Correct (Your answer)' : '✓ Correct answer';
                    optBadgeColor = tokens.success;
                  } else if (isSelected) {
                    optBg = tokens.dangerSoft;
                    optBorder = tokens.danger;
                    optTextColor = tokens.danger;
                    optBadge = '✗ Your answer (Incorrect)';
                    optBadgeColor = tokens.danger;
                  }
                } else if (isSelected) {
                  optBg = isPractice ? tokens.primarySoft : tokens.amberSoft;
                  optBorder = isPractice ? tokens.primary : tokens.amber;
                  optTextColor = isPractice ? tokens.primary : tokens.textPrimary;
                }

                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() =>
                      setSelectedAnswers((prev) => ({
                        ...prev,
                        [currentQ.id]: opt.id,
                      }))
                    }
                    style={[
                      styles.optionBtn,
                      {
                        backgroundColor: optBg,
                        borderColor: optBorder,
                        borderWidth: isSelected || (isPractice && hasAnswered && isCorrectOption) ? 2 : 1,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color: optTextColor,
                            fontWeight: isSelected || (isPractice && hasAnswered && isCorrectOption) ? '700' : '500',
                          },
                        ]}
                      >
                        {opt.id}. {opt.textLatex || (opt as any).text}
                      </Text>
                      {optBadge && (
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: optBadgeColor,
                            marginTop: 4,
                          }}
                        >
                          {optBadge}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Immediate Explanation Card (Practice Mode Only) */}
            {isPractice && (
              chosenOptionId ? (
                <View
                  style={[
                    styles.explanationBox,
                    {
                      backgroundColor:
                        chosenOptionId === currentQ.correctOptionId
                          ? tokens.successSoft
                          : tokens.surface,
                      borderColor:
                        chosenOptionId === currentQ.correctOptionId
                          ? tokens.success
                          : tokens.border,
                      borderWidth: 1.5,
                      borderRadius: RADIUS.md,
                      padding: SPACING.md,
                      marginTop: SPACING.md,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <MasteraIcon
                      name={chosenOptionId === currentQ.correctOptionId ? 'check-circle' : 'info'}
                      size={18}
                      color={
                        chosenOptionId === currentQ.correctOptionId
                          ? tokens.success
                          : tokens.danger
                      }
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color:
                          chosenOptionId === currentQ.correctOptionId
                            ? tokens.success
                            : tokens.danger,
                        marginLeft: 8,
                      }}
                    >
                      {chosenOptionId === currentQ.correctOptionId
                        ? 'Correct Answer!'
                        : `Incorrect · Option ${currentQ.correctOptionId} is correct`}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.explanationText,
                      {
                        color: tokens.textPrimary,
                        fontSize: 13,
                        lineHeight: 19,
                      },
                    ]}
                  >
                    {currentQ.explanationLatex || 'Detailed explanation provided for academic concept.'}
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.explanationBox,
                    {
                      backgroundColor: tokens.surface,
                      borderColor: tokens.border,
                      borderRadius: RADIUS.md,
                      padding: SPACING.md,
                      marginTop: SPACING.md,
                    },
                  ]}
                >
                  <Text style={[styles.explanationText, { color: tokens.textMuted }]}>
                    Select an answer above to see immediate feedback and full explanation.
                  </Text>
                </View>
              )
            )}

            {/* Paged Navigation Row: Previous & Next */}
            <View style={[styles.prevNextRow, { marginTop: SPACING.lg }]}>
              <TouchableOpacity
                disabled={questionIndex === 0}
                onPress={() => setQuestionIndex((i) => Math.max(0, i - 1))}
                style={[
                  styles.prevNextBtn,
                  {
                    borderColor: isPractice ? tokens.primary : tokens.amber,
                    backgroundColor: tokens.surface,
                    opacity: questionIndex === 0 ? 0.4 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.prevNextBtnText,
                    { color: isPractice ? tokens.primary : tokens.amber },
                  ]}
                >
                  Previous
                </Text>
              </TouchableOpacity>

        {/* Immediate Explanation Card */}
        {showFeedback && chosenOptionId ? (
          <View
            style={[
              styles.explanationBox,
              {
                backgroundColor:
                  chosenOptionId === currentQ.correctOptionId
                    ? tokens.successSoft
                    : tokens.surface,
                borderColor:
                  chosenOptionId === currentQ.correctOptionId
                    ? tokens.success
                    : tokens.border,
                borderWidth: 1.5,
                borderRadius: RADIUS.md,
                padding: SPACING.md,
                marginTop: SPACING.md,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <MasteraIcon
                name={chosenOptionId === currentQ.correctOptionId ? 'check-circle' : 'info'}
                size={18}
                color={
                  chosenOptionId === currentQ.correctOptionId
                    ? tokens.success
                    : tokens.danger
                }
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color:
                    chosenOptionId === currentQ.correctOptionId
                      ? tokens.success
                      : tokens.danger,
                  marginLeft: 8,
                }}
                style={[
                  styles.prevNextBtn,
                  {
                    backgroundColor: isPractice ? tokens.primary : tokens.amber,
                    borderColor: isPractice ? tokens.primary : tokens.amber,
                  },
                ]}
              >
                <Text style={[styles.prevNextBtnText, { color: tokens.surface }]}>
                  {questionIndex + 1 < questions.length
                    ? 'Next'
                    : isPractice
                    ? 'Finish Practice'
                    : 'Submit Quiz'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ------------------------------------------------------------------ */
          /* VIEW B: CONTINUOUS VERTICAL SCROLL RUNNER */
          /* ------------------------------------------------------------------ */
          <View style={{ gap: SPACING.lg, marginTop: SPACING.sm }}>
            {questions.map((q, idx) => {
              const qChosen = selectedAnswers[q.id];
              const qAnswered = !!qChosen;
              const qIsCorrect = qChosen === q.correctOptionId;

              return (
                <View
                  key={q.id}
                  style={{
                    backgroundColor: tokens.surface,
                    borderWidth: 1,
                    borderColor: tokens.border,
                    borderRadius: RADIUS.lg,
                    padding: SPACING.md,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: tokens.textMuted,
                      marginBottom: 4,
                    }}
                  >
                    Question {idx + 1} of {questions.length}
                  </Text>
                  <Text
                    style={[
                      styles.questionPrompt,
                      { color: tokens.textPrimary, fontSize: 16, marginBottom: SPACING.md },
                    ]}
                  >
                    {q.promptLatex}
                  </Text>

                  <View style={styles.optionsCol}>
                    {(q.options ?? []).map((opt) => {
                      const isSelected = qChosen === opt.id;
                      const isCorrectOpt = opt.id === q.correctOptionId;

                      let optBg = tokens.surface;
                      let optBorder = tokens.border;
                      let optTextColor = tokens.textPrimary;
                      let optBadge: string | null = null;
                      let optBadgeColor = tokens.textMuted;

                      if (isPractice && qAnswered) {
                        if (isCorrectOpt) {
                          optBg = tokens.successSoft;
                          optBorder = tokens.success;
                          optTextColor = tokens.success;
                          optBadge = isSelected ? '✓ Correct (Your answer)' : '✓ Correct answer';
                          optBadgeColor = tokens.success;
                        } else if (isSelected) {
                          optBg = tokens.dangerSoft;
                          optBorder = tokens.danger;
                          optTextColor = tokens.danger;
                          optBadge = '✗ Your answer (Incorrect)';
                          optBadgeColor = tokens.danger;
                        }
                      } else if (isSelected) {
                        optBg = isPractice ? tokens.primarySoft : tokens.amberSoft;
                        optBorder = isPractice ? tokens.primary : tokens.amber;
                        optTextColor = isPractice ? tokens.primary : tokens.textPrimary;
                      }

                      return (
                        <TouchableOpacity
                          key={opt.id}
                          onPress={() =>
                            setSelectedAnswers((prev) => ({
                              ...prev,
                              [q.id]: opt.id,
                            }))
                          }
                          style={[
                            styles.optionBtn,
                            {
                              backgroundColor: optBg,
                              borderColor: optBorder,
                              borderWidth: isSelected || (isPractice && qAnswered && isCorrectOpt) ? 2 : 1,
                            },
                          ]}
                          activeOpacity={0.8}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.optionText,
                                {
                                  color: optTextColor,
                                  fontWeight: isSelected || (isPractice && qAnswered && isCorrectOpt) ? '700' : '500',
                                },
                              ]}
                            >
                              {opt.id}. {opt.textLatex || (opt as any).text}
                            </Text>
                            {optBadge && (
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: '700',
                                  color: optBadgeColor,
                                  marginTop: 4,
                                }}
                              >
                                {optBadge}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Immediate Explanation in Practice Mode */}
                  {isPractice && qChosen && (
                    <View
                      style={[
                        styles.explanationBox,
                        {
                          backgroundColor: qIsCorrect ? tokens.successSoft : tokens.surface,
                          borderColor: qIsCorrect ? tokens.success : tokens.border,
                          borderWidth: 1.5,
                          borderRadius: RADIUS.md,
                          padding: SPACING.md,
                          marginTop: SPACING.md,
                        },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <MasteraIcon
                          name={qIsCorrect ? 'check-circle' : 'info'}
                          size={16}
                          color={qIsCorrect ? tokens.success : tokens.danger}
                        />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '700',
                            color: qIsCorrect ? tokens.success : tokens.danger,
                            marginLeft: 6,
                          }}
                        >
                          {qIsCorrect ? 'Correct Answer!' : `Incorrect · Option ${q.correctOptionId} is correct`}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 13, color: tokens.textPrimary, lineHeight: 18 }}>
                        {q.explanationLatex || 'Detailed explanation provided for academic concept.'}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Bottom Submit / Finish Button for Scroll View */}
            <TouchableOpacity
              onPress={() => {
                onCompleteQuizChapter(activeChapter.id, selectedAnswers);
                setStage('REVIEW');
              }}
              style={[
                styles.primaryActionBtn,
                {
                  backgroundColor: isPractice ? tokens.primary : tokens.amber,
                  marginTop: SPACING.md,
                  marginBottom: SPACING.xl,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text style={[styles.primaryActionBtnText, { color: tokens.surface }]}>
                {isPractice ? 'Finish Practice & View Review' : 'Submit Quiz'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Next Button */}
        <TouchableOpacity
          onPress={() => {
            if (questionIndex + 1 < questions.length) {
              setQuestionIndex((i) => i + 1);
            } else {
              if (quizMode === 'EXAM') {
                onCompleteQuizChapter(activeChapter.id, selectedAnswers, quizMode);
                setQuizFinished(true);
              } else {
                onCompleteQuizChapter(activeChapter.id, selectedAnswers);
                setActiveChapter(null);
                setQuizMode(null);
                setQuestionIndex(0);
              }
            }
          }}
          style={[styles.primaryActionBtn, { backgroundColor: tokens.primary }]}
        >
          <Text style={[styles.primaryActionBtnText, { color: tokens.surface }]}>
            {questionIndex + 1 < questions.length ? 'Next' : quizMode === 'EXAM' ? 'Submit quiz' : 'Finish Quiz'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // STEP 1: Quiz Chapters Direct List (Matching user screenshot media_1794168593766_d12a6e63.png)
  const activeBook = quizBooks.find(
    (b) =>
      b.item.category === activeQuizTab ||
      b.item.code === (activeQuizTab === 'QUIZ_1' ? 'Q1' : activeQuizTab === 'QUIZ_2' ? 'Q2' : 'Q3') ||
      (b.item.title && b.item.title.toLowerCase().includes(activeQuizTab === 'QUIZ_1' ? 'quiz 1' : activeQuizTab === 'QUIZ_2' ? 'quiz 2' : 'quiz 3'))
  );

  let chapterRows: ResolvedCatalogRowView<CatalogChapterMetaDto>[] = [];

  if (activeBook && chaptersByBookId[activeBook.item.id]?.length) {
    chapterRows = chaptersByBookId[activeBook.item.id] || [];
  } else if (courseChapters) {
    // Strict course isolation: only get chapters belonging to this course & active quiz category
    chapterRows = courseChapters
      .filter(
        (ch) =>
          (activeBook && ch.bookGroupId === activeBook.item.id) ||
          (ch.courseId === (courseId || activeBook?.item.courseId) &&
            ch.category === activeQuizTab)
      )
      .map((ch, idx) => ({
        item: ch,
        canOpenNow: true,
        accessBadge: ch.isFree ? 'Free' : 'Included',
        updateAvailable: false,
      }));
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tokens.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Top Header with Back Arrow and Title */}
      <View style={styles.headerBackRow}>
        {onBackToCourses && (
          <TouchableOpacity
            onPress={onBackToCourses}
            style={[styles.topBackArrowBtn, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <MasteraIcon name="chevron-left" size={20} color={tokens.textPrimary} />
          </TouchableOpacity>
        )}
        <Text style={[styles.screenTitleWithBack, { color: tokens.textPrimary }]}>
          {courseTitle}
        </Text>
      </View>

      {/* Top Course Tabs: Material | Tests (Active) | Exams */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => onSwitchCourseTopTab('MATERIAL')}
          style={[
            styles.tabBtn,
            { borderColor: tokens.border, backgroundColor: tokens.surface },
          ]}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBtnText, { color: tokens.textPrimary }]}>
            Material
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onSwitchCourseTopTab('TESTS')}
          style={[
            styles.tabBtn,
            { backgroundColor: tokens.black, borderColor: tokens.black },
          ]}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, { color: tokens.white }]}>
            Tests
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onSwitchCourseTopTab('EXAMS')}
          style={[
            styles.tabBtn,
            { borderColor: tokens.border, backgroundColor: tokens.surface },
          ]}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBtnText, { color: tokens.textPrimary }]}>
            Exams
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sub-Tabs: Quiz 1 | Quiz 2 | Quiz 3 */}
      <View style={styles.subTabsRow}>
        {(
          [
            { id: 'QUIZ_1' as const, label: 'Quiz 1' },
            { id: 'QUIZ_2' as const, label: 'Quiz 2' },
            { id: 'QUIZ_3' as const, label: 'Quiz 3' },
          ]
        ).map((tab) => {
          const isSelected = activeQuizTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => {
                setActiveQuizTab(tab.id);
                setActiveChapter(null);
                setQuizMode(null);
                setQuizFinished(false);
                setQuestionIndex(0);
              }}
              style={[
                styles.subTabBtn,
                {
                  backgroundColor: isSelected ? tokens.primary : tokens.primarySoft,
                  borderColor: isSelected ? tokens.primary : tokens.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.subTabBtnText,
                  {
                    color: isSelected ? tokens.surface : tokens.primary,
                    fontWeight: isSelected ? '700' : '600',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Direct Quiz Chapters List matching user screenshot media_1794168593766_d12a6e63.png */}
      <View style={styles.quizChapterCardList}>
        {chapterRows.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, marginTop: 40 }}>
            <MasteraIcon name="info" size={40} color={tokens.textMuted} />
            <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '600', color: tokens.textPrimary }}>
              No {quizTabLabel} assessments published yet
            </Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: tokens.textMuted, textAlign: 'center' }}>
              Practice tests and quizzes for {courseTitle} will appear here when published in the curriculum.
            </Text>
          </View>
        ) : (
          chapterRows.map((row, idx) => {
            const ch = (row as any).item || row;
            const colonIdx = ch.title.indexOf(':');
            const mainTitle =
              colonIdx > -1
                ? ch.title.substring(0, colonIdx).trim()
                : `Chapter ${ch.orderIndex || idx + 1}`;
            const subTitle =
              colonIdx > -1
                ? ch.title.substring(colonIdx + 1).trim()
                : ch.title;

            // Squircle book container colors matching screenshot:
            // Chapter 1: Amber squircle
            // Chapter 2: Green squircle
            // Chapter 3: Purple squircle
            // Chapter 4: Blue squircle
            const squircleColors = [
              COURSE_ACCENTS.amber,
              tokens.success,
              COURSE_ACCENTS.indigo,
              tokens.primary,
            ];
            const squircleBg = squircleColors[idx % squircleColors.length];

            return (
              <TouchableOpacity
                key={ch.id || `quiz-ch-${idx}`}
                onPress={() => {
                  setActiveChapter(ch);
                  setQuizMode(null);
                  setQuizFinished(false);
                  setQuestionIndex(0);
                  setSelectedAnswers({});
                }}
                activeOpacity={0.7}
                style={[
                  styles.quizChapterCard,
                  {
                    backgroundColor: tokens.surface,
                    borderColor: tokens.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.squircleBookBox,
                    { backgroundColor: squircleBg },
                  ]}
                >
                  <MasteraIcon name="book-open" size={24} color={tokens.white} />
                </View>

                <View style={styles.quizChapterTextCol}>
                  <Text
                    style={[
                      styles.quizChapterHeading,
                      { color: tokens.textPrimary },
                    ]}
                  >
                    {mainTitle}
                  </Text>
                  <Text
                    style={[
                      styles.quizChapterSubheading,
                      { color: tokens.textMuted },
                    ]}
                  >
                    {subTitle}
                  </Text>
                </View>

                <MasteraIcon
                  name="chevron-right"
                  size={22}
                  color={tokens.primary}
                />
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Quiz Mode Selection Modal (Practice Mode vs Exam Mode) */}
      <Modal
        visible={!!pendingChapter}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingChapter(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: tokens.surface,
              borderTopLeftRadius: RADIUS.xl,
              borderTopRightRadius: RADIUS.xl,
              padding: SPACING.lg,
              paddingBottom: SPACING.xxl,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '800',
                color: tokens.textPrimary,
              }}
            >
              Choose Assessment Mode
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: tokens.textMuted,
                marginTop: 4,
                marginBottom: SPACING.lg,
              }}
            >
              {pendingChapter?.title || 'Chapter Assessment'}
            </Text>

            {/* Practice Mode Option */}
            <TouchableOpacity
              onPress={() => {
                const ch = pendingChapter!;
                setQuizMode('PRACTICE');
                setActiveChapter(ch);
                setPendingChapter(null);
                setStage('RUNNING');
                setQuestionIndex(0);
                setSelectedAnswers({});
              }}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: SPACING.md,
                borderRadius: RADIUS.lg,
                borderWidth: 1.5,
                borderColor: tokens.primary,
                backgroundColor: tokens.primarySoft,
                marginBottom: SPACING.md,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: RADIUS.md,
                  backgroundColor: tokens.surface,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <MasteraIcon name="book-open" size={22} color={tokens.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: tokens.primary,
                  }}
                >
                  Practice Mode
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: tokens.textMuted,
                    marginTop: 2,
                    lineHeight: 16,
                  }}
                >
                  Immediate answer feedback & full explanations shown after each question.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Exam Mode Option */}
            <TouchableOpacity
              onPress={() => {
                const ch = pendingChapter!;
                setQuizMode('EXAM');
                setActiveChapter(ch);
                setPendingChapter(null);
                setStage('RUNNING');
                setQuestionIndex(0);
                setSelectedAnswers({});
              }}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: SPACING.md,
                borderRadius: RADIUS.lg,
                borderWidth: 1.5,
                borderColor: tokens.amber,
                backgroundColor: tokens.amberSoft,
                marginBottom: SPACING.lg,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: RADIUS.md,
                  backgroundColor: tokens.surface,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <MasteraIcon name="award" size={22} color={tokens.amber} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: tokens.amber,
                  }}
                >
                  Exam Mode
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: tokens.textMuted,
                    marginTop: 2,
                    lineHeight: 16,
                  }}
                >
                  Timed simulation with answers hidden. Full score and answer review revealed upon submit.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => setPendingChapter(null)}
              style={{
                paddingVertical: 12,
                borderRadius: RADIUS.md,
                borderWidth: 1,
                borderColor: tokens.border,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: tokens.textMuted }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ============================================================================
// 2. EXAMS TAB: DIRECT MID, FINAL & MOCK EXAM FLOWS
// ============================================================================

export interface CourseExamsTabFlowProps {
  courseTitle: string;
  courseId?: string;
  examSets: ResolvedCatalogRowView<CatalogExamSetMetaDto>[];
  questionsByExamSetId: Record<string, QuestionItemDto[]>;
  accountState: StudentAccountState;
  onSwitchCourseTopTab: (tab: 'MATERIAL' | 'TESTS' | 'EXAMS') => void;
  onLockedExamTap: () => void;
  onSubmitExamAttempt: (
    examSetId: string,
    answers: Record<string, string>
  ) => void;
  onBackToCourses?: () => void;
  themeMode?: ThemeMode;
}

export function CourseExamsDirectFlowScreen({
  courseTitle,
  courseId,
  examSets,
  questionsByExamSetId,
  accountState,
  onSwitchCourseTopTab,
  onLockedExamTap,
  onSubmitExamAttempt,
  onBackToCourses,
  themeMode = 'light',
}: CourseExamsTabFlowProps): React.ReactElement {
  const [activeExamSubTab, setActiveExamSubTab] = useState<
    'MID' | 'FINAL' | 'MOCK' | 'COC'
  >('MID');
  const [pendingStartExamSet, setPendingStartExamSet] =
    useState<CatalogExamSetMetaDto | null>(null);
  const [runningExamSet, setRunningExamSet] =
    useState<CatalogExamSetMetaDto | null>(null);
  const [stage, setStage] = useState<'LIST' | 'RUNNING' | 'REVIEW'>('LIST');
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Set<string>>(
    new Set()
  );
  const [secondsRemaining, setSecondsRemaining] = useState<number>(40 * 60);
  const [examNavigationMode, setExamNavigationMode] =
    useState<QuestionNavigationMode>('PAGED');

  const tokens = STUDENT_THEMES[themeMode];

  // Active Countdown Timer for Exam Runner
  React.useEffect(() => {
    if (stage !== 'RUNNING' || !runningExamSet) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onSubmitExamAttempt(runningExamSet.id, selectedAnswers);
          setExpandedQuestionIds(new Set(getQuestionsForExamSet(runningExamSet).map((q) => q.id)));
          setStage('REVIEW');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stage, runningExamSet, onSubmitExamAttempt, selectedAnswers]);

  const formattedTimer = React.useMemo(() => {
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, [secondsRemaining]);

  const shortCourseTitle = courseTitle.toLowerCase().includes('english')
    ? 'English'
    : courseTitle;

  // Specific exam questions retrieval from database or catalog provider
  const getQuestionsForExamSet = (es: CatalogExamSetMetaDto): QuestionItemDto[] => {
    const found = questionsByExamSetId[es.id];
    if (found && found.length > 0) return found;

    return [];
  };

  // ==========================================================================
  // SCREEN 4: REVIEW ANSWERS (Flow: "review answers follows each submit")
  // ==========================================================================
  if (stage === 'REVIEW' && runningExamSet) {
    const questions = getQuestionsForExamSet(runningExamSet);
    const score = questions.filter(
      (q) => selectedAnswers[q.id] === q.correctOptionId
    ).length;
    const percent =
      questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const isPassed = percent >= 50;

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Header Row with Back Arrow */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            onPress={() => {
              setStage('LIST');
              setRunningExamSet(null);
            }}
            style={styles.backBtnRow}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.topBackArrowBtn,
                { backgroundColor: tokens.surface, borderColor: tokens.border },
              ]}
            >
              <MasteraIcon
                name="chevron-left"
                size={18}
                color={tokens.textPrimary}
              />
            </View>
            <Text style={[styles.backBtnText, { color: tokens.textPrimary }]}>
              Review answers
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.badgePill,
              {
                backgroundColor: isPassed
                  ? tokens.successSoft
                  : tokens.dangerSoft,
              },
            ]}
          >
            <Text
              style={[
                styles.badgePillText,
                { color: isPassed ? tokens.success : tokens.danger },
              ]}
            >
              Score: {score} / {questions.length} ({percent}%) · {isPassed ? 'Passed' : 'Needs Review'}
            </Text>
          </View>
        </View>

        {/* Controls row */}
        <View style={[styles.topNavRow, { marginTop: SPACING.sm }]}>
          <Text style={[styles.helperText, { color: tokens.textMuted }]}>
            Explanations
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (expandedQuestionIds.size === questions.length) {
                setExpandedQuestionIds(new Set());
              } else {
                setExpandedQuestionIds(new Set(questions.map((q) => q.id)));
              }
            }}
            style={[styles.outlineSmallBtn, { borderColor: tokens.primary }]}
          >
            <Text
              style={[styles.outlineSmallBtnText, { color: tokens.primary }]}
            >
              {expandedQuestionIds.size === questions.length
                ? 'Hide all'
                : 'Show all'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Questions Breakdown List */}
        <View style={styles.reviewCol}>
          {questions.map((q, idx) => {
            const studentChoice = selectedAnswers[q.id];
            const isCorrect = studentChoice === q.correctOptionId;
            const isExpanded = expandedQuestionIds.has(q.id);

            const chosenOpt = (q.options ?? []).find(
              (o) => o.id === studentChoice
            );
            const correctOpt = (q.options ?? []).find(
              (o) => o.id === q.correctOptionId
            );

            return (
              <View
                key={q.id}
                style={[
                  styles.reviewCard,
                  {
                    backgroundColor: tokens.surface,
                    borderColor: isCorrect ? tokens.border : tokens.amber,
                    borderWidth: isCorrect ? 1 : 1.5,
                  },
                ]}
              >
                <Text
                  style={[styles.reviewPrompt, { color: tokens.textPrimary }]}
                >
                  {idx + 1}. {q.promptLatex}
                </Text>

                <Text
                  style={[
                    styles.reviewAnswerMeta,
                    {
                      color: isCorrect ? tokens.success : tokens.amber,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {isCorrect
                    ? `Your answer: ${studentChoice} (${chosenOpt?.textLatex || ''}) · Correct ✓`
                    : `You: ${studentChoice ?? 'Skipped'}${
                        chosenOpt ? ` (${chosenOpt.textLatex})` : ''
                      } · Correct: ${q.correctOptionId} (${correctOpt?.textLatex || ''}) ✗`}
                </Text>

                {isExpanded ? (
                  <View
                    style={[
                      styles.explanationBox,
                      {
                        backgroundColor: tokens.surface,
                        borderColor: tokens.border,
                        borderRadius: RADIUS.sm,
                        padding: SPACING.sm,
                        marginTop: SPACING.xs,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.reviewExplanation,
                        { color: tokens.textPrimary },
                      ]}
                    >
                      Explanation: {q.explanationLatex}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() =>
                      setExpandedQuestionIds((prev) => {
                        const next = new Set(prev);
                        next.add(q.id);
                        return next;
                      })
                    }
                    style={[
                      styles.explanationBtn,
                      { borderColor: tokens.primary, marginTop: SPACING.xs },
                    ]}
                  >
                    <Text
                      style={[
                        styles.explanationBtnText,
                        { color: tokens.primary },
                      ]}
                    >
                      Show explanation
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={() => {
            setStage('LIST');
            setRunningExamSet(null);
          }}
          style={[
            styles.primaryActionBtn,
            { backgroundColor: tokens.primary, marginTop: SPACING.lg },
          ]}
        >
          <Text
            style={[styles.primaryActionBtnText, { color: tokens.surface }]}
          >
            Back to Exams
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ==========================================================================
  // SCREEN 3: TIMED EXAM RUNNER — Dual Navigation: PAGED or SCROLL
  // ==========================================================================
  if (stage === 'RUNNING' && runningExamSet) {
    const questions = getQuestionsForExamSet(runningExamSet);
    if (questions.length === 0) {
      return (
        <ScrollView
          style={[styles.container, { backgroundColor: tokens.background }]}
          contentContainerStyle={styles.scrollContent}
        >
          <TouchableOpacity
            onPress={() => {
              setStage('LIST');
              setRunningExamSet(null);
            }}
            style={styles.backBtnRow}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.topBackArrowBtn,
                { backgroundColor: tokens.surface, borderColor: tokens.border },
              ]}
            >
              <MasteraIcon name="chevron-left" size={18} color={tokens.textPrimary} />
            </View>
            <Text style={[styles.backBtnText, { color: tokens.textPrimary }]}>
              {runningExamSet.title}
            </Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, marginTop: 40 }}>
            <MasteraIcon name="award" size={40} color={tokens.textMuted} />
            <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '600', color: tokens.textPrimary }}>
              No questions published yet
            </Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: tokens.textMuted, textAlign: 'center' }}>
              The questions for this exam set are currently being prepared.
            </Text>
          </View>
        </ScrollView>
      );
    }
    if (examNavigationMode === 'SCROLL') {
      return (
        <ScrollView style={[styles.container, { backgroundColor: tokens.background }]} contentContainerStyle={styles.scrollContent}>
          <View style={styles.topNavRow}>
            <Text style={[styles.backBtnText, { color: tokens.textPrimary }]}>{runningExamSet.title}</Text>
            <View style={[styles.examBadgePill, { backgroundColor: tokens.amberSoft, borderColor: tokens.border }]}>
              <Text style={[styles.examBadgePillText, { color: tokens.amber }]}>{formattedTimer}</Text>
            </View>
          </View>
          {questions.map((q, index) => (
            <View key={q.id} style={[styles.reviewCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
              <Text style={[styles.questionPrompt, { color: tokens.textPrimary, fontSize: 16 }]}>{index + 1}. {q.promptLatex}</Text>
              {(q.options ?? []).map((opt) => (
                <TouchableOpacity key={opt.id} onPress={() => setSelectedAnswers((prev) => ({ ...prev, [q.id]: opt.id }))} style={[styles.optionBtn, { backgroundColor: tokens.surface, borderColor: selectedAnswers[q.id] === opt.id ? tokens.amber : tokens.border, borderWidth: selectedAnswers[q.id] === opt.id ? 2 : 1 }]}>
                  <Text style={[styles.optionText, { color: tokens.textPrimary }]}>{opt.id}. {opt.textLatex}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          <TouchableOpacity onPress={() => { onSubmitExamAttempt(runningExamSet.id, selectedAnswers); setExpandedQuestionIds(new Set(questions.map((q) => q.id))); setStage('REVIEW'); }} style={[styles.primaryActionBtn, { backgroundColor: tokens.amber }]}>
            <Text style={[styles.primaryActionBtnText, { color: tokens.white }]}>Submit exam</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    const currentQ = questions[questionIndex] ?? questions[0]!;
    const chosenOptionId = currentQ ? selectedAnswers[currentQ.id] : undefined;

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header: < ExamSet Title | Nav Toggle | Timer */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            onPress={() => {
              setStage('LIST');
              setRunningExamSet(null);
            }}
            style={styles.backBtnRow}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.topBackArrowBtn,
                { backgroundColor: tokens.surface, borderColor: tokens.border },
              ]}
            >
              <MasteraIcon name="chevron-left" size={18} color={tokens.textPrimary} />
            </View>
            <Text style={[styles.backBtnText, { color: tokens.textPrimary }]}>
              {runningExamSet.title}
            </Text>
          </TouchableOpacity>

          {/* Nav Mode Toggle Pill: [ 📄 Pages | 📜 Scroll ] */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: tokens.surface,
              borderRadius: RADIUS.pill,
              borderWidth: 1,
              borderColor: tokens.border,
              padding: 2,
            }}
          >
            <TouchableOpacity
              onPress={() => setExamNavMode('PAGED')}
              style={{
                paddingHorizontal: 7,
                paddingVertical: 3,
                borderRadius: RADIUS.pill,
                backgroundColor: examNavMode === 'PAGED' ? tokens.amber : 'transparent',
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '700', color: examNavMode === 'PAGED' ? tokens.white : tokens.textMuted }}>
                📄 Pages
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setExamNavMode('SCROLL')}
              style={{
                paddingHorizontal: 7,
                paddingVertical: 3,
                borderRadius: RADIUS.pill,
                backgroundColor: examNavMode === 'SCROLL' ? tokens.amber : 'transparent',
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: '700', color: examNavMode === 'SCROLL' ? tokens.white : tokens.textMuted }}>
                📜 Scroll
              </Text>
            </TouchableOpacity>
          </View>

          {/* Timer Pill */}
          <View
            style={[
              styles.examBadgePill,
              { backgroundColor: tokens.amberSoft, borderColor: tokens.border },
            ]}
          >
            <Text style={[styles.examBadgePillText, { color: tokens.amber, fontWeight: '700' }]}>
              {formattedTimer}
            </Text>
          </View>
        </View>

        {/* ------------------------------------------------------------------ */}
        {/* VIEW A: PAGED EXAM RUNNER */}
        {/* ------------------------------------------------------------------ */}
        {examNavMode === 'PAGED' ? (
          <View>
            {/* Progress Bar */}
            <View style={[styles.progressTrack, { backgroundColor: tokens.surface, borderColor: tokens.border, marginTop: SPACING.xs }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.round(((questionIndex + 1) / questions.length) * 100)}%`,
                    backgroundColor: tokens.amber,
                  },
                ]}
              />
            </View>

            <Text style={[styles.helperText, { color: tokens.textMuted, marginVertical: SPACING.xs }]}>
              Question {questionIndex + 1} of {questions.length}
            </Text>

            <Text style={[styles.questionPrompt, { color: tokens.textPrimary, fontSize: 18, marginBottom: SPACING.md }]}>
              {currentQ?.promptLatex}
            </Text>

            <View style={styles.optionsCol}>
              {(currentQ?.options ?? []).map((opt) => {
                const isSelected = chosenOptionId === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() =>
                      setSelectedAnswers((prev) => ({
                        ...prev,
                        [currentQ.id]: opt.id,
                      }))
                    }
                    activeOpacity={0.8}
                    style={[
                      styles.optionBtn,
                      {
                        backgroundColor: isSelected ? tokens.amberSoft : tokens.surface,
                        borderColor: isSelected ? tokens.amber : tokens.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.optionText, { color: tokens.textPrimary, fontWeight: isSelected ? '700' : '500' }]}>
                      {opt.id}. {opt.textLatex || (opt as any).text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Previous / Next Row */}
            <View style={[styles.prevNextRow, { marginVertical: SPACING.md }]}>
              <TouchableOpacity
                disabled={questionIndex === 0}
                onPress={() => setQuestionIndex((i) => Math.max(0, i - 1))}
                style={[
                  styles.prevNextBtn,
                  {
                    borderColor: tokens.amber,
                    backgroundColor: tokens.surface,
                    opacity: questionIndex === 0 ? 0.4 : 1,
                  },
                ]}
              >
                <Text style={[styles.prevNextBtnText, { color: tokens.amber }]}>
                  Previous
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={questionIndex >= questions.length - 1}
                onPress={() =>
                  setQuestionIndex((i) => Math.min(questions.length - 1, i + 1))
                }
                style={[
                  styles.prevNextBtn,
                  {
                    backgroundColor: tokens.amber,
                    borderColor: tokens.amber,
                    opacity: questionIndex >= questions.length - 1 ? 0.4 : 1,
                  },
                ]}
              >
                <Text style={[styles.prevNextBtnText, { color: tokens.white }]}>
                  Next
                </Text>
              </TouchableOpacity>
            </View>

            {/* Submit Exam Button */}
            <TouchableOpacity
              onPress={() => {
                onSubmitExamAttempt(runningExamSet.id, selectedAnswers);
                setExpandedQuestionIds(new Set(questions.map((q) => q.id)));
                setStage('REVIEW');
              }}
              style={[
                styles.primaryActionBtn,
                { backgroundColor: tokens.amber, marginTop: SPACING.lg },
              ]}
              activeOpacity={0.8}
            >
              <Text style={[styles.primaryActionBtnText, { color: tokens.white }]}>
                Submit Exam
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ---------------------------------------------------------------- */
          /* VIEW B: CONTINUOUS VERTICAL SCROLL EXAM RUNNER */
          /* ---------------------------------------------------------------- */
          <View style={{ gap: SPACING.lg, marginTop: SPACING.sm }}>
            {questions.map((q, idx) => {
              const qChosen = selectedAnswers[q.id];
              return (
                <View
                  key={q.id}
                  style={{
                    backgroundColor: tokens.surface,
                    borderWidth: 1,
                    borderColor: tokens.border,
                    borderRadius: RADIUS.lg,
                    padding: SPACING.md,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: tokens.textMuted, marginBottom: 4 }}>
                    Question {idx + 1} of {questions.length}
                  </Text>
                  <Text style={[styles.questionPrompt, { color: tokens.textPrimary, fontSize: 16, marginBottom: SPACING.md }]}>
                    {q.promptLatex}
                  </Text>

                  <View style={styles.optionsCol}>
                    {(q.options ?? []).map((opt) => {
                      const isSelected = qChosen === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          onPress={() =>
                            setSelectedAnswers((prev) => ({
                              ...prev,
                              [q.id]: opt.id,
                            }))
                          }
                          activeOpacity={0.8}
                          style={[
                            styles.optionBtn,
                            {
                              backgroundColor: isSelected ? tokens.amberSoft : tokens.surface,
                              borderColor: isSelected ? tokens.amber : tokens.border,
                              borderWidth: isSelected ? 2 : 1,
                            },
                          ]}
                        >
                          <Text style={[styles.optionText, { color: tokens.textPrimary, fontWeight: isSelected ? '700' : '500' }]}>
                            {opt.id}. {opt.textLatex || (opt as any).text}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {/* Submit Exam Button at bottom of scroll */}
            <TouchableOpacity
              onPress={() => {
                onSubmitExamAttempt(runningExamSet.id, selectedAnswers);
                setExpandedQuestionIds(new Set(questions.map((q) => q.id)));
                setStage('REVIEW');
              }}
              style={[
                styles.primaryActionBtn,
                { backgroundColor: tokens.amber, marginTop: SPACING.md, marginBottom: SPACING.xl },
              ]}
              activeOpacity={0.8}
            >
              <Text style={[styles.primaryActionBtnText, { color: tokens.white }]}>
                Submit Exam
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  }

  // ==========================================================================
  // SCREEN 1 & 2: EXAM LIST & START DRAWER (preview: "1 · List" & "2 · Start button")
  // ==========================================================================
  const setsForSubTab = examSets.filter((es) => {
    if (activeExamSubTab === 'COC') {
      return (
        es.item.category === 'COC' ||
        es.item.examSetCode.includes('COC') ||
        es.item.title.toLowerCase().includes('coc')
      );
    }
    if (courseId && es.item.courseId && es.item.courseId !== courseId) {
      return false;
    }
    return es.item.category === activeExamSubTab;
  });

  const effectiveSetsForSubTab = setsForSubTab;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tokens.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Top Header with Back Arrow and Title: < English */}
      <View style={styles.headerBackRow}>
        {onBackToCourses && (
          <TouchableOpacity
            onPress={onBackToCourses}
            style={[
              styles.topBackArrowBtn,
              { backgroundColor: tokens.surface, borderColor: tokens.border },
            ]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <MasteraIcon
              name="chevron-left"
              size={20}
              color={tokens.textPrimary}
            />
          </TouchableOpacity>
        )}
        <Text
          style={[styles.screenTitleWithBack, { color: tokens.textPrimary }]}
        >
          {shortCourseTitle}
        </Text>
      </View>

      {/* Top Course Tabs: Material | Tests | Exams (Active solid black) */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => onSwitchCourseTopTab('MATERIAL')}
          style={[
            styles.tabBtn,
            { borderColor: tokens.border, backgroundColor: tokens.surface },
          ]}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBtnText, { color: tokens.textPrimary }]}>
            Material
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onSwitchCourseTopTab('TESTS')}
          style={[
            styles.tabBtn,
            { borderColor: tokens.border, backgroundColor: tokens.surface },
          ]}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabBtnText, { color: tokens.textPrimary }]}>
            Tests
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onSwitchCourseTopTab('EXAMS')}
          style={[
            styles.tabBtn,
            {
              backgroundColor: tokens.black,
              borderColor: tokens.black,
            },
          ]}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, { color: tokens.white }]}>
            Exams
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sub-Tabs: Mid | Final | Mock | COC */}
      <View style={styles.subTabsRow}>
        {(
          [
            { id: 'MID' as const, label: 'Mid' },
            { id: 'FINAL' as const, label: 'Final' },
            { id: 'MOCK' as const, label: 'Mock' },
            { id: 'COC' as const, label: 'COC' },
          ]
        ).map((tab) => {
          const isSelected = activeExamSubTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => {
                setActiveExamSubTab(tab.id);
                setPendingStartExamSet(null);
              }}
              style={[
                styles.subTabBtn,
                {
                  backgroundColor: isSelected
                    ? tokens.primary
                    : tokens.surface,
                  borderColor: isSelected ? tokens.primary : tokens.border,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.subTabBtnText,
                  { color: isSelected ? tokens.surface : tokens.textPrimary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Helper text matching screenshot */}
      <Text
        style={[
          styles.helperText,
          { color: tokens.textMuted, marginVertical: SPACING.xs },
        ]}
      >
        {activeExamSubTab === 'MID'
          ? 'Mid list opens automatically'
          : activeExamSubTab === 'FINAL'
          ? 'Final list opens automatically'
          : activeExamSubTab === 'MOCK'
          ? 'Mock list opens automatically'
          : 'COC list opens automatically'}
      </Text>

      {/* Direct Exam Set Cards matching screenshot */}
      <View style={styles.booksCol}>
        {effectiveSetsForSubTab.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, marginTop: 40 }}>
            <MasteraIcon name="award" size={40} color={tokens.textMuted} />
            <Text style={{ marginTop: 12, fontSize: 16, fontWeight: '600', color: tokens.textPrimary }}>
              No {activeExamSubTab} exams published yet
            </Text>
            <Text style={{ marginTop: 4, fontSize: 13, color: tokens.textMuted, textAlign: 'center' }}>
              {activeExamSubTab} examinations for {courseTitle} will appear here when scheduled by the university.
            </Text>
          </View>
        ) : (
          effectiveSetsForSubTab.map((row) => {
            const es = row.item;
            const isLocked = row.accessBadge === 'Locked';
            const badgeLabel = isLocked
              ? 'Locked'
              : row.accessBadge === 'Downloaded'
              ? 'Downloaded'
              : es.isFreeSample
              ? 'Free'
              : 'Open';

            return (
              <TouchableOpacity
                key={es.id}
                onPress={() => {
                  if (isLocked) {
                    onLockedExamTap();
                  } else {
                    setPendingStartExamSet(es);
                  }
                }}
                activeOpacity={0.7}
                style={[
                  styles.bookRow,
                  {
                    backgroundColor: tokens.surface,
                    borderColor:
                      pendingStartExamSet?.id === es.id
                        ? tokens.primary
                        : tokens.border,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.bookRowTitle, { color: tokens.textPrimary }]}
                  >
                    {es.title}
                  </Text>
                  <Text
                    style={[styles.bookRowMeta, { color: tokens.textMuted }]}
                  >
                    {es.year} {es.questionCount || 20} questions · {es.timeAllowedMinutes} min
                  </Text>
                </View>

                {/* Cream/Amber Badge Pill */}
                <View
                  style={[
                    styles.examBadgePill,
                    {
                      backgroundColor: tokens.amberSoft,
                      borderColor: tokens.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.examBadgePillText,
                      { color: tokens.amber, fontWeight: '700' },
                    ]}
                  >
                    {badgeLabel}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Screen 2: Start Exam Bottom Sheet / Drawer */}
      {pendingStartExamSet && (
        <View
          style={[
            styles.startSheet,
            {
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              shadowColor: tokens.ink,
            },
          ]}
        >
          <Text
            style={[styles.startSheetTitle, { color: tokens.textPrimary }]}
          >
            {pendingStartExamSet.title}
          </Text>
          <Text style={[styles.startSheetSub, { color: tokens.textMuted }]}>
            {pendingStartExamSet.year} {pendingStartExamSet.questionCount || 20} questions · {pendingStartExamSet.timeAllowedMinutes} min · timer starts on Start
          </Text>

          <Text style={[styles.helperText, { color: tokens.textMuted }]}>Question navigation</Text>
          <View style={styles.prevNextRow}>
            {(['PAGED', 'SCROLL'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setExamNavigationMode(mode)}
                style={[styles.prevNextBtn, { backgroundColor: examNavigationMode === mode ? tokens.primary : tokens.surface, borderColor: tokens.primary }]}
              >
                <Text style={[styles.prevNextBtnText, { color: examNavigationMode === mode ? tokens.surface : tokens.primary }]}>
                  {mode === 'PAGED' ? 'Next / Previous' : 'Scroll all'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Solid Amber Button matching screenshot */}
          <TouchableOpacity
            onPress={() => {
              setRunningExamSet(pendingStartExamSet);
              setSecondsRemaining(
                (pendingStartExamSet.timeAllowedMinutes || 40) * 60
              );
              setPendingStartExamSet(null);
              setQuestionIndex(0);
              setSelectedAnswers({});
              setStage('RUNNING');
            }}
            style={[
              styles.primaryActionBtn,
              { backgroundColor: tokens.amber, marginTop: SPACING.md },
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.primaryActionBtnText, { color: tokens.white }]}
            >
              Start exam
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  headerBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACING.md,
  },
  topBackArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitleWithBack: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  backBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptyPromptText: {
    fontSize: 14,
    marginTop: SPACING.lg,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  badgePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  examBadgePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  examBadgePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.pill,
  },
  questionPrompt: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: SPACING.md,
    lineHeight: 24,
  },
  optionsCol: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  optionBtn: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
  },
  optionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  explanationBox: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 18,
  },
  primaryActionBtn: {
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  subTabsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  subTabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quizChapterCardList: {
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  quizChapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.xs,
  },
  squircleBookBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizChapterTextCol: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  quizChapterHeading: {
    fontSize: 16,
    fontWeight: '800',
  },
  quizChapterSubheading: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  helperText: {
    fontSize: 12,
    marginBottom: SPACING.md,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  modeChoiceCol: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  modeChoiceCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  modeChoiceTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  modeChoiceDescription: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  booksCol: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  bookRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  bookRowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  bookRowMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  chipBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  chipBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bookCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  bookSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  chaptersCol: {
    gap: SPACING.sm,
  },
  chapterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  chapterLeft: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  chapterMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  reviewCol: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  reviewCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
  },
  reviewPrompt: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  reviewAnswerMeta: {
    fontSize: 12,
    marginBottom: SPACING.xs,
  },
  reviewExplanation: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  explanationBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  explanationBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  outlineSmallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  outlineSmallBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  prevNextRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  prevNextBtn: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevNextBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  startSheet: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    marginTop: SPACING.md,
  },
  startSheetTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  startSheetSub: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  bannerBox: {
    // used for quiz/exam result banners
  },
});
