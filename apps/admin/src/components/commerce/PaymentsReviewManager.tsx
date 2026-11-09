import React, { useState } from 'react';
import {
  OrderProductType,
  OrderStatus,
  PaginatedResponseDto,
  RefundRecordDto,
} from '@mastera/contracts';
import {
  ACTIVE_NAVIGATION_TOKEN,
  ADMIN_THEMES,
  RADIUS,
  SPACING,
  ThemeMode,
} from '@mastera/ui-tokens';
import { PaginatedTable, TableColumn } from '../shared/PaginatedTable';

export interface PaymentQueueRowDto {
  orderId: string;
  studentName: string;
  studentCode: string | null; // Null while local-only awaiting first bundle approval
  phone: string;
  email: string;
  universityShortName: string;
  productType: OrderProductType;
  coursesCount: number;
  expectedAmountETB: number;
  paymentMethodName: string;
  transactionReference: string;
  submittedDateLabel: string;
  durationDays: number;
  status: OrderStatus;
  receiptSignedUrl: string;
}

export interface PaymentsReviewManagerProps {
  ordersPage: PaginatedResponseDto<PaymentQueueRowDto>;
  refundsPage: PaginatedResponseDto<RefundRecordDto>;
  onPageChange: (page: number) => void;
  onApproveOrder: (orderId: string, verifiedAmountETB: number) => void;
  onRejectOrder: (orderId: string, reason: string) => void;
  themeMode?: ThemeMode;
}

const REJECTION_REASONS = [
  'Photo unclear. Fix and resubmit.',
  'Receipt amount does not match expected order total.',
  'Transaction reference invalid or not found in bank statement.',
  'Duplicate receipt image already used on another order.',
] as const;

export function PaymentsReviewManager({
  ordersPage,
  refundsPage,
  onPageChange,
  onApproveOrder,
  onRejectOrder,
  themeMode = 'light',
}: PaymentsReviewManagerProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<
    'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDS'
  >('PENDING');
  const [selectedOrder, setSelectedOrder] =
    useState<PaymentQueueRowDto | null>(null);
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const tokens = ADMIN_THEMES[themeMode];

  // Detail View: Split-Pane Payment Review (/commerce/payments/[orderId])
  if (selectedOrder) {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setSelectedOrder(null);
            setZoomPercent(100);
            setRotationDeg(0);
            setRejectionReason('');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: tokens.primary,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: SPACING.sm,
            padding: 0,
          }}
        >
          ← Back to payments
        </button>

        <h1 style={{ marginTop: 0, marginBottom: SPACING.lg, fontSize: 24 }}>
          Payment Review
        </h1>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 1fr',
            gap: SPACING.xl,
          }}
        >
          {/* Left Pane: Digital Slip Viewer with Zoom & Rotate Controls */}
          <div
            style={{
              backgroundColor: tokens.surface,
              border: `1px solid ${tokens.border}`,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
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
              <span style={{ fontSize: 12, fontWeight: 600 }}>
                Digital Slip
              </span>
              <span
                style={{
                  padding: `4px ${SPACING.md}px`,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.primary}`,
                  color: tokens.primary,
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {selectedOrder.transactionReference}
              </span>
            </div>

            {/* Zoom & Rotation Toolbar */}
            <div
              style={{
                display: 'flex',
                gap: SPACING.xs,
                marginBottom: SPACING.md,
              }}
            >
              <button
                type="button"
                onClick={() => setZoomPercent((z) => Math.max(50, z - 25))}
                style={{
                  padding: `${SPACING.xs}px ${SPACING.md}px`,
                  borderRadius: RADIUS.sm,
                  border: `1px solid ${tokens.primary}`,
                  backgroundColor: tokens.surface,
                  color: tokens.primary,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                -
              </button>
              <span
                style={{
                  padding: `${SPACING.xs}px ${SPACING.md}px`,
                  fontWeight: 700,
                }}
              >
                {zoomPercent}%
              </span>
              <button
                type="button"
                onClick={() => setZoomPercent((z) => Math.min(200, z + 25))}
                style={{
                  padding: `${SPACING.xs}px ${SPACING.md}px`,
                  borderRadius: RADIUS.sm,
                  border: `1px solid ${tokens.primary}`,
                  backgroundColor: tokens.surface,
                  color: tokens.primary,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setRotationDeg((r) => (r - 90) % 360)}
                style={{
                  padding: `${SPACING.xs}px ${SPACING.md}px`,
                  borderRadius: RADIUS.sm,
                  border: `1px solid ${tokens.primary}`,
                  backgroundColor: tokens.surface,
                  color: tokens.primary,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ↺
              </button>
              <button
                type="button"
                onClick={() => setRotationDeg((r) => (r + 90) % 360)}
                style={{
                  padding: `${SPACING.xs}px ${SPACING.md}px`,
                  borderRadius: RADIUS.sm,
                  border: `1px solid ${tokens.primary}`,
                  backgroundColor: tokens.surface,
                  color: tokens.primary,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                ↻
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoomPercent(100);
                  setRotationDeg(0);
                }}
                style={{
                  padding: `${SPACING.xs}px ${SPACING.md}px`,
                  borderRadius: RADIUS.sm,
                  border: `1px solid ${tokens.primary}`,
                  backgroundColor: tokens.surface,
                  color: tokens.primary,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>
            </div>

            {/* Receipt Canvas */}
            <div
              style={{
                backgroundColor: tokens.sidebarBg,
                borderRadius: RADIUS.lg,
                padding: SPACING.xxl,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                  borderRadius: RADIUS.lg,
                  padding: SPACING.xl,
                  width: 300,
                  transform: `scale(${zoomPercent / 100}) rotate(${rotationDeg}deg)`,
                  transition: 'transform 0.15s ease',
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {selectedOrder.paymentMethodName}
                </div>
                <div
                  style={{
                    color: tokens.primary,
                    fontWeight: 600,
                    fontSize: 13,
                    marginBottom: SPACING.md,
                  }}
                >
                  Transaction successful
                </div>
                <div style={{ fontSize: 12, color: tokens.textMuted }}>
                  From
                </div>
                <div style={{ fontWeight: 700, marginBottom: SPACING.sm }}>
                  {selectedOrder.studentName}
                </div>
                <div style={{ fontSize: 12, color: tokens.textMuted }}>
                  Amount
                </div>
                <div style={{ fontWeight: 700, marginBottom: SPACING.sm }}>
                  {selectedOrder.expectedAmountETB} ETB
                </div>
                <div style={{ fontSize: 12, color: tokens.textMuted }}>
                  Reference
                </div>
                <div style={{ fontWeight: 700 }}>
                  {selectedOrder.transactionReference}
                </div>
              </div>
            </div>
          </div>

          {/* Right Pane: Order Metadata & Approval / Rejection Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
            <div
              style={{
                backgroundColor: tokens.surface,
                border: `1px solid ${tokens.border}`,
                borderRadius: RADIUS.lg,
                padding: SPACING.lg,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                rowGap: SPACING.md,
                fontSize: 14,
              }}
            >
              <span style={{ color: tokens.textMuted }}>Student</span>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>
                {selectedOrder.studentName}
              </span>

              <span style={{ color: tokens.textMuted }}>Student ID</span>
              <span style={{ textAlign: 'right', fontWeight: 700 }}>
                {selectedOrder.studentCode ?? 'Assigned on approval'}
              </span>

              <span style={{ color: tokens.textMuted }}>Phone</span>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>
                {selectedOrder.phone}
              </span>

              <span style={{ color: tokens.textMuted }}>Email</span>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>
                {selectedOrder.email}
              </span>

              <span style={{ color: tokens.textMuted }}>University</span>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>
                {selectedOrder.universityShortName}
              </span>

              <span style={{ color: tokens.textMuted }}>Product</span>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>
                {selectedOrder.productType.replace(/_/g, ' ')}
              </span>

              <span style={{ color: tokens.textMuted }}>Courses selected</span>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>
                {selectedOrder.coursesCount} courses
              </span>

              <span style={{ color: tokens.textMuted }}>Amount</span>
              <span style={{ textAlign: 'right', fontWeight: 700 }}>
                {selectedOrder.expectedAmountETB} ETB
              </span>

              <span style={{ color: tokens.textMuted }}>Payment method</span>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>
                {selectedOrder.paymentMethodName}
              </span>

              <span style={{ color: tokens.textMuted }}>Reference</span>
              <span style={{ textAlign: 'right', fontWeight: 700 }}>
                {selectedOrder.transactionReference}
              </span>

              <span style={{ color: tokens.textMuted }}>Submitted</span>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>
                {selectedOrder.submittedDateLabel}
              </span>

              <span style={{ color: tokens.textMuted }}>Access given</span>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>
                {selectedOrder.durationDays} days
              </span>

              <span style={{ color: tokens.textMuted }}>Status</span>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>
                {selectedOrder.status}
              </span>
            </div>

            {/* Reason for rejecting + Action Buttons */}
            <div
              style={{
                backgroundColor: tokens.surface,
                border: `1px solid ${tokens.border}`,
                borderRadius: RADIUS.lg,
                padding: SPACING.lg,
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: SPACING.md,
                }}
              >
                Reason for rejecting
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={{ width: '100%', padding: SPACING.sm, marginTop: 4 }}
                >
                  <option value="">Select a reason</option>
                  {REJECTION_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: SPACING.sm,
                }}
              >
                <button
                  type="button"
                  disabled={!rejectionReason}
                  onClick={() =>
                    onRejectOrder(selectedOrder.orderId, rejectionReason)
                  }
                  style={{
                    padding: `${SPACING.sm}px ${SPACING.lg}px`,
                    borderRadius: RADIUS.md,
                    border: 'none',
                    backgroundColor: tokens.danger,
                    color: tokens.sidebarText,
                    fontWeight: 600,
                    opacity: !rejectionReason ? 0.5 : 1,
                    cursor: !rejectionReason ? 'not-allowed' : 'pointer',
                  }}
                >
                  Reject
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onApproveOrder(
                      selectedOrder.orderId,
                      selectedOrder.expectedAmountETB
                    )
                  }
                  style={{
                    padding: `${SPACING.sm}px ${SPACING.xl}px`,
                    borderRadius: RADIUS.md,
                    border: 'none',
                    backgroundColor: tokens.primary,
                    color: tokens.sidebarText,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Approve and activate access
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Queue Table View (/commerce/payments)
  const orderColumns: TableColumn<PaymentQueueRowDto>[] = [
    {
      key: 'student',
      header: 'Student',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.studentName}</div>
          <div style={{ fontSize: 12, color: tokens.textMuted }}>
            ({row.phone})
          </div>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      render: (row) => row.productType.replace(/_/g, ' '),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => `${row.expectedAmountETB} ETB`,
    },
    {
      key: 'method',
      header: 'Method',
      render: (row) => row.paymentMethodName,
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (row) => row.transactionReference,
    },
    {
      key: 'submitted',
      header: 'Submitted',
      render: (row) => row.submittedDateLabel,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          style={{
            padding: `2px ${SPACING.sm}px`,
            borderRadius: RADIUS.pill,
            backgroundColor: tokens.warningBg,
            color: tokens.textPrimary,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'review',
      header: 'Review',
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedOrder(row)}
          style={{
            padding: `${SPACING.xs}px ${SPACING.lg}px`,
            borderRadius: RADIUS.md,
            border: 'none',
            backgroundColor: tokens.primary,
            color: tokens.sidebarText,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Review
        </button>
      ),
    },
  ];

  const refundColumns: TableColumn<RefundRecordDto>[] = [
    { key: 'orderId', header: 'Order ID', render: (r) => r.orderId },
    { key: 'amount', header: 'Amount', render: (r) => `${r.amountETB} ETB` },
    { key: 'status', header: 'Status', render: (r) => r.status },
    { key: 'reason', header: 'Reason', render: (r) => r.reason },
    {
      key: 'payoutRef',
      header: 'Payout Ref',
      render: (r) => r.payoutReference ?? '—',
    },
  ];

  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: SPACING.md, fontSize: 26 }}>
        Payments
      </h1>

      {/* Pill Tabs: Pending | Approved | Rejected | Refunds */}
      <div style={{ display: 'flex', gap: SPACING.sm, marginBottom: SPACING.lg }}>
        {(
          [
            { id: 'PENDING' as const, label: `Pending (${ordersPage.total})` },
            { id: 'APPROVED' as const, label: 'Approved' },
            { id: 'REJECTED' as const, label: 'Rejected' },
            { id: 'REFUNDS' as const, label: 'Refunds' },
          ]
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: `${SPACING.sm}px ${SPACING.lg}px`,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.primary}`,
                backgroundColor: isActive
                  ? ACTIVE_NAVIGATION_TOKEN
                  : tokens.surface,
                color: isActive ? tokens.sidebarText : tokens.primary,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'REFUNDS' ? (
        <PaginatedTable
          columns={refundColumns}
          data={refundsPage}
          rowKey={(r) => r.id}
          onPageChange={onPageChange}
          themeMode={themeMode}
        />
      ) : (
        <PaginatedTable
          columns={orderColumns}
          data={ordersPage}
          rowKey={(o) => o.orderId}
          onPageChange={onPageChange}
          themeMode={themeMode}
        />
      )}
    </div>
  );
}