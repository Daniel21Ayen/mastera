import React, { useState, useEffect } from 'react';
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
  CatalogProgramDto,
  CatalogUniversityDto,
} from '@mastera/contracts';
import {
  COURSE_ACCENTS,
  CourseAccentName,
  RADIUS,
  SPACING,
  STUDENT_THEMES,
  ThemeMode,
} from '@mastera/ui-tokens';
import { ForgotPasswordResolution } from '../core/security/local-auth-manager';
import { MasteraIcon } from '../shared/components/MasteraIcon';

export type OnboardingStep =
  | 'LOGIN'
  | 'REGISTER'
  | 'COMPLETE_PROFILE'
  | 'UNIVERSITY_SCOPE'
  | 'MY_COURSES';

export interface BeforeHomeAuthScreensProps {
  initialStep?: OnboardingStep;
  universities?: CatalogUniversityDto[];
  programs?: CatalogProgramDto[];
  departmentCourses?: CatalogCourseDto[];
  onSignIn: (identifier: string, password: string) => void;
  onRegisterLocal: (payload: {
    fullName: string;
    identifier: string;
    password: string;
    confirmPassword: string;
    stream: 'NATURAL' | 'SOCIAL';
  }) => void;
  onCompleteProfileAndSelectCourses: (payload: {
    universityId: string;
    universityName: string;
    programId: string;
    programName: string;
    semester: 'Semester 1' | 'Semester 2';
    stream: 'Natural' | 'Social';
    selectedCourseIds: string[];
  }) => void;
  onForgotPasswordRequest: () => ForgotPasswordResolution;
  onWipeAndReRegister?: () => void;
  onVerifyOtpReset?: (identifier: string, otpCode: string, newPass: string) => void;
  themeMode?: ThemeMode;
  onToggleTheme?: () => void;
}

export function BeforeHomeAuthScreens({
  initialStep = 'LOGIN',
  universities = [],
  programs = [],
  departmentCourses = [],
  onSignIn,
  onRegisterLocal,
  onCompleteProfileAndSelectCourses,
  onForgotPasswordRequest,
  onWipeAndReRegister,
  themeMode = 'light',
  onToggleTheme,
}: BeforeHomeAuthScreensProps): React.ReactElement {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>(
    initialStep === 'REGISTER' ? 'REGISTER' : 'LOGIN'
  );
  // Registration flow sub-step: FORM (1) -> UNIVERSITY_SCOPE (2) -> MY_COURSES (3) -> Done (4/Home)
  const [regStep, setRegStep] = useState<'FORM' | 'UNIVERSITY_SCOPE' | 'MY_COURSES'>(
    initialStep === 'COMPLETE_PROFILE' || initialStep === 'UNIVERSITY_SCOPE'
      ? 'UNIVERSITY_SCOPE'
      : initialStep === 'MY_COURSES'
      ? 'MY_COURSES'
      : 'FORM'
  );

  // Form Fields
  const [identifier, setIdentifier] = useState('+251 911 022 344');
  const [password, setPassword] = useState('password123');
  const [confirmPassword, setConfirmPassword] = useState('password123');
  const [fullName, setFullName] = useState('Abebe Kebede');
  const [showPassword, setShowPassword] = useState(false);

  // University & Program Selections
  const [selectedUniversity, setSelectedUniversity] = useState('BDU - Bahir Dar University');
  const [selectedDepartment, setSelectedDepartment] = useState('Freshman Department');
  const [selectedSemester, setSelectedSemester] = useState<'Semester 1' | 'Semester 2'>('Semester 1');
  const [selectedStream, setSelectedStream] = useState<'Natural' | 'Social'>('Natural');

  // Dropdown expansion state (collapsed by default, not automatically opened)
  const [isUniversityDropdownOpen, setIsUniversityDropdownOpen] = useState(false);
  const [isDepartmentDropdownOpen, setIsDepartmentDropdownOpen] = useState(false);

  // Courses Selection
  const initialSelectedCourses = departmentCourses.length >= 3
    ? [departmentCourses[0]!.id, departmentCourses[1]!.id, departmentCourses[2]!.id]
    : departmentCourses.map((c) => c.id);

  const [checkedCourseIds, setCheckedCourseIds] = useState<string[]>(initialSelectedCourses);

  useEffect(() => {
    if (departmentCourses.length > 0) {
      setCheckedCourseIds((prev) => {
        if (prev.length === 0 || prev.some((id) => id.startsWith('c-'))) {
          return departmentCourses.slice(0, 3).map((c) => c.id);
        }
        return prev;
      });
    }
  }, [departmentCourses]);

  const [forgotResolution, setForgotResolution] =
    useState<ForgotPasswordResolution | null>(null);

  const tokens = STUDENT_THEMES[themeMode];

  const universityOptions =
    universities.length > 0
      ? universities.map((u) => ({
          id: u.shortName || u.name,
          name: `${u.shortName ? `${u.shortName} - ` : ''}${u.name}`,
        }))
      : [
          { id: 'BDU', name: 'BDU - Bahir Dar University' },
          { id: 'AASTU', name: 'AASTU - Addis Ababa Science & Tech' },
          { id: 'AAU', name: 'AAU - Addis Ababa University' },
          { id: 'ASTU', name: 'ASTU - Adama Science & Tech' },
        ];

  const departmentOptions =
    programs.length > 0
      ? programs.map((p) => ({
          id: p.name.toUpperCase().replace(/\s+/g, '_'),
          name: p.name,
        }))
      : [
          { id: 'FRESHMAN', name: 'Freshman Department' },
          { id: 'SWE', name: 'Software Engineering' },
          { id: 'ECE', name: 'Electrical & Computer Engineering' },
          { id: 'CIVIL', name: 'Civil Engineering' },
          { id: 'MED', name: 'Medicine & Health Sciences' },
        ];

  const displayCourses = departmentCourses;

  const toggleCourseChecked = (courseId: string) => {
    setCheckedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const completeOnboardingAndGoHome = () => {
    onCompleteProfileAndSelectCourses({
      universityId: selectedUniversity.split(' ')[0] || 'BDU',
      universityName: selectedUniversity,
      programId: selectedDepartment.toUpperCase().replace(/\s+/g, '_'),
      programName: selectedDepartment,
      semester: selectedSemester,
      stream: selectedStream,
      selectedCourseIds: checkedCourseIds,
    });
  };

  // Helper for bottom tab bar (Home, Course, Progress, Profile)
  const renderFooterTabs = () => (
    <View
      style={[
        styles.footerTabBar,
        {
          backgroundColor: tokens.surface,
          borderTopColor: tokens.border,
        },
      ]}
    >
      <TouchableOpacity
        onPress={completeOnboardingAndGoHome}
        style={styles.footerTabItem}
        activeOpacity={0.7}
      >
        <MasteraIcon name="home" size={20} color={tokens.textMuted} />
        <Text style={[styles.footerTabLabel, { color: tokens.textMuted }]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setRegStep('MY_COURSES')}
        style={styles.footerTabItem}
        activeOpacity={0.7}
      >
        <MasteraIcon name="book-open" size={20} color={tokens.textMuted} />
        <Text style={[styles.footerTabLabel, { color: tokens.textMuted }]}>Course</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.footerTabItem}
        activeOpacity={0.7}
      >
        <MasteraIcon name="bar-chart-2" size={20} color={tokens.textMuted} />
        <Text style={[styles.footerTabLabel, { color: tokens.textMuted }]}>Progress</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setRegStep('UNIVERSITY_SCOPE')}
        style={styles.footerTabItem}
        activeOpacity={0.7}
      >
        <MasteraIcon name="user" size={20} color={tokens.primary} />
        <Text style={[styles.footerTabLabel, { color: tokens.primary, fontWeight: '700' }]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );

  // =========================================================================
  // STEP 3 of REGISTRATION: MY COURSES (Screenshot 3 in solashandlogiregerationflow)
  // =========================================================================
  if (authMode === 'REGISTER' && regStep === 'MY_COURSES') {
    return (
      <View style={[styles.container, { backgroundColor: tokens.background }]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header with Back Arrow */}
          <View style={styles.headerBackRow}>
            <TouchableOpacity
              onPress={() => setRegStep('UNIVERSITY_SCOPE')}
              style={[
                styles.iconBackBtn,
                { backgroundColor: tokens.surface, borderColor: tokens.border },
              ]}
              activeOpacity={0.7}
            >
              <MasteraIcon name="chevron-left" size={18} color={tokens.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.screenTitleWithBack, { color: tokens.textPrimary }]}>
              My Courses
            </Text>
          </View>

          {/* Subtitle */}
          <Text style={[styles.screenSubtitle, { color: tokens.textMuted }]}>
            Manage active courses on your Course tab. All courses offered in{' '}
            <Text style={{ fontWeight: '700', color: tokens.textPrimary }}>
              {selectedDepartment}
            </Text>{' '}
            are listed below.
          </Text>

          {/* Courses List */}
          <View style={styles.coursesListCol}>
            {displayCourses.map((c) => {
              const isChecked = checkedCourseIds.includes(c.id);
              const accentColor =
                c.accent && c.accent in COURSE_ACCENTS
                  ? COURSE_ACCENTS[c.accent as CourseAccentName]
                  : COURSE_ACCENTS.blue;

              return (
                <View
                  key={c.id}
                  style={[
                    styles.courseCard,
                    {
                      backgroundColor: tokens.surface,
                      borderColor: tokens.border,
                    },
                  ]}
                >
                  <View style={styles.courseCardLeft}>
                    <View
                      style={[
                        styles.courseIconBox,
                        { backgroundColor: tokens.primarySoft },
                      ]}
                    >
                      <MasteraIcon name="book-open" size={20} color={accentColor} />
                    </View>
                    <View style={styles.courseMetaCol}>
                      <Text
                        style={[styles.courseTitle, { color: tokens.textPrimary }]}
                        numberOfLines={2}
                      >
                        {c.title}
                      </Text>
                      <Text style={[styles.courseCodeSub, { color: tokens.textMuted }]}>
                        {c.code} · {selectedSemester}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => toggleCourseChecked(c.id)}
                    style={[
                      styles.checkInBtn,
                      isChecked
                        ? { backgroundColor: tokens.primary, borderColor: tokens.primary }
                        : { backgroundColor: tokens.surface, borderColor: tokens.border },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.checkInBtnText,
                        { color: isChecked ? tokens.surface : tokens.textPrimary },
                      ]}
                    >
                      {isChecked ? '✓ Checked In' : '+ Check In'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Info Card */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: tokens.primarySoft,
                borderColor: tokens.primary,
                marginTop: SPACING.md,
              },
            ]}
          >
            <Text style={[styles.infoCardText, { color: tokens.primary }]}>
              Checked courses immediately appear on your main Course tab. Unchecked
              courses stay available here in your department.
            </Text>
          </View>

          {/* Done Button (Solid Blue) */}
          <TouchableOpacity
            onPress={completeOnboardingAndGoHome}
            style={[
              styles.primaryActionBtn,
              { backgroundColor: tokens.primary, marginTop: SPACING.lg },
            ]}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryActionBtnText, { color: tokens.surface }]}>
              Done
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Footer Tabs */}
        {renderFooterTabs()}
      </View>
    );
  }

  // =========================================================================
  // STEP 2 of REGISTRATION: UNIVERSITY & PROGRAM (Screenshot 2 in solashandlogiregerationflow)
  // =========================================================================
  if (authMode === 'REGISTER' && regStep === 'UNIVERSITY_SCOPE') {
    return (
      <View style={[styles.container, { backgroundColor: tokens.background }]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header with Back Arrow */}
          <View style={styles.headerBackRow}>
            <TouchableOpacity
              onPress={() => setRegStep('FORM')}
              style={[
                styles.iconBackBtn,
                { backgroundColor: tokens.surface, borderColor: tokens.border },
              ]}
              activeOpacity={0.7}
            >
              <MasteraIcon name="chevron-left" size={18} color={tokens.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.screenTitleWithBack, { color: tokens.textPrimary }]}>
              University &amp; Program
            </Text>
          </View>

          {/* UNIVERSITY Dropdown Field (not automatically opened) */}
          <Text style={[styles.sectionHeading, { color: tokens.textMuted }]}>
            UNIVERSITY
          </Text>
          <TouchableOpacity
            onPress={() => {
              setIsUniversityDropdownOpen((prev) => !prev);
              setIsDepartmentDropdownOpen(false);
            }}
            style={[
              styles.dropdownField,
              {
                backgroundColor: tokens.surface,
                borderColor: isUniversityDropdownOpen ? tokens.primary : tokens.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.dropdownFieldText, { color: tokens.textPrimary }]}>
              {selectedUniversity}
            </Text>
            <MasteraIcon
              name={isUniversityDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={tokens.textMuted}
            />
          </TouchableOpacity>

          {isUniversityDropdownOpen && (
            <View
              style={[
                styles.dropdownMenu,
                { backgroundColor: tokens.surface, borderColor: tokens.border },
              ]}
            >
              {universityOptions.map((u) => {
                const isSel = selectedUniversity.includes(u.id);
                return (
                  <TouchableOpacity
                    key={u.id}
                    onPress={() => {
                      setSelectedUniversity(u.name);
                      setIsUniversityDropdownOpen(false);
                    }}
                    style={[
                      styles.dropdownItem,
                      isSel && { backgroundColor: tokens.primarySoft },
                      { borderBottomColor: tokens.border },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
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

          {/* DEPARTMENT / PROGRAM Dropdown Field (not automatically opened) */}
          <Text
            style={[
              styles.sectionHeading,
              { color: tokens.textMuted, marginTop: SPACING.md },
            ]}
          >
            DEPARTMENT / PROGRAM
          </Text>
          <TouchableOpacity
            onPress={() => {
              setIsDepartmentDropdownOpen((prev) => !prev);
              setIsUniversityDropdownOpen(false);
            }}
            style={[
              styles.dropdownField,
              {
                backgroundColor: tokens.surface,
                borderColor: isDepartmentDropdownOpen ? tokens.primary : tokens.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.dropdownFieldText, { color: tokens.textPrimary }]}>
              {selectedDepartment}
            </Text>
            <MasteraIcon
              name={isDepartmentDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={tokens.textMuted}
            />
          </TouchableOpacity>

          {isDepartmentDropdownOpen && (
            <View
              style={[
                styles.dropdownMenu,
                { backgroundColor: tokens.surface, borderColor: tokens.border },
              ]}
            >
              {departmentOptions.map((d) => {
                const isSel = selectedDepartment === d.name;
                return (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => {
                      setSelectedDepartment(d.name);
                      setIsDepartmentDropdownOpen(false);
                    }}
                    style={[
                      styles.dropdownItem,
                      isSel && { backgroundColor: tokens.primarySoft },
                      { borderBottomColor: tokens.border },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
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

          {/* SEMESTER */}
          <Text
            style={[
              styles.sectionHeading,
              { color: tokens.textMuted, marginTop: SPACING.md },
            ]}
          >
            SEMESTER
          </Text>
          <View style={styles.segmentedRow}>
            {(['Semester 1', 'Semester 2'] as const).map((sem) => {
              const isSel = selectedSemester === sem;
              return (
                <TouchableOpacity
                  key={sem}
                  onPress={() => setSelectedSemester(sem)}
                  style={[
                    styles.segmentedBtn,
                    {
                      backgroundColor: isSel ? tokens.primary : tokens.surface,
                      borderColor: isSel ? tokens.primary : tokens.border,
                    },
                  ]}
                  activeOpacity={0.7}
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

          {/* ACADEMIC STREAM */}
          <Text
            style={[
              styles.sectionHeading,
              { color: tokens.textMuted, marginTop: SPACING.md },
            ]}
          >
            ACADEMIC STREAM
          </Text>
          <View style={styles.segmentedRow}>
            {(['Natural', 'Social'] as const).map((st) => {
              const isSel = selectedStream === st;
              return (
                <TouchableOpacity
                  key={st}
                  onPress={() => setSelectedStream(st)}
                  style={[
                    styles.segmentedBtn,
                    {
                      backgroundColor: isSel ? tokens.primary : tokens.surface,
                      borderColor: isSel ? tokens.primary : tokens.border,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.segmentedBtnText,
                      {
                        color: isSel ? tokens.surface : tokens.textPrimary,
                        fontWeight: isSel ? '700' : '500',
                      },
                    ]}
                  >
                    {st === 'Natural' ? 'Natural Science' : 'Social Science'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action Button: Continue to My Courses */}
          <TouchableOpacity
            onPress={() => setRegStep('MY_COURSES')}
            style={[
              styles.primaryActionBtn,
              { backgroundColor: tokens.primary, marginTop: SPACING.lg },
            ]}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryActionBtnText, { color: tokens.surface }]}>
              Continue to My Courses
            </Text>
            <MasteraIcon name="chevron-right" size={18} color={tokens.surface} />
          </TouchableOpacity>
        </ScrollView>

        {/* Footer Tabs */}
        {renderFooterTabs()}
      </View>
    );
  }

  // =========================================================================
  // STEP 1 of AUTH: SIGN IN or REGISTER (Screenshot 1 & Screenshot 5)
  // =========================================================================
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tokens.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Brand Header */}
      <View style={styles.brandRow}>
        <View style={styles.brandLeft}>
          <View style={[styles.logoIconBox, { backgroundColor: tokens.primary }]}>
            <Text style={[styles.logoIconText, { color: tokens.surface }]}>M</Text>
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={[styles.brandName, { color: tokens.textPrimary }]}>
              Mastara · ማስታራ
            </Text>
            <Text style={[styles.brandTagline, { color: tokens.textMuted }]}>
              Ethiopian University Learning Companion
            </Text>
          </View>
        </View>

        {onToggleTheme && (
          <TouchableOpacity
            onPress={onToggleTheme}
            style={[
              styles.themePill,
              { borderColor: tokens.border, backgroundColor: tokens.surface },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.themePillText, { color: tokens.textMuted }]}>
              {themeMode === 'dark' ? 'Light' : 'Dark'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Auth Mode Toggle Tabs (Sign In vs Register) */}
      <View
        style={[
          styles.authTabs,
          { backgroundColor: tokens.surface, borderColor: tokens.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => setAuthMode('LOGIN')}
          style={[
            styles.authTabBtn,
            authMode === 'LOGIN' && { backgroundColor: tokens.primary },
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.authTabBtnText,
              { color: authMode === 'LOGIN' ? tokens.surface : tokens.textMuted },
            ]}
          >
            Sign in
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setAuthMode('REGISTER');
            setRegStep('FORM');
          }}
          style={[
            styles.authTabBtn,
            authMode === 'REGISTER' && { backgroundColor: tokens.primary },
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.authTabBtnText,
              { color: authMode === 'REGISTER' ? tokens.surface : tokens.textMuted },
            ]}
          >
            Register
          </Text>
        </TouchableOpacity>
      </View>

      {authMode === 'REGISTER' ? (
        // ===================================================================
        // REGISTER FORM (Step 1 in solashandlogiregerationflow, marked "1")
        // ===================================================================
        <View style={styles.formContainer}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: tokens.textMuted }]}>
              FULL NAME
            </Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Abebe Kebede"
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

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: tokens.textMuted }]}>
              PHONE OR EMAIL
            </Text>
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="+251 911 022 344"
              placeholderTextColor={tokens.textMuted}
              keyboardType="email-address"
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

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: tokens.textMuted }]}>
              PASSWORD
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="••••••••••"
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

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: tokens.textMuted }]}>
              CONFIRM PASSWORD
            </Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              placeholder="••••••••••"
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

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: tokens.textMuted }]}>
              STREAM
            </Text>
            <View style={styles.segmentedRow}>
              <TouchableOpacity
                onPress={() => setSelectedStream('Natural')}
                style={[
                  styles.segmentedBtn,
                  {
                    backgroundColor:
                      selectedStream === 'Natural' ? tokens.primary : tokens.surface,
                    borderColor:
                      selectedStream === 'Natural' ? tokens.primary : tokens.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.segmentedBtnText,
                    {
                      color:
                        selectedStream === 'Natural'
                          ? tokens.surface
                          : tokens.textPrimary,
                    },
                  ]}
                >
                  Natural Science
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedStream('Social')}
                style={[
                  styles.segmentedBtn,
                  {
                    backgroundColor:
                      selectedStream === 'Social' ? tokens.primary : tokens.surface,
                    borderColor:
                      selectedStream === 'Social' ? tokens.primary : tokens.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.segmentedBtnText,
                    {
                      color:
                        selectedStream === 'Social'
                          ? tokens.surface
                          : tokens.textPrimary,
                    },
                  ]}
                >
                  Social Science
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Saved on phone notice with Lock icon */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: tokens.surface,
                borderColor: tokens.primary,
                marginTop: SPACING.sm,
              },
            ]}
          >
            <MasteraIcon name="lock" size={16} color={tokens.primary} />
            <Text style={[styles.infoCardText, { color: tokens.primary }]}>
              Saved on this phone. Server registration happens only after payment.
            </Text>
          </View>

          {/* Create Local Account Button */}
          <TouchableOpacity
            onPress={() => {
              onRegisterLocal({
                fullName,
                identifier,
                password,
                confirmPassword,
                stream: selectedStream === 'Natural' ? 'NATURAL' : 'SOCIAL',
              });
              setRegStep('UNIVERSITY_SCOPE');
            }}
            style={[
              styles.primaryActionBtn,
              { backgroundColor: tokens.primary, marginTop: SPACING.md },
            ]}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryActionBtnText, { color: tokens.surface }]}>
              Create local account
            </Text>
          </TouchableOpacity>

          {/* Switch to Sign In */}
          <TouchableOpacity
            onPress={() => setAuthMode('LOGIN')}
            style={styles.switchAuthRow}
            activeOpacity={0.7}
          >
            <Text style={[styles.switchAuthText, { color: tokens.textMuted }]}>
              Already registered on this device?{' '}
            </Text>
            <Text style={[styles.switchAuthHighlight, { color: tokens.primary }]}>
              Sign in
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        // ===================================================================
        // SIGN IN FORM (Screenshot 5 in solashandlogiregerationflow, marked "1")
        // ===================================================================
        <View style={styles.formContainer}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: tokens.textMuted }]}>
              PHONE OR EMAIL
            </Text>
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="+251 911 022 344"
              placeholderTextColor={tokens.textMuted}
              keyboardType="email-address"
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

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: tokens.textMuted }]}>
              PASSWORD
            </Text>
            <View
              style={[
                styles.passwordRow,
                { backgroundColor: tokens.surface, borderColor: tokens.border },
              ]}
            >
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="••••••••••"
                placeholderTextColor={tokens.textMuted}
                style={[styles.passwordInput, { color: tokens.textPrimary }]}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                activeOpacity={0.7}
              >
                <MasteraIcon
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color={tokens.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password link */}
          <TouchableOpacity
            onPress={() => {
              const res = onForgotPasswordRequest();
              setForgotResolution(res);
            }}
            style={styles.forgotBtn}
            activeOpacity={0.7}
          >
            <Text style={[styles.forgotBtnText, { color: tokens.primary }]}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          {/* Forgot password resolution warning */}
          {forgotResolution && (
            <View
              style={[
                styles.warningCard,
                { backgroundColor: tokens.surface, borderColor: tokens.amber },
              ]}
            >
              <Text style={[styles.warningTitle, { color: tokens.amber }]}>
                {forgotResolution.title}
              </Text>
              <Text style={[styles.warningMessage, { color: tokens.textPrimary }]}>
                {forgotResolution.message}
              </Text>
              {forgotResolution.allowsLocalWipeAndReRegister && onWipeAndReRegister && (
                <TouchableOpacity
                  onPress={onWipeAndReRegister}
                  style={[styles.wipeBtn, { backgroundColor: tokens.danger }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.wipeBtnText, { color: tokens.surface }]}>
                    Wipe &amp; Re-Register
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Sign In Button (Solid Blue) -> Lands directly on Home (Screenshot 6) */}
          <TouchableOpacity
            onPress={() => onSignIn(identifier, password)}
            style={[
              styles.primaryActionBtn,
              { backgroundColor: tokens.primary, marginTop: SPACING.md },
            ]}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryActionBtnText, { color: tokens.surface }]}>
              Sign in
            </Text>
          </TouchableOpacity>

          {/* Create New Account Button (Outline) */}
          <TouchableOpacity
            onPress={() => {
              setAuthMode('REGISTER');
              setRegStep('FORM');
            }}
            style={[
              styles.secondaryActionBtn,
              { backgroundColor: tokens.surface, borderColor: tokens.border },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.secondaryActionBtnText, { color: tokens.textPrimary }]}
            >
              Create new account
            </Text>
          </TouchableOpacity>

          {/* Works Offline Info Card with Wifi-off icon */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: tokens.surface,
                borderColor: tokens.primary,
                marginTop: SPACING.lg,
              },
            ]}
          >
            <MasteraIcon name="wifi-off" size={16} color={tokens.primary} />
            <Text style={[styles.infoCardText, { color: tokens.primary }]}>
              Works offline. Your account is saved on this phone until you buy a
              bundle.
            </Text>
          </View>
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
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingTop: 4,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoIconBox: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconText: {
    fontSize: 22,
    fontWeight: '900',
  },
  brandName: {
    fontSize: 17,
    fontWeight: '800',
  },
  brandTagline: {
    fontSize: 11,
    marginTop: 2,
  },
  themePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  themePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  authTabs: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 3,
    marginBottom: SPACING.lg,
  },
  authTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  authTabBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  formContainer: {
    width: '100%',
  },
  fieldGroup: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  passwordRow: {
    height: 48,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  forgotBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  warningCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    marginBottom: SPACING.md,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  warningMessage: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  wipeBtn: {
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  wipeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentedBtn: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 10,
  },
  infoCardText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  primaryActionBtn: {
    height: 48,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    height: 48,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  secondaryActionBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  switchAuthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  switchAuthText: {
    fontSize: 13,
  },
  switchAuthHighlight: {
    fontSize: 13,
    fontWeight: '800',
  },
  headerBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingTop: 4,
  },
  iconBackBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitleWithBack: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 12,
  },
  screenSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: SPACING.md,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  optionsCol: {
    gap: 8,
    marginBottom: SPACING.md,
  },
  selectionCard: {
    height: 48,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectionCardText: {
    fontSize: 14,
  },
  coursesListCol: {
    gap: 10,
    marginBottom: SPACING.sm,
  },
  courseCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  courseCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  courseIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseMetaCol: {
    marginLeft: 10,
    flex: 1,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  courseCodeSub: {
    fontSize: 12,
    marginTop: 2,
  },
  checkInBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  dropdownField: {
    height: 48,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dropdownFieldText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dropdownMenu: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
  },
  dropdownItemText: {
    fontSize: 14,
  },
  footerTabBar: {
    flexDirection: 'row',
    height: 56,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  footerTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  footerTabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
});
