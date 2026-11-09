import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { RADIUS, SPACING, STUDENT_THEMES, ThemeMode } from '@mastera/ui-tokens';
import { MasteraIcon } from './MasteraIcon';

export interface LockedContentModalProps {
  visible: boolean;
  contentTitle?: string | undefined;
  courseCode?: string | undefined;
  onClose: () => void;
  onPurchaseCourse: () => void;
  themeMode?: ThemeMode | undefined;
}

/**
 * Locked Content Modal matching preview (4).webp Design 5
 * Appears when students attempt to open or download locked chapters, courses, or assessments.
 */
export function LockedContentModal({
  visible,
  contentTitle = 'This Chapter',
  courseCode,
  onClose,
  onPurchaseCourse,
  themeMode = 'light',
}: LockedContentModalProps): React.ReactElement | null {
  if (!visible) return null;
  const tokens = STUDENT_THEMES[themeMode];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.modalCard,
            { backgroundColor: tokens.surface, borderColor: tokens.border },
          ]}
        >
          {/* Header with Title and Close Icon */}
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: tokens.primarySoft },
                ]}
              >
                <MasteraIcon name="lock" size={20} color={tokens.primary} />
              </View>
              <View style={styles.titleTextContainer}>
                <Text
                  style={[styles.modalTitle, { color: tokens.textPrimary }]}
                >
                  Locked Content
                </Text>
                <Text
                  style={[styles.modalSubtitle, { color: tokens.textMuted }]}
                >
                  You cannot access this content
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MasteraIcon
                name="x-circle"
                size={20}
                color={tokens.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Body Text matching preview (4).webp Design 5 */}
          <View
            style={[
              styles.messageBox,
              {
                backgroundColor: tokens.background,
                borderColor: tokens.border,
              },
            ]}
          >
            <Text
              style={[styles.messageText, { color: tokens.textPrimary }]}
            >
              <Text style={styles.boldSnippet}>
                {courseCode ? `${courseCode}: ` : ''}
                {contentTitle}
              </Text>{' '}
              is locked. Activate or purchase this course or a semester
              bundle to unlock full modules, lecture notes, Amharic
              explanations, quizzes, and university exams.
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsCol}>
            <TouchableOpacity
              onPress={() => {
                onClose();
                onPurchaseCourse();
              }}
              style={[
                styles.purchaseBtn,
                { backgroundColor: tokens.primary },
              ]}
              activeOpacity={0.8}
            >
              <MasteraIcon
                name="shopping-bag"
                size={18}
                color={tokens.surface}
              />
              <Text
                style={[styles.purchaseBtnText, { color: tokens.surface }]}
              >
                Purchase Course
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: tokens.surface,
                  borderColor: tokens.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.cancelBtnText, { color: tokens.textMuted }]}
              >
                Dismiss
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleTextContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  messageBox: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  boldSnippet: {
    fontWeight: '700',
  },
  actionsCol: {
    flexDirection: 'column',
    gap: SPACING.sm,
  },
  purchaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  purchaseBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
