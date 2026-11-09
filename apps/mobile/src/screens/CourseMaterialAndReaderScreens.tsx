import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  CatalogBookGroupDto,
  CatalogChapterMetaDto,
  MaterialType,
} from '@mastera/contracts';
import {
  RADIUS,
  SPACING,
  STUDENT_THEMES,
  ThemeMode,
} from '@mastera/ui-tokens';
import { ResolvedCatalogRowView } from '../core/database/local-catalog-store';
import { MasteraIcon } from '../shared/components/MasteraIcon';
import { LockedContentModal } from '../shared/components/LockedContentModal';

export interface CourseMaterialAndReaderScreensProps {
  courseTitle: string;
  courseCode?: string;
  books: CatalogBookGroupDto[];
  chaptersByBookId: Record<
    string,
    ResolvedCatalogRowView<CatalogChapterMetaDto>[]
  >;
  chapterBodyByChapterId: Record<
    string,
    {
      bodyText: string;
      formulaLatex: string;
      keyIdeaSummary: string;
    }
  >;
  isCourseDownloaded?: boolean;
  downloadedChapterIds?: string[];
  onDownloadCourse: () => void;
  onDeleteCourseDownload?: () => void;
  onDownloadChapter?: (chapterId: string) => void;
  onDeleteChapterDownload?: (chapterId: string) => void;
  onLockedChapterTap: () => void;
  onTakeQuizForChapter: (chapterId: string) => void;
  onSwitchTopTab: (tab: 'MATERIAL' | 'TESTS' | 'EXAMS') => void;
  onReaderModeChange?: (isInReader: boolean) => void;
  onBackToCourses?: () => void;
  onNavigateToStore?: () => void;
  onOpenDownloadsManager?: () => void;
  themeMode?: ThemeMode;
}

export function CourseMaterialAndReaderScreens({
  courseTitle,
  courseCode,
  books,
  chaptersByBookId,
  chapterBodyByChapterId,
  isCourseDownloaded = false,
  downloadedChapterIds = ['ch-1', 'ch-2'],
  onDownloadCourse,
  onDeleteCourseDownload,
  onDownloadChapter,
  onDeleteChapterDownload,
  onLockedChapterTap,
  onTakeQuizForChapter,
  onSwitchTopTab,
  onReaderModeChange,
  onBackToCourses,
  onNavigateToStore,
  onOpenDownloadsManager,
  themeMode = 'light',
}: CourseMaterialAndReaderScreensProps): React.ReactElement {
  const [activeCategory, setActiveCategory] = useState<'MODULES' | 'NOTES' | 'AMHARIC_NOTE'>('MODULES');
  const [selectedBook, setSelectedBook] = useState<CatalogBookGroupDto | null>(null);
  const [activeChapter, setActiveChapter] = useState<CatalogChapterMetaDto | null>(null);
  const [localCourseDownloaded, setLocalCourseDownloaded] = useState<boolean>(
    !!isCourseDownloaded
  );
  const [downloadedChapters, setDownloadedChapters] = useState<Set<string>>(
    () => new Set(downloadedChapterIds)
  );
  const [lockedModalInfo, setLockedModalInfo] = useState<{
    title: string;
    code?: string | undefined;
  } | null>(null);

  useEffect(() => {
    if (typeof isCourseDownloaded === 'boolean') {
      setLocalCourseDownloaded(isCourseDownloaded);
    }
  }, [isCourseDownloaded]);

  useEffect(() => {
    if (downloadedChapterIds) {
      setDownloadedChapters(new Set(downloadedChapterIds));
    }
  }, [downloadedChapterIds]);

  const handleDownloadCourse = () => {
    setLocalCourseDownloaded(true);
    onDownloadCourse?.();
  };

  const handleDeleteCourse = () => {
    setLocalCourseDownloaded(false);
    onDeleteCourseDownload?.();
  };

  const handleToggleChapterDownload = (chapterId: string) => {
    const isDownloaded = downloadedChapters.has(chapterId);
    if (isDownloaded) {
      setDownloadedChapters((prev) => {
        const next = new Set(prev);
        next.delete(chapterId);
        return next;
      });
      onDeleteChapterDownload?.(chapterId);
    } else {
      setDownloadedChapters((prev) => {
        const next = new Set(prev);
        next.add(chapterId);
        return next;
      });
      onDownloadChapter?.(chapterId);
    }
  };

  const onReaderModeChangeRef = useRef(onReaderModeChange);
  useEffect(() => {
    onReaderModeChangeRef.current = onReaderModeChange;
  });

  useEffect(() => {
    onReaderModeChangeRef.current?.(!!activeChapter);
  }, [activeChapter]);

  const tokens = STUDENT_THEMES[themeMode];

  // -------------------------------------------------------------------
  // Screen 8 in preview (4).webp: "Reader"
  // -------------------------------------------------------------------
  if (activeChapter) {
    const contentBody = chapterBodyByChapterId[activeChapter.id] ?? {
      bodyText:
        'Comprehensive standard semester module, fundamental principles and unit theorems.',
      formulaLatex: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}",
      keyIdeaSummary:
        'Key idea: a derivative measures how fast a value changes at a point.',
    };

    return (
      <View style={[styles.container, { backgroundColor: tokens.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Reader Top Bar */}
          <View style={styles.readerTopBar}>
            <TouchableOpacity
              onPress={() => setActiveChapter(null)}
              style={styles.backLink}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <View style={[styles.topBackArrowBtn, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                <MasteraIcon name="chevron-left" size={20} color={tokens.textPrimary} />
              </View>
              <Text style={[styles.backLinkText, { color: tokens.textPrimary }]}>
                {courseTitle}
              </Text>
            </TouchableOpacity>

            <View style={[styles.downloadedChip, { backgroundColor: tokens.primarySoft }]}>
              <Text style={[styles.downloadedChipText, { color: tokens.primary }]}>
                Downloaded
              </Text>
            </View>
          </View>

          {/* Book / Curriculum Label */}
          <Text style={[styles.readerSubHeader, { color: tokens.primary }]}>
            {selectedBook?.title.toUpperCase() || `${courseTitle.toUpperCase()} — CORE CURRICULUM`}
          </Text>

          {/* Chapter Title */}
          <Text style={[styles.readerTitle, { color: tokens.textPrimary }]}>
            {activeChapter.title}
          </Text>

          {/* Body Text */}
          <Text style={[styles.readerBody, { color: tokens.textPrimary }]}>
            {contentBody.bodyText}
          </Text>

          {/* Math / Formula Box */}
          <View style={[styles.formulaBox, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
            <Text style={[styles.formulaText, { color: tokens.primary }]}>
              {contentBody.formulaLatex}
            </Text>
          </View>

          {/* Callout Summary Box */}
          <View style={[styles.calloutBox, { backgroundColor: tokens.amberSoft, borderColor: tokens.amber }]}>
            <View style={styles.calloutHeaderRow}>
              <MasteraIcon name="lightbulb" size={16} color={tokens.amber} />
              <Text style={[styles.calloutTitle, { color: tokens.textPrimary }]}>
                Key Idea
              </Text>
            </View>
            <Text style={[styles.calloutBody, { color: tokens.textPrimary }]}>
              {contentBody.keyIdeaSummary}
            </Text>
          </View>

          {/* Action Row */}
          <View style={styles.readerActions}>
            <TouchableOpacity
              onPress={() => setActiveChapter(null)}
              style={[styles.backToBookBtn, { borderColor: tokens.border, backgroundColor: tokens.surface }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.backToBookText, { color: tokens.textPrimary }]}>
                Back to Book
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onTakeQuizForChapter(activeChapter.id)}
              style={[styles.takeQuizBtn, { backgroundColor: tokens.primary }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.takeQuizText, { color: tokens.white }]}>
                Take Quiz {'>'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // -------------------------------------------------------------------
  // Screen 7 in preview (4).webp: "Chapters" List for a Selected Book
  // -------------------------------------------------------------------
  if (selectedBook) {
    const rawChapters = chaptersByBookId[selectedBook.id] || [];
    const chapters = rawChapters.map((r, idx) => ({
      item: r.item || r,
      canOpenNow: r.canOpenNow !== false,
      accessBadge: r.accessBadge || (idx === 3 ? 'Locked' : 'Included'),
      isCompleted: idx === 0,
    }));

    return (
      <View style={[styles.container, { backgroundColor: tokens.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Back to Books Header */}
          <TouchableOpacity
            onPress={() => setSelectedBook(null)}
            style={styles.backLink}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <View style={[styles.topBackArrowBtn, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
              <MasteraIcon name="chevron-left" size={20} color={tokens.textPrimary} />
            </View>
            <Text style={[styles.backLinkText, { color: tokens.textPrimary }]}>
              Back to Books
            </Text>
          </TouchableOpacity>

          {/* Banner */}
          <View style={[styles.infoBanner, { backgroundColor: tokens.primarySoft }]}>
            <Text style={[styles.infoBannerTitle, { color: tokens.primary }]}>
              {selectedBook.title}
            </Text>
            <Text style={[styles.infoBannerSubtitle, { color: tokens.textMuted }]}>
              {chapters.length} chapters inside · syllabus aligned
            </Text>
          </View>

          {/* Chapter Rows matching preview (4).webp Screen 7 */}
          <View style={styles.chaptersList}>
            {chapters.map((ch, idx) => {
              const isLocked = ch.accessBadge === 'Locked' || idx === 3;
              const isCompleted = ch.isCompleted;
              const isChapterDownloaded =
                downloadedChapters.has(ch.item.id) || localCourseDownloaded;

              return (
                <View
                  key={ch.item.id}
                  style={[
                    styles.chapterRow,
                    {
                      backgroundColor: tokens.surface,
                      borderColor: tokens.border,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[styles.chapterRowLeft, { flex: 1 }]}
                    onPress={() => {
                      if (isLocked) {
                        setLockedModalInfo({
                          title: ch.item.title,
                          code: courseCode || courseTitle,
                        });
                        onLockedChapterTap();
                      } else {
                        setActiveChapter(ch.item);
                      }
                    }}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.chapterNumberCircle,
                        {
                          backgroundColor: isCompleted
                            ? tokens.primarySoft
                            : tokens.surface,
                          borderColor: isCompleted
                            ? tokens.primary
                            : tokens.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chapterNumberText,
                          {
                            color: isCompleted
                              ? tokens.primary
                              : tokens.textMuted,
                          },
                        ]}
                      >
                        {idx + 1}
                      </Text>
                    </View>
                    <View style={styles.chapterTextGroup}>
                      <Text
                        style={[
                          styles.chapterTitle,
                          { color: tokens.textPrimary },
                        ]}
                      >
                        {ch.item.title}
                      </Text>
                      <Text
                        style={[
                          styles.chapterSubtitle,
                          { color: tokens.textMuted },
                        ]}
                      >
                        {isCompleted
                          ? 'Completed'
                          : isLocked
                          ? 'Requires bundle (Locked)'
                          : isChapterDownloaded
                          ? 'Downloaded · Offline ready'
                          : 'Ready to read'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Dynamic Action: Locked vs Downloaded (Trash) vs Un-downloaded (Download) */}
                  {isLocked ? (
                    <TouchableOpacity
                      onPress={() => {
                        setLockedModalInfo({
                          title: ch.item.title,
                          code: courseCode || courseTitle,
                        });
                        onLockedChapterTap();
                      }}
                      style={{ padding: SPACING.xs }}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <MasteraIcon
                        name="lock"
                        size={18}
                        color={tokens.textMuted}
                      />
                    </TouchableOpacity>
                  ) : isChapterDownloaded ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: SPACING.sm,
                      }}
                    >
                      <MasteraIcon
                        name="check-circle"
                        size={18}
                        color={tokens.primary}
                      />
                      <TouchableOpacity
                        onPress={() => handleToggleChapterDownload(ch.item.id)}
                        style={{ padding: SPACING.xs }}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <MasteraIcon
                          name="trash-2"
                          size={16}
                          color={tokens.danger}
                        />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleToggleChapterDownload(ch.item.id)}
                      style={{ padding: SPACING.xs }}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <MasteraIcon
                        name="download"
                        size={18}
                        color={tokens.primary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          {/* Dynamic Download / Delete Course Action */}
          {localCourseDownloaded ? (
            <TouchableOpacity
              onPress={handleDeleteCourse}
              style={[
                styles.downloadCourseBtn,
                {
                  backgroundColor: tokens.surface,
                  borderColor: tokens.danger,
                },
              ]}
              activeOpacity={0.7}
            >
              <MasteraIcon name="trash-2" size={16} color={tokens.danger} />
              <Text
                style={[
                  styles.downloadCourseText,
                  { color: tokens.danger },
                ]}
              >
                Delete course download · 18 MB
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleDownloadCourse}
              style={[
                styles.downloadCourseBtn,
                {
                  backgroundColor: tokens.surface,
                  borderColor: tokens.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <MasteraIcon name="download" size={16} color={tokens.primary} />
              <Text
                style={[
                  styles.downloadCourseText,
                  { color: tokens.primary },
                ]}
              >
                Download course · 18 MB
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <LockedContentModal
          visible={!!lockedModalInfo}
          contentTitle={lockedModalInfo?.title}
          courseCode={lockedModalInfo?.code || courseCode}
          onClose={() => setLockedModalInfo(null)}
          onPurchaseCourse={() => {
            setLockedModalInfo(null);
            onNavigateToStore?.();
          }}
          themeMode={themeMode}
        />
      </View>
    );
  }

  // -------------------------------------------------------------------
  // Screen 6 & Screen 9 in preview (4).webp: Books List with Sub-Pills
  // (Modules | Notes | Amharic Notes)
  // -------------------------------------------------------------------
  const filteredBooks = books.filter((b) => {
    if (activeCategory === 'AMHARIC_NOTE') {
      return (
        b.category === 'AMHARIC_NOTE' ||
        b.title.includes('አማርኛ') ||
        b.title.toLowerCase().includes('amharic')
      );
    }
    if (activeCategory === 'NOTES') {
      return (
        b.category === 'NOTES' ||
        b.title.toLowerCase().includes('notes') ||
        b.title.toLowerCase().includes('formula')
      );
    }
    // Default MODULES
    return (
      b.category === 'MODULES' ||
      (!b.title.includes('አማርኛ') && !b.title.toLowerCase().includes('notes'))
    );
  });

  const effectiveBooksList = filteredBooks.length > 0 ? filteredBooks : books;

  return (
    <View style={[styles.container, { backgroundColor: tokens.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
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
          <Text style={[styles.courseTitleHeading, { color: tokens.textPrimary, flex: 1 }]}>
            {courseTitle}
          </Text>
          {onOpenDownloadsManager && (
            <TouchableOpacity
              onPress={onOpenDownloadsManager}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: RADIUS.pill,
                backgroundColor: tokens.primarySoft,
              }}
              activeOpacity={0.7}
            >
              <MasteraIcon name="download" size={14} color={tokens.primary} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: tokens.primary,
                }}
              >
                Downloads
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 3 Top Tabs: Material (Active) | Tests | Exams */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
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
              Material
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              {
                borderColor: tokens.border,
                backgroundColor: tokens.surface,
              },
            ]}
            onPress={() => onSwitchTopTab('TESTS')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabBtnText, { color: tokens.textPrimary }]}>
              Tests
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              {
                borderColor: tokens.border,
                backgroundColor: tokens.surface,
              },
            ]}
            onPress={() => onSwitchTopTab('EXAMS')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabBtnText, { color: tokens.textPrimary }]}>
              Exams
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3 Sub-Pills: Modules | Notes | Amharic matching preview (4).webp Screen 6 & 9 */}
        <View style={styles.subPillsRow}>
          <TouchableOpacity
            onPress={() => setActiveCategory('MODULES')}
            style={[
              styles.subPill,
              {
                backgroundColor: activeCategory === 'MODULES' ? tokens.primary : tokens.surface,
                borderColor: activeCategory === 'MODULES' ? tokens.primary : tokens.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.subPillText,
                { color: activeCategory === 'MODULES' ? tokens.white : tokens.textPrimary },
              ]}
            >
              Modules
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveCategory('NOTES')}
            style={[
              styles.subPill,
              {
                backgroundColor: activeCategory === 'NOTES' ? tokens.primary : tokens.surface,
                borderColor: activeCategory === 'NOTES' ? tokens.primary : tokens.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.subPillText,
                { color: activeCategory === 'NOTES' ? tokens.white : tokens.textPrimary },
              ]}
            >
              Notes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveCategory('AMHARIC_NOTE')}
            style={[
              styles.subPill,
              {
                backgroundColor: activeCategory === 'AMHARIC_NOTE' ? tokens.primary : tokens.surface,
                borderColor: activeCategory === 'AMHARIC_NOTE' ? tokens.primary : tokens.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.subPillText,
                { color: activeCategory === 'AMHARIC_NOTE' ? tokens.white : tokens.textPrimary },
              ]}
            >
              Amharic
            </Text>
          </TouchableOpacity>
        </View>

        {/* Blue Info Banner matching preview (4).webp Screen 6 & 9 */}
        <View style={[styles.infoBanner, { backgroundColor: tokens.primarySoft }]}>
          <Text style={[styles.infoBannerTitle, { color: tokens.primary }]}>
            {activeCategory === 'AMHARIC_NOTE'
              ? 'አማርኛ ማስታወሻዎች'
              : activeCategory === 'NOTES'
              ? 'Lecture Notes & Summaries'
              : 'Course Books & Modules'}
          </Text>
          <Text style={[styles.infoBannerSubtitle, { color: tokens.textMuted }]}>
            {activeCategory === 'AMHARIC_NOTE'
              ? `${effectiveBooksList.length} books · offline ready`
              : `Select a book to view chapters · ${effectiveBooksList.length} books`}
          </Text>
        </View>

        {/* Books Cards matching preview (4).webp Screen 6 */}
        <View style={styles.booksList}>
          {effectiveBooksList.map((book, idx) => {
            const rawChapters = chaptersByBookId[book.id] || [];
            const chapterCount = rawChapters.length > 0 ? rawChapters.length : 4;

            return (
              <TouchableOpacity
                key={book.id}
                style={[
                  styles.bookCard,
                  { backgroundColor: tokens.surface, borderColor: tokens.border },
                ]}
                onPress={() => setSelectedBook(book)}
                activeOpacity={0.75}
              >
                <View style={styles.bookCardLeft}>
                  {/* Square Badge e.g. M1, M2, N1 */}
                  <View style={[styles.bookBadgeSquare, { backgroundColor: tokens.badgeBg }]}>
                    <Text style={[styles.bookBadgeLetter, { color: tokens.badgeText }]}>
                      {activeCategory === 'AMHARIC_NOTE' ? 'አ' : activeCategory === 'NOTES' ? 'N' : 'M'}
                      {idx + 1}
                    </Text>
                  </View>

                  <View style={styles.bookCardTextGroup}>
                    <Text style={[styles.bookCardTitle, { color: tokens.textPrimary }]}>
                      {book.title}
                    </Text>
                    <Text style={[styles.bookCardSubtitle, { color: tokens.textMuted }]}>
                      {book.subtitle || 'Standard semester curriculum module'}
                    </Text>
                  </View>
                </View>

                {/* Chapter Count Badge */}
                <View style={[styles.chapterCountPill, { backgroundColor: tokens.primarySoft }]}>
                  <Text style={[styles.chapterCountText, { color: tokens.primary }]}>
                    {chapterCount} Ch
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <LockedContentModal
        visible={!!lockedModalInfo}
        contentTitle={lockedModalInfo?.title}
        courseCode={lockedModalInfo?.code || courseCode}
        onClose={() => setLockedModalInfo(null)}
        onPurchaseCourse={() => {
          setLockedModalInfo(null);
          onNavigateToStore?.();
        }}
        themeMode={themeMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xxl,
  },
  headerBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  topBackArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  courseTitleHeading: {
    fontSize: 20,
    fontWeight: '800',
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
    justifyContent: 'center',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  topTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: STUDENT_THEMES.light.border,
    marginBottom: SPACING.sm,
  },
  topTabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  topTabText: {
    fontSize: 14,
  },
  subPillsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginVertical: SPACING.xs,
  },
  subPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoBanner: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
  },
  infoBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  infoBannerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  booksList: {
    gap: 12,
  },
  bookCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  bookCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bookBadgeSquare: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBadgeLetter: {
    fontSize: 14,
    fontWeight: '800',
  },
  bookCardTextGroup: {
    flex: 1,
  },
  bookCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  bookCardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  chapterCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  chapterCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 14,
  },
  backLinkText: {
    fontSize: 15,
    fontWeight: '700',
  },
  chaptersList: {
    gap: 10,
    marginBottom: 18,
  },
  chapterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  chapterRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  chapterNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterNumberText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chapterTextGroup: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  chapterSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  downloadCourseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  downloadCourseText: {
    fontSize: 13,
    fontWeight: '700',
  },
  readerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  downloadedChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  downloadedChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  readerSubHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  readerTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
    lineHeight: 26,
  },
  readerBody: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  formulaBox: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  formulaText: {
    fontSize: 16,
    fontWeight: '700',
  },
  calloutBox: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 24,
  },
  calloutHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  calloutBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  readerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  backToBookBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToBookText: {
    fontSize: 14,
    fontWeight: '700',
  },
  takeQuizBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takeQuizText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
