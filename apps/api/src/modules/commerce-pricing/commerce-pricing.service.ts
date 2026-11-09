import { Injectable } from '@nestjs/common';
import {
  BundleProductType,
  CatalogCourseDto,
  EntitlementRecordDto,
  mastera_ERROR_CODES,
  PaymentMethodEntryDto,
  PaymentSettingsDto,
  PriceQuoteDto,
  PriceQuoteItemBreakdownDto,
  PriceQuoteRequestDto,
} from '@mastera/contracts';
import {
  calculateBundlePrice,
  calculateExtraCoursePrice,
  canPurchaseSingleCourse,
  validateBundleSelection,
} from '@mastera/domain';
import { AuditService } from '../audit-reports/audit.service';
import {
  AuthenticatedAdminContext,
  ScopeAuthorizationService,
} from '../permissions/scope.service';

export function createDefaultPaymentSettings(): PaymentSettingsDto {
  return {
    configVersion: 1,
    singleCoursesEnabled: true,
    renewalWindowDays: 14, // DR-11 default 14 days
    quoteExpiryMinutes: 60,
    maxReceiptSizeBytes: 300 * 1024, // 300 KB default (Section 3.2)
    bundles: {
      SEMESTER_BUNDLE: {
        productType: 'SEMESTER_BUNDLE',
        enabled: true,
        minCourses: 7, // Section 3.2: 7-10 default for semester bundle
        maxCourses: 10,
        pricingMode: 'FIXED',
        discountPercent: 0,
        fixedPriceETB: 200, // Section 6.1: 200 ETB fixed default
        durationDays: 150,
        unlocksSingleCourses: true,
        includesCommonCourses: true,
        includesCocAndExams: true,
      },
      BATCH_BUNDLE: {
        productType: 'BATCH_BUNDLE',
        enabled: true,
        minCourses: 3,
        maxCourses: 8,
        pricingMode: 'CALCULATED',
        discountPercent: 15,
        fixedPriceETB: 150,
        durationDays: 150,
        unlocksSingleCourses: true,
        includesCommonCourses: true,
        includesCocAndExams: false,
      },
      FULL_COURSE_BUNDLE: {
        productType: 'FULL_COURSE_BUNDLE',
        enabled: true,
        minCourses: 7,
        maxCourses: 24,
        pricingMode: 'FIXED',
        discountPercent: 0,
        fixedPriceETB: 350, // Section 6.1: 350 ETB per stream default
        durationDays: 365,
        unlocksSingleCourses: true,
        includesCommonCourses: true,
        includesCocAndExams: true,
      },
    },
    bothStreamsPriceETB: 700, // 2 x 350 default (Section 6.1)
    bothStreamsDurationDays: 365,
    extraCourseTiers: [
      { fromOrdinal: 1, toOrdinal: 1, unitPriceETB: 100 },
      { fromOrdinal: 2, toOrdinal: 5, unitPriceETB: 50 },
      { fromOrdinal: 6, toOrdinal: null, unitPriceETB: 40 },
    ],
    paymentMethods: [
      {
        id: 'pm-cbe-mobile',
        providerName: 'CBE Mobile Banking',
        accountHolderName: 'mastera Education PLC',
        accountNumberOrCode: '1000123456789',
        instructions: 'Transfer the exact amount and upload the digital receipt screenshot.',
        isActive: true,
      },
      {
        id: 'pm-telebirr',
        providerName: 'Telebirr',
        accountHolderName: 'mastera Education PLC',
        accountNumberOrCode: 'TB-123456',
        instructions: 'Pay via Telebirr merchant ID and upload the confirmation screen.',
        isActive: true,
      },
      {
        id: 'pm-cbe-birr',
        providerName: 'CBE Birr',
        accountHolderName: 'mastera Education PLC',
        accountNumberOrCode: '0911223344',
        instructions: 'Send via CBE Birr agent/wallet and attach the receipt.',
        isActive: true,
      },
    ],
  };
}

export interface CommercePricingPort {
  getActiveSettings(): Promise<PaymentSettingsDto>;
  saveSettings(nextSettings: PaymentSettingsDto): Promise<PaymentSettingsDto>;
  findCoursesByIds(courseIds: string[]): Promise<CatalogCourseDto[]>;
  getActiveStudentEntitlements(studentId: string): Promise<EntitlementRecordDto[]>;
  saveQuote(quote: PriceQuoteDto): Promise<void>;
  findQuoteById(quoteId: string): Promise<PriceQuoteDto | null>;
}

@Injectable()
export class CommercePricingService {
  constructor(
    private readonly port: CommercePricingPort,
    private readonly scopeAuth: ScopeAuthorizationService,
    private readonly auditService: AuditService
  ) {}

  async getPublicPaymentSettings(): Promise<PaymentSettingsDto> {
    return this.port.getActiveSettings();
  }

  /**
   * Super Admin updates pricing, bundle limits, tiers, durations, or single-course toggle.
   * Validates Section 6.2 invariants and logs an immutable audit record with reason.
   */
  async updatePaymentSettings(
    actor: AuthenticatedAdminContext,
    nextConfig: Omit<PaymentSettingsDto, 'configVersion'>,
    reason: string
  ): Promise<PaymentSettingsDto> {
    const decision = await this.scopeAuth.authorizeAdminAction(
      actor,
      'COMMERCE_SETTINGS_MANAGE'
    );
    if (!decision.allowed) {
      throw new Error(`${decision.errorCode}: ${decision.reason}`);
    }

    this.validateSettingsInvariants(nextConfig);

    const previous = await this.port.getActiveSettings();
    const updated: PaymentSettingsDto = {
      ...nextConfig,
      configVersion: previous.configVersion + 1,
    };

    const saved = await this.port.saveSettings(updated);

    await this.auditService.recordReasonRequiredMutation({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'COMMERCE_PRICING_CONFIG_UPDATED',
      resourceType: 'PRICING_CONFIG',
      resourceId: `v${saved.configVersion}`,
      reason,
      previousValue: { ...previous },
      newValue: { ...saved },
    });

    return saved;
  }

  async addPaymentMethod(
    actor: AuthenticatedAdminContext,
    method: PaymentMethodEntryDto,
    reason?: string
  ): Promise<PaymentMethodEntryDto[]> {
    const current = await this.port.getActiveSettings();
    const existing = current.paymentMethods || [];
    const nextMethods = [...existing.filter((m) => m.id !== method.id), method];
    const updated = await this.updatePaymentSettings(
      actor,
      { ...current, paymentMethods: nextMethods },
      reason || `Added payment method ${method.providerName}`
    );
    return updated.paymentMethods;
  }

  async updatePaymentMethod(
    actor: AuthenticatedAdminContext,
    methodId: string,
    updates: Partial<PaymentMethodEntryDto>,
    reason?: string
  ): Promise<PaymentMethodEntryDto[]> {
    const current = await this.port.getActiveSettings();
    const existing = current.paymentMethods || [];
    const nextMethods = existing.map((m) =>
      m.id === methodId ? { ...m, ...updates } : m
    );
    const updated = await this.updatePaymentSettings(
      actor,
      { ...current, paymentMethods: nextMethods },
      reason || `Updated payment method ${methodId}`
    );
    return updated.paymentMethods;
  }

  async deletePaymentMethod(
    actor: AuthenticatedAdminContext,
    methodId: string,
    reason?: string
  ): Promise<PaymentMethodEntryDto[]> {
    const current = await this.port.getActiveSettings();
    const existing = current.paymentMethods || [];
    const nextMethods = existing.filter((m) => m.id !== methodId);
    const updated = await this.updatePaymentSettings(
      actor,
      { ...current, paymentMethods: nextMethods },
      reason || `Deleted payment method ${methodId}`
    );
    return updated.paymentMethods;
  }

  /**
   * Creates an authoritative server-calculated PriceQuoteDto (Section 6.4, 6.6).
   * Enforces bundle min/max counts, deduplication, and single-course eligibility.
   */
  async createPriceQuote(
    request: PriceQuoteRequestDto,
    nowMs: number = Date.now()
  ): Promise<PriceQuoteDto> {
    const settings = await this.port.getActiveSettings();
    const uniqueCourseIds = Array.from(new Set(request.selectedCourseIds));

    if (uniqueCourseIds.length !== request.selectedCourseIds.length) {
      throw new Error(
        `${mastera_ERROR_CODES.BUNDLE_SIZE_INVALID}: Duplicate course IDs are not permitted.`
      );
    }

    const courses = await this.port.findCoursesByIds(uniqueCourseIds);
    if (courses.length !== uniqueCourseIds.length || courses.some((c) => !c.isActive)) {
      throw new Error(
        `${mastera_ERROR_CODES.BUNDLE_SIZE_INVALID}: One or more selected courses are inactive or missing.`
      );
    }

    const activeEntitlements = request.studentId
      ? await this.port.getActiveStudentEntitlements(request.studentId)
      : [];

    const nowIso = new Date(nowMs).toISOString();
    const validEntitlements = activeEntitlements.filter(
      (e) => e.status === 'ACTIVE' && e.expiresAt > nowIso
    );
    const ownedCourseIds = new Set(validEntitlements.map((e) => e.courseId));

    // PUR-05: Reject purchasing a course already owned/included
    for (const cId of uniqueCourseIds) {
      if (ownedCourseIds.has(cId)) {
        throw new Error(
          `${mastera_ERROR_CODES.COURSE_ALREADY_INCLUDED}: Course ${cId} is already covered by an active entitlement.`
        );
      }
    }

    let baseAmountETB = 0;
    let discountAmountETB = 0;
    let totalAmountETB = 0;
    let durationDays = 150;
    let perCourseBreakdown: PriceQuoteItemBreakdownDto[] = [];

    if (request.productType === 'EXTRA_SINGLE_COURSE') {
      // Check if student holds an active qualifying bundle (PUR-01, PUR-03, Section 6.5)
      const hasQualifyingBundle = validEntitlements.some((ent) => {
        if (
          ent.productType === 'SEMESTER_BUNDLE' ||
          ent.productType === 'BATCH_BUNDLE' ||
          ent.productType === 'FULL_COURSE_BUNDLE'
        ) {
          return settings.bundles[ent.productType].unlocksSingleCourses;
        }
        if (ent.productType === 'BOTH_STREAMS_PACKAGE') {
          return true;
        }
        return false;
      });

      const singleCheck = canPurchaseSingleCourse({
        singleCoursesEnabled: settings.singleCoursesEnabled,
        hasActiveQualifyingBundle: hasQualifyingBundle,
        isCourseAlreadyOwnedOrIncluded: false,
      });

      if (!singleCheck.allowed) {
        throw new Error(`${singleCheck.errorCode}: ${singleCheck.message}`);
      }

      if (uniqueCourseIds.length === 0) {
        throw new Error(
          `${mastera_ERROR_CODES.BUNDLE_SIZE_INVALID}: At least one extra course must be selected.`
        );
      }

      const extraCalc = calculateExtraCoursePrice(
        courses.map((c) => ({
          courseId: c.id,
          courseCode: c.code,
          courseTitle: c.title,
        })),
        settings.extraCourseTiers
      );

      baseAmountETB = extraCalc.totalAmountETB;
      discountAmountETB = 0;
      totalAmountETB = extraCalc.totalAmountETB;
      durationDays = settings.bundles.SEMESTER_BUNDLE.durationDays;
      perCourseBreakdown = extraCalc.perCourseBreakdown;
    } else if (request.productType === 'BOTH_STREAMS_PACKAGE') {
      const calc = calculateBundlePrice(
        'BOTH_STREAMS_PACKAGE',
        courses.map((c) => ({ courseId: c.id, priceETB: c.priceETB })),
        { pricingMode: 'FIXED', fixedPriceETB: settings.bothStreamsPriceETB },
        settings.bothStreamsPriceETB
      );
      baseAmountETB = calc.baseAmountETB;
      discountAmountETB = calc.discountAmountETB;
      totalAmountETB = calc.totalAmountETB;
      durationDays = settings.bothStreamsDurationDays;
      perCourseBreakdown = courses.map((c, idx) => ({
        courseId: c.id,
        courseCode: c.code,
        courseTitle: c.title,
        ordinalPosition: idx + 1,
        appliedUnitPriceETB: c.priceETB,
        tierLabel: 'Both Streams Package',
      }));
    } else {
      const bundleType: BundleProductType = request.productType;
      const bundleConfig = settings.bundles[bundleType];

      if (!bundleConfig.enabled) {
        throw new Error(
          `${mastera_ERROR_CODES.BUNDLE_SIZE_INVALID}: Bundle type ${bundleType} is currently disabled.`
        );
      }

      // Section 6.3: For Semester Bundle, verify all non-COMMON courses share the same semester & stream
      if (bundleType === 'SEMESTER_BUNDLE') {
        const semesters = new Set(courses.map((c) => c.semester));
        const nonCommonStreams = new Set(
          courses.filter((c) => c.stream !== 'COMMON').map((c) => c.stream)
        );
        if (semesters.size > 1 || nonCommonStreams.size > 1) {
          throw new Error(
            `${mastera_ERROR_CODES.BUNDLE_SIZE_INVALID}: Semester bundle courses must belong to one semester and stream.`
          );
        }
      }

      const validation = validateBundleSelection(
        uniqueCourseIds,
        courses,
        bundleConfig
      );
      if (!validation.valid) {
        throw new Error(
          `${mastera_ERROR_CODES.BUNDLE_SIZE_INVALID}: ${validation.message}`
        );
      }

      const calc = calculateBundlePrice(
        bundleType,
        courses.map((c) => ({ courseId: c.id, priceETB: c.priceETB })),
        bundleConfig
      );

      baseAmountETB = calc.baseAmountETB;
      discountAmountETB = calc.discountAmountETB;
      totalAmountETB = calc.totalAmountETB;
      durationDays = bundleConfig.durationDays;
      perCourseBreakdown = courses.map((c, idx) => ({
        courseId: c.id,
        courseCode: c.code,
        courseTitle: c.title,
        ordinalPosition: idx + 1,
        appliedUnitPriceETB: c.priceETB,
        tierLabel:
          bundleConfig.pricingMode === 'FIXED'
            ? `${bundleType} (Fixed)`
            : `${bundleType} (${bundleConfig.discountPercent}% off)`,
      }));
    }

    const expiresAtIso = new Date(
      nowMs + settings.quoteExpiryMinutes * 60 * 1000
    ).toISOString();

    const quote: PriceQuoteDto = {
      quoteId: `qt-${nowMs}-${Math.random().toString(36).slice(2, 8)}`,
      productType: request.productType,
      uniqueCourseCount: uniqueCourseIds.length,
      perCourseBreakdown,
      baseAmountETB,
      discountAmountETB,
      totalAmountETB,
      durationDays,
      settingsVersion: settings.configVersion,
      expiresAt: expiresAtIso,
    };

    await this.port.saveQuote(quote);
    return quote;
  }

  private validateSettingsInvariants(
    cfg: Omit<PaymentSettingsDto, 'configVersion'>
  ): void {
    if (cfg.renewalWindowDays < 1 || cfg.quoteExpiryMinutes < 1) {
      throw new Error('Validation Error: renewalWindowDays and quoteExpiryMinutes must be >= 1.');
    }

    for (const bundle of Object.values(cfg.bundles)) {
      if (bundle.minCourses < 1 || bundle.maxCourses < bundle.minCourses) {
        throw new Error(
          `Validation Error (${bundle.productType}): minCourses must be >= 1 and maxCourses >= minCourses.`
        );
      }
      if (bundle.discountPercent < 0 || bundle.discountPercent > 100) {
        throw new Error(
          `Validation Error (${bundle.productType}): discountPercent must be between 0 and 100.`
        );
      }
      if (bundle.fixedPriceETB < 0 || bundle.durationDays < 1) {
        throw new Error(
          `Validation Error (${bundle.productType}): prices must be non-negative and durationDays positive.`
        );
      }
    }

    // Validate extraCourseTiers are contiguous, non-overlapping, starting at 1 (Section 6.2)
    const sortedTiers = [...cfg.extraCourseTiers].sort(
      (a, b) => a.fromOrdinal - b.fromOrdinal
    );
    if (sortedTiers.length === 0 || sortedTiers[0]?.fromOrdinal !== 1) {
      throw new Error(
        'Validation Error: Extra-course tiers must start at ordinal 1.'
      );
    }

    for (let i = 0; i < sortedTiers.length; i++) {
      const current = sortedTiers[i]!;
      if (current.unitPriceETB < 0) {
        throw new Error('Validation Error: Extra-course tier price cannot be negative.');
      }
      if (i < sortedTiers.length - 1) {
        const next = sortedTiers[i + 1]!;
        if (current.toOrdinal === null || next.fromOrdinal !== current.toOrdinal + 1) {
          throw new Error(
            'Validation Error: Extra-course tier ranges must not overlap and must cover every count without gaps.'
          );
        }
      } else if (current.toOrdinal !== null) {
        throw new Error(
          'Validation Error: The final extra-course tier must have toOrdinal = null to cover all higher counts.'
        );
      }
    }
  }
}