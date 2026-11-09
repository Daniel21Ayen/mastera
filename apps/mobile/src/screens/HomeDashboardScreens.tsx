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

export type HomeAdaptiveStage =
  | 'SYNCED_ACTIVE'
  | 'LOCAL_ONLY'
  | 'PAYMENT_PENDING'
  | 'OFFLINE_EXPIRING';

export interface RecentlyAccessedItem {
  id: string;
  badgeLetter: string;
  title: string;
  subtitle: string;
  targetType: 'CHAPTER' | 'NOTES' | 'EXAM';
  targetId?: string;
}

export interface HomeDashboardScreensProps {
  studentFirstName: string;
  accountState?: StudentAccountState;
  adaptiveStage: HomeAdaptiveStage;
  enrolledCoursesCount: number;
  pendingOrdersCount?: number;
  bundleDaysRemaining?: number | null;
  renewalWindowDays?: number; // Default 14 (DR-11)
  continueLearningCourseTitle?: string;
  continueLearningProgressPercent?: number;
  recentItems?: RecentlyAccessedItem[];
  onOpenMyCourses: () => void;
  onOpenProgressTab: () => void;
  onOpenCocExam?: () => void;
  onOpenStoreBundles?: () => void;
  onOpenBuyExtras?: () => void;
  onOpenRecentItem?: (item: RecentlyAccessedItem) => void;
  onSeeAllRecent?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  themeMode?: ThemeMode;
}

const DEFAULT_RECENT_ITEMS: RecentlyAccessedItem[] = [
  {
    id: 'rec-calc',
    badgeLetter: 'C',
    title: 'Calculus I',
    subtitle: 'Chapter 2 · 2 days ago',
    targetType: 'CHAPTER',
    targetId: 'c-calc',
  },
  {
    id: 'rec-grammar',
    badgeLetter: 'G',
    title: 'Grammar',
    subtitle: 'Notes · 3 days ago',
    targetType: 'NOTES',
    targetId: 'c-eng',
  },
  {
    id: 'rec-aastu',
    badgeLetter: 'A',
    title: 'AASTU (Mid) Exam',
    subtitle: 'Viewed 5 days ago',
    targetType: 'EXAM',
    targetId: 'set-aastu-mid',
  },
];

export function HomeDashboardScreens({
  studentFirstName,
  adaptiveStage,
  enrolledCoursesCount,
  pendingOrdersCount = 1,
  bundleDaysRemaining = 38,
  renewalWindowDays = 14,
  continueLearningCourseTitle = 'Communicative English · Chapter 2',
  continueLearningProgressPercent = 60,
  recentItems = DEFAULT_RECENT_ITEMS,
  onOpenMyCourses,
  onOpenProgressTab,
  onOpenCocExam,
  onOpenStoreBundles,
  onOpenBuyExtras,
  onOpenRecentItem,
  onSeeAllRecent,
  onOpenNotifications,
  onOpenProfile,
  themeMode = 'light',
}: HomeDashboardScreensProps): React.ReactElement {
  const [subScreen, setSubScreen] = useState<'HOME' | 'PAYMENT_ALERTS' | 'STORE_STATUS'>('HOME');
  const [alertsTab, setAlertsTab] = useState<'ALL' | 'ORDERS' | 'EXPIRY'>('ALL');

  const tokens = STUDENT_THEMES[themeMode];

  // Sub-Screen: Payment Alerts
  if (subScreen === 'PAYMENT_ALERTS') {
    return (
      <View style={[styles.container, { backgroundColor: tokens.background }]}>
        <TouchableOpacity
          onPress={() => setSubScreen('HOME')}
          style={styles.backRow}
          activeOpacity={0.7}
        >
          <MasteraIcon name="chevron-left" size={20} color={tokens.textPrimary} />
          <Text style={[styles.subScreenTitle, { color: tokens.textPrimary }]}>
            Payment Alerts
          </Text>
        </TouchableOpacity>

        {/* Tabs: All | Orders | Expiry */}
        <View style={styles.tabsRow}>
          {(['ALL', 'ORDERS', 'EXPIRY'] as const).map((tab) => {
            const isSelected = alertsTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setAlertsTab(tab)}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: isSelected ? tokens.primary : tokens.surface,
                    borderColor: isSelected ? tokens.primary : tokens.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    { color: isSelected ? tokens.white : tokens.textPrimary },
                  ]}
                >
                  {tab.charAt(0) + tab.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.alertList}>
          <View
            style={[
              styles.alertCard,
              {
                backgroundColor: tokens.amberSoft,
                borderColor: tokens.amber,
              },
            ]}
          >
            <Text style={[styles.alertCardTitle, { color: tokens.textPrimary }]}>
              Receipt under review
            </Text>
            <Text style={[styles.alertCardSubtitle, { color: tokens.textMuted }]}>
              Semester Bundle · 200 ETB
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Sub-Screen: Subscription & Store Status
  if (subScreen === 'STORE_STATUS') {
    const daysLeft = bundleDaysRemaining ?? 38;
    const canRenew = daysLeft <= renewalWindowDays;

    return (
      <View style={[styles.container, { backgroundColor: tokens.background }]}>
        <TouchableOpacity
          onPress={() => setSubScreen('HOME')}
          style={styles.backRow}
          activeOpacity={0.7}
        >
          <MasteraIcon name="chevron-left" size={20} color={tokens.textPrimary} />
          <Text style={[styles.subScreenTitle, { color: tokens.textPrimary }]}>
            Subscription and store
          </Text>
        </TouchableOpacity>

        {/* Active Bundle Card */}
        <View style={[styles.bundleCard, { backgroundColor: tokens.ink }]}>
          <View style={styles.bundleHeader}>
            <View>
              <Text style={[styles.bundleSubtitle, { color: tokens.textMuted }]}>ACTIVE BUNDLE</Text>
              <Text style={[styles.bundleTitle, { color: tokens.white }]}>Semester Bundle</Text>
            </View>
            <View style={[styles.bundleBadge, { backgroundColor: tokens.amber }]}>
              <Text style={[styles.bundleBadgeText, { color: tokens.ink }]}>Active</Text>
            </View>
          </View>

          <View style={styles.bundleBody}>
            <View style={[styles.bundleDaysCircle, { borderColor: tokens.amber }]}>
              <Text style={[styles.bundleDaysNumber, { color: tokens.white }]}>{daysLeft}d</Text>
            </View>
            <View style={styles.bundleDaysTextGroup}>
              <Text style={[styles.bundleDaysLabel, { color: tokens.textMuted }]}>Started on approval</Text>
              <Text style={[styles.bundleDaysLabel, { color: tokens.textMuted }]}>Expires in {daysLeft} days</Text>
              <Text style={[styles.bundleDaysCovered, { color: tokens.white }]}>7 courses covered</Text>
            </View>
          </View>
        </View>

        {/* Extra Courses Card */}
        <View
          style={[
            styles.extraCourseCard,
            { backgroundColor: tokens.surface, borderColor: tokens.border },
          ]}
        >
          <View>
            <Text style={[styles.extraCourseLabel, { color: tokens.textMuted }]}>
              Extra courses
            </Text>
            <Text style={[styles.extraCourseName, { color: tokens.textPrimary }]}>
              Logic
            </Text>
          </View>
          <View style={[styles.extraPill, { backgroundColor: tokens.primarySoft }]}>
            <Text style={[styles.extraPillText, { color: tokens.primary }]}>
              38 days left
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onOpenBuyExtras}
          style={[styles.primaryActionBtn, { backgroundColor: tokens.primary }]}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryActionBtnText}>+ Buy extra courses</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={!canRenew}
          onPress={onOpenStoreBundles}
          style={[
            styles.secondaryActionBtn,
            {
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              opacity: canRenew ? 1 : 0.6,
            },
          ]}
          activeOpacity={0.8}
        >
          <Text style={[styles.secondaryActionBtnText, { color: tokens.textMuted }]}>
            Renew bundle · opens in last {renewalWindowDays} days
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main Home Dashboard matching user's exact uploaded design:
  // Top: "Hello, Abebe" + subtitle + Bell & Avatar badges
  // Hero: Royal Blue "Continue Learning" with translucent Play ▶ button + 60% progress bar
  // Stats: 3 white cards ("My Courses", "Learning Stats", "Store Status") with light-blue square badges
  // COC Exam: Pastel green card with green "C" badge, title, subtitle & chevron >
  // Recently Accessed: "Recently Accessed" + "See all", 3 cards (Calculus I, Grammar, AASTU Mid Exam)
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tokens.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Top Greeting Header with Notification Bell and Avatar */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greetingTitle, { color: tokens.textPrimary }]}>
            Hello, {studentFirstName || 'Abebe'}
          </Text>
          <Text style={[styles.greetingSubtitle, { color: tokens.textMuted }]}>
            Keep learning, your future is bright!
          </Text>
        </View>

        <View style={styles.headerRight}>
          {/* Notification Bell Badge Button */}
          <TouchableOpacity
            style={[
              styles.iconCircleBtn,
              { backgroundColor: tokens.surface, borderColor: tokens.border },
            ]}
            onPress={onOpenNotifications || (() => setSubScreen('PAYMENT_ALERTS'))}
            activeOpacity={0.7}
          >
            <Text style={[styles.iconLetterN, { color: tokens.textPrimary }]}>N</Text>
            {/* Red indicator dot */}
            <View style={[styles.notificationRedDot, { backgroundColor: tokens.danger }]} />
          </TouchableOpacity>

            <TouchableOpacity
              style={[styles.avatarCircle, { backgroundColor: tokens.ink }]}
              onPress={onOpenProfile}
              activeOpacity={0.8}
            >
              <Text style={[styles.avatarInitial, { color: tokens.white }]}>
                {studentFirstName ? studentFirstName.charAt(0).toUpperCase() : 'A'}
              </Text>
            </TouchableOpacity>
        </View>
      </View>

      {/* 2. Hero Card: Royal Blue "Continue Learning" with Progress Bar */}
      <TouchableOpacity
        style={[styles.heroCard, { backgroundColor: tokens.primary }]}
        onPress={onOpenProgressTab}
        activeOpacity={0.85}
      >
        <View style={styles.heroTopRow}>
          <View style={styles.heroLeftSection}>
            {/* Translucent Play ▶ Icon */}
            <View style={styles.heroPlayCircle}>
              <View style={[styles.heroPlayTriangle, { borderLeftColor: tokens.white }]} />
            </View>

            <View style={styles.heroTextGroup}>
              <Text style={styles.heroSubLabel}>Continue Learning</Text>
              <Text style={[styles.heroCourseTitle, { color: tokens.white }]}>
                {continueLearningCourseTitle}
              </Text>
            </View>
          </View>

          {/* Progress Percent */}
          <Text style={[styles.heroPercentText, { color: tokens.white }]}>
            {continueLearningProgressPercent}%
          </Text>
        </View>

        {/* Horizontal Progress Bar */}
        <View style={styles.heroProgressTrack}>
          <View
            style={[
              styles.heroProgressFill,
              { width: `${Math.min(100, Math.max(5, continueLearningProgressPercent))}%`, backgroundColor: tokens.white },
            ]}
          />
        </View>
      </TouchableOpacity>

      {/* 3. 3-Card Quick Stats Row */}
      <View style={styles.statsRow}>
        {/* Card 1: My Courses */}
        <TouchableOpacity
          style={[
            styles.statCard,
            { backgroundColor: tokens.surface, borderColor: tokens.border },
          ]}
          onPress={onOpenMyCourses}
          activeOpacity={0.75}
        >
          <View style={[styles.statSquareBadge, { backgroundColor: tokens.badgeBg }]}>
            <Text style={[styles.statSquareLetter, { color: tokens.badgeText }]}>M</Text>
          </View>
          <Text style={[styles.statCardTitle, { color: tokens.textPrimary }]}>
            My Courses
          </Text>
          <Text style={[styles.statCardSubtitle, { color: tokens.textMuted }]}>
            {enrolledCoursesCount || 7} courses enrolled
          </Text>
        </TouchableOpacity>

        {/* Card 2: Learning Stats */}
        <TouchableOpacity
          style={[
            styles.statCard,
            { backgroundColor: tokens.surface, borderColor: tokens.border },
          ]}
          onPress={onOpenProgressTab}
          activeOpacity={0.75}
        >
          <View style={[styles.statSquareBadge, { backgroundColor: tokens.badgeBg }]}>
            <Text style={[styles.statSquareLetter, { color: tokens.badgeText }]}>%</Text>
          </View>
          <Text style={[styles.statCardTitle, { color: tokens.textPrimary }]}>
            Learning Stats
          </Text>
          <Text style={[styles.statCardSubtitle, { color: tokens.textMuted }]}>
            6 of 15 chapters
          </Text>
        </TouchableOpacity>

        {/* Card 3: Store Status */}
        <TouchableOpacity
          style={[
            styles.statCard,
            { backgroundColor: tokens.surface, borderColor: tokens.border },
          ]}
          onPress={() => (onOpenStoreBundles ? onOpenStoreBundles() : setSubScreen('STORE_STATUS'))}
          activeOpacity={0.75}
        >
          <View style={[styles.statSquareBadge, { backgroundColor: tokens.badgeBg }]}>
            <Text style={[styles.statSquareLetter, { color: tokens.badgeText }]}>S</Text>
          </View>
          <Text style={[styles.statCardTitle, { color: tokens.textPrimary }]}>
            Store Status
          </Text>
          <Text style={[styles.statCardSubtitle, { color: tokens.textMuted }]}>
            1 active · {pendingOrdersCount || 1} pending
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Recently Accessed Section */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeaderRow}>
          <Text style={[styles.recentSectionTitle, { color: tokens.textPrimary }]}>
            Recently Accessed
          </Text>
          <TouchableOpacity onPress={onSeeAllRecent || onOpenMyCourses} activeOpacity={0.7}>
            <Text style={[styles.seeAllText, { color: tokens.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Recently Accessed Cards */}
        {recentItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.recentCard,
              { backgroundColor: tokens.surface, borderColor: tokens.border },
            ]}
            onPress={() => (onOpenRecentItem ? onOpenRecentItem(item) : onOpenMyCourses())}
            activeOpacity={0.75}
          >
            <View style={styles.recentCardLeft}>
              <View style={[styles.recentSquareBadge, { backgroundColor: tokens.badgeBg }]}>
                <Text style={[styles.recentSquareLetter, { color: tokens.badgeText }]}>
                  {item.badgeLetter}
                </Text>
              </View>
              <View style={styles.recentTextGroup}>
                <Text style={[styles.recentTitle, { color: tokens.textPrimary }]}>
                  {item.title}
                </Text>
                <Text style={[styles.recentSubtitle, { color: tokens.textMuted }]}>
                  {item.subtitle}
                </Text>
              </View>
            </View>

            <MasteraIcon name="chevron-right" size={18} color={tokens.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  greetingSubtitle: {
    fontSize: 13,
    marginTop: 3,
    fontWeight: '400',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconLetterN: {
    fontSize: 14,
    fontWeight: '700',
  },
  notificationRedDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 15,
    fontWeight: '700',
  },
  heroCard: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 16,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  heroPlayCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heroPlayTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 2,
  },
  heroTextGroup: {
    flex: 1,
  },
  heroSubLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  heroCourseTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  heroPercentText: {
    fontSize: 17,
    fontWeight: '800',
  },
  heroProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginTop: 14,
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  statSquareBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statSquareLetter: {
    fontSize: 15,
    fontWeight: '800',
  },
  statCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  statCardSubtitle: {
    fontSize: 11,
    fontWeight: '400',
  },
  cocCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cocLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  cocSquareBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cocSquareLetter: {
    fontSize: 16,
    fontWeight: '800',
  },
  cocTextGroup: {
    flex: 1,
  },
  cocTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cocSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  recentSection: {
    marginTop: 4,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  recentCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentSquareBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentSquareLetter: {
    fontSize: 14,
    fontWeight: '800',
  },
  recentTextGroup: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  recentSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingVertical: 4,
  },
  subScreenTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  alertList: {
    gap: 10,
  },
  alertCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  alertCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  alertCardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  bundleCard: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
  },
  bundleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bundleSubtitle: {
    fontSize: 10,
    fontWeight: '700',
  },
  bundleTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  bundleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  bundleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  bundleBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bundleDaysCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bundleDaysNumber: {
    fontWeight: '800',
    fontSize: 14,
  },
  bundleDaysTextGroup: {
    gap: 2,
  },
  bundleDaysLabel: {
    fontSize: 12,
  },
  bundleDaysCovered: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  extraCourseCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  extraCourseLabel: {
    fontSize: 11,
  },
  extraCourseName: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  extraPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  extraPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  primaryActionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  primaryActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
