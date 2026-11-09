import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import {
  CatalogCourseDto,
  PaymentMethodEntryDto,
  StudentAccountState,
} from '@mastera/contracts';
import {
  RADIUS,
  SPACING,
  STUDENT_THEMES,
  ThemeMode,
  COURSE_ACCENTS,
} from '@mastera/ui-tokens';
import { MasteraIcon } from '../shared/components/MasteraIcon';

const STATUS_BAR_HEIGHT = StatusBar.currentHeight ?? 24;

export type ProfileFlowScreen =
  | 'PROFILE_MAIN'
  | 'EDIT_PROFILE'
  | 'UNIVERSITY_SCOPE'
  | 'MY_COURSES_CHECK_IN_OUT'
  | 'ABOUT_US'
  | 'FEEDBACK'
  | 'LANGUAGE_SETTINGS'
  | 'RELEASE_DEVICE_SHEET'
  | 'DEVICE_LOCKED'
  | 'SUBSCRIPTION_DASHBOARD'
  | 'STORE_CATALOG'
  | 'BUNDLE_BUILDER'
  | 'EXTRA_COURSES'
  | 'PAYMENT_CHECKOUT'
  | 'ACCOUNT_SETUP'
  | 'ORDER_STATUS_PENDING'
  | 'ORDER_APPROVED_MS_ID';

export interface AcademicScopeState {
  universityId: string;
  universityName: string;
  programId: string;
  programName: string;
  semester: 'Semester 1' | 'Semester 2';
  stream: 'Natural' | 'Social';
}

export interface ProfileAndStoreScreensProps {
  initialScreen?: ProfileFlowScreen;
  accountState: StudentAccountState;
  studentCode: string | null; // e.g., "MS0001"
  fullName: string;
  identifier: string; // phone or email
  email?: string;
  scopeSummaryLabel: string;
  academicScope: AcademicScopeState;
  onChangeAcademicScope: (scope: AcademicScopeState) => void;
  onUpdateProfileInfo?: (name: string, phone: string, email: string) => void;
  downloadedSizeMB: number;
  uiLanguage: 'en' | 'am';
  hasActiveBundle: boolean;
  departmentCourses: CatalogCourseDto[];
  selectedCourseIds: string[];
  onToggleCourseCheckInOut: (courseId: string) => void;
  paymentMethods: PaymentMethodEntryDto[];
  onOpenDownloadsManager: () => void;
  onChangeUiLanguage: (lang: 'en' | 'am') => void;
  onReleaseDeviceAndLogout: () => void;
  onSubmitBundleOrder: (payload: {
    selectedCourseIds: string[];
    paymentMethodId: string;
    transactionReference: string;
    fullName?: string;
    phoneNumber?: string;
    password?: string;
  }) => void;
  themeMode?: ThemeMode;
  onToggleTheme?: () => void;
}

export function ProfileAndStoreScreens({
  initialScreen = 'PROFILE_MAIN',
  accountState = 'LOCAL_ONLY',
  studentCode,
  fullName,
  identifier,
  email = 'student@mastera.et',
  scopeSummaryLabel,
  academicScope,
  onChangeAcademicScope,
  onUpdateProfileInfo,
  downloadedSizeMB,
  uiLanguage,
  hasActiveBundle,
  departmentCourses,
  selectedCourseIds,
  onToggleCourseCheckInOut,
  paymentMethods,
  onOpenDownloadsManager,
  onChangeUiLanguage,
  onReleaseDeviceAndLogout,
  onSubmitBundleOrder,
  themeMode = 'light',
  onToggleTheme,
}: ProfileAndStoreScreensProps): React.ReactElement {
  const [screen, setScreen] = useState<ProfileFlowScreen>(initialScreen);

  React.useEffect(() => {
    if (initialScreen) {
      setScreen(initialScreen);
    }
  }, [initialScreen]);

  const [copiedMethodId, setCopiedMethodId] = useState<string | null>(null);
  const [receiptAttached, setReceiptAttached] = useState<boolean>(true);
  const [bundleCheckedIds, setBundleCheckedIds] = useState<Set<string>>(
    () => new Set(departmentCourses.slice(0, 7).map((c) => c.id))
  );
  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    paymentMethods[0]?.id ?? 'pm-cbe-mobile'
  );
  const [txRef, setTxRef] = useState('FT26302MAC789');

  // Account Setup Form state (Offline registration pre-submit)
  const [setupFullName, setSetupFullName] = useState(fullName);
  const [setupPhone, setSetupPhone] = useState(identifier);
  const [setupPassword, setSetupPassword] = useState('');
  const [setupEmail, setSetupEmail] = useState(email);

  // University & Program switcher local state
  const [tempUniversity, setTempUniversity] = useState(academicScope.universityName);
  const [tempProgram, setTempProgram] = useState(academicScope.programName);
  const [tempSemester, setTempSemester] = useState<'Semester 1' | 'Semester 2'>(academicScope.semester);
  const [tempStream, setTempStream] = useState<'Natural' | 'Social'>(academicScope.stream);

  // Dropdown expansion state (collapsed by default, not automatically opened)
  const [isScopeUniOpen, setIsScopeUniOpen] = useState(false);
  const [isScopeDeptOpen, setIsScopeDeptOpen] = useState(false);

  // Feedback state
  const [feedbackCategory, setFeedbackCategory] = useState<
    'Bug Report' | 'Content Suggestion' | 'Feature Request' | 'Other'
  >('Bug Report');
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [feedbackContact, setFeedbackContact] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  const tokens = STUDENT_THEMES[themeMode];

  // Helper for top squircle back arrow
  const renderBackArrow = (onBack: () => void) => (
    <TouchableOpacity
      onPress={onBack}
      style={[
        styles.topBackArrowBtn,
        { backgroundColor: tokens.surface, borderColor: tokens.border },
      ]}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      activeOpacity={0.7}
    >
      <MasteraIcon name="chevron-left" size={20} color={tokens.textPrimary} />
    </TouchableOpacity>
  );

  // ==========================================================================
  // SCREEN 4: UNIVERSITY & PROGRAM (preview (3).webp - Panel 1, Screen 4)
  // ==========================================================================
  if (screen === 'UNIVERSITY_SCOPE') {
    const universityOptions = [
      { id: 'BDU', name: 'BDU - Bahir Dar University' },
      { id: 'AASTU', name: 'AASTU - Addis Ababa Science & Tech' },
      { id: 'AAU', name: 'AAU - Addis Ababa University' },
      { id: 'ASTU', name: 'ASTU - Adama Science & Tech' },
    ];

    const departmentOptions = [
      { id: 'FRESHMAN', name: 'Freshman Department' },
      { id: 'SWE', name: 'Software Engineering' },
      { id: 'ECE', name: 'Electrical & Computer Engineering' },
      { id: 'CIVIL', name: 'Civil Engineering' },
      { id: 'MED', name: 'Medicine & Health Sciences' },
    ];

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerBackRow}>
          {renderBackArrow(() => setScreen('PROFILE_MAIN'))}
          <Text style={[styles.screenTitleWithBack, { color: tokens.textPrimary }]}>
            University &amp; Program
          </Text>
        </View>

        {/* University Selector Dropdown (not automatically opened) */}
        <Text style={[styles.inputSectionHeader, { color: tokens.textMuted }]}>
          UNIVERSITY
        </Text>
        <TouchableOpacity
          onPress={() => {
            setIsScopeUniOpen((prev) => !prev);
            setIsScopeDeptOpen(false);
          }}
          style={[
            styles.selectionCard,
            {
              backgroundColor: tokens.surface,
              borderColor: isScopeUniOpen ? tokens.primary : tokens.border,
              marginBottom: 4,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.selectionCardText,
              { color: tokens.textPrimary, fontWeight: '700' },
            ]}
          >
            {tempUniversity}
          </Text>
          <MasteraIcon
            name={isScopeUniOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={tokens.textMuted}
          />
        </TouchableOpacity>

        {isScopeUniOpen && (
          <View
            style={{
              borderRadius: RADIUS.lg,
              borderWidth: 1,
              borderColor: tokens.border,
              backgroundColor: tokens.surface,
              overflow: 'hidden',
              marginBottom: SPACING.md,
            }}
          >
            {universityOptions.map((u) => {
              const isSel = tempUniversity.includes(u.id);
              return (
                <TouchableOpacity
                  key={u.id}
                  onPress={() => {
                    setTempUniversity(u.name);
                    setIsScopeUniOpen(false);
                  }}
                  style={[
                    {
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottomWidth: 0.5,
                      borderBottomColor: tokens.border,
                    },
                    isSel && { backgroundColor: tokens.primarySoft },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.selectionCardText,
                      {
                        color: isSel ? tokens.primary : tokens.textPrimary,
                        fontWeight: isSel ? '700' : '500',
                      },
                    ]}
                  >
                    {u.name}
                  </Text>
                  {isSel && (
                    <MasteraIcon name="check-circle" size={18} color={tokens.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Department / Program Selector Dropdown (not automatically opened) */}
        <Text
          style={[
            styles.inputSectionHeader,
            { color: tokens.textMuted, marginTop: SPACING.md },
          ]}
        >
          DEPARTMENT / PROGRAM
        </Text>
        <TouchableOpacity
          onPress={() => {
            setIsScopeDeptOpen((prev) => !prev);
            setIsScopeUniOpen(false);
          }}
          style={[
            styles.selectionCard,
            {
              backgroundColor: tokens.surface,
              borderColor: isScopeDeptOpen ? tokens.primary : tokens.border,
              marginBottom: 4,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.selectionCardText,
              { color: tokens.textPrimary, fontWeight: '700' },
            ]}
          >
            {tempProgram}
          </Text>
          <MasteraIcon
            name={isScopeDeptOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={tokens.textMuted}
          />
        </TouchableOpacity>

        {isScopeDeptOpen && (
          <View
            style={{
              borderRadius: RADIUS.lg,
              borderWidth: 1,
              borderColor: tokens.border,
              backgroundColor: tokens.surface,
              overflow: 'hidden',
              marginBottom: SPACING.md,
            }}
          >
            {departmentOptions.map((d) => {
              const isSel = tempProgram === d.name;
              return (
                <TouchableOpacity
                  key={d.id}
                  onPress={() => {
                    setTempProgram(d.name);
                    setIsScopeDeptOpen(false);
                  }}
                  style={[
                    {
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottomWidth: 0.5,
                      borderBottomColor: tokens.border,
                    },
                    isSel && { backgroundColor: tokens.primarySoft },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.selectionCardText,
                      {
                        color: isSel ? tokens.primary : tokens.textPrimary,
                        fontWeight: isSel ? '700' : '500',
                      },
                    ]}
                  >
                    {d.name}
                  </Text>
                  {isSel && (
                    <MasteraIcon name="check-circle" size={18} color={tokens.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Semester Segmented Selector */}
        <Text
          style={[
            styles.inputSectionHeader,
            { color: tokens.textMuted, marginTop: SPACING.md },
          ]}
        >
          SEMESTER
        </Text>
        <View style={styles.segmentedRow}>
          {(['Semester 1', 'Semester 2'] as const).map((sem) => {
            const isSel = tempSemester === sem;
            return (
              <TouchableOpacity
                key={sem}
                onPress={() => setTempSemester(sem)}
                style={[
                  styles.segmentedBtn,
                  {
                    backgroundColor: isSel ? tokens.primary : tokens.surface,
                    borderColor: isSel ? tokens.primary : tokens.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segmentedBtnText,
                    { color: isSel ? tokens.surface : tokens.textPrimary },
                  ]}
                >
                  {sem}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Academic Stream Segmented Selector */}
        <Text
          style={[
            styles.inputSectionHeader,
            { color: tokens.textMuted, marginTop: SPACING.md },
          ]}
        >
          ACADEMIC STREAM
        </Text>
        <View style={styles.segmentedRow}>
          {(['Natural', 'Social'] as const).map((st) => {
            const isSel = tempStream === st;
            return (
              <TouchableOpacity
                key={st}
                onPress={() => setTempStream(st)}
                style={[
                  styles.segmentedBtn,
                  {
                    backgroundColor: isSel ? tokens.primary : tokens.surface,
                    borderColor: isSel ? tokens.primary : tokens.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segmentedBtnText,
                    { color: isSel ? tokens.surface : tokens.textPrimary },
                  ]}
                >
                  {st}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Informational Scope Note */}
        <View
          style={[
            styles.noticeCard,
            { backgroundColor: tokens.primarySoft, marginTop: SPACING.lg },
          ]}
        >
          <Text style={[styles.noticeText, { color: tokens.primary }]}>
            Changing scope loads the matching course catalog for your department.
            Resources from other departments will not be shown. Purchases and progress are kept.
          </Text>
        </View>

        {/* Save Scope Button */}
        <TouchableOpacity
          onPress={() => {
            onChangeAcademicScope({
              universityId: tempUniversity.split(' ')[0] || 'BDU',
              universityName: tempUniversity,
              programId: tempProgram.toUpperCase().replace(/\s+/g, '_'),
              programName: tempProgram,
              semester: tempSemester,
              stream: tempStream,
            });
            setScreen('PROFILE_MAIN');
          }}
          style={[styles.primaryBtn, { backgroundColor: tokens.primary, marginTop: SPACING.lg }]}
        >
          <Text style={[styles.primaryBtnText, { color: tokens.surface }]}>
            Save scope
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ==========================================================================
  // MY COURSES CHECK-IN / CHECK-OUT SCREEN
  // ==========================================================================
  if (screen === 'MY_COURSES_CHECK_IN_OUT') {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerBackRow}>
          {renderBackArrow(() => setScreen('PROFILE_MAIN'))}
          <Text style={[styles.screenTitleWithBack, { color: tokens.textPrimary }]}>
            My Courses
          </Text>
        </View>

        <Text style={[styles.screenSubtitle, { color: tokens.textMuted }]}>
          Manage active courses on your Course tab. All courses offered in{' '}
          <Text style={{ fontWeight: '700', color: tokens.textPrimary }}>
            {academicScope.programName}
          </Text>{' '}
          are listed below.
        </Text>

        <View style={styles.listCol}>
          {departmentCourses.map((c, idx) => {
            const isChecked = selectedCourseIds.includes(c.id);
            const accents = [
              COURSE_ACCENTS.amber,
              COURSE_ACCENTS.teal,
              COURSE_ACCENTS.indigo,
              tokens.primary,
            ];
            const iconBg = accents[idx % accents.length];

            return (
              <View
                key={c.id}
                style={[
                  styles.courseCheckInOutCard,
                  {
                    backgroundColor: tokens.surface,
                    borderColor: isChecked ? tokens.primary : tokens.border,
                  },
                ]}
              >
                <View style={[styles.courseIconBox, { backgroundColor: iconBg }]}>
                  <MasteraIcon name="book-open" size={20} color={tokens.white} />
                </View>

                <View style={styles.courseCheckInOutInfo}>
                  <Text style={[styles.courseTitleText, { color: tokens.textPrimary }]}>
                    {c.title}
                  </Text>
                  <Text style={[styles.courseMetaText, { color: tokens.textMuted }]}>
                    {c.code} · {c.semester === 1 ? 'Semester 1' : 'Semester 2'}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => onToggleCourseCheckInOut(c.id)}
                  style={[
                    styles.checkInOutBtn,
                    {
                      backgroundColor: isChecked ? tokens.primary : tokens.surface,
                      borderColor: tokens.primary,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.checkInOutBtnText,
                      { color: isChecked ? tokens.surface : tokens.primary },
                    ]}
                  >
                    {isChecked ? '✓ Checked In' : '+ Check In'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View
          style={[
            styles.noticeCard,
            { backgroundColor: tokens.primarySoft, marginTop: SPACING.md },
          ]}
        >
          <Text style={[styles.noticeText, { color: tokens.primary }]}>
            Checked courses immediately appear on your main Course tab. Unchecked courses stay available here in your department.
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setScreen('PROFILE_MAIN')}
          style={[styles.primaryBtn, { backgroundColor: tokens.primary, marginTop: SPACING.lg }]}
        >
          <Text style={[styles.primaryBtnText, { color: tokens.surface }]}>
            Done
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ==========================================================================
  // SCREEN 3: EDIT PROFILE (preview (3).webp - Panel 1, Screen 3)
  // ==========================================================================
  if (screen === 'EDIT_PROFILE') {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerBackRow}>
          {renderBackArrow(() => setScreen('PROFILE_MAIN'))}
          <Text style={[styles.screenTitleWithBack, { color: tokens.textPrimary }]}>
            Edit profile
          </Text>
        </View>

        <View style={styles.avatarCenteredCol}>
          <View style={[styles.avatarCircleLarge, { backgroundColor: tokens.primary }]}>
            <Text style={[styles.avatarInitialLarge, { color: tokens.white }]}>
              {setupFullName.charAt(0).toUpperCase() || 'S'}
            </Text>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: tokens.textMuted }]}>FULL NAME</Text>
          <TextInput
            value={setupFullName}
            onChangeText={setSetupFullName}
            style={[
              styles.textInput,
              { backgroundColor: tokens.surface, borderColor: tokens.border, color: tokens.textPrimary },
            ]}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: tokens.textMuted }]}>PHONE NUMBER</Text>
          <TextInput
            value={setupPhone}
            onChangeText={setSetupPhone}
            keyboardType="phone-pad"
            style={[
              styles.textInput,
              { backgroundColor: tokens.surface, borderColor: tokens.border, color: tokens.textPrimary },
            ]}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: tokens.textMuted }]}>EMAIL (OPTIONAL)</Text>
          <TextInput
            value={setupEmail}
            onChangeText={setSetupEmail}
            keyboardType="email-address"
            style={[
              styles.textInput,
              { backgroundColor: tokens.surface, borderColor: tokens.border, color: tokens.textPrimary },
            ]}
          />
        </View>

        <TouchableOpacity
          style={[styles.menuRowItem, { backgroundColor: tokens.surface, borderColor: tokens.border, marginTop: SPACING.sm }]}
        >
          <View>
            <Text style={[styles.menuTitle, { color: tokens.textPrimary }]}>Change password</Text>
            <Text style={[styles.menuSubtitle, { color: tokens.textMuted }]}>Last changed on this phone</Text>
          </View>
          <MasteraIcon name="chevron-right" size={18} color={tokens.textMuted} />
        </TouchableOpacity>

        <View
          style={[
            styles.noticeCard,
            { backgroundColor: tokens.primarySoft, marginTop: SPACING.md },
          ]}
        >
          <Text style={[styles.noticeText, { color: tokens.primary }]}>
            Changes stay on this phone until your first purchase.
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            if (onUpdateProfileInfo) {
              onUpdateProfileInfo(setupFullName, setupPhone, setupEmail);
            }
            setScreen('PROFILE_MAIN');
          }}
          style={[styles.primaryBtn, { backgroundColor: tokens.primary, marginTop: SPACING.lg }]}
        >
          <Text style={[styles.primaryBtnText, { color: tokens.surface }]}>
            Save changes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setScreen('PROFILE_MAIN')}
          style={[styles.outlineBtn, { borderColor: tokens.border, marginTop: SPACING.sm }]}
        >
          <Text style={[styles.outlineBtnText, { color: tokens.textPrimary }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ==========================================================================
  // ABOUT US SCREEN
  // ==========================================================================
  if (screen === 'ABOUT_US') {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBackRow}>
          {renderBackArrow(() => setScreen('PROFILE_MAIN'))}
          <Text style={[styles.screenTitleWithBack, { color: tokens.textPrimary }]}>
            About Us
          </Text>
        </View>

        {/* Brand Banner */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              alignItems: 'center',
              paddingVertical: SPACING.xl,
            },
          ]}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: RADIUS.lg,
              backgroundColor: tokens.primarySoft,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: SPACING.sm,
            }}
          >
            <MasteraIcon name="book-open" size={28} color={tokens.primary} />
          </View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '800',
              color: tokens.textPrimary,
              letterSpacing: 0.5,
            }}
          >
            Mastera
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: tokens.primary,
              marginTop: 2,
            }}
          >
            v3.4.0 · Higher Education Edition
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: tokens.textMuted,
              textAlign: 'center',
              marginTop: SPACING.sm,
              paddingHorizontal: SPACING.md,
              lineHeight: 18,
            }}
          >
            The dedicated academic learning companion for Ethiopian university students.
          </Text>
        </View>

        {/* Mission Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              marginTop: SPACING.md,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: tokens.textPrimary }]}>
            Our Mission
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: tokens.textPrimary,
              lineHeight: 20,
              marginTop: SPACING.xs,
            }}
          >
            Mastera provides university students across Ethiopia with immediate, high-quality, and curriculum-aligned learning materials. Built with an offline-first philosophy, students can study anytime, anywhere without requiring continuous internet or mobile data.
          </Text>
        </View>

        {/* Feature Highlights */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              marginTop: SPACING.md,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: tokens.textPrimary, marginBottom: SPACING.sm }]}>
            Platform Highlights
          </Text>

          <View style={{ gap: SPACING.md }}>
            <View style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' }}>
              <MasteraIcon name="check-circle" size={18} color={tokens.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: tokens.textPrimary }}>
                  100% Offline Learning
                </Text>
                <Text style={{ fontSize: 12, color: tokens.textMuted, marginTop: 2 }}>
                  Download courses once over Wi-Fi or cellular data and read books, notes, and exams completely offline.
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' }}>
              <MasteraIcon name="check-circle" size={18} color={tokens.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: tokens.textPrimary }}>
                  National University Alignment
                </Text>
                <Text style={{ fontSize: 12, color: tokens.textMuted, marginTop: 2 }}>
                  Directly matched with semester syllabus from AAU, AASTU, ASTU, BDU, and all public universities.
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' }}>
              <MasteraIcon name="check-circle" size={18} color={tokens.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: tokens.textPrimary }}>
                  Amharic Explanations & Notes
                </Text>
                <Text style={{ fontSize: 12, color: tokens.textMuted, marginTop: 2 }}>
                  Complex English definitions and technical formulas translated and clarified with native Amharic notes.
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start' }}>
              <MasteraIcon name="check-circle" size={18} color={tokens.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: tokens.textPrimary }}>
                  Comprehensive Assessment Bank
                </Text>
                <Text style={{ fontSize: 12, color: tokens.textMuted, marginTop: 2 }}>
                  Chapter quizzes with answer explanations, past university mid and final exams, and COC exit exam simulations.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact & Support */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              marginTop: SPACING.md,
              marginBottom: SPACING.xl,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: tokens.textPrimary, marginBottom: SPACING.xs }]}>
            Contact & Support
          </Text>
          <Text style={{ fontSize: 12, color: tokens.textMuted, marginBottom: SPACING.sm }}>
            Have questions, feedback, or need help with course enrollment?
          </Text>
          <View style={{ gap: SPACING.xs }}>
            <Text style={{ fontSize: 13, color: tokens.textPrimary }}>
              • Telegram: <Text style={{ fontWeight: '700', color: tokens.primary }}>@mastera_education</Text>
            </Text>
            <Text style={{ fontSize: 13, color: tokens.textPrimary }}>
              • Email: <Text style={{ fontWeight: '700', color: tokens.primary }}>support@mastera.et</Text>
            </Text>
            <Text style={{ fontSize: 13, color: tokens.textPrimary }}>
              • Location: <Text style={{ fontWeight: '600' }}>Addis Ababa, Ethiopia</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ==========================================================================
  // FEEDBACK SCREEN
  // ==========================================================================
  if (screen === 'FEEDBACK') {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBackRow}>
          {renderBackArrow(() => setScreen('PROFILE_MAIN'))}
          <Text style={[styles.screenTitleWithBack, { color: tokens.textPrimary }]}>
            Feedback
          </Text>
        </View>

        {feedbackSubmitted ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: tokens.surface,
                borderColor: tokens.border,
                alignItems: 'center',
                paddingVertical: SPACING.xl,
                marginTop: SPACING.md,
              },
            ]}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: RADIUS.pill,
                backgroundColor: tokens.primarySoft,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: SPACING.md,
              }}
            >
              <MasteraIcon name="check-circle" size={32} color={tokens.primary} />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: tokens.textPrimary,
                marginBottom: SPACING.xs,
              }}
            >
              Thank You!
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: tokens.textMuted,
                textAlign: 'center',
                paddingHorizontal: SPACING.lg,
                lineHeight: 19,
                marginBottom: SPACING.lg,
              }}
            >
              Your feedback has been received. Our academic and engineering teams review every message to make Mastera better for students across Ethiopia.
            </Text>
            <TouchableOpacity
              onPress={() => setScreen('PROFILE_MAIN')}
              style={[
                styles.primaryBtn,
                { backgroundColor: tokens.primary, paddingHorizontal: SPACING.xl },
              ]}
            >
              <Text style={[styles.primaryBtnText, { color: tokens.surface }]}>
                Back to Profile
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: SPACING.md }}>
            {/* Category Selection */}
            <View
              style={[
                styles.card,
                { backgroundColor: tokens.surface, borderColor: tokens.border },
              ]}
            >
              <Text
                style={[
                  styles.cardTitle,
                  { color: tokens.textPrimary, marginBottom: SPACING.sm },
                ]}
              >
                Category
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs }}>
                {(
                  [
                    'Bug Report',
                    'Content Suggestion',
                    'Feature Request',
                    'Other',
                  ] as const
                ).map((cat) => {
                  const isSelected = feedbackCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setFeedbackCategory(cat)}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: RADIUS.pill,
                        borderWidth: 1,
                        borderColor: isSelected ? tokens.primary : tokens.border,
                        backgroundColor: isSelected
                          ? tokens.primarySoft
                          : tokens.surface,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: isSelected ? '700' : '500',
                          color: isSelected ? tokens.primary : tokens.textPrimary,
                        }}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Experience Rating */}
            <View
              style={[
                styles.card,
                { backgroundColor: tokens.surface, borderColor: tokens.border },
              ]}
            >
              <Text
                style={[
                  styles.cardTitle,
                  { color: tokens.textPrimary, marginBottom: SPACING.xs },
                ]}
              >
                Rate Your Experience
              </Text>
              <Text style={{ fontSize: 12, color: tokens.textMuted, marginBottom: SPACING.sm }}>
                How satisfied are you with Mastera?
              </Text>
              <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const isStarActive = feedbackRating >= star;
                  return (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setFeedbackRating(star)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: RADIUS.md,
                        backgroundColor: isStarActive
                          ? tokens.primarySoft
                          : tokens.background,
                        borderWidth: 1,
                        borderColor: isStarActive ? tokens.primary : tokens.border,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '800',
                          color: isStarActive ? tokens.primary : tokens.textMuted,
                        }}
                      >
                        {star}★
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Message input */}
            <View
              style={[
                styles.card,
                { backgroundColor: tokens.surface, borderColor: tokens.border },
              ]}
            >
              <Text
                style={[
                  styles.cardTitle,
                  { color: tokens.textPrimary, marginBottom: SPACING.xs },
                ]}
              >
                Your Message *
              </Text>
              <Text style={{ fontSize: 12, color: tokens.textMuted, marginBottom: SPACING.sm }}>
                Tell us what you like or what can be improved in your courses.
              </Text>
              <TextInput
                multiline
                numberOfLines={4}
                value={feedbackMessage}
                onChangeText={setFeedbackMessage}
                placeholder="Write your feedback, questions, or content notes here..."
                placeholderTextColor={tokens.textMuted}
                style={{
                  minHeight: 90,
                  textAlignVertical: 'top',
                  borderWidth: 1,
                  borderColor: tokens.border,
                  borderRadius: RADIUS.md,
                  padding: SPACING.sm,
                  fontSize: 13,
                  color: tokens.textPrimary,
                  backgroundColor: tokens.background,
                }}
              />
            </View>

            {/* Optional contact */}
            <View
              style={[
                styles.card,
                { backgroundColor: tokens.surface, borderColor: tokens.border },
              ]}
            >
              <Text
                style={[
                  styles.cardTitle,
                  { color: tokens.textPrimary, marginBottom: SPACING.xs },
                ]}
              >
                Contact Details (Optional)
              </Text>
              <TextInput
                value={feedbackContact}
                onChangeText={setFeedbackContact}
                placeholder="Phone number or email (if you would like a reply)"
                placeholderTextColor={tokens.textMuted}
                style={{
                  borderWidth: 1,
                  borderColor: tokens.border,
                  borderRadius: RADIUS.md,
                  padding: SPACING.sm,
                  fontSize: 13,
                  color: tokens.textPrimary,
                  backgroundColor: tokens.background,
                }}
              />
            </View>

            {/* Submit button */}
            <TouchableOpacity
              onPress={() => {
                if (feedbackMessage.trim()) {
                  setFeedbackSubmitted(true);
                }
              }}
              disabled={!feedbackMessage.trim()}
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: tokens.primary,
                  opacity: feedbackMessage.trim() ? 1 : 0.6,
                  marginTop: SPACING.xs,
                  marginBottom: SPACING.xl,
                },
              ]}
            >
              <Text style={[styles.primaryBtnText, { color: tokens.surface }]}>
                Submit Feedback
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  }

  // ==========================================================================
  // SCREEN 5: LANGUAGE SETTINGS (preview (3).webp - Panel 2, Screen 5)
  // ==========================================================================
  if (screen === 'LANGUAGE_SETTINGS') {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerBackRow}>
          {renderBackArrow(() => setScreen('PROFILE_MAIN'))}
          <Text style={[styles.screenTitleWithBack, { color: tokens.textPrimary }]}>
            Language
          </Text>
        </View>

        <View style={styles.listCol}>
          {(
            [
              { id: 'en' as const, title: 'English', sub: 'App text in English' },
              { id: 'am' as const, title: 'አማርኛ', sub: 'የመተግበሪያው ቋንቋ በአማርኛ' },
            ]
          ).map((opt) => {
            const isSelected = uiLanguage === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => onChangeUiLanguage(opt.id)}
                style={[
                  styles.optionCard,
                  {
                    borderColor: isSelected ? tokens.primary : tokens.border,
                    backgroundColor: isSelected ? tokens.primarySoft : tokens.surface,
                  },
                ]}
              >
                <Text style={[styles.optionTitle, { color: tokens.textPrimary }]}>
                  {opt.title}
                </Text>
                <Text style={[styles.optionSub, { color: tokens.textMuted }]}>
                  {opt.sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View
          style={[
            styles.noticeCard,
            { backgroundColor: tokens.primarySoft, marginTop: SPACING.md },
          ]}
        >
          <Text style={[styles.noticeText, { color: tokens.primary }]}>
            Amharic notes are separate content items. Fonts are bundled, so they work offline.
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setScreen('PROFILE_MAIN')}
          style={[styles.primaryBtn, { backgroundColor: tokens.primary, marginTop: SPACING.lg }]}
        >
          <Text style={[styles.primaryBtnText, { color: tokens.surface }]}>
            Apply language
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ==========================================================================
  // SCREEN 6: RELEASE DEVICE SHEET (preview (3).webp - Panel 2, Screen 6)
  // ==========================================================================
  if (screen === 'RELEASE_DEVICE_SHEET') {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerBackRow}>
          {renderBackArrow(() => setScreen('PROFILE_MAIN'))}
          <Text style={[styles.screenTitleWithBack, { color: tokens.textPrimary }]}>
            Release this device?
          </Text>
        </View>

        <View style={styles.listCol}>
          <View style={[styles.infoItem, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <Text style={[styles.infoItemText, { color: tokens.textPrimary }]}>
              • Paid downloads on this phone stop opening.
            </Text>
          </View>
          <View style={[styles.infoItem, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <Text style={[styles.infoItemText, { color: tokens.textPrimary }]}>
              • You can then sign in on a new phone.
            </Text>
          </View>
          <View style={[styles.infoItem, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <Text style={[styles.infoItemText, { color: tokens.textPrimary }]}>
              • Progress and purchases stay on your account.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onReleaseDeviceAndLogout}
          style={[styles.primaryBtn, { backgroundColor: tokens.danger, marginTop: SPACING.lg }]}
        >
          <Text style={[styles.primaryBtnText, { color: tokens.surface }]}>
            Release &amp; log out
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setScreen('PROFILE_MAIN')}
          style={[styles.outlineBtn, { borderColor: tokens.border, marginTop: SPACING.sm }]}
        >
          <Text style={[styles.outlineBtnText, { color: tokens.textPrimary }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ==========================================================================
  // SCREEN 8: SUBSCRIPTION AND STORE DASHBOARD (preview (3).webp - Panel 3, Screen 8)
  // ==========================================================================
  if (screen === 'SUBSCRIPTION_DASHBOARD') {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerBackRow}>
          {renderBackArrow(() => setScreen('PROFILE_MAIN'))}
          <Text style={[styles.screenTitleWithBack, { color: tokens.textPrimary }]}>
            Subscription and store
          </Text>
        </View>

        {/* Active Bundle Card */}
        <View
          style={[
            styles.subscriptionActiveCard,
            { backgroundColor: tokens.surface, borderColor: tokens.border },
          ]}
        >
          <View style={styles.subscriptionActiveHeader}>
            <View>
              <Text style={[styles.subLabel, { color: tokens.primary }]}>ACTIVE BUNDLE</Text>
              <Text style={[styles.subTitle, { color: tokens.textPrimary }]}>Semester Bundle</Text>
            </View>
            <View style={[styles.activeBadge, { backgroundColor: tokens.successSoft }]}>
              <Text style={[styles.activeBadgeText, { color: tokens.success }]}>Active</Text>
            </View>
          </View>

          <View style={styles.daysCircleRow}>
            <View style={[styles.daysCircle, { borderColor: tokens.primary }]}>
              <Text style={[styles.daysNumber, { color: tokens.primary }]}>128d</Text>
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={[styles.subDetailText, { color: tokens.textPrimary }]}>
                Started on approval
              </Text>
              <Text style={[styles.subDetailText, { color: tokens.textMuted }]}>
                Expires in 128 days
              </Text>
              <Text style={[styles.subDetailText, { color: tokens.textMuted }]}>
                {departmentCourses.length} courses covered
              </Text>
            </View>
          </View>
        </View>

        {/* Extra Courses Section */}
        <Text style={[styles.inputSectionHeader, { color: tokens.textMuted, marginTop: SPACING.md }]}>
          EXTRA COURSES
        </Text>
        <View style={[styles.infoItem, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <Text style={[styles.infoItemText, { color: tokens.textPrimary, fontWeight: '600' }]}>
            Logic · <Text style={{ color: tokens.primary }}>38 days left</Text>
          </Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          onPress={() => setScreen('STORE_CATALOG')}
          style={[styles.primaryBtn, { backgroundColor: tokens.primary, marginTop: SPACING.lg }]}
        >
          <Text style={[styles.primaryBtnText, { color: tokens.surface }]}>
            + Buy extra courses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setScreen('BUNDLE_BUILDER')}
          style={[styles.outlineBtn, { borderColor: tokens.border, marginTop: SPACING.sm }]}
        >
          <Text style={[styles.outlineBtnText, { color: tokens.textPrimary }]}>
            Renew bundle · opens in last 14 days
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ==========================================================================
  // SCREEN 9: STORE CATALOG (preview (3).webp - Panel 3, Screen 9)
  // ==========================================================================
  if (screen === 'STORE_CATALOG') {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerBackRow}>
          {renderBackArrow(() => setScreen('PROFILE_MAIN'))}
          <Text style={[styles.screenTitleWithBack, { color: tokens.textPrimary }]}>
            Store
          </Text>
        </View>

        <View style={styles.listCol}>
          <TouchableOpacity
            onPress={() => setScreen('BUNDLE_BUILDER')}
            style={[
              styles.storeCard,
              { backgroundColor: tokens.surface, borderColor: tokens.primary },
            ]}
          >
            <View>
              <Text style={[styles.storeCardTitle, { color: tokens.textPrimary }]}>
                Semester Bundle
              </Text>
              <Text style={[styles.storeCardSub, { color: tokens.textMuted }]}>
                Pick 7 to 10 courses
              </Text>
            </View>
            <Text style={[styles.priceTag, { color: tokens.primary }]}>
              200 ETB
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setScreen('PAYMENT_CHECKOUT')}
            style={[
              styles.storeCard,
              { backgroundColor: tokens.surface, borderColor: tokens.border },
            ]}
          >
            <View>
              <Text style={[styles.storeCardTitle, { color: tokens.textPrimary }]}>
                Full Freshman Package
              </Text>
              <Text style={[styles.storeCardSub, { color: tokens.textMuted }]}>
                All courses of the stream
              </Text>
            </View>
            <Text style={[styles.priceTag, { color: tokens.primary }]}>
              350 ETB
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.storeCard,
              { backgroundColor: tokens.surface, borderColor: tokens.border },
            ]}
          >
            <View>
              <Text style={[styles.storeCardTitle, { color: tokens.textPrimary }]}>
                Single course
              </Text>
              <Text style={[styles.storeCardSub, { color: tokens.textMuted }]}>
                Buy one course first
              </Text>
            </View>
            <MasteraIcon name="chevron-right" size={18} color={tokens.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.storeCard,
              { backgroundColor: tokens.surface, borderColor: tokens.border },
            ]}
          >
            <View>
              <Text style={[styles.storeCardTitle, { color: tokens.textPrimary }]}>
                Extra course
              </Text>
              <Text style={[styles.storeCardSub, { color: tokens.textMuted }]}>
                Add beyond the bundle
              </Text>
            </View>
            <MasteraIcon name="chevron-right" size={18} color={tokens.textMuted} />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.noticeCard,
            { backgroundColor: tokens.primarySoft, marginTop: SPACING.md },
          ]}
        >
          <Text style={[styles.noticeText, { color: tokens.primary }]}>
            Access starts when payment is approved. Prices and durations are set by Admin and may change.
          </Text>
        </View>
      </ScrollView>
    );
  }

  // ==========================================================================
  // SCREEN 10: BUNDLE BUILDER (preview (3).webp - Panel 3, Screen 10)
  // ==========================================================================
  if (screen === 'BUNDLE_BUILDER') {
    const count = bundleCheckedIds.size;
    const isCountValid = count >= 7 && count <= 10;

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerBackRow}>
          {renderBackArrow(() => setScreen('STORE_CATALOG'))}
          <Text style={[styles.screenTitleWithBack, { color: tokens.textPrimary }]}>
            Semester Bundle
          </Text>
        </View>

        <Text style={[styles.screenSubtitle, { color: tokens.textMuted }]}>
          Choose 7 to 10 courses. Your courses list is preselected.
        </Text>

        <View style={styles.listCol}>
          {departmentCourses.map((c) => {
            const isChecked = bundleCheckedIds.has(c.id);
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => {
                  setBundleCheckedIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(c.id)) {
                      next.delete(c.id);
                    } else {
                      next.add(c.id);
                    }
                    return next;
                  });
                }}
                style={[
                  styles.bundleRow,
                  {
                    backgroundColor: tokens.surface,
                    borderColor: isChecked ? tokens.primary : tokens.border,
                  },
                ]}
              >
                <Text style={[styles.bundleCourseTitle, { color: tokens.textPrimary }]}>
                  {c.title}
                </Text>
                <Text
                  style={[
                    styles.bundleStatusText,
                    { color: isChecked ? tokens.primary : tokens.textMuted },
                  ]}
                >
                  {isChecked ? '✓ Selected' : 'Select'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.bundleCountRow}>
          <Text style={[styles.bundleCountText, { color: tokens.textPrimary }]}>
            {count} selected
          </Text>
          <Text style={[styles.bundleMinMaxText, { color: tokens.primary }]}>
            min 7 · max 10
          </Text>
        </View>

        <TouchableOpacity
          disabled={!isCountValid}
          onPress={() => setScreen('PAYMENT_CHECKOUT')}
          style={[
            styles.primaryBtn,
            {
              backgroundColor: tokens.primary,
              opacity: isCountValid ? 1 : 0.5,
              marginTop: SPACING.md,
            },
          ]}
        >
          <Text style={[styles.primaryBtnText, { color: tokens.surface }]}>
            Continue · 200 ETB
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ==========================================================================
  // SCREEN 12: PAYMENT & RECEIPT (preview (3).webp - Panel 4, Screen 12)
  // ==========================================================================
  if (screen === 'PAYMENT_CHECKOUT') {
    const activeProvider =
      paymentMethods.find((p) => p.id === selectedProviderId) ??
      paymentMethods[0];

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerBackRow}>
          {renderBackArrow(() => setScreen('BUNDLE_BUILDER'))}
          <Text style={[styles.screenTitleWithBack, { color: tokens.textPrimary }]}>
            Payment
          </Text>
        </View>

        <View style={styles.paymentSummaryBox}>
          <Text style={[styles.paymentAmountTitle, { color: tokens.textPrimary }]}>
            Send exactly 200 ETB
          </Text>
          <Text style={[styles.paymentDurationSub, { color: tokens.primary }]}>
            180 days access after approval
          </Text>
        </View>

        {/* Payment Methods List with Radio Button */}
        <Text style={[styles.inputSectionHeader, { color: tokens.textMuted, marginBottom: 8 }]}>
          SELECT PAYMENT METHOD
        </Text>
        <View style={{ gap: SPACING.sm, marginBottom: SPACING.md }}>
          {paymentMethods.map((pm) => {
            const isSel = pm.id === selectedProviderId;
            return (
              <TouchableOpacity
                key={pm.id}
                onPress={() => setSelectedProviderId(pm.id)}
                style={[
                  {
                    borderRadius: RADIUS.lg,
                    borderWidth: 1.5,
                    borderColor: isSel ? tokens.primary : tokens.border,
                    backgroundColor: tokens.surface,
                    padding: 14,
                  },
                ]}
                activeOpacity={0.8}
              >
                {/* Header Row: Radio Button + Provider Name */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: RADIUS.pill,
                      borderWidth: 2,
                      borderColor: isSel ? tokens.primary : tokens.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    {isSel && (
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: RADIUS.pill,
                          backgroundColor: tokens.primary,
                        }}
                      />
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '700',
                      color: isSel ? tokens.primary : tokens.textPrimary,
                      flex: 1,
                    }}
                  >
                    {pm.providerName}
                  </Text>
                  {pm.isActive && (
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: RADIUS.pill,
                        backgroundColor: tokens.successSoft,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: tokens.success }}>
                        Active
                      </Text>
                    </View>
                  )}
                </View>

                {/* When clicked/selected: Account details and copy button expand */}
                {isSel && (
                  <View
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: tokens.border,
                    }}
                  >
                    {/* Account Holder Name */}
                    <Text style={[styles.bankLabel, { color: tokens.textMuted }]}>
                      Account Holder Name
                    </Text>
                    <Text
                      style={[
                        styles.bankValue,
                        { color: tokens.textPrimary, fontWeight: '700', marginTop: 2 },
                      ]}
                    >
                      {pm.accountHolderName}
                    </Text>

                    {/* Account Number with Copy Button */}
                    <Text style={[styles.bankLabel, { color: tokens.textMuted, marginTop: 10 }]}>
                      Account Number / Code
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: RADIUS.md,
                        backgroundColor: tokens.primarySoft,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '800',
                          color: tokens.primary,
                          letterSpacing: 0.5,
                        }}
                      >
                        {pm.accountNumberOrCode}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setCopiedMethodId(pm.id);
                          setTimeout(() => setCopiedMethodId(null), 2500);
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: RADIUS.md,
                          backgroundColor:
                            copiedMethodId === pm.id ? tokens.successSoft : tokens.primary,
                          borderWidth: 1,
                          borderColor:
                            copiedMethodId === pm.id ? tokens.success : tokens.primary,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        activeOpacity={0.7}
                      >
                        <MasteraIcon
                          name={copiedMethodId === pm.id ? 'check-circle' : 'flag'}
                          size={14}
                          color={
                            copiedMethodId === pm.id ? tokens.success : tokens.surface
                          }
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color:
                              copiedMethodId === pm.id ? tokens.success : tokens.surface,
                          }}
                        >
                          {copiedMethodId === pm.id ? 'Copied!' : 'Copy'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Instructions */}
                    {pm.instructions ? (
                      <Text
                        style={{
                          fontSize: 12,
                          color: tokens.textMuted,
                          marginTop: 10,
                          lineHeight: 17,
                        }}
                      >
                        {pm.instructions}
                      </Text>
                    ) : null}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Attach Payment Screenshot */}
        <Text
          style={[
            styles.inputSectionHeader,
            { color: tokens.textMuted, marginTop: SPACING.sm, marginBottom: 8 },
          ]}
        >
          ATTACH PAYMENT SCREENSHOT
        </Text>
        <TouchableOpacity
          onPress={() => setReceiptAttached((prev) => !prev)}
          style={[
            styles.receiptBox,
            {
              backgroundColor: tokens.surface,
              borderColor: receiptAttached ? tokens.primary : tokens.border,
              padding: 14,
            },
          ]}
          activeOpacity={0.8}
        >
          <MasteraIcon
            name={receiptAttached ? 'check-circle' : 'award'}
            size={22}
            color={receiptAttached ? tokens.success : tokens.textMuted}
          />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: receiptAttached ? tokens.textPrimary : tokens.textMuted,
              }}
            >
              {receiptAttached
                ? 'payment_receipt_screenshot.png'
                : 'Tap to attach payment screenshot'}
            </Text>
            <Text style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2 }}>
              {receiptAttached
                ? '214 KB · Valid screenshot'
                : 'Supports JPEG, PNG or WebP (max 300 KB)'}
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: RADIUS.pill,
              backgroundColor: receiptAttached ? tokens.successSoft : tokens.primarySoft,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: receiptAttached ? tokens.success : tokens.primary,
              }}
            >
              {receiptAttached ? 'Attached' : '+ Attach'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Transaction Reference Input */}
        <View style={[styles.fieldGroup, { marginTop: SPACING.md }]}>
          <Text style={[styles.fieldLabel, { color: tokens.textMuted }]}>
            TRANSACTION REFERENCE
          </Text>
          <TextInput
            value={txRef}
            onChangeText={setTxRef}
            placeholder="e.g. FT26302MAC789"
            placeholderTextColor={tokens.textMuted}
            style={[
              styles.textInput,
              {
                backgroundColor: tokens.surface,
                borderColor: tokens.border,
                color: tokens.textPrimary,
              },
            ]}
          />
        </View>

        {/* Continue to Account Setup Form (User Correction Step) */}
        <TouchableOpacity
          onPress={() => setScreen('ACCOUNT_SETUP')}
          style={[styles.primaryBtn, { backgroundColor: tokens.primary, marginTop: SPACING.md }]}
        >
          <Text style={[styles.primaryBtnText, { color: tokens.surface }]}>
            Continue to Account Setup →
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ==========================================================================
  // USER-REQUESTED NEW SCREEN: OFFLINE REGISTRATION ACCOUNT SETUP FORM
  // (Inserted before final submit so no PII is sent to server before purchase)
  // ==========================================================================
  if (screen === 'ACCOUNT_SETUP') {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerBackRow}>
          {renderBackArrow(() => setScreen('PAYMENT_CHECKOUT'))}
          <Text style={[styles.screenTitleWithBack, { color: tokens.textPrimary }]}>
            Set Up Account
          </Text>
        </View>

        <Text style={[styles.screenSubtitle, { color: tokens.textMuted }]}>
          Create your account credentials. Your details will be registered on the server together with your payment proof.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: tokens.textMuted }]}>FULL NAME</Text>
          <TextInput
            value={setupFullName}
            onChangeText={setSetupFullName}
            placeholder="e.g. Abebe Kebede"
            placeholderTextColor={tokens.textMuted}
            style={[
              styles.textInput,
              { backgroundColor: tokens.surface, borderColor: tokens.border, color: tokens.textPrimary },
            ]}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: tokens.textMuted }]}>PHONE NUMBER</Text>
          <TextInput
            value={setupPhone}
            onChangeText={setSetupPhone}
            placeholder="e.g. +251 911 223 344"
            placeholderTextColor={tokens.textMuted}
            keyboardType="phone-pad"
            style={[
              styles.textInput,
              { backgroundColor: tokens.surface, borderColor: tokens.border, color: tokens.textPrimary },
            ]}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: tokens.textMuted }]}>PASSWORD</Text>
          <TextInput
            value={setupPassword}
            onChangeText={setSetupPassword}
            placeholder="Enter secure password"
            placeholderTextColor={tokens.textMuted}
            secureTextEntry
            style={[
              styles.textInput,
              { backgroundColor: tokens.surface, borderColor: tokens.border, color: tokens.textPrimary },
            ]}
          />
        </View>

        {/* Offline Privacy Guarantee Card */}
        <View
          style={[
            styles.noticeCard,
            { backgroundColor: tokens.primarySoft, marginTop: SPACING.md },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <MasteraIcon name="lock" size={16} color={tokens.primary} />
            <Text style={{ fontWeight: '700', color: tokens.primary, marginLeft: 6, fontSize: 13 }}>
              Offline-First Privacy Guarantee
            </Text>
          </View>
          <Text style={[styles.noticeText, { color: tokens.primary }]}>
            No phone number or personal data was sent to the server prior to this purchase. Submitting will register your account and device securely.
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            onSubmitBundleOrder({
              selectedCourseIds: Array.from(bundleCheckedIds),
              paymentMethodId: selectedProviderId,
              transactionReference: txRef,
              fullName: setupFullName,
              phoneNumber: setupPhone,
              password: setupPassword,
            });
            setScreen('ORDER_STATUS_PENDING');
          }}
          style={[styles.primaryBtn, { backgroundColor: tokens.primary, marginTop: SPACING.lg }]}
        >
          <Text style={[styles.primaryBtnText, { color: tokens.surface }]}>
            Submit for review
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ==========================================================================
  // SCREEN 13: ORDER STATUS - PENDING (preview (3).webp - Panel 4, Screen 13)
  // ==========================================================================
  if (screen === 'ORDER_STATUS_PENDING') {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerBackRow}>
          {renderBackArrow(() => setScreen('PROFILE_MAIN'))}
          <Text style={[styles.screenTitleWithBack, { color: tokens.textPrimary }]}>
            Order status
          </Text>
        </View>

        <View style={styles.pendingHeader}>
          <Text style={[styles.pendingTitle, { color: tokens.textPrimary }]}>
            Pending review
          </Text>
          <Text style={[styles.pendingSubtitle, { color: tokens.textMuted }]}>
            Admin is checking your receipt
          </Text>
        </View>

        {/* Stepper */}
        <View style={styles.stepperCol}>
          <View style={styles.stepRow}>
            <View style={[styles.stepCircle, { backgroundColor: tokens.success }]}>
              <Text style={{ color: tokens.white, fontWeight: '700' }}>✓</Text>
            </View>
            <View style={styles.stepTextCol}>
              <Text style={[styles.stepTitle, { color: tokens.textPrimary }]}>
                Receipt submitted
              </Text>
              <Text style={[styles.stepSub, { color: tokens.textMuted }]}>
                Today · 9:41
              </Text>
            </View>
          </View>

          <View style={[styles.stepLine, { backgroundColor: tokens.primary }]} />

          <View style={styles.stepRow}>
            <View style={[styles.stepCircle, { backgroundColor: tokens.primary }]}>
              <Text style={{ color: tokens.white, fontWeight: '700' }}>2</Text>
            </View>
            <View style={styles.stepTextCol}>
              <Text style={[styles.stepTitle, { color: tokens.textPrimary }]}>
                Admin verification
              </Text>
              <Text style={[styles.stepSub, { color: tokens.textMuted }]}>
                Usually within a few hours
              </Text>
            </View>
          </View>

          <View style={[styles.stepLine, { backgroundColor: tokens.border }]} />

          <View style={styles.stepRow}>
            <View style={[styles.stepCircle, { backgroundColor: tokens.surface, borderColor: tokens.border, borderWidth: 1 }]}>
              <Text style={{ color: tokens.textMuted, fontWeight: '700' }}>3</Text>
            </View>
            <View style={styles.stepTextCol}>
              <Text style={[styles.stepTitle, { color: tokens.textMuted }]}>
                Access activated
              </Text>
              <Text style={[styles.stepSub, { color: tokens.textMuted }]}>
                Your MS number is created
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.noticeCard,
            { backgroundColor: tokens.primarySoft, marginTop: SPACING.lg },
          ]}
        >
          <Text style={[styles.noticeText, { color: tokens.primary }]}>
            Your account stays on this phone until approved. If rejected, you see the reason and can fix and resubmit.
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setScreen('ORDER_APPROVED_MS_ID')}
          style={[styles.outlineBtn, { borderColor: tokens.primary, marginTop: SPACING.md }]}
        >
          <Text style={[styles.outlineBtnText, { color: tokens.primary }]}>
            Simulate Admin Approval (Demo)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setScreen('PROFILE_MAIN')}
          style={[styles.primaryBtn, { backgroundColor: tokens.primary, marginTop: SPACING.sm }]}
        >
          <Text style={[styles.primaryBtnText, { color: tokens.surface }]}>
            Back to Profile
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ==========================================================================
  // SCREEN 14: ORDER APPROVED - MS ID (preview (3).webp - Panel 4, Screen 14)
  // ==========================================================================
  if (screen === 'ORDER_APPROVED_MS_ID') {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: tokens.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.approvedIconCentered}>
          <View style={[styles.largeCheckCircle, { backgroundColor: tokens.primary }]}>
            <MasteraIcon name="check-circle" size={32} color={tokens.white} />
          </View>
          <Text style={[styles.approvedHeading, { color: tokens.textPrimary }]}>
            Payment approved
          </Text>
          <Text style={[styles.approvedSub, { color: tokens.textMuted }]}>
            Your account is now registered.
          </Text>
        </View>

        {/* Student ID Card */}
        <View
          style={[
            styles.studentIdCard,
            { backgroundColor: tokens.primary, borderColor: tokens.primary },
          ]}
        >
          <Text style={[styles.studentIdLabel, { color: tokens.white }]}>YOUR STUDENT ID</Text>
          <Text style={[styles.studentIdNumber, { color: tokens.white }]}>MS0001</Text>
        </View>

        <View style={styles.approvedPillsRow}>
          <View style={[styles.badgePill, { backgroundColor: tokens.surface, borderColor: tokens.border, borderWidth: 1 }]}>
            <Text style={[styles.badgePillText, { color: tokens.textPrimary }]}>
              180 days access
            </Text>
          </View>
          <View style={[styles.badgePill, { backgroundColor: tokens.surface, borderColor: tokens.border, borderWidth: 1 }]}>
            <Text style={[styles.badgePillText, { color: tokens.textPrimary }]}>
              {departmentCourses.length} courses unlocked
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setScreen('PROFILE_MAIN')}
          style={[styles.primaryBtn, { backgroundColor: tokens.primary, marginTop: SPACING.xl }]}
        >
          <Text style={[styles.primaryBtnText, { color: tokens.surface }]}>
            Start learning
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ==========================================================================
  // SCREEN 1 & 2: PROFILE MAIN (preview (3).webp - Panel 1, Screen 1 & 2)
  // ==========================================================================
  const isRegistered = accountState === 'REGISTERED_REMOTE' && !!studentCode;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tokens.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Top Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.screenTitle, { color: tokens.textPrimary }]}>
          Profile
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setScreen('EDIT_PROFILE')}
            style={[styles.themeBtn, { borderColor: tokens.border, backgroundColor: tokens.surface, marginRight: 8 }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MasteraIcon name="sliders" size={16} color={tokens.primary} />
          </TouchableOpacity>
          {onToggleTheme && (
            <TouchableOpacity
              onPress={onToggleTheme}
              style={[styles.themeBtn, { borderColor: tokens.border, backgroundColor: tokens.surface }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MasteraIcon
                name={themeMode === 'dark' ? 'sun' : 'moon'}
                size={16}
                color={tokens.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Identity Card */}
      <View
        style={[
          styles.identityCard,
          { backgroundColor: tokens.surface, borderColor: tokens.border },
        ]}
      >
        <View style={[styles.avatarCircle, { backgroundColor: tokens.primary }]}>
          <Text style={[styles.avatarInitial, { color: tokens.white }]}>
            {fullName.charAt(0).toUpperCase() || 'S'}
          </Text>
        </View>

        <View style={styles.identityDetails}>
          <Text style={[styles.studentName, { color: tokens.textPrimary }]}>
            {fullName}
          </Text>
          {isRegistered ? (
            <Text style={[styles.studentMeta, { color: tokens.primary }]}>
              {identifier} · {studentCode} · Synced
            </Text>
          ) : (
            <Text style={[styles.studentMeta, { color: tokens.textMuted }]}>
              {identifier} - Local Only
            </Text>
          )}
        </View>
      </View>

      {/* Banner for Local Only accounts */}
      {!isRegistered && (
        <View
          style={[
            styles.noticeCard,
            { backgroundColor: tokens.primarySoft, marginTop: SPACING.sm },
          ]}
        >
          <Text style={[styles.noticeText, { color: tokens.primary }]}>
            Saved on this phone. Buy a bundle to register your account.
          </Text>
        </View>
      )}

      {/* University & Department Card (Taps to Screen 4) */}
      <TouchableOpacity
        onPress={() => setScreen('UNIVERSITY_SCOPE')}
        style={[
          styles.scopeCard,
          { backgroundColor: tokens.surface, borderColor: tokens.border, marginTop: SPACING.md },
        ]}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.scopeUniversityTitle, { color: tokens.textPrimary }]}>
            {academicScope.universityId} - {academicScope.programName}
          </Text>
          <Text style={[styles.scopeSubtitle, { color: tokens.textMuted }]}>
            {academicScope.semester} · {academicScope.stream} Science (Tap to edit)
          </Text>
        </View>
        <MasteraIcon name="chevron-right" size={20} color={tokens.textMuted} />
      </TouchableOpacity>

      {/* Menu Rows */}
      <View style={[styles.listCol, { marginTop: SPACING.md }]}>
        {/* 1. My courses (Check in / Check out) */}
        <TouchableOpacity
          onPress={() => setScreen('MY_COURSES_CHECK_IN_OUT')}
          style={[
            styles.menuRowItem,
            { backgroundColor: tokens.surface, borderColor: tokens.border },
          ]}
          activeOpacity={0.7}
        >
          <View>
            <Text style={[styles.menuTitle, { color: tokens.textPrimary }]}>
              My courses
            </Text>
            <Text style={[styles.menuSubtitle, { color: tokens.textMuted }]}>
              Add or remove courses ({selectedCourseIds.length} active)
            </Text>
          </View>
          <MasteraIcon name="chevron-right" size={20} color={tokens.textMuted} />
        </TouchableOpacity>

        {/* 2. Subscription and store */}
        <TouchableOpacity
          onPress={() => setScreen(hasActiveBundle ? 'SUBSCRIPTION_DASHBOARD' : 'STORE_CATALOG')}
          style={[
            styles.menuRowItem,
            { backgroundColor: tokens.surface, borderColor: tokens.border },
          ]}
          activeOpacity={0.7}
        >
          <View>
            <Text style={[styles.menuTitle, { color: tokens.textPrimary }]}>
              Subscription and store
            </Text>
            <Text style={[styles.menuSubtitle, { color: tokens.textMuted }]}>
              {hasActiveBundle ? 'Active · 128 days left' : 'Active, pending, renew'}
            </Text>
          </View>
          <MasteraIcon name="chevron-right" size={20} color={tokens.textMuted} />
        </TouchableOpacity>

        {/* 3. About us */}
        <TouchableOpacity
          onPress={() => setScreen('ABOUT_US')}
          style={[
            styles.menuRowItem,
            { backgroundColor: tokens.surface, borderColor: tokens.border },
          ]}
          activeOpacity={0.7}
        >
          <View>
            <Text style={[styles.menuTitle, { color: tokens.textPrimary }]}>
              About us
            </Text>
            <Text style={[styles.menuSubtitle, { color: tokens.textMuted }]}>
              Mastera platform, mission, and version 3.4.0
            </Text>
          </View>
          <MasteraIcon name="chevron-right" size={20} color={tokens.textMuted} />
        </TouchableOpacity>

        {/* 4. Feedback */}
        <TouchableOpacity
          onPress={() => {
            setFeedbackSubmitted(false);
            setScreen('FEEDBACK');
          }}
          style={[
            styles.menuRowItem,
            { backgroundColor: tokens.surface, borderColor: tokens.border },
          ]}
          activeOpacity={0.7}
        >
          <View>
            <Text style={[styles.menuTitle, { color: tokens.textPrimary }]}>
              Feedback
            </Text>
            <Text style={[styles.menuSubtitle, { color: tokens.textMuted }]}>
              Questions, issue reports, and suggestions
            </Text>
          </View>
          <MasteraIcon name="chevron-right" size={20} color={tokens.textMuted} />
        </TouchableOpacity>

        {/* 5. Release device & log out */}
        <TouchableOpacity
          onPress={() => setScreen('RELEASE_DEVICE_SHEET')}
          style={[
            styles.menuRowItem,
            { backgroundColor: tokens.surface, borderColor: tokens.border },
          ]}
          activeOpacity={0.7}
        >
          <View>
            <Text style={[styles.menuTitle, { color: tokens.textPrimary }]}>
              Release device &amp; log out
            </Text>
            <Text style={[styles.menuSubtitle, { color: tokens.textMuted }]}>
              Use this to switch phones
            </Text>
          </View>
          <MasteraIcon name="chevron-right" size={20} color={tokens.textMuted} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: STATUS_BAR_HEIGHT + 8,
    paddingHorizontal: 20,
    paddingBottom: 90,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  headerBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  topBackArrowBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  screenTitleWithBack: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  screenSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  themeBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
  },
  avatarCenteredCol: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  avatarCircleLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialLarge: {
    fontSize: 32,
    fontWeight: '700',
  },
  identityDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 17,
    fontWeight: '700',
  },
  studentMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  scopeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  scopeUniversityTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  scopeSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  menuRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  menuSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  listCol: {
    gap: SPACING.sm,
  },
  optionsCol: {
    gap: SPACING.xs,
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  selectionCardText: {
    fontSize: 14,
  },
  inputSectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  segmentedBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  courseCheckInOutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.xs,
  },
  courseIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  courseCheckInOutInfo: {
    flex: 1,
  },
  courseTitleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  courseMetaText: {
    fontSize: 12,
    marginTop: 2,
  },
  checkInOutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  checkInOutBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  noticeCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 18,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  outlineBtn: {
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fieldGroup: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
  },
  card: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  optionSub: {
    fontSize: 13,
    marginTop: 2,
  },
  infoItem: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.xs,
  },
  infoItemText: {
    fontSize: 14,
    lineHeight: 20,
  },
  subscriptionActiveCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  subscriptionActiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  daysCircleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  daysCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysNumber: {
    fontSize: 16,
    fontWeight: '800',
  },
  subDetailText: {
    fontSize: 13,
    lineHeight: 18,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  storeCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  storeCardSub: {
    fontSize: 13,
    marginTop: 2,
  },
  priceTag: {
    fontSize: 16,
    fontWeight: '800',
  },
  bundleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  bundleCourseTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  bundleStatusText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  bundleCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  bundleCountText: {
    fontSize: 14,
    fontWeight: '700',
  },
  bundleMinMaxText: {
    fontSize: 13,
    fontWeight: '700',
  },
  paymentSummaryBox: {
    marginBottom: SPACING.md,
  },
  paymentAmountTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  paymentDurationSub: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  pmTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  pmTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bankDetailsCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  bankLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  bankValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  bankAccountNo: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  receiptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  receiptBoxText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pendingHeader: {
    marginBottom: SPACING.lg,
  },
  pendingTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  pendingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  stepperCol: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  stepTextCol: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  stepSub: {
    fontSize: 13,
    marginTop: 1,
  },
  stepLine: {
    width: 2,
    height: 24,
    marginLeft: 15,
    marginVertical: 4,
  },
  approvedIconCentered: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  largeCheckCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  approvedHeading: {
    fontSize: 22,
    fontWeight: '800',
  },
  approvedSub: {
    fontSize: 14,
    marginTop: 4,
  },
  studentIdCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  studentIdLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  studentIdNumber: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 4,
  },
  approvedPillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  badgePillText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
