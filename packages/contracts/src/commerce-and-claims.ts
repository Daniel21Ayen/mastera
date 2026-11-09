import { StudentProfileInputDto } from './roles-and-auth';

export type BundleProductType =
  | 'SEMESTER_BUNDLE'
  | 'BATCH_BUNDLE'
  | 'FULL_COURSE_BUNDLE';

export type OrderProductType =
  | BundleProductType
  | 'BOTH_STREAMS_PACKAGE'
  | 'EXTRA_SINGLE_COURSE';

export type PricingMode = 'CALCULATED' | 'FIXED';

export interface ExtraCourseTierRuleDto {
  fromOrdinal: number; // 1-based ordinal position within the order (D37)
  toOrdinal: number | null; // null means unbounded (e.g., #6 and above)
  unitPriceETB: number;
}

export interface BundleProductConfigDto {
  productType: BundleProductType;
  enabled: boolean;
  minCourses: number;
  maxCourses: number;
  pricingMode: PricingMode;
  discountPercent: number; // 0-100
  fixedPriceETB: number;
  durationDays: number;
  unlocksSingleCourses: boolean;
  includesCommonCourses: boolean;
  includesCocAndExams: boolean;
}

export interface PaymentMethodEntryDto {
  id: string;
  providerName: string; // e.g., CBE Mobile Banking, Telebirr, CBE Birr
  accountHolderName: string;
  accountNumberOrCode: string;
  instructions: string;
  isActive: boolean;
}

export interface PaymentSettingsDto {
  configVersion: number;
  singleCoursesEnabled: boolean;
  renewalWindowDays: number; // Default 14 (DR-11)
  quoteExpiryMinutes: number;
  maxReceiptSizeBytes: number; // Default 300 KB (307200 bytes)
  bundles: Record<BundleProductType, BundleProductConfigDto>;
  bothStreamsPriceETB: number;
  bothStreamsDurationDays: number;
  extraCourseTiers: ExtraCourseTierRuleDto[];
  paymentMethods: PaymentMethodEntryDto[];
}

export interface PriceQuoteItemBreakdownDto {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  ordinalPosition: number;
  appliedUnitPriceETB: number;
  tierLabel: string;
}

export interface PriceQuoteRequestDto {
  productType: OrderProductType;
  selectedCourseIds: string[];
  studentId?: string;
}

export interface PriceQuoteDto {
  quoteId: string;
  productType: OrderProductType;
  uniqueCourseCount: number;
  perCourseBreakdown: PriceQuoteItemBreakdownDto[];
  baseAmountETB: number;
  discountAmountETB: number;
  totalAmountETB: number;
  durationDays: number;
  settingsVersion: number;
  expiresAt: string;
}

export interface SubmitOrderWithLocalDto {
  localAccountId: string; // UUID idempotency key (REG-02, REG-10)
  profile: StudentProfileInputDto;
  passwordPlaintextOverTls: string; // Re-entered at first purchase (FR-A07)
  claimSecretHash: string; // SHA-256 hex of 32-byte URL-safe claimSecret
  deviceHardwareId: string;
  quoteId: string;
  productType: OrderProductType;
  selectedCourseIds: string[];
  paymentMethodId: string;
  transactionReference: string;
}

export type OrderStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface OrderResultDto {
  orderId: string;
  status: OrderStatus;
  amountSnapshotETB: number;
  rejectionReason?: string | null;
  claimReady: boolean;
  submittedAt: string;
}

export interface ClaimOrderDto {
  claimSecret: string; // Original 32-byte URL-safe secret (Section 5.4)
  deviceHardwareId: string;
}

export interface EntitlementRecordDto {
  id: string;
  orderId: string;
  courseId: string;
  productType: OrderProductType;
  startsAt: string; // Approval timestamp (D38)
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

export interface ClaimOrderResponseDto {
  studentId: string;
  studentCode: string; // Gapless MS0001+ (FR-G45)
  localAccountId: string;
  accessToken: string;
  refreshToken: string;
  entitlements: EntitlementRecordDto[];
  signedEntitlementToken: string;
  serverTimestamp: string;
}

export interface SignedEntitlementTokenPayloadDto {
  studentId: string;
  studentCode: string;
  deviceHardwareId: string;
  issuedAtServerTime: string;
  tokenExpiresAt: string;
  courseExpiries: Record<string, string>; // courseId -> ISO expiresAt
}

export type RefundStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAID_OUT'
  | 'ENTITLEMENT_REVOKED';

export interface RefundRecordDto {
  id: string;
  orderId: string;
  amountETB: number;
  status: RefundStatus;
  reason: string;
  requestedByAdminId: string;
  approvedByAdminId: string | null;
  payoutReference: string | null;
  createdAt: string;
  updatedAt: string;
}