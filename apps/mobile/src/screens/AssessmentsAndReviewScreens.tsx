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
    answers: Record<string, string>
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
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});

  const tokens = STUDENT_THEMES[themeMode];

  const quizTabLabel =
    activeQuizTab === 'QUIZ_1'
      ? 'Quiz 1'
      : activeQuizTab === 'QUIZ_2'
      ? 'Quiz 2'
      : 'Quiz 3';

  // STEP 2: Practice Question Runner (Runs when a chapter card is tapped)
  if (activeChapter) {
    const questions = questionsByChapterId[activeChapter.id] ?? [];
    const currentQ = questions[questionIndex] ?? questions[0];

    if (!currentQ) {
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

    const chosenOptionId = selectedAnswers[currentQ.id];
    const progressRatio =
      questions.length > 0 ? (questionIndex + 1) / questions.length : 1;

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Header */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            onPress={() => {
              setActiveChapter(null);
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

          <View style={[styles.badgePill, { backgroundColor: tokens.primarySoft }]}>
            <Text style={[styles.badgePillText, { color: tokens.primary }]}>
              {questionIndex + 1} / {questions.length}
            </Text>
          </View>
        </View>

        {/* Horizontal Progress Bar */}
        <View style={[styles.progressTrack, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round(progressRatio * 100)}%`,
                backgroundColor: tokens.primary,
              },
            ]}
          />
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

            if (hasAnswered) {
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
                  styles.optionBtn,
                  {
                    backgroundColor: optBg,
                    borderColor: optBorder,
                    borderWidth: hasAnswered && (isCorrectOption || isSelected) ? 2 : 1,
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
                        fontWeight: isSelected || (hasAnswered && isCorrectOption) ? '700' : '500',
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

        {/* Immediate Explanation Card */}
        {chosenOptionId ? (
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
        )}

        {/* Bottom Next Button */}
        <TouchableOpacity
          onPress={() => {
            if (questionIndex + 1 < questions.length) {
              setQuestionIndex((i) => i + 1);
            } else {
              onCompleteQuizChapter(activeChapter.id, selectedAnswers);
              setActiveChapter(null);
              setQuestionIndex(0);
            }
          }}
          style={[styles.primaryActionBtn, { backgroundColor: tokens.primary }]}
        >
          <Text style={[styles.primaryActionBtnText, { color: tokens.surface }]}>
            {questionIndex + 1 < questions.length ? 'Next' : 'Finish Quiz'}
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
        accessBadge: ch.isFree ? 'Free' : idx === 3 ? 'Locked' : 'Included',
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

  const tokens = STUDENT_THEMES[themeMode];

  // Active Countdown Timer for Exam Runner
  React.useEffect(() => {
    if (stage !== 'RUNNING') return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stage]);

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
  // SCREEN 3: TIMED EXAM RUNNER (preview: "3 · Questions")
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
              <MasteraIcon
                name="chevron-left"
                size={18}
                color={tokens.textPrimary}
              />
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
    const currentQ = questions[questionIndex] ?? questions[0]!;
    const chosenOptionId = currentQ ? selectedAnswers[currentQ.id] : undefined;

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header: < AASTU · Mid | Timer Pill: 42:15 */}
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
              {runningExamSet.title}
            </Text>
          </TouchableOpacity>

          {/* Yellow/Cream Timer Pill matching screenshot */}
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
              {formattedTimer}
            </Text>
          </View>
        </View>

        {/* Question Counter: Question 7 of 20 */}
        <Text
          style={[
            styles.helperText,
            { color: tokens.textMuted, marginVertical: SPACING.xs },
          ]}
        >
          Question {questionIndex + 1} of {questions.length}
        </Text>

        {/* Question Prompt: Which word is a noun? */}
        <Text
          style={[
            styles.questionPrompt,
            { color: tokens.textPrimary, fontSize: 18, marginBottom: SPACING.md },
          ]}
        >
          {currentQ?.promptLatex}
        </Text>

        {/* Options List */}
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
                    backgroundColor: tokens.surface,
                    borderColor: isSelected ? tokens.amber : tokens.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: tokens.textPrimary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {opt.id} {opt.textLatex || (opt as any).text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Previous and Next Navigation Buttons */}
        <View style={[styles.prevNextRow, { marginVertical: SPACING.md }]}>
          <TouchableOpacity
            disabled={questionIndex === 0}
            onPress={() => setQuestionIndex((i) => Math.max(0, i - 1))}
            style={[
              styles.prevNextBtn,
              {
                borderColor: tokens.primary,
                backgroundColor: tokens.surface,
                opacity: questionIndex === 0 ? 0.4 : 1,
              },
            ]}
          >
            <Text style={[styles.prevNextBtnText, { color: tokens.primary }]}>
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
                backgroundColor: tokens.primary,
                borderColor: tokens.primary,
                opacity: questionIndex >= questions.length - 1 ? 0.4 : 1,
              },
            ]}
          >
            <Text style={[styles.prevNextBtnText, { color: tokens.surface }]}>
              Next
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sticky Solid Amber/Orange Submit exam button matching screenshot */}
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
            Submit exam
          </Text>
        </TouchableOpacity>
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
});
