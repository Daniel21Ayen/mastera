import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { StudentAccountState } from '@mastera/contracts';
import {
  RADIUS,
  SPACING,
  STUDENT_THEMES,
  ThemeMode,
} from '@mastera/ui-tokens';
import { MasteraIcon } from '../shared/components/MasteraIcon';

export interface CourseMasterySummary {
  courseId: string;
  courseTitle: string;
  completedChapters: number;
  totalChapters: number;
  avgQuizPercent: number;
  masteryPercent: number;
  isSavedOffline: boolean;
}

export interface PastExamAttemptSummary {
  attemptId: string;
  title: string; // e.g., "Mid · AASTU"
  dateAndDurationLabel: string;
  scoreLabel: string; // e.g., "16/20"
  passed: boolean;
}

export interface ProgressTabScreensProps {
  accountState: StudentAccountState;
  overallMasteryPercent: number;
  completedChaptersTotal: number;
  totalChaptersCount: number;
  quizzesPassedCount: number;
  streakDays: number;
  weeklyActivityHeights: [number, number, number, number, number, number, number];
  coursesProgress: CourseMasterySummary[];
  pastAttempts: PastExamAttemptSummary[];
  onBrowseCourses: () => void;
  onOpenReviewAttempt: (attemptId: string) => void;
  themeMode?: ThemeMode;
}

export function ProgressTabScreens({
  accountState,
  overallMasteryPercent,
  completedChaptersTotal,
  totalChaptersCount,
  quizzesPassedCount,
  streakDays,
  weeklyActivityHeights,
  coursesProgress,
  pastAttempts,
  onBrowseCourses,
  onOpenReviewAttempt,
  themeMode = 'light',
}: ProgressTabScreensProps): React.ReactElement {
  const [subView, setSubView] = useState<'OVERVIEW' | 'HISTORY'>('OVERVIEW');
  const [selectedCourse, setSelectedCourse] =
    useState<CourseMasterySummary | null>(null);

  const tokens = STUDENT_THEMES[themeMode];

  // Screen 3 in preview (2).webp: "No progress yet" Empty State
  if (completedChaptersTotal === 0 && pastAttempts.length === 0) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.screenTitle, { color: tokens.textPrimary }]}>
          Learning Progress
        </Text>

        <View style={styles.emptyCenterBox}>
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: tokens.primarySoft },
            ]}
          >
            <MasteraIcon name="bar-chart-2" size={32} color={tokens.primary} />
          </View>

          <Text style={[styles.emptyHeading, { color: tokens.textPrimary }]}>
            No progress yet
          </Text>
          <Text style={[styles.emptyDescription, { color: tokens.textMuted }]}>
            Open a chapter or take a quiz. Your progress is saved on this phone
            and works offline.
          </Text>

          {accountState !== 'REGISTERED_REMOTE' && (
            <View
              style={[
                styles.localAccountCard,
                { backgroundColor: tokens.surface, borderColor: tokens.border },
              ]}
            >
              <Text style={[styles.localAccountText, { color: tokens.primary }]}>
                Local-only account. Progress syncs after your first bundle purchase.
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={onBrowseCourses}
            style={[styles.actionBtn, { backgroundColor: tokens.primary }]}
          >
            <Text style={[styles.actionBtnText, { color: tokens.surface }]}>
              Browse courses
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Single Course Progress Detail View
  if (selectedCourse) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          onPress={() => setSelectedCourse(null)}
          style={styles.backBtnRow}
        >
          <MasteraIcon name="chevron-left" size={18} color={tokens.textPrimary} />
          <Text style={[styles.backBtnText, { color: tokens.textPrimary }]}>
            {selectedCourse.courseTitle}
          </Text>
        </TouchableOpacity>

        <View
          style={[
            styles.statsCard,
            { backgroundColor: tokens.surface, borderColor: tokens.border },
          ]}
        >
          <View style={[styles.masteryPill, { borderColor: tokens.primary }]}>
            <Text style={[styles.masteryPillText, { color: tokens.primary }]}>
              {selectedCourse.masteryPercent}%
            </Text>
          </View>
          <View>
            <Text style={[styles.statValue, { color: tokens.textPrimary }]}>
              {selectedCourse.completedChapters}/{selectedCourse.totalChapters}
            </Text>
            <Text style={[styles.statLabel, { color: tokens.textMuted }]}>
              Chapters
            </Text>
          </View>
          <View>
            <Text style={[styles.statValue, { color: tokens.textPrimary }]}>
              {selectedCourse.avgQuizPercent}%
            </Text>
            <Text style={[styles.statLabel, { color: tokens.textMuted }]}>
              Avg quiz
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Tests & Exams History View
  if (subView === 'HISTORY') {
    const passedCount = pastAttempts.filter((a) => a.passed).length;
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.screenTitle, { color: tokens.textPrimary }]}>
            Tests & Exams
          </Text>
          <TouchableOpacity
            onPress={() => setSubView('OVERVIEW')}
            style={[
              styles.pillButton,
              { borderColor: tokens.primary, backgroundColor: tokens.surface },
            ]}
          >
            <Text style={[styles.pillButtonText, { color: tokens.primary }]}>
              Overview
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridThree}>
          <View
            style={[
              styles.metricCard,
              { backgroundColor: tokens.surface, borderColor: tokens.border },
            ]}
          >
            <Text style={[styles.metricLabel, { color: tokens.textMuted }]}>
              Best score
            </Text>
            <Text style={[styles.metricValue, { color: tokens.primary }]}>
              80%
            </Text>
          </View>
          <View
            style={[
              styles.metricCard,
              { backgroundColor: tokens.surface, borderColor: tokens.border },
            ]}
          >
            <Text style={[styles.metricLabel, { color: tokens.textMuted }]}>
              Attempts
            </Text>
            <Text style={[styles.metricValue, { color: tokens.textPrimary }]}>
              {pastAttempts.length}
            </Text>
          </View>
          <View
            style={[
              styles.metricCard,
              { backgroundColor: tokens.surface, borderColor: tokens.border },
            ]}
          >
            <Text style={[styles.metricLabel, { color: tokens.textMuted }]}>
              Passed
            </Text>
            <Text style={[styles.metricValue, { color: tokens.textPrimary }]}>
              {passedCount}
            </Text>
          </View>
        </View>

        <View style={styles.listCol}>
          {pastAttempts.map((att) => (
            <TouchableOpacity
              key={att.attemptId}
              onPress={() => onOpenReviewAttempt(att.attemptId)}
              style={[
                styles.attemptRow,
                { backgroundColor: tokens.surface, borderColor: tokens.border },
              ]}
            >
              <View style={styles.attemptLeft}>
                <Text style={[styles.attemptTitle, { color: tokens.textPrimary }]}>
                  {att.title}
                </Text>
                <Text style={[styles.attemptSubtitle, { color: tokens.textMuted }]}>
                  {att.dateAndDurationLabel}
                </Text>
              </View>

              <View style={styles.attemptRight}>
                <Text
                  style={[
                    styles.attemptScore,
                    { color: att.passed ? tokens.primary : tokens.amber },
                  ]}
                >
                  {att.scoreLabel}
                </Text>
                <View
                  style={[
                    styles.badgePill,
                    {
                      backgroundColor: att.passed
                        ? tokens.primarySoft
                        : tokens.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgePillText,
                      { color: att.passed ? tokens.primary : tokens.textPrimary },
                    ]}
                  >
                    {att.passed ? 'Passed' : 'Retake'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  }

  // Learning Progress Overview Screen
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tokens.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.screenTitle, { color: tokens.textPrimary }]}>
          Learning Progress
        </Text>
        <View
          style={[
            styles.streakBadge,
            { backgroundColor: tokens.primarySoft },
          ]}
        >
          <Text style={[styles.streakText, { color: tokens.primary }]}>
            {streakDays}-day streak
          </Text>
        </View>
      </View>

      {/* Mastery Ring + Weekly Activity Card */}
      <View
        style={[
          styles.overviewCard,
          { backgroundColor: tokens.surface, borderColor: tokens.border },
        ]}
      >
        <View style={styles.masteryRow}>
          <View style={[styles.circleBadge, { borderColor: tokens.primary }]}>
            <Text style={[styles.circleBadgeText, { color: tokens.primary }]}>
              {overallMasteryPercent}%
            </Text>
          </View>
          <View style={styles.masteryInfo}>
            <Text style={[styles.statLabel, { color: tokens.textMuted }]}>
              Overall Semester Mastery
            </Text>
            <Text style={[styles.masterySubtitle, { color: tokens.textPrimary }]}>
              {completedChaptersTotal} of {totalChaptersCount} chapters completed · {quizzesPassedCount} practice quizzes passed
            </Text>
          </View>
        </View>

        {/* Weekly Activity Bars */}
        <View style={styles.barsContainer}>
          {weeklyActivityHeights.map((h, idx) => (
            <View key={idx} style={styles.barCol}>
              <View
                style={[
                  styles.activityBar,
                  {
                    height: Math.max(8, Math.min(36, h)),
                    backgroundColor: tokens.primary,
                  },
                ]}
              />
              <Text style={[styles.dayLabel, { color: tokens.textMuted }]}>
                {dayLabels[idx]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Course Progress Cards List */}
      <View style={styles.listCol}>
        {coursesProgress.map((cp) => (
          <TouchableOpacity
            key={cp.courseId}
            onPress={() => setSelectedCourse(cp)}
            style={[
              styles.courseCard,
              { backgroundColor: tokens.surface, borderColor: tokens.border },
            ]}
          >
            <View style={styles.courseCardTop}>
              <Text style={[styles.courseTitle, { color: tokens.textPrimary }]}>
                {cp.courseTitle}
              </Text>
              <Text style={[styles.coursePercent, { color: tokens.primary }]}>
                {cp.masteryPercent}%
              </Text>
            </View>
            <Text style={[styles.courseMeta, { color: tokens.textMuted }]}>
              Chapter {cp.completedChapters} of {cp.totalChapters} · {cp.avgQuizPercent}% avg quiz score
            </Text>
            <Text style={[styles.offlineStatus, { color: tokens.primary }]}>
              {cp.isSavedOffline ? '✓ Saved offline' : 'Not downloaded'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Button to Tests & Exams History */}
      <TouchableOpacity
        onPress={() => setSubView('HISTORY')}
        style={[
          styles.outlineBtn,
          { borderColor: tokens.primary, backgroundColor: tokens.surface },
        ]}
      >
        <Text style={[styles.outlineBtnText, { color: tokens.primary }]}>
          View Tests & Exams History
        </Text>
      </TouchableOpacity>
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
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  streakBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
  },
  overviewCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  masteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  circleBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBadgeText: {
    fontSize: 15,
    fontWeight: '800',
  },
  masteryInfo: {
    flex: 1,
  },
  masterySubtitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
    lineHeight: 18,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 54,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  activityBar: {
    width: 14,
    borderRadius: 4,
    marginBottom: 4,
  },
  dayLabel: {
    fontSize: 10,
  },
  listCol: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  courseCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  courseCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  coursePercent: {
    fontSize: 14,
    fontWeight: '800',
  },
  courseMeta: {
    fontSize: 11,
    marginBottom: 4,
  },
  offlineStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  outlineBtn: {
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCenterBox: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
    paddingHorizontal: 20,
  },
  localAccountCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  localAccountText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  backBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.md,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  masteryPill: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  masteryPillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
  },
  pillButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  pillButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  gridThree: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  metricCard: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  attemptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  attemptLeft: {
    flex: 1,
  },
  attemptTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  attemptSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  attemptRight: {
    alignItems: 'flex-end',
  },
  attemptScore: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
