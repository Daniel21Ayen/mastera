import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import {
  STUDENT_THEMES,
  SPACING,
  RADIUS,
  ThemeMode,
} from '@mastera/ui-tokens';
import {
  CatalogProgramDto,
  CatalogUniversityDto,
  CatalogCourseDto,
  CatalogBookGroupDto,
  CatalogChapterMetaDto,
  CatalogExamSetMetaDto,
  QuestionItemDto,
} from '@mastera/contracts';
import { ResolvedCatalogRowView } from './src/core/database/local-catalog-store';
import { SplashScreen } from './src/screens/SplashScreen';
import { BeforeHomeAuthScreens } from './src/screens/BeforeHomeAuthScreens';
import { HomeDashboardScreens } from './src/screens/HomeDashboardScreens';
import { MyCoursesListScreen } from './src/screens/MyCoursesListScreen';
import { CourseMaterialAndReaderScreens } from './src/screens/CourseMaterialAndReaderScreens';
import {
  CourseTestsQuizFlowScreen,
  CourseExamsDirectFlowScreen,
} from './src/screens/AssessmentsAndReviewScreens';
import {
  DownloadManagerScreen,
  DownloadItemEntry,
} from './src/screens/DownloadManagerScreen';
import { ProgressTabScreens } from './src/screens/ProgressTabScreens';
import {
  ProfileAndStoreScreens,
  AcademicScopeState,
  ProfileFlowScreen,
} from './src/screens/ProfileAndStoreScreens';
import { MasteraIcon } from './src/shared/components/MasteraIcon';
import {
  initialRealAppData,
  syncLiveCatalogFromApi,
  syncCatalogDeltaFromApi,
  mergeDeltaIntoState,
  unpackPackageIntoState,
  fetchCoursePackageFromApi,
  fetchLivePaymentMethods,
  getCandidateHosts,
  RealAppDataState,
} from './src/core/data/live-catalog-provider';

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? (StatusBar.currentHeight ?? 30) : 44;
const SAFE_TOP_PADDING = STATUS_BAR_HEIGHT + 8;

export default function App(): any {
  const [appData, setAppData] = useState<RealAppDataState>(initialRealAppData);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [profileInitialScreen, setProfileInitialScreen] =
    useState<ProfileFlowScreen>('PROFILE_MAIN');
  const [activeTab, setActiveTab] = useState<
    'HOME' | 'COURSES' | 'PROGRESS' | 'PROFILE'
  >('HOME');

  // Continuous live database synchronization:
  // Dynamically syncs universities, programs, courses, chapters, exams, and payment methods from PostgreSQL
  useEffect(() => {
    let isCancelled = false;

    async function syncFromDatabase() {
      try {
        const freshData = await syncLiveCatalogFromApi();
        if (!isCancelled && freshData && freshData.courses.length > 0) {
          setAppData(freshData);
        } else {
          const currentVersion = Math.max(
            ...appData.courses.map((c) => c.version || 1),
            1
          );
          const deltaRes = await syncCatalogDeltaFromApi(currentVersion);
          if (
            !isCancelled &&
            deltaRes &&
            !deltaRes.notModified &&
            deltaRes.delta
          ) {
            setAppData((prev) => mergeDeltaIntoState(prev, deltaRes.delta!));
          }
        }
      } catch {
        // Fallback to local offline cache
      }
    }

    syncFromDatabase();

    // Check for continuous database updates every 8 seconds
    const interval = setInterval(syncFromDatabase, 8000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Synchronize payment methods dynamically whenever student accesses Profile/Store or on interval
  useEffect(() => {
    let isCancelled = false;
    async function refreshPaymentMethods() {
      try {
        const methods = await fetchLivePaymentMethods();
        if (!isCancelled && methods && methods.length > 0) {
          setAppData((prev) => ({
            ...prev,
            paymentMethods: methods,
          }));
        }
      } catch {}
    }
    refreshPaymentMethods();
    return () => {
      isCancelled = true;
    };
  }, [activeTab, profileInitialScreen]);

  // Academic scope state (University, Department, Semester, Stream)
  const [academicScope, setAcademicScope] = useState<AcademicScopeState>({
    universityId: 'BDU',
    universityName: 'BDU - Bahir Dar University',
    programId: 'FRESHMAN',
    programName: 'Freshman Department',
    semester: 'Semester 1',
    stream: 'Natural',
  });

  // Account and student profile state
  const [accountState, setAccountState] = useState<'LOCAL_ONLY' | 'REGISTERED_REMOTE'>('LOCAL_ONLY');
  const [studentCode, setStudentCode] = useState<string | null>(null);
  const [studentFullName, setStudentFullName] = useState<string>('');
  const [studentPhone, setStudentPhone] = useState<string>('');
  const [studentEmail, setStudentEmail] = useState<string>('');
  const [hasActiveBundle, setHasActiveBundle] = useState<boolean>(false);
  const [bundleDaysRemaining, setBundleDaysRemaining] = useState<number>(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [continueLearningPercent, setContinueLearningPercent] = useState<number>(0);

  // Pricing settings from live database config (Phase 3)
  const [bundlePriceETB, setBundlePriceETB] = useState<number>(150);
  const [freshmanPriceETB, setFreshmanPriceETB] = useState<number>(350);
  const [bundleDurationDays, setBundleDurationDays] = useState<number>(150);

  // Load live student summary from database (Phase 2)
  useEffect(() => {
    let isCancelled = false;
    async function loadStudentSummary() {
      try {
        const candidateHosts = getCandidateHosts();
        for (const host of candidateHosts) {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 2000);
            const url =
              `${host}/student/me/summary` +
              (studentCode ? `?studentCode=${studentCode}` : '');
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timer);
            if (res.ok) {
              const summary = await res.json();
              if (!isCancelled && summary) {
                if (summary.name && summary.name !== 'Student')
                  setStudentFullName(summary.name);
                if (summary.studentCode) setStudentCode(summary.studentCode);
                if (summary.bundleDaysRemaining !== undefined)
                  setBundleDaysRemaining(summary.bundleDaysRemaining);
                if (summary.pendingOrdersCount !== undefined)
                  setPendingOrdersCount(summary.pendingOrdersCount);
                if (summary.accountState === 'CLAIMED_REGISTERED') {
                  setAccountState('REGISTERED_REMOTE');
                  setHasActiveBundle(true);
                }
              }
              break;
            }
          } catch {}
        }
      } catch {}
    }
    loadStudentSummary();
    return () => {
      isCancelled = true;
    };
  }, [studentCode, activeTab]);

  // Load live pricing settings from commerce pricing config (Phase 3)
  useEffect(() => {
    let isCancelled = false;
    async function loadPricingSettings() {
      try {
        const candidateHosts = getCandidateHosts();
        for (const host of candidateHosts) {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 2000);
            const res = await fetch(`${host}/commerce/settings`, {
              signal: controller.signal,
            });
            clearTimeout(timer);
            if (res.ok) {
              const settings = await res.json();
              if (!isCancelled && settings?.bundles) {
                if (settings.bundles.semesterBundle?.priceETB) {
                  setBundlePriceETB(settings.bundles.semesterBundle.priceETB);
                }
                if (settings.bundles.semesterBundle?.durationDays) {
                  setBundleDurationDays(
                    settings.bundles.semesterBundle.durationDays
                  );
                }
                if (settings.bundles.fullFreshmanPackage?.singleStreamETB) {
                  setFreshmanPriceETB(
                    settings.bundles.fullFreshmanPackage.singleStreamETB
                  );
                }
              }
              break;
            }
          } catch {}
        }
      } catch {}
    }
    loadPricingSettings();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Department-scoped courses: students only get resources for their chosen department
  const departmentScopedCourses = React.useMemo(() => {
    if (
      academicScope.programId === 'FRESHMAN' ||
      academicScope.programName.toLowerCase().includes('freshman')
    ) {
      const targetStream = (academicScope.stream || 'NATURAL').toUpperCase();
      const filtered = appData.courses.filter((c) => {
        const stream = ((c as any).stream || '').toUpperCase();
        if (stream && stream !== 'COMMON' && stream !== targetStream) {
          return false;
        }
        return true;
      });
      return filtered.length > 0 ? filtered : appData.courses;
    }
    const matches = appData.courses.filter((c) => {
      const pName = ((c as any).programName || '').toLowerCase();
      const targetPName = academicScope.programName.toLowerCase();
      return pName.includes(targetPName) || c.programId === academicScope.programId;
    });
    return matches.length > 0 ? matches : appData.courses;
  }, [appData.courses, academicScope]);

  // Enrolled course IDs initialized from real database courses
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(() => {
    const courses = appData.courses;
    if (courses.length >= 3) {
      return [courses[0]!.id, courses[1]!.id, courses[2]!.id];
    }
    return courses.map((c) => c.id);
  });

  // Keep enrolled course IDs synchronized with real database courses when catalog syncs
  useEffect(() => {
    if (departmentScopedCourses.length > 0) {
      setSelectedCourseIds((prev) => {
        const hasValidEnrolledCourse = prev.some((id) =>
          departmentScopedCourses.some((c) => c.id === id)
        );
        if (!hasValidEnrolledCourse) {
          return departmentScopedCourses.slice(0, 3).map((c) => c.id);
        }
        return prev;
      });
    }
  }, [departmentScopedCourses]);

  // Sub-flow states matching image2 design sheets
  const [selectedCourse, setSelectedCourse] = useState<CatalogCourseDto | null>(
    null
  );
  const [courseTopTab, setCourseTopTab] = useState<
    'MATERIAL' | 'TESTS' | 'EXAMS'
  >('MATERIAL');
  const [activeQuizChapterId, setActiveQuizChapterId] = useState<string | null>(
    null
  );
  const [activeExamSetId, setActiveExamSetId] = useState<string | null>(null);
  const [showDownloads, setShowDownloads] = useState<boolean>(false);
  const [isInReaderMode, setIsInReaderMode] = useState<boolean>(false);
  const handleReaderModeChange = useCallback((inReader: boolean) => {
    setIsInReaderMode(inReader);
  }, []);

  // Dynamic Offline Downloads State (Wi-Fi or cellular data)
  const [downloadedCourseIds, setDownloadedCourseIds] = useState<string[]>([]);
  const [downloadedChapterIds, setDownloadedChapterIds] = useState<string[]>([]);
  const [wifiOnly, setWifiOnly] = useState<boolean>(false);

  const handleDownloadCourse = (courseId: string) => {
    setDownloadedCourseIds((prev) =>
      prev.includes(courseId) ? prev : [...prev, courseId]
    );
    // Background stream package from MinIO/API and unpack into memory for instant offline reading
    fetchCoursePackageFromApi(courseId)
      .then((pkg) => {
        if (pkg) {
          setAppData((prev) => unpackPackageIntoState(prev, pkg));
        }
      })
      .catch(() => {
        // Fallback to local offline cache
      });
  };

  const handleDeleteCourseDownload = (courseId: string) => {
    setDownloadedCourseIds((prev) => prev.filter((id) => id !== courseId));
  };

  const handleDownloadChapter = (chapterId: string) => {
    setDownloadedChapterIds((prev) =>
      prev.includes(chapterId) ? prev : [...prev, chapterId]
    );
  };

  const handleDeleteChapterDownload = (chapterId: string) => {
    setDownloadedChapterIds((prev) => prev.filter((id) => id !== chapterId));
  };

  // Auto-stream course package from MinIO S3 into volatile RAM when course is opened
  useEffect(() => {
    if (selectedCourse?.id) {
      fetchCoursePackageFromApi(selectedCourse.id)
        .then((pkg) => {
          if (pkg) {
            setAppData((prev) => unpackPackageIntoState(prev, pkg));
          }
        })
        .catch(() => {});
    }
  }, [selectedCourse?.id]);

  const tokens = STUDENT_THEMES[themeMode];

  const firstEnrolledCourse =
    appData.courses.find((c) => selectedCourseIds.includes(c.id)) ||
    appData.courses[0];

  // Dynamic Recent Items derived from real database courses
  const realRecentItems = appData.courses.slice(0, 3).map((c, idx) => ({
    id: `rec-${c.id}`,
    badgeLetter: c.title.charAt(0).toUpperCase(),
    title: c.title,
    subtitle: idx === 0 ? 'Chapter 1 · 2 days ago' : idx === 1 ? 'Notes · 3 days ago' : 'Mid Exam · Viewed 5 days ago',
    targetType: (idx === 2 ? 'EXAM' : idx === 1 ? 'NOTES' : 'CHAPTER') as 'EXAM' | 'NOTES' | 'CHAPTER',
    targetId: c.id,
  }));

  if (showSplash) {
    return (
      <SplashScreen
        durationMs={2400}
        themeMode={themeMode}
        onFinish={() => setShowSplash(false)}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.background, paddingTop: SAFE_TOP_PADDING }}>
        <StatusBar
          barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={tokens.background}
        />
        <BeforeHomeAuthScreens
          universities={appData.universities}
          programs={appData.programs}
          departmentCourses={departmentScopedCourses}
          themeMode={themeMode}
          onToggleTheme={() =>
            setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'))
          }
          onSignIn={() => {
            setIsAuthenticated(true);
            setActiveTab('HOME');
          }}
          onRegisterLocal={(payload) => {
            setStudentFullName(payload.fullName);
            setStudentPhone(payload.identifier);
            setAcademicScope((prev) => ({
              ...prev,
              stream: payload.stream === 'NATURAL' ? 'Natural' : 'Social',
            }));
          }}
          onCompleteProfileAndSelectCourses={(payload) => {
            setAcademicScope({
              universityId: payload.universityId,
              universityName: payload.universityName,
              programId: payload.programId,
              programName: payload.programName,
              semester: payload.semester,
              stream: payload.stream,
            });
            if (payload.selectedCourseIds && payload.selectedCourseIds.length > 0) {
              setSelectedCourseIds(payload.selectedCourseIds);
            }
            setIsAuthenticated(true);
            setActiveTab('HOME');
          }}
          onForgotPasswordRequest={() => ({
            mode: 'LOCAL_RESET_WARNING',
            title: 'Forgot password?',
            message:
              'Local password cannot be reset. You can re-register (data will be lost).',
            canResetViaOtp: false,
            allowsLocalWipeAndReRegister: true,
          })}
        />
      </View>
    );
  }

  // Scoped content specifically for the selected course (Strict course isolation, zero cross-course leakage)
  const courseBooks = selectedCourse
    ? appData.bookGroups.filter((b) => b.courseId === selectedCourse.id)
    : [];
  const materialBooks = courseBooks.filter((b) =>
    ['MODULES', 'NOTES', 'AMHARIC_NOTE'].includes(b.category)
  );
  const quizBooks = courseBooks.filter((b) =>
    ['QUIZ_1', 'QUIZ_2', 'QUIZ_3'].includes(b.category)
  );
  const courseChapters = selectedCourse
    ? appData.chapters.filter((ch) => ch.courseId === selectedCourse.id)
    : [];

  const courseExamSets: ResolvedCatalogRowView<CatalogExamSetMetaDto>[] = selectedCourse
    ? appData.examSets
        .filter(
          (es) =>
            es.courseId === selectedCourse.id ||
            (es.category === 'COC' &&
              (!es.universityId ||
                es.universityId === academicScope.universityId))
        )
        .map((es) => ({
          item: es,
          canOpenNow: true,
          accessBadge: es.isFreeSample ? 'Free' : 'Included',
          updateAvailable: false,
        }))
    : [];

  const isActuallyInReaderMode =
    isInReaderMode && !!selectedCourse && courseTopTab === 'MATERIAL';

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.background,
        paddingTop: SAFE_TOP_PADDING,
      }}
    >
      <StatusBar
        barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={tokens.background}
      />

      {/* Main Screen Content (Unified for all flows) */}
      <View style={{ flex: 1 }}>
        {showDownloads ? (
          <DownloadManagerScreen
            allItems={departmentScopedCourses.flatMap((course) => {
              const isCourseDown = downloadedCourseIds.includes(course.id);
              const isCourseLocked =
                !selectedCourseIds.includes(course.id) && !course.freeAccess;
              const courseItem: DownloadItemEntry = {
                id: course.id,
                title: course.title,
                code: course.code,
                type: 'COURSE',
                sizeMB: 18,
                isDownloaded: isCourseDown,
                isLocked: isCourseLocked,
              };

              const courseChapters =
                appData.chaptersByBookId[course.id] || [];
              const chapterItems: DownloadItemEntry[] = courseChapters
                .slice(0, 3)
                .map((ch, idx) => ({
                  id: ch.item.id,
                  title: ch.item.title,
                  code: course.code,
                  type: 'CHAPTER',
                  sizeMB: 4,
                  isDownloaded:
                    isCourseDown || downloadedChapterIds.includes(ch.item.id),
                  isLocked: isCourseLocked || idx === 3,
                  parentCourseTitle: course.title,
                }));

              return [courseItem, ...chapterItems];
            })}
            totalUsedMB={
              downloadedCourseIds.length * 18 + downloadedChapterIds.length * 4
            }
            freeSpaceGBLabel="9.2 GB free on this phone"
            wifiOnly={wifiOnly}
            onToggleWifiOnly={(enabled) => setWifiOnly(enabled)}
            onDownloadItem={(itemId, itemType) => {
              if (itemType === 'COURSE') {
                handleDownloadCourse(itemId);
              } else {
                handleDownloadChapter(itemId);
              }
            }}
            onDeleteDownloadItem={(itemId, itemType) => {
              if (itemType === 'COURSE') {
                handleDeleteCourseDownload(itemId);
              } else {
                handleDeleteChapterDownload(itemId);
              }
            }}
            onUpdateCourse={(cId) => handleDownloadCourse(cId)}
            onConfirmDeleteDownload={(cId) => handleDeleteCourseDownload(cId)}
            onOpenStore={() => {
              setShowDownloads(false);
              setProfileInitialScreen('STORE_CATALOG');
              setActiveTab('PROFILE');
            }}
            onBack={() => setShowDownloads(false)}
            themeMode={themeMode}
          />
        ) : selectedCourse ? (
          courseTopTab === 'TESTS' ? (
            <CourseTestsQuizFlowScreen
              courseTitle={selectedCourse.title}
              courseId={selectedCourse.id}
              quizBooks={quizBooks.map((b) => ({
                item: b,
                canOpenNow: true,
                accessBadge: 'Included',
                updateAvailable: false,
              }))}
              courseChapters={courseChapters}
              chaptersByBookId={appData.chaptersByBookId}
              questionsByChapterId={appData.questionsByChapterId}
              onSwitchCourseTopTab={(tab) => setCourseTopTab(tab)}
              onLockedItemTap={() => {}}
              onDownloadChapterTap={() => {}}
              onCompleteQuizChapter={() => {}}
              onBackToCourses={() => setSelectedCourse(null)}
              themeMode={themeMode}
            />
          ) : courseTopTab === 'EXAMS' ? (
            <CourseExamsDirectFlowScreen
              courseTitle={selectedCourse.title}
              courseId={selectedCourse.id}
              examSets={courseExamSets}
              questionsByExamSetId={appData.questionsByExamSetId}
              accountState="LOCAL_ONLY"
              onSwitchCourseTopTab={(tab) => setCourseTopTab(tab)}
              onLockedExamTap={() => {}}
              onSubmitExamAttempt={() => {}}
              onBackToCourses={() => setSelectedCourse(null)}
              themeMode={themeMode}
            />
          ) : (
            <CourseMaterialAndReaderScreens
              courseTitle={selectedCourse.title}
              courseCode={selectedCourse.code}
              books={materialBooks}
              courseChapters={courseChapters}
              chaptersByBookId={appData.chaptersByBookId}
              chapterBodyByChapterId={appData.chapterBodyByChapterId}
              isCourseDownloaded={downloadedCourseIds.includes(selectedCourse.id)}
              downloadedChapterIds={downloadedChapterIds}
              onDownloadCourse={() => handleDownloadCourse(selectedCourse.id)}
              onDeleteCourseDownload={() => handleDeleteCourseDownload(selectedCourse.id)}
              onDownloadChapter={handleDownloadChapter}
              onDeleteChapterDownload={handleDeleteChapterDownload}
              onLockedChapterTap={() => {}}
              onTakeQuizForChapter={(chId) => {
                setActiveQuizChapterId(chId);
                setCourseTopTab('TESTS');
              }}
              onSwitchTopTab={(tab) => {
                setIsInReaderMode(false);
                setCourseTopTab(tab);
              }}
              onReaderModeChange={handleReaderModeChange}
              onBackToCourses={() => {
                setIsInReaderMode(false);
                setSelectedCourse(null);
              }}
              onNavigateToStore={() => {
                setSelectedCourse(null);
                setProfileInitialScreen('STORE_CATALOG');
                setActiveTab('PROFILE');
              }}
              onOpenDownloadsManager={() => setShowDownloads(true)}
              themeMode={themeMode}
            />
          )
        ) : activeTab === 'HOME' ? (
          <HomeDashboardScreens
            studentFirstName={
              studentFullName ? studentFullName.split(' ')[0] : 'Student'
            }
            accountState={accountState}
            adaptiveStage="SYNCED_ACTIVE"
            enrolledCoursesCount={selectedCourseIds.length}
            pendingOrdersCount={pendingOrdersCount}
            bundleDaysRemaining={bundleDaysRemaining}
            bundlePriceETB={bundlePriceETB}
            activeCourseTitle={firstEnrolledCourse?.title}
            renewalWindowDays={14}
            continueLearningCourseTitle={`${
              firstEnrolledCourse
                ? firstEnrolledCourse.title
                : appData.courses[0]?.title || 'Course'
            } · Chapter 1`}
            continueLearningProgressPercent={continueLearningPercent}
            recentItems={realRecentItems}
            themeMode={themeMode}
            onOpenMyCourses={() => setActiveTab('COURSES')}
            onOpenProgressTab={() => setActiveTab('PROGRESS')}
            onOpenStoreBundles={() => {
              setProfileInitialScreen('STORE_CATALOG');
              setActiveTab('PROFILE');
            }}
            onOpenBuyExtras={() => {
              setProfileInitialScreen('STORE_CATALOG');
              setActiveTab('PROFILE');
            }}
            onOpenRecentItem={(item) => {
              const matched =
                appData.courses.find((c) => c.id === item.targetId) ||
                appData.courses[0]!;
              setSelectedCourse(matched);
              if (item.targetType === 'EXAM') {
                setCourseTopTab('EXAMS');
              } else {
                setCourseTopTab('MATERIAL');
              }
            }}
            onSeeAllRecent={() => setActiveTab('COURSES')}
            onOpenNotifications={() => {}}
            onOpenProfile={() => {
              setProfileInitialScreen('PROFILE_MAIN');
              setActiveTab('PROFILE');
            }}
          />
        ) : activeTab === 'COURSES' ? (
          <MyCoursesListScreen
            departmentLabel={`${academicScope.programName} (${academicScope.universityId})`}
            selectedCourseIds={selectedCourseIds}
            onSaveSelectedCourseIds={setSelectedCourseIds}
            themeMode={themeMode}
            onChangeDepartmentScope={() => setActiveTab('PROFILE')}
            onOpenDownloadsManager={() => setShowDownloads(true)}
            onOpenCourseOrPaywall={(courseRow) => {
              const courseId =
                typeof courseRow === 'string'
                  ? courseRow
                  : (courseRow as any).id || (courseRow as any).item?.id;
              const matched =
                departmentScopedCourses.find((c) => c.id === courseId) ||
                departmentScopedCourses[0] ||
                appData.courses[0];
              if (matched) {
                setSelectedCourse(matched);
                setCourseTopTab('MATERIAL');
              }
            }}
            allScopedCourses={departmentScopedCourses.map((c) => ({
              item: c,
              canOpenNow: selectedCourseIds.includes(c.id),
              accessBadge: selectedCourseIds.includes(c.id)
                ? 'Included'
                : c.freeAccess
                ? 'Free'
                : 'Locked',
              updateAvailable: false,
            }))}
          />
        ) : activeTab === 'PROGRESS' ? (
          <ProgressTabScreens
            accountState={accountState}
            overallMasteryPercent={68}
            completedChaptersTotal={14}
            totalChaptersCount={28}
            quizzesPassedCount={12}
            streakDays={5}
            weeklyActivityHeights={[30, 50, 70, 40, 85, 60, 20]}
            themeMode={themeMode}
            onBrowseCourses={() => setActiveTab('COURSES')}
            onOpenReviewAttempt={() => {}}
            coursesProgress={departmentScopedCourses.slice(0, 3).map((c, i) => ({
              courseId: c.id,
              courseTitle: c.title,
              completedChapters: i === 0 ? 6 : i === 1 ? 4 : 2,
              totalChapters: 8,
              avgQuizPercent: i === 0 ? 80 : i === 1 ? 65 : 50,
              masteryPercent: i === 0 ? 75 : i === 1 ? 60 : 45,
              isSavedOffline: true,
            }))}
            pastAttempts={[
              {
                attemptId: 'att-1',
                title: 'Calculus I Mid-Semester 2024 · AASTU',
                dateAndDurationLabel: '2 days ago · 45 mins',
                scoreLabel: '18/20',
                passed: true,
              },
            ]}
          />
        ) : (
          <ProfileAndStoreScreens
            initialScreen={profileInitialScreen}
            accountState={accountState}
            studentCode={studentCode}
            fullName={studentFullName}
            identifier={studentPhone}
            email={studentEmail}
            scopeSummaryLabel={`${academicScope.universityId} - ${academicScope.programName} · ${academicScope.semester} · ${academicScope.stream} Science`}
            academicScope={academicScope}
            onChangeAcademicScope={(newScope) => setAcademicScope(newScope)}
            onUpdateProfileInfo={(name, phone, mail) => {
              setStudentFullName(name);
              setStudentPhone(phone);
              setStudentEmail(mail);
            }}
            downloadedSizeMB={54}
            uiLanguage="en"
            hasActiveBundle={hasActiveBundle}
            departmentCourses={departmentScopedCourses}
            selectedCourseIds={selectedCourseIds}
            onToggleCourseCheckInOut={(courseId) => {
              setSelectedCourseIds((prev) =>
                prev.includes(courseId)
                  ? prev.filter((id) => id !== courseId)
                  : [...prev, courseId]
              );
            }}
            themeMode={themeMode}
            onToggleTheme={() =>
              setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'))
            }
            onOpenDownloadsManager={() => setShowDownloads(true)}
            onChangeUiLanguage={() => {}}
            onReleaseDeviceAndLogout={() => {
              setIsAuthenticated(false);
              setShowSplash(true);
            }}
            onSubmitBundleOrder={(payload) => {
              if (payload.fullName) setStudentFullName(payload.fullName);
              if (payload.phoneNumber) setStudentPhone(payload.phoneNumber);
              setPendingOrdersCount((c) => c + 1);
            }}
            bundlePriceETB={bundlePriceETB}
            freshmanPackagePriceETB={freshmanPriceETB}
            bundleDurationDays={bundleDurationDays}
            paymentMethods={
              appData.paymentMethods && appData.paymentMethods.length > 0
                ? appData.paymentMethods
                : initialRealAppData.paymentMethods
            }
          />
        )}
      </View>

      {/* Persistent Bottom Tab Bar (Visible on EVERY screen EXCEPT Reader) */}
      {!isActuallyInReaderMode && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            height: Platform.OS === 'android' ? 66 : 78,
            paddingBottom: Platform.OS === 'android' ? 8 : 20,
            paddingHorizontal: 16,
            backgroundColor: tokens.surface,
            borderTopWidth: 1,
            borderTopColor: tokens.border,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setSelectedCourse(null);
              setShowDownloads(false);
              setIsInReaderMode(false);
              setActiveTab('HOME');
            }}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 6,
            }}
            activeOpacity={0.7}
          >
            <MasteraIcon
              name="home"
              size={22}
              color={activeTab === 'HOME' && !selectedCourse && !showDownloads ? tokens.primary : tokens.textMuted}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: activeTab === 'HOME' && !selectedCourse && !showDownloads ? '700' : '500',
                color: activeTab === 'HOME' && !selectedCourse && !showDownloads ? tokens.primary : tokens.textMuted,
                marginTop: 3,
              }}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setShowDownloads(false);
              setIsInReaderMode(false);
              if (activeTab !== 'COURSES' || selectedCourse) {
                setSelectedCourse(null);
                setActiveTab('COURSES');
              }
            }}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 6,
            }}
            activeOpacity={0.7}
          >
            <MasteraIcon
              name="book-open"
              size={22}
              color={activeTab === 'COURSES' || selectedCourse ? tokens.primary : tokens.textMuted}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: activeTab === 'COURSES' || selectedCourse ? '700' : '500',
                color: activeTab === 'COURSES' || selectedCourse ? tokens.primary : tokens.textMuted,
                marginTop: 3,
              }}
            >
              Course
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setSelectedCourse(null);
              setShowDownloads(false);
              setIsInReaderMode(false);
              setActiveTab('PROGRESS');
            }}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 6,
            }}
            activeOpacity={0.7}
          >
            <MasteraIcon
              name="bar-chart-2"
              size={22}
              color={activeTab === 'PROGRESS' && !selectedCourse && !showDownloads ? tokens.primary : tokens.textMuted}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: activeTab === 'PROGRESS' && !selectedCourse && !showDownloads ? '700' : '500',
                color: activeTab === 'PROGRESS' && !selectedCourse && !showDownloads ? tokens.primary : tokens.textMuted,
                marginTop: 3,
              }}
            >
              Progress
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setSelectedCourse(null);
              setShowDownloads(false);
              setIsInReaderMode(false);
              setProfileInitialScreen('PROFILE_MAIN');
              setActiveTab('PROFILE');
            }}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 6,
            }}
            activeOpacity={0.7}
          >
            <MasteraIcon
              name="user"
              size={22}
              color={(activeTab === 'PROFILE' && !selectedCourse) || showDownloads ? tokens.primary : tokens.textMuted}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: (activeTab === 'PROFILE' && !selectedCourse) || showDownloads ? '700' : '500',
                color: (activeTab === 'PROFILE' && !selectedCourse) || showDownloads ? tokens.primary : tokens.textMuted,
                marginTop: 3,
              }}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
