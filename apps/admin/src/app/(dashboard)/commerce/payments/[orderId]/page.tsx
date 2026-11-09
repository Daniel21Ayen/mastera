'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, ZoomIn, ZoomOut } from 'lucide-react';
import { ADMIN_THEMES, RADIUS, SPACING } from '@mastera/ui-tokens';

interface PaymentDetailPageProps {
  params: {
    orderId: string;
  };
}

export default function PaymentOrderDetailPage({ params }: PaymentDetailPageProps): React.ReactElement {
  const router = useRouter();
  const tokens = ADMIN_THEMES.light;
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('Photo unclear. Fix and resubmit.');
  const [inputAmount, setInputAmount] = useState('270');
  const [isApproved, setIsApproved] = useState(false);

  const order = {
    id: params.orderId,
    studentName: 'Abebe Bikila',
    studentCode: 'MS0001',
    phone: '+251 911 022 344',
    email: 'abebe@aastu.edu.et',
    university: 'Addis Ababa Science & Technology University',
    department: 'Freshman Engineering',
    semester: 1,
    productType: 'Semester Bundle (5 Courses)',
    courses: [
      'MATH101 - Applied Mathematics I',
      'PHYS101 - General Physics I',
      'CHEM101 - General Chemistry',
      'ENGL101 - Communicative English Skills',
      'GEES101 - Introduction to Emerging Technologies',
    ],
    expectedAmountETB: 270,
    paymentMethod: 'Commercial Bank of Ethiopia (CBE)',
    transactionReference: 'FT2428909123',
    accountNumber: '1000123456789 (Mastera Education PLC)',
    submittedAt: '2024-11-06 14:10:00',
    receiptImageUrl: 'https://images.unsplash.com/photo-1554415707-9e4466759538?w=1000&auto=format&fit=crop&q=80',
    status: isApproved ? 'APPROVED' : 'PENDING',
  };

  const handleApprove = () => {
    if (Number(inputAmount) !== order.expectedAmountETB) {
      alert(`Amount entered (${inputAmount} ETB) does not match expected amount (${order.expectedAmountETB} ETB).`);
      return;
    }
    setIsApproved(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg, height: 'calc(100vh - 120px)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
          <Link
            href="/commerce/payments"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: RADIUS.md,
              backgroundColor: tokens.surface,
              border: `1px solid ${tokens.border}`,
              color: tokens.textPrimary,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: tokens.textPrimary, margin: 0 }}>
                Order #{order.id}
              </h1>
              <span
                style={{
                  padding: `${SPACING.xs}px ${SPACING.sm}px`,
                  borderRadius: RADIUS.pill,
                  backgroundColor: order.status === 'APPROVED' ? tokens.successBg : tokens.warningBg,
                  color: order.status === 'APPROVED' ? tokens.success : tokens.warning,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {order.status}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: tokens.textMuted }}>
              Submitted on {order.submittedAt}
            </p>
          </div>
        </div>

        {order.status === 'PENDING' && (
          <div style={{ display: 'flex', gap: SPACING.sm, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowRejectModal(true)}
              style={{
                padding: `${SPACING.sm}px ${SPACING.md}px`,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.danger}`,
                backgroundColor: tokens.dangerBg,
                color: tokens.danger,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: SPACING.xs,
              }}
            >
              <XCircle size={16} strokeWidth={2} />
              Reject Slip
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
              <input
                type="number"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                placeholder="Amount ETB"
                style={{
                  width: 100,
                  padding: SPACING.sm,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              />
              <button
                type="button"
                onClick={handleApprove}
                style={{
                  padding: `${SPACING.sm}px ${SPACING.md}px`,
                  borderRadius: RADIUS.md,
                  border: 'none',
                  backgroundColor: tokens.primary,
                  color: tokens.surface,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: SPACING.xs,
                }}
              >
                <CheckCircle2 size={16} strokeWidth={2} />
                Verify & Approve
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Split Pane */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: SPACING.lg, flex: 1, minHeight: 0 }}>
        {/* Left Pane: Order & Student Metadata */}
        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.lg,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.lg,
          }}
        >
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: tokens.textPrimary, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Student Information
            </h2>
            <div style={{ marginTop: SPACING.sm, display: 'flex', flexDirection: 'column', gap: SPACING.xs, fontSize: 13 }}>
              <div><span style={{ color: tokens.textMuted }}>Name:</span> <strong>{order.studentName}</strong></div>
              <div><span style={{ color: tokens.textMuted }}>Student Code:</span> <strong>{order.studentCode}</strong></div>
              <div><span style={{ color: tokens.textMuted }}>Phone:</span> {order.phone}</div>
              <div><span style={{ color: tokens.textMuted }}>Email:</span> {order.email}</div>
              <div><span style={{ color: tokens.textMuted }}>Institution:</span> {order.university}</div>
              <div><span style={{ color: tokens.textMuted }}>Department:</span> {order.department} (Semester {order.semester})</div>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${tokens.border}`, paddingTop: SPACING.md }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: tokens.textPrimary, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Package & Entitlements
            </h2>
            <div style={{ marginTop: SPACING.sm, fontSize: 13 }}>
              <div style={{ fontWeight: 600, color: tokens.primary }}>{order.productType}</div>
              <ul style={{ margin: `${SPACING.xs}px 0 0 0`, paddingLeft: 18, color: tokens.textMuted, fontSize: 12 }}>
                {order.courses.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${tokens.border}`, paddingTop: SPACING.md }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: tokens.textPrimary, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Payment Details
            </h2>
            <div style={{ marginTop: SPACING.sm, display: 'flex', flexDirection: 'column', gap: SPACING.xs, fontSize: 13 }}>
              <div><span style={{ color: tokens.textMuted }}>Method:</span> <strong>{order.paymentMethod}</strong></div>
              <div><span style={{ color: tokens.textMuted }}>Tx Reference:</span> <strong style={{ color: tokens.primary }}>{order.transactionReference}</strong></div>
              <div><span style={{ color: tokens.textMuted }}>Receiving Account:</span> {order.accountNumber}</div>
              <div style={{ marginTop: SPACING.xs }}>
                <span style={{ color: tokens.textMuted }}>Expected Total:</span>{' '}
                <span style={{ fontSize: 16, fontWeight: 700, color: tokens.primary }}>{order.expectedAmountETB} ETB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane: Digital Slip Viewer */}
        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: `${SPACING.sm}px ${SPACING.md}px`,
              borderBottom: `1px solid ${tokens.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: tokens.surfaceSubtle,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: tokens.textPrimary }}>
              Receipt Image Proof
            </span>
            <div style={{ display: 'flex', gap: SPACING.xs }}>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                style={{
                  padding: 4,
                  borderRadius: RADIUS.sm,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  cursor: 'pointer',
                }}
              >
                <ZoomOut size={16} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                style={{
                  padding: 4,
                  borderRadius: RADIUS.sm,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  cursor: 'pointer',
                }}
              >
                <ZoomIn size={16} strokeWidth={2} />
              </button>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: SPACING.md,
              backgroundColor: tokens.background,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={order.receiptImageUrl}
              alt="Payment Slip Proof"
              style={{
                maxWidth: `${zoomLevel * 100}%`,
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: RADIUS.md,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'transform 0.15s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: tokens.surface,
              borderRadius: RADIUS.lg,
              padding: SPACING.xl,
              width: 440,
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.md,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, color: tokens.danger }}>
              <AlertTriangle size={24} strokeWidth={2} />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Reject Payment Slip</h3>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: tokens.textMuted }}>
              Select predefined feedback sent directly via SMS notification to the student:
            </p>
            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{
                width: '100%',
                padding: SPACING.sm,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                backgroundColor: tokens.surface,
                color: tokens.textPrimary,
                fontSize: 13,
              }}
            >
              <option value="Photo unclear. Fix and resubmit.">Photo unclear. Fix and resubmit.</option>
              <option value="Receipt amount does not match expected order total.">Receipt amount does not match expected order total.</option>
              <option value="Transaction reference invalid or not found in bank statement.">Transaction reference invalid or not found in bank statement.</option>
              <option value="Duplicate receipt image already used on another order.">Duplicate receipt image already used on another order.</option>
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.sm }}>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                style={{
                  padding: `${SPACING.sm}px ${SPACING.md}px`,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${tokens.border}`,
                  backgroundColor: tokens.surface,
                  color: tokens.textPrimary,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  router.push('/commerce/payments');
                }}
                style={{
                  padding: `${SPACING.sm}px ${SPACING.md}px`,
                  borderRadius: RADIUS.md,
                  border: 'none',
                  backgroundColor: tokens.danger,
                  color: tokens.surface,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Send Rejection SMS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
