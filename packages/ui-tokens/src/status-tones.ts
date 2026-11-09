/**
 * Admin Portal shared status tones (Section 10.8, D31):
 * - Published, Approved, Active, Downloaded -> success
 * - Pending, Expiring -> warning
 * - Rejected, Expired, Failed -> danger
 * - Draft, Inactive, Offline -> neutral
 * - Free -> primary
 * - Locked -> neutral with lock icon
 */
export type SemanticTone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'primary';

export type UnifiedStatusKey =
  | 'PUBLISHED'
  | 'APPROVED'
  | 'ACTIVE'
  | 'DOWNLOADED'
  | 'PENDING'
  | 'EXPIRING'
  | 'REJECTED'
  | 'EXPIRED'
  | 'FAILED'
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'INACTIVE'
  | 'OFFLINE'
  | 'FREE'
  | 'LOCKED';

export interface StatusToneDefinition {
  tone: SemanticTone;
  requiresLockIcon: boolean;
}

export const STATUS_TONE_MAP: Record<UnifiedStatusKey, StatusToneDefinition> = {
  PUBLISHED: { tone: 'success', requiresLockIcon: false },
  APPROVED: { tone: 'success', requiresLockIcon: false },
  ACTIVE: { tone: 'success', requiresLockIcon: false },
  DOWNLOADED: { tone: 'success', requiresLockIcon: false },
  PENDING: { tone: 'warning', requiresLockIcon: false },
  IN_REVIEW: { tone: 'warning', requiresLockIcon: false },
  EXPIRING: { tone: 'warning', requiresLockIcon: false },
  REJECTED: { tone: 'danger', requiresLockIcon: false },
  EXPIRED: { tone: 'danger', requiresLockIcon: false },
  FAILED: { tone: 'danger', requiresLockIcon: false },
  DRAFT: { tone: 'neutral', requiresLockIcon: false },
  INACTIVE: { tone: 'neutral', requiresLockIcon: false },
  OFFLINE: { tone: 'neutral', requiresLockIcon: false },
  FREE: { tone: 'primary', requiresLockIcon: false },
  LOCKED: { tone: 'neutral', requiresLockIcon: true },
};

/**
 * Student App Two-Part Badge Vocabulary (DR-04, Section 8.2, 9.4, 9.15):
 * 1. AccessBadgeType: communicates entitlement & offline availability
 * 2. ActionChipType: communicates progress / immediate action on chapter/set rows
 */
export type StudentAccessBadgeType =
  | 'Free'
  | 'Paid'
  | 'Locked'
  | 'Downloaded'
  | 'Download'
  | 'Included'
  | 'Not available offline'
  | 'Pending verification'
  | 'Expiring'
  | 'Expired';

export type StudentActionChipType = 'Open' | 'Start' | 'Resume' | 'Done';
