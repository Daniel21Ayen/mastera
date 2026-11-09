import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import {
  RADIUS,
  SPACING,
  STUDENT_THEMES,
  ThemeMode,
} from '@mastera/ui-tokens';
import { DownloadedCourseEntry } from '../core/downloads/encrypted-download-manager';
import { MasteraIcon } from '../shared/components/MasteraIcon';
import { LockedContentModal } from '../shared/components/LockedContentModal';

export interface DownloadItemEntry {
  id: string;
  title: string;
  code?: string;
  type: 'COURSE' | 'CHAPTER';
  sizeMB: number;
  isDownloaded: boolean;
  isLocked: boolean;
  parentCourseTitle?: string;
}

export interface DownloadManagerScreenProps {
  downloads?: DownloadedCourseEntry[];
  allItems?: DownloadItemEntry[];
  totalUsedMB: number;
  freeSpaceGBLabel: string; // e.g., "9.2 GB free on this phone"
  wifiOnly: boolean;
  onToggleWifiOnly: (enabled: boolean) => void;
  onDownloadItem?: (itemId: string, type: 'COURSE' | 'CHAPTER') => void;
  onDeleteDownloadItem?: (itemId: string, type: 'COURSE' | 'CHAPTER') => void;
  onUpdateCourse: (courseId: string) => void;
  onConfirmDeleteDownload: (courseId: string) => void;
  onOpenStore?: () => void;
  onBack: () => void;
  themeMode?: ThemeMode;
}

export function DownloadManagerScreen({
  downloads = [],
  allItems,
  totalUsedMB,
  freeSpaceGBLabel,
  wifiOnly,
  onToggleWifiOnly,
  onDownloadItem,
  onDeleteDownloadItem,
  onUpdateCourse,
  onConfirmDeleteDownload,
  onOpenStore,
  onBack,
  themeMode = 'light',
}: DownloadManagerScreenProps): React.ReactElement {
  const [coursePendingDelete, setCoursePendingDelete] = useState<{
    id: string;
    title: string;
    sizeMB: number;
    type: 'COURSE' | 'CHAPTER';
  } | null>(null);

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DOWNLOADED' | 'AVAILABLE'>('ALL');
  const [lockedModalItem, setLockedModalItem] = useState<{
    title: string;
    code?: string | undefined;
  } | null>(null);

  const tokens = STUDENT_THEMES[themeMode];

  // Default entries if allItems is not provided
  const items: DownloadItemEntry[] = allItems ?? [
    {
      id: 'c-eng',
      title: 'Communicative English',
      code: 'FLEn 1011',
      type: 'COURSE',
      sizeMB: 18,
      isDownloaded: true,
      isLocked: false,
    },
    {
      id: 'ch-eng-1',
      title: 'Chapter 1: Foundations & Overview',
      type: 'CHAPTER',
      sizeMB: 4,
      isDownloaded: true,
      isLocked: false,
      parentCourseTitle: 'Communicative English',
    },
    {
      id: 'ch-eng-2',
      title: 'Chapter 2: Academic Reading Skills',
      type: 'CHAPTER',
      sizeMB: 5,
      isDownloaded: true,
      isLocked: false,
      parentCourseTitle: 'Communicative English',
    },
    {
      id: 'c-calc',
      title: 'Calculus I',
      code: 'Math 1011',
      type: 'COURSE',
      sizeMB: 22,
      isDownloaded: true,
      isLocked: false,
    },
    {
      id: 'c-phys',
      title: 'General Physics',
      code: 'Phys 1011',
      type: 'COURSE',
      sizeMB: 20,
      isDownloaded: false,
      isLocked: false,
    },
    {
      id: 'c-prog',
      title: 'Introduction to Computer Programming',
      code: 'CoSc 1011',
      type: 'COURSE',
      sizeMB: 24,
      isDownloaded: false,
      isLocked: false,
    },
    {
      id: 'c-logic',
      title: 'Logic & Critical Thinking',
      code: 'Phil 1011',
      type: 'COURSE',
      sizeMB: 16,
      isDownloaded: false,
      isLocked: true,
    },
    {
      id: 'ch-logic-1',
      title: 'Chapter 1: Logic & Arguments',
      code: 'Phil 1011',
      type: 'CHAPTER',
      sizeMB: 4,
      isDownloaded: false,
      isLocked: true,
      parentCourseTitle: 'Logic & Critical Thinking',
    },
  ];

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'DOWNLOADED') return item.isDownloaded;
    if (activeFilter === 'AVAILABLE') return !item.isDownloaded;
    return true;
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tokens.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerBackRow}>
        <TouchableOpacity
          onPress={onBack}
          style={[
            styles.backBtnSquircle,
            { backgroundColor: tokens.surface, borderColor: tokens.border },
          ]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <MasteraIcon name="chevron-left" size={20} color={tokens.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tokens.textPrimary }]}>
          Downloads & Storage
        </Text>
      </View>

      {/* Storage Usage Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: tokens.surface, borderColor: tokens.border },
        ]}
      >
        <View style={styles.rowBetween}>
          <Text style={[styles.boldText, { color: tokens.textPrimary }]}>
            {totalUsedMB} MB used on this phone
          </Text>
          <Text style={[styles.subText, { color: tokens.textMuted }]}>
            {items.filter((i) => i.isDownloaded && i.type === 'COURSE').length} courses offline
          </Text>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: tokens.border }]}>
          <View
            style={[
              styles.progressFill,
              { width: '28%', backgroundColor: tokens.primary },
            ]}
          />
        </View>

        <Text style={[styles.subText, { color: tokens.textMuted }]}>
          {freeSpaceGBLabel}
        </Text>
      </View>

      {/* Network Download Preferences Toggle */}
      <View
        style={[
          styles.toggleCard,
          { backgroundColor: tokens.surface, borderColor: tokens.border },
        ]}
      >
        <View style={{ flex: 1, paddingRight: SPACING.md }}>
          <Text style={[styles.boldText, { color: tokens.textPrimary }]}>
            Download over Wi-Fi or Cellular Data
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: tokens.textMuted,
              marginTop: 2,
              lineHeight: 15,
            }}
          >
            Allow downloads using mobile data when Wi-Fi is unavailable.
          </Text>
        </View>
        <Switch
          value={!wifiOnly}
          onValueChange={(allowCellular: boolean) => onToggleWifiOnly(!allowCellular)}
          trackColor={{ false: tokens.border, true: tokens.primary }}
          thumbColor={tokens.surface}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(
          [
            { key: 'ALL', label: 'All Content' },
            { key: 'DOWNLOADED', label: 'Downloaded' },
            { key: 'AVAILABLE', label: 'Available to Download' },
          ] as const
        ).map((tab) => {
          const isSelected = activeFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveFilter(tab.key)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: isSelected ? tokens.primary : tokens.surface,
                  borderColor: isSelected ? tokens.primary : tokens.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: isSelected ? tokens.white : tokens.textPrimary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Unified Dynamic Download/Delete List */}
      <View style={styles.listCol}>
        {filteredItems.map((item) => {
          return (
            <View
              key={item.id}
              style={[
                styles.itemRow,
                { backgroundColor: tokens.surface, borderColor: tokens.border },
              ]}
            >
              <View style={styles.itemInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.itemTitle, { color: tokens.textPrimary }]}>
                    {item.title}
                  </Text>
                  {item.type === 'COURSE' && (
                    <View
                      style={{
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                        borderRadius: RADIUS.sm,
                        backgroundColor: tokens.primarySoft,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: '700',
                          color: tokens.primary,
                        }}
                      >
                        COURSE
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.itemMeta, { color: tokens.textMuted }]}>
                  {item.parentCourseTitle ? `${item.parentCourseTitle} · ` : ''}
                  {item.sizeMB} MB ·{' '}
                  {item.isLocked
                    ? 'Requires bundle (Locked)'
                    : item.isDownloaded
                    ? 'Saved offline'
                    : 'Ready to download'}
                </Text>
              </View>

              {/* Dynamic Action Buttons */}
              <View style={styles.actionsGroup}>
                {item.isLocked ? (
                  <TouchableOpacity
                    onPress={() =>
                      setLockedModalItem({
                        title: item.title,
                        code: item.code,
                      })
                    }
                    style={[
                      styles.lockedBadge,
                      { backgroundColor: tokens.background, borderColor: tokens.border },
                    ]}
                    activeOpacity={0.7}
                  >
                    <MasteraIcon name="lock" size={14} color={tokens.textMuted} />
                    <Text style={[styles.actionBtnText, { color: tokens.textMuted }]}>
                      Locked
                    </Text>
                  </TouchableOpacity>
                ) : item.isDownloaded ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                    <View
                      style={[
                        styles.readyBadge,
                        { backgroundColor: tokens.primarySoft },
                      ]}
                    >
                      <MasteraIcon name="check-circle" size={13} color={tokens.primary} />
                      <Text style={[styles.readyBadgeText, { color: tokens.primary }]}>
                        Ready
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() =>
                        setCoursePendingDelete({
                          id: item.id,
                          title: item.title,
                          sizeMB: item.sizeMB,
                          type: item.type,
                        })
                      }
                      style={[
                        styles.trashBtn,
                        { borderColor: tokens.danger, backgroundColor: tokens.surface },
                      ]}
                      activeOpacity={0.7}
                    >
                      <MasteraIcon name="trash-2" size={15} color={tokens.danger} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => onDownloadItem?.(item.id, item.type)}
                    style={[
                      styles.downloadActionBtn,
                      { backgroundColor: tokens.primary },
                    ]}
                    activeOpacity={0.7}
                  >
                    <MasteraIcon name="download" size={14} color={tokens.surface} />
                    <Text style={[styles.downloadActionBtnText, { color: tokens.surface }]}>
                      Download
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Delete Confirmation Card */}
      {coursePendingDelete && (
        <View
          style={[
            styles.deleteCard,
            { backgroundColor: tokens.surface, borderColor: tokens.danger },
          ]}
        >
          <Text style={[styles.deleteTitle, { color: tokens.textPrimary }]}>
            Delete download?
          </Text>
          <Text style={[styles.deleteDesc, { color: tokens.textMuted }]}>
            "{coursePendingDelete.title}" ({coursePendingDelete.sizeMB} MB) will be removed
            from your phone's offline storage. Your course enrollment remains active and you
            can download it again anytime over Wi-Fi or mobile data.
          </Text>

          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <TouchableOpacity
              onPress={() => setCoursePendingDelete(null)}
              style={[
                styles.cancelBtn,
                { borderColor: tokens.border, backgroundColor: tokens.surface, flex: 1 },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelBtnText, { color: tokens.textPrimary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (coursePendingDelete.type === 'COURSE') {
                  onConfirmDeleteDownload(coursePendingDelete.id);
                }
                onDeleteDownloadItem?.(
                  coursePendingDelete.id,
                  coursePendingDelete.type
                );
                setCoursePendingDelete(null);
              }}
              style={[
                styles.deleteBtn,
                { backgroundColor: tokens.danger, flex: 1 },
              ]}
              activeOpacity={0.8}
            >
              <Text style={[styles.deleteBtnText, { color: tokens.surface }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Locked Content Modal matching preview (4).webp Design 5 */}
      <LockedContentModal
        visible={!!lockedModalItem}
        contentTitle={lockedModalItem?.title}
        courseCode={lockedModalItem?.code}
        onClose={() => setLockedModalItem(null)}
        onPurchaseCourse={() => {
          setLockedModalItem(null);
          onOpenStore?.();
        }}
        themeMode={themeMode}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  headerBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACING.md,
  },
  backBtnSquircle: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  card: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  boldText: {
    fontWeight: '700',
    fontSize: 13,
  },
  subText: {
    fontSize: 11,
  },
  progressTrack: {
    height: 6,
    borderRadius: RADIUS.pill,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.pill,
  },
  toggleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  listCol: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  itemInfo: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemMeta: {
    fontSize: 11,
    marginTop: 3,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  readyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  trashBtn: {
    padding: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  downloadActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deleteCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    marginTop: SPACING.sm,
  },
  deleteTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  deleteDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  deleteBtn: {
    height: 42,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cancelBtn: {
    height: 42,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
