import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import { CatalogCourseDto } from '@mastera/contracts';
import {
  RADIUS,
  SPACING,
  STUDENT_THEMES,
  ThemeMode,
} from '@mastera/ui-tokens';
import { ResolvedCatalogRowView } from '../core/database/local-catalog-store';
import { MasteraIcon } from '../shared/components/MasteraIcon';

export interface MyCoursesListScreenProps {
  allScopedCourses: ResolvedCatalogRowView<CatalogCourseDto>[];
  selectedCourseIds: string[];
  departmentLabel: string; // e.g., "Freshman (BDU)"
  initialMode?: 'LIST' | 'ADD_OR_REMOVE';
  onSaveSelectedCourseIds: (nextSelectedIds: string[]) => void;
  onOpenCourseOrPaywall: (courseRow: ResolvedCatalogRowView<CatalogCourseDto>) => void;
  onChangeDepartmentScope: () => void;
  onOpenDownloadsManager?: () => void;
  themeMode?: ThemeMode;
}

export function MyCoursesListScreen({
  allScopedCourses,
  selectedCourseIds,
  departmentLabel,
  initialMode = 'LIST',
  onSaveSelectedCourseIds,
  onOpenCourseOrPaywall,
  onChangeDepartmentScope,
  onOpenDownloadsManager,
  themeMode = 'light',
}: MyCoursesListScreenProps): React.ReactElement {
  const [viewMode, setViewMode] = useState<'LIST' | 'ADD_OR_REMOVE'>(initialMode);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ONGOING' | 'COMPLETED'>('ALL');
  const [semesterFilter, setSemesterFilter] = useState<1 | 2>(1);
  const [searchText, setSearchText] = useState('');
  const [draftCheckedIds, setDraftCheckedIds] = useState<Set<string>>(
    () => new Set(selectedCourseIds)
  );

  useEffect(() => {
    setDraftCheckedIds(new Set(selectedCourseIds));
  }, [selectedCourseIds]);
  const [lockedModalCourse, setLockedModalCourse] = useState<CatalogCourseDto | null>(null);

  const tokens = STUDENT_THEMES[themeMode];

  const toggleDraftCourse = (courseId: string) => {
    setDraftCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  // -------------------------------------------------------------
  // Screen 2 in preview (4).webp: "Add or remove courses"
  // -------------------------------------------------------------
  if (viewMode === 'ADD_OR_REMOVE') {
    const filteredForPicker = allScopedCourses.filter(({ item }) => {
      if (item.semester !== semesterFilter) return false;
      if (
        searchText &&
        !item.title.toLowerCase().includes(searchText.toLowerCase()) &&
        !item.code.toLowerCase().includes(searchText.toLowerCase())
      ) {
        return false;
      }
      return true;
    });

    return (
      <View style={[styles.container, { backgroundColor: tokens.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header back button */}
          <TouchableOpacity
            onPress={() => setViewMode('LIST')}
            style={styles.headerBackBtn}
            activeOpacity={0.7}
          >
            <MasteraIcon name="chevron-left" size={20} color={tokens.textPrimary} />
            <Text style={[styles.screenHeading, { color: tokens.textPrimary }]}>
              Add or remove courses
            </Text>
          </TouchableOpacity>

          {/* Search Bar */}
          <View
            style={[
              styles.searchBar,
              { backgroundColor: tokens.surface, borderColor: tokens.border },
            ]}
          >
            <MasteraIcon name="search" size={16} color={tokens.textMuted} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search courses..."
              placeholderTextColor={tokens.textMuted}
              style={[styles.searchInput, { color: tokens.textPrimary }]}
            />
          </View>

          {/* Semester Switcher */}
          <View style={styles.semesterTabs}>
            {([1, 2] as const).map((sem) => {
              const isSelected = semesterFilter === sem;
              return (
                <TouchableOpacity
                  key={sem}
                  onPress={() => setSemesterFilter(sem)}
                  style={[
                    styles.semesterBtn,
                    {
                      backgroundColor: isSelected ? tokens.primary : tokens.surface,
                      borderColor: isSelected ? tokens.primary : tokens.border,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.semesterBtnText,
                      { color: isSelected ? tokens.white : tokens.textPrimary },
                    ]}
                  >
                    Semester {sem}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Courses checkbox list */}
          <View style={styles.courseList}>
            {filteredForPicker.map(({ item }) => {
              const checked = draftCheckedIds.has(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => toggleDraftCourse(item.id)}
                  style={[
                    styles.pickerRow,
                    {
                      backgroundColor: tokens.surface,
                      borderColor: checked ? tokens.primary : tokens.border,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <View style={styles.pickerRowLeft}>
                    <View
                      style={[
                        styles.badgeSquare,
                        {
                          backgroundColor: tokens.badgeBg,
                        },
                      ]}
                    >
                      <Text style={[styles.badgeLetter, { color: tokens.badgeText }]}>
                        {item.title.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.pickerInfo}>
                      <Text style={[styles.courseCardTitle, { color: tokens.textPrimary }]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.courseCardSubtitle, { color: tokens.textMuted }]}>
                        {item.code} · {item.stream} · Semester {item.semester}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.checkboxCircle,
                      {
                        backgroundColor: checked ? tokens.primary : 'transparent',
                        borderColor: checked ? tokens.primary : tokens.border,
                      },
                    ]}
                  >
                    {checked && <MasteraIcon name="check-circle" size={16} color={tokens.white} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={() => {
              onSaveSelectedCourseIds(Array.from(draftCheckedIds));
              setViewMode('LIST');
            }}
            style={[styles.saveBtn, { backgroundColor: tokens.primary }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.saveBtnText, { color: tokens.white }]}>
              Save Enrolled Courses ({draftCheckedIds.size})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // -------------------------------------------------------------
  // Screen 4 in preview (4).webp: "My Courses" Dashboard View
  // -------------------------------------------------------------
  const filteredCourses = allScopedCourses.filter(({ item }) => {
    if (searchText) {
      const q = searchText.toLowerCase();
      if (!item.title.toLowerCase().includes(q) && !item.code.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (activeTab === 'ONGOING') {
      return selectedCourseIds.includes(item.id);
    }
    if (activeTab === 'COMPLETED') {
      return false; // local fresh state
    }
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: tokens.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Title */}
        <View style={styles.headerRow}>
          <Text style={[styles.pageTitle, { color: tokens.textPrimary }]}>My Courses</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {onOpenDownloadsManager && (
              <TouchableOpacity
                style={[styles.filterBtn, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                onPress={onOpenDownloadsManager}
                activeOpacity={0.7}
              >
                <MasteraIcon name="download" size={18} color={tokens.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.filterBtn, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
              onPress={onChangeDepartmentScope}
              activeOpacity={0.7}
            >
              <MasteraIcon name="sliders" size={18} color={tokens.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Input */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: tokens.surface, borderColor: tokens.border },
          ]}
        >
          <MasteraIcon name="search" size={16} color={tokens.textMuted} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search your courses..."
            placeholderTextColor={tokens.textMuted}
            style={[styles.searchInput, { color: tokens.textPrimary }]}
          />
        </View>

        {/* Tabs: All | Ongoing | Completed */}
        <View style={styles.pillsRow}>
          {(['ALL', 'ONGOING', 'COMPLETED'] as const).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
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

        {/* Department Info Line with Change link */}
        <View style={styles.deptInfoRow}>
          <Text style={[styles.deptInfoText, { color: tokens.textMuted }]}>
            Department: {departmentLabel || 'Freshman (AASTU)'}
          </Text>
          <TouchableOpacity onPress={onChangeDepartmentScope} activeOpacity={0.7}>
            <Text style={[styles.changeLink, { color: tokens.primary }]}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Course Cards matching preview (4).webp Screen 4 */}
        <View style={styles.courseList}>
          {filteredCourses.map((courseRow) => {
            const { item, accessBadge } = courseRow;
            const isIncluded = accessBadge === 'Included';
            const isFree = accessBadge === 'Free';
            const isLocked = accessBadge === 'Locked';

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.courseCard,
                  { backgroundColor: tokens.surface, borderColor: tokens.border },
                ]}
                onPress={() => {
                  if (isLocked) {
                    setLockedModalCourse(item);
                  } else {
                    onOpenCourseOrPaywall(courseRow);
                  }
                }}
                activeOpacity={0.75}
              >
                <View style={styles.courseCardLeft}>
                  <View style={[styles.badgeSquare, { backgroundColor: tokens.badgeBg }]}>
                    <Text style={[styles.badgeLetter, { color: tokens.badgeText }]}>
                      {item.title.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.courseCardTextGroup}>
                    <Text style={[styles.courseCardTitle, { color: tokens.textPrimary }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.courseCardSubtitle, { color: tokens.textMuted }]}>
                      {item.stream} · Semester {item.semester}
                    </Text>
                  </View>
                </View>

                {/* Badge Pill: Included | Free | Locked */}
                <View
                  style={[
                    styles.badgePill,
                    {
                      backgroundColor: isIncluded
                        ? tokens.primarySoft
                        : isFree
                        ? tokens.amberSoft
                        : tokens.ink,
                    },
                  ]}
                >
                  {isLocked && (
                    <MasteraIcon name="lock" size={11} color={tokens.white} />
                  )}
                  <Text
                    style={[
                      styles.badgePillText,
                      {
                        color: isIncluded
                          ? tokens.primary
                          : isFree
                          ? tokens.amber
                          : tokens.white,
                      },
                    ]}
                  >
                    {accessBadge}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Add or remove courses Button matching preview (4).webp Screen 4 */}
        <TouchableOpacity
          onPress={() => setViewMode('ADD_OR_REMOVE')}
          style={[
            styles.addRemoveCoursesBtn,
            { borderColor: tokens.primary, backgroundColor: tokens.surface },
          ]}
          activeOpacity={0.7}
        >
          <MasteraIcon name="plus" size={16} color={tokens.primary} />
          <Text style={[styles.addRemoveCoursesText, { color: tokens.primary }]}>
            + Add or remove courses
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Screen 5: Locked Content Bottom Sheet Modal matching preview (4).webp */}
      <Modal
        visible={!!lockedModalCourse}
        transparent
        animationType="slide"
        onRequestClose={() => setLockedModalCourse(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: tokens.surface }]}>
            {/* Lock Amber Circle */}
            <View style={[styles.lockIconCircle, { backgroundColor: tokens.amberSoft }]}>
              <MasteraIcon name="lock" size={26} color={tokens.amber} />
            </View>

            <Text style={[styles.modalTitle, { color: tokens.textPrimary }]}>
              Locked Content
            </Text>
            <Text style={[styles.modalSubtitle, { color: tokens.textMuted }]}>
              You can't access this course.
            </Text>
            <Text style={[styles.modalDesc, { color: tokens.textPrimary }]}>
              {lockedModalCourse?.title || 'This course'} is locked. Purchase a course or semester
              bundle to unlock all modules, notes, Amharic notes, quizzes, and university exams.
            </Text>

            <TouchableOpacity
              onPress={() => {
                setLockedModalCourse(null);
                // navigate to store / purchase
              }}
              style={[styles.modalPrimaryBtn, { backgroundColor: tokens.primary }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.modalPrimaryBtnText, { color: tokens.white }]}>
                Purchase Course
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setLockedModalCourse(null)}
              style={styles.modalCancelBtn}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalCancelBtnText, { color: tokens.textMuted }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  screenHeading: {
    fontSize: 18,
    fontWeight: '800',
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
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
  deptInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  deptInfoText: {
    fontSize: 12,
  },
  changeLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  courseList: {
    gap: 10,
    marginBottom: 18,
  },
  courseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  courseCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  badgeSquare: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLetter: {
    fontSize: 16,
    fontWeight: '800',
  },
  courseCardTextGroup: {
    flex: 1,
  },
  courseCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  courseCardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  addRemoveCoursesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 6,
  },
  addRemoveCoursesText: {
    fontSize: 13,
    fontWeight: '700',
  },
  semesterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  semesterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  semesterBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  pickerRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pickerInfo: {
    flex: 1,
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
    alignItems: 'center',
  },
  lockIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 10,
  },
  modalDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalPrimaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalCancelBtn: {
    paddingVertical: 10,
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
