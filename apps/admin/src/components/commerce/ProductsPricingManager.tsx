import React, { useState } from 'react';
import {
  AdminRole,
  PaymentMethodEntryDto,
  PaymentSettingsDto,
} from '@mastera/contracts';
import {
  ADMIN_THEMES,
  RADIUS,
  SPACING,
  ThemeMode,
} from '@mastera/ui-tokens';

export interface RevenueKpiSummaryDto {
  totalVerifiedETB: number;
  approvedStudentsCount: number;
  pendingQueueETB: number;
  pendingOrdersCount: number;
  averageOrderValueETB: number;
  telebirrCollectedETB: number;
  telebirrVerifiedCount: number;
  cbeMobileCollectedETB: number;
  cbeMobileVerifiedCount: number;
}

export interface ProductsPricingManagerProps {
  actorRole: AdminRole;
  settings: PaymentSettingsDto;
  kpis: RevenueKpiSummaryDto;
  onSaveSettings: (
    nextSettings: Omit<PaymentSettingsDto, 'configVersion'>,
    reason: string
  ) => void;
  onNavigateToPaidStudents: () => void;
  onNavigateToPaymentsQueue: () => void;
  themeMode?: ThemeMode;
}

export function ProductsPricingManager({
  actorRole,
  settings,
  kpis,
  onSaveSettings,
  onNavigateToPaidStudents,
  onNavigateToPaymentsQueue,
  themeMode = 'light',
}: ProductsPricingManagerProps): React.ReactElement {
  const canEdit = actorRole === 'SUPER_ADMIN';
  const tokens = ADMIN_THEMES[themeMode];

  const [draft, setDraft] = useState<Omit<PaymentSettingsDto, 'configVersion'>>({
    singleCoursesEnabled: settings.singleCoursesEnabled,
    renewalWindowDays: settings.renewalWindowDays,
    quoteExpiryMinutes: settings.quoteExpiryMinutes,
    maxReceiptSizeBytes: settings.maxReceiptSizeBytes,
    bundles: settings.bundles,
    bothStreamsPriceETB: settings.bothStreamsPriceETB,
    bothStreamsDurationDays: settings.bothStreamsDurationDays,
    extraCourseTiers: settings.extraCourseTiers,
    paymentMethods: settings.paymentMethods,
  });

  const [firstChapterModuleFree, setFirstChapterModuleFree] = useState(true);
  const [firstChapterQuizFree, setFirstChapterQuizFree] = useState(true);
  const [cocSampleSetFree, setCocSampleSetFree] = useState(true);
  const [changeReason, setChangeReason] = useState('');

  // Payment Methods Admin CRUD State
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);
  const [isAddingNewMethod, setIsAddingNewMethod] = useState<boolean>(false);
  const [methodForm, setMethodForm] = useState<PaymentMethodEntryDto>({
    id: '',
    providerName: '',
    accountHolderName: 'Mastera Education Technologies PLC',
    accountNumberOrCode: '',
    instructions: '',
    isActive: true,
  });

  const handleStartAddMethod = () => {
    setMethodForm({
      id: `pm-${Date.now()}`,
      providerName: '',
      accountHolderName: 'Mastera Education Technologies PLC',
      accountNumberOrCode: '',
      instructions: '',
      isActive: true,
    });
    setEditingMethodId(null);
    setIsAddingNewMethod(true);
  };

  const handleStartEditMethod = (pm: PaymentMethodEntryDto) => {
    setMethodForm({ ...pm });
    setIsAddingNewMethod(false);
    setEditingMethodId(pm.id);
  };

  const handleSaveMethodForm = () => {
    if (!methodForm.providerName.trim() || !methodForm.accountNumberOrCode.trim()) {
      return;
    }
    if (isAddingNewMethod) {
      setDraft((prev) => ({
        ...prev,
        paymentMethods: [...prev.paymentMethods, methodForm],
      }));
      setIsAddingNewMethod(false);
    } else if (editingMethodId) {
      setDraft((prev) => ({
        ...prev,
        paymentMethods: prev.paymentMethods.map((m) =>
          m.id === editingMethodId ? methodForm : m
        ),
      }));
      setEditingMethodId(null);
    }
  };

  const handleDeleteMethod = (idToDelete: string) => {
    setDraft((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter((m) => m.id !== idToDelete),
    }));
    if (editingMethodId === idToDelete) {
      setEditingMethodId(null);
    }
  };

  const semBundle = draft.bundles.SEMESTER_BUNDLE;
  const fullBundle = draft.bundles.FULL_COURSE_BUNDLE;
  const firstExtraTier = draft.extraCourseTiers[0]?.unitPriceETB ?? 100;
  const laterExtraTier = draft.extraCourseTiers[1]?.unitPriceETB ?? 50;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    onSaveSettings(draft, changeReason.trim());
  };

  return (
    <form onSubmit={handleSave}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: SPACING.xl,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 26 }}>Products & Pricing</h1>

        {canEdit && (
          <button
            type="submit"
            disabled={changeReason.trim().length < 3}
            style={{
              padding: `${SPACING.sm}px ${SPACING.xl}px`,
              borderRadius: RADIUS.md,
              border: 'none',
              backgroundColor: tokens.primary,
              color: tokens.sidebarText,
              fontWeight: 600,
              opacity: changeReason.trim().length < 3 ? 0.6 : 1,
              cursor:
                changeReason.trim().length < 3 ? 'not-allowed' : 'pointer',
            }}
          >
            Save changes
          </button>
        )}
      </div>

      {/* Student Revenue Counter Card */}
      <div
        style={{
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.border}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.xl,
          marginBottom: SPACING.xl,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.md,
          }}
        >
          <span
            style={{
              padding: `4px ${SPACING.md}px`,
              borderRadius: RADIUS.pill,
              backgroundColor: tokens.surfaceSubtle,
              color: tokens.primary,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            STUDENT REVENUE COUNTER
          </span>

          <div style={{ display: 'flex', gap: SPACING.sm }}>
            <button
              type="button"
              onClick={onNavigateToPaidStudents}
              style={{
                padding: `${SPACING.xs}px ${SPACING.md}px`,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surface,
                color: tokens.textPrimary,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              View Paid Students ({kpis.approvedStudentsCount})
            </button>

            <button
              type="button"
              onClick={onNavigateToPaymentsQueue}
              style={{
                padding: `${SPACING.xs}px ${SPACING.md}px`,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surface,
                color: tokens.textPrimary,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Payments Queue ({kpis.pendingOrdersCount})
            </button>
          </div>
        </div>

        <div style={{ fontSize: 34, fontWeight: 800, color: tokens.primary }}>
          ETB {kpis.totalVerifiedETB.toLocaleString()}
        </div>
        <div
          style={{
            fontSize: 13,
            color: tokens.textMuted,
            marginBottom: SPACING.lg,
          }}
        >
          Total Birr paid by students across all verified and approved
          enrollments
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: SPACING.md,
          }}
        >
          <div
            style={{
              padding: SPACING.md,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
            }}
          >
            <div style={{ fontSize: 11, color: tokens.textMuted }}>
              APPROVED PAYMENTS
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
              {kpis.approvedStudentsCount} Students
            </div>
            <div style={{ fontSize: 11, color: tokens.textMuted }}>
              Access verified & unlocked
            </div>
          </div>

          <div
            style={{
              padding: SPACING.md,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
            }}
          >
            <div style={{ fontSize: 11, color: tokens.textMuted }}>
              PENDING IN QUEUE
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
              ETB {kpis.pendingQueueETB.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: tokens.textMuted }}>
              {kpis.pendingOrdersCount} orders awaiting approval
            </div>
          </div>

          <div
            style={{
              padding: SPACING.md,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
            }}
          >
            <div style={{ fontSize: 11, color: tokens.textMuted }}>
              AVG. ORDER VALUE
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
              ETB {kpis.averageOrderValueETB.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: tokens.textMuted }}>
              Per paying student
            </div>
          </div>

          <div
            style={{
              padding: SPACING.md,
              borderRadius: RADIUS.md,
              border: `1px solid ${tokens.border}`,
            }}
          >
            <div style={{ fontSize: 11, color: tokens.textMuted }}>
              TELEBIRR / CBE COLLECTED
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
              ETB{' '}
              {(
                kpis.telebirrCollectedETB + kpis.cbeMobileCollectedETB
              ).toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: tokens.textMuted }}>
              {kpis.telebirrVerifiedCount + kpis.cbeMobileVerifiedCount}{' '}
              transactions verified
            </div>
          </div>
        </div>
      </div>

      {/* Three Product Cards: Semester Bundle | Extra courses | Full Freshman Package */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: SPACING.lg,
          marginBottom: SPACING.xl,
        }}
      >
        {/* Card 1: Semester Bundle */}
        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.md,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>Semester Bundle</h3>
            <span
              style={{
                padding: `2px ${SPACING.sm}px`,
                borderRadius: RADIUS.sm,
                backgroundColor: tokens.surfaceSubtle,
                color: tokens.primary,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Core Bundle
            </span>
          </div>

          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Price (ETB)
            <input
              type="number"
              disabled={!canEdit}
              value={semBundle.fixedPriceETB}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  bundles: {
                    ...prev.bundles,
                    SEMESTER_BUNDLE: {
                      ...prev.bundles.SEMESTER_BUNDLE,
                      fixedPriceETB: Number(e.target.value),
                    },
                  },
                }))
              }
              style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
            />
          </label>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: SPACING.sm,
            }}
          >
            <label style={{ fontSize: 12, fontWeight: 600 }}>
              Courses min
              <input
                type="number"
                disabled={!canEdit}
                min={1}
                value={semBundle.minCourses}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    bundles: {
                      ...prev.bundles,
                      SEMESTER_BUNDLE: {
                        ...prev.bundles.SEMESTER_BUNDLE,
                        minCourses: Number(e.target.value),
                      },
                    },
                  }))
                }
                style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
              />
            </label>

            <label style={{ fontSize: 12, fontWeight: 600 }}>
              Courses max
              <input
                type="number"
                disabled={!canEdit}
                min={semBundle.minCourses}
                value={semBundle.maxCourses}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    bundles: {
                      ...prev.bundles,
                      SEMESTER_BUNDLE: {
                        ...prev.bundles.SEMESTER_BUNDLE,
                        maxCourses: Number(e.target.value),
                      },
                    },
                  }))
                }
                style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
              />
            </label>
          </div>

          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Duration (days)
            <input
              type="number"
              disabled={!canEdit}
              min={1}
              value={semBundle.durationDays}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  bundles: {
                    ...prev.bundles,
                    SEMESTER_BUNDLE: {
                      ...prev.bundles.SEMESTER_BUNDLE,
                      durationDays: Number(e.target.value),
                    },
                  },
                }))
              }
              style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
            />
          </label>
        </div>

        {/* Card 2: Extra courses (Add-ons) */}
        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.md,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>Extra courses</h3>
            <span
              style={{
                padding: `2px ${SPACING.sm}px`,
                borderRadius: RADIUS.sm,
                backgroundColor: tokens.surfaceSubtle,
                color: tokens.primary,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Add-ons
            </span>
          </div>

          <label style={{ fontSize: 12, fontWeight: 600 }}>
            First extra (ETB)
            <input
              type="number"
              disabled={!canEdit}
              min={0}
              value={firstExtraTier}
              onChange={(e) => {
                const val = Number(e.target.value);
                setDraft((prev) => ({
                  ...prev,
                  extraCourseTiers: [
                    { fromOrdinal: 1, toOrdinal: 1, unitPriceETB: val },
                    {
                      fromOrdinal: 2,
                      toOrdinal: null,
                      unitPriceETB: laterExtraTier,
                    },
                  ],
                }));
              }}
              style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
            />
          </label>

          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Later extras (ETB)
            <input
              type="number"
              disabled={!canEdit}
              min={0}
              value={laterExtraTier}
              onChange={(e) => {
                const val = Number(e.target.value);
                setDraft((prev) => ({
                  ...prev,
                  extraCourseTiers: [
                    {
                      fromOrdinal: 1,
                      toOrdinal: 1,
                      unitPriceETB: firstExtraTier,
                    },
                    { fromOrdinal: 2, toOrdinal: null, unitPriceETB: val },
                  ],
                }));
              }}
              style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
            />
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.sm,
              fontSize: 13,
              fontWeight: 600,
              marginTop: SPACING.sm,
            }}
          >
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={draft.singleCoursesEnabled}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  singleCoursesEnabled: e.target.checked,
                }))
              }
            />
            Enable single-course purchases
          </label>
        </div>

        {/* Card 3: Full Freshman Package */}
        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.md,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>Full Freshman Package</h3>
            <span
              style={{
                padding: `2px ${SPACING.sm}px`,
                borderRadius: RADIUS.sm,
                backgroundColor: tokens.surfaceSubtle,
                color: tokens.primary,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              All-Inclusive
            </span>
          </div>

          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Per stream (ETB)
            <input
              type="number"
              disabled={!canEdit}
              min={0}
              value={fullBundle.fixedPriceETB}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  bundles: {
                    ...prev.bundles,
                    FULL_COURSE_BUNDLE: {
                      ...prev.bundles.FULL_COURSE_BUNDLE,
                      fixedPriceETB: Number(e.target.value),
                    },
                  },
                }))
              }
              style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
            />
          </label>

          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Both streams (ETB)
            <input
              type="number"
              disabled={!canEdit}
              min={0}
              value={draft.bothStreamsPriceETB}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  bothStreamsPriceETB: Number(e.target.value),
                }))
              }
              style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
            />
          </label>

          <label style={{ fontSize: 12, fontWeight: 600 }}>
            Duration (days)
            <input
              type="number"
              disabled={!canEdit}
              min={1}
              value={fullBundle.durationDays}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  bundles: {
                    ...prev.bundles,
                    FULL_COURSE_BUNDLE: {
                      ...prev.bundles.FULL_COURSE_BUNDLE,
                      durationDays: Number(e.target.value),
                    },
                  },
                }))
              }
              style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
            />
          </label>
        </div>
      </div>

      {/* Free trial default */}
      <div
        style={{
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.border}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          marginBottom: SPACING.xl,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: SPACING.md,
          }}
        >
          <h3 style={{ margin: 0 }}>Free trial default</h3>
          <span
            style={{
              padding: `2px ${SPACING.sm}px`,
              borderRadius: RADIUS.sm,
              backgroundColor: tokens.surfaceSubtle,
              color: tokens.primary,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Global Default
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: SPACING.md,
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.sm,
              padding: SPACING.md,
              borderRadius: RADIUS.md,
              backgroundColor: tokens.surfaceSubtle,
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={firstChapterModuleFree}
              onChange={(e) => setFirstChapterModuleFree(e.target.checked)}
            />
            First chapter of each module free
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.sm,
              padding: SPACING.md,
              borderRadius: RADIUS.md,
              backgroundColor: tokens.surfaceSubtle,
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={firstChapterQuizFree}
              onChange={(e) => setFirstChapterQuizFree(e.target.checked)}
            />
            First chapter of each quiz free
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.sm,
              padding: SPACING.md,
              borderRadius: RADIUS.md,
              backgroundColor: tokens.surfaceSubtle,
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={cocSampleSetFree}
              onChange={(e) => setCocSampleSetFree(e.target.checked)}
            />
            COC sample set
          </label>
        </div>
      </div>

      {/* Payment Accounts & Credentials */}
      <div
        style={{
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.border}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          marginBottom: SPACING.lg,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.md,
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>Payment Accounts & Gateways</h3>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: 13,
                color: tokens.textMuted,
              }}
            >
              Configure bank accounts, mobile money codes, and payment instructions presented to students during checkout.
            </p>
          </div>
          {canEdit && !isAddingNewMethod && !editingMethodId && (
            <button
              type="button"
              onClick={handleStartAddMethod}
              style={{
                backgroundColor: tokens.primary,
                color: tokens.surface,
                border: 'none',
                borderRadius: RADIUS.md,
                padding: `${SPACING.sm}px ${SPACING.md}px`,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              + Add Payment Method
            </button>
          )}
        </div>

        {/* Add / Edit Form Modal / Inline Editor */}
        {(isAddingNewMethod || editingMethodId) && (
          <div
            style={{
              backgroundColor: tokens.surfaceSubtle,
              border: `1px solid ${tokens.primary}`,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              marginBottom: SPACING.lg,
            }}
          >
            <h4 style={{ margin: '0 0 12px 0', color: tokens.textPrimary }}>
              {isAddingNewMethod ? 'Add New Payment Method' : 'Edit Payment Method'}
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: SPACING.md,
                marginBottom: SPACING.md,
              }}
            >
              <label style={{ fontSize: 12, fontWeight: 600, color: tokens.textPrimary }}>
                Provider / Bank Name *
                <input
                  type="text"
                  placeholder="e.g. Commercial Bank of Ethiopia (CBE)"
                  value={methodForm.providerName}
                  onChange={(e) =>
                    setMethodForm((prev) => ({
                      ...prev,
                      providerName: e.target.value,
                    }))
                  }
                  style={{
                    width: '100%',
                    padding: SPACING.sm,
                    marginTop: 4,
                    borderRadius: RADIUS.sm,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                  }}
                />
              </label>

              <label style={{ fontSize: 12, fontWeight: 600, color: tokens.textPrimary }}>
                Account Holder Name *
                <input
                  type="text"
                  placeholder="e.g. Mastera Education Technologies PLC"
                  value={methodForm.accountHolderName}
                  onChange={(e) =>
                    setMethodForm((prev) => ({
                      ...prev,
                      accountHolderName: e.target.value,
                    }))
                  }
                  style={{
                    width: '100%',
                    padding: SPACING.sm,
                    marginTop: 4,
                    borderRadius: RADIUS.sm,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                  }}
                />
              </label>

              <label style={{ fontSize: 12, fontWeight: 600, color: tokens.textPrimary }}>
                Account Number or Code *
                <input
                  type="text"
                  placeholder="e.g. 1000123456789 or 0911022344"
                  value={methodForm.accountNumberOrCode}
                  onChange={(e) =>
                    setMethodForm((prev) => ({
                      ...prev,
                      accountNumberOrCode: e.target.value,
                    }))
                  }
                  style={{
                    width: '100%',
                    padding: SPACING.sm,
                    marginTop: 4,
                    borderRadius: RADIUS.sm,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                  }}
                />
              </label>

              <label style={{ fontSize: 12, fontWeight: 600, color: tokens.textPrimary }}>
                Instructions / Notes
                <input
                  type="text"
                  placeholder="e.g. Transfer the exact amount and upload screenshot."
                  value={methodForm.instructions || ''}
                  onChange={(e) =>
                    setMethodForm((prev) => ({
                      ...prev,
                      instructions: e.target.value,
                    }))
                  }
                  style={{
                    width: '100%',
                    padding: SPACING.sm,
                    marginTop: 4,
                    borderRadius: RADIUS.sm,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                  }}
                />
              </label>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: SPACING.sm,
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: SPACING.sm,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: tokens.textPrimary,
                }}
              >
                <input
                  type="checkbox"
                  checked={methodForm.isActive}
                  onChange={(e) =>
                    setMethodForm((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                />
                Active (available to students on checkout)
              </label>

              <div style={{ display: 'flex', gap: SPACING.sm }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNewMethod(false);
                    setEditingMethodId(null);
                  }}
                  style={{
                    padding: `${SPACING.sm}px ${SPACING.md}px`,
                    borderRadius: RADIUS.md,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveMethodForm}
                  disabled={
                    !methodForm.providerName.trim() ||
                    !methodForm.accountNumberOrCode.trim()
                  }
                  style={{
                    padding: `${SPACING.sm}px ${SPACING.md}px`,
                    borderRadius: RADIUS.md,
                    border: 'none',
                    backgroundColor: tokens.primary,
                    color: tokens.surface,
                    cursor:
                      !methodForm.providerName.trim() ||
                      !methodForm.accountNumberOrCode.trim()
                        ? 'not-allowed'
                        : 'pointer',
                    opacity:
                      !methodForm.providerName.trim() ||
                      !methodForm.accountNumberOrCode.trim()
                        ? 0.6
                        : 1,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {isAddingNewMethod ? 'Add Method' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: SPACING.md,
          }}
        >
          {draft.paymentMethods.map((pm) => (
            <div
              key={pm.id}
              style={{
                border: `1px solid ${tokens.border}`,
                borderRadius: RADIUS.md,
                padding: SPACING.md,
                backgroundColor: tokens.surface,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: SPACING.sm,
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: SPACING.xs,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: tokens.textPrimary,
                    }}
                  >
                    {pm.providerName}
                  </span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: RADIUS.pill,
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: pm.isActive
                        ? tokens.successBg
                        : tokens.warningBg,
                      color: pm.isActive ? tokens.success : tokens.warning,
                    }}
                  >
                    {pm.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: tokens.textMuted,
                    marginBottom: 2,
                  }}
                >
                  Holder:{' '}
                  <span
                    style={{
                      fontWeight: 600,
                      color: tokens.textPrimary,
                    }}
                  >
                    {pm.accountHolderName}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: tokens.primary,
                    letterSpacing: '0.5px',
                    marginBottom: SPACING.xs,
                  }}
                >
                  {pm.accountNumberOrCode}
                </div>

                {pm.instructions && (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: tokens.textMuted,
                      lineHeight: 1.4,
                    }}
                  >
                    {pm.instructions}
                  </p>
                )}
              </div>

              {canEdit && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: SPACING.sm,
                    borderTop: `1px solid ${tokens.border}`,
                    paddingTop: SPACING.sm,
                    marginTop: SPACING.xs,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleStartEditMethod(pm)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      borderRadius: RADIUS.sm,
                      border: `1px solid ${tokens.border}`,
                      backgroundColor: tokens.surface,
                      color: tokens.primary,
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMethod(pm.id)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      borderRadius: RADIUS.sm,
                      border: `1px solid ${tokens.danger}`,
                      backgroundColor: tokens.dangerBg,
                      color: tokens.danger,
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Audit Reason Input (Mandatory per Section 4.3 & Section 6) */}
      {canEdit && (
        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            marginBottom: SPACING.md,
          }}
        >
          <label style={{ fontSize: 13, fontWeight: 600 }}>
            Audit Reason for Commercial Changes (Required)
            <input
              type="text"
              required
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="Explain why prices, limits, or payment accounts are being updated..."
              style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
            />
          </label>
        </div>
      )}

      <div
        style={{
          padding: SPACING.md,
          borderRadius: RADIUS.md,
          backgroundColor: tokens.surface,
          border: `1px solid ${tokens.border}`,
          color: tokens.textMuted,
          fontSize: 13,
        }}
      >
        Changes apply to new orders only. Pending orders keep their quoted
        price. Every change is logged.
      </div>
    </form>
  );
}