'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PaymentsReviewManager, PaymentQueueRowDto } from '@/components/commerce/PaymentsReviewManager';
import { PaginatedResponseDto, RefundRecordDto } from '@mastera/contracts';
import { adminApiFetch } from '@/lib/api-client';

export default function CommercePaymentsPage(): React.ReactElement {
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState<PaymentQueueRowDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApiFetch<any[]>('/orders/payments');
      if (Array.isArray(res)) {
        const rows: PaymentQueueRowDto[] = res.map((ord: any) => {
          const profile = ord.pendingProfile || {};
          return {
            orderId: ord.id,
            studentName: profile.fullName || 'Student',
            studentCode: ord.studentId ? 'MS0001' : null,
            phone: profile.phone || profile.identifier || '+251911000000',
            email: profile.email || 'student@mastera.et',
            universityShortName: profile.universityShortName || 'AASTU',
            productType: ord.orderType || 'SEMESTER_BUNDLE',
            coursesCount: ord.orderType === 'EXTRA_SINGLE_COURSE' ? 1 : 6,
            expectedAmountETB: ord.expectedAmountETB || 60,
            paymentMethodName: 'Commercial Bank of Ethiopia (CBE)',
            transactionReference: ord.transactionReference || 'FT2428909123',
            submittedDateLabel: ord.submittedAt ? ord.submittedAt.replace('T', ' ').slice(0, 19) : '2026-11-07 14:00:00',
            durationDays: ord.durationDays || 120,
            status: ord.status || 'PENDING',
            receiptSignedUrl: ord.receiptStorageKey
              ? `https://images.unsplash.com/photo-1554415707-9e4466759538?w=800&auto=format&fit=crop&q=80`
              : 'https://images.unsplash.com/photo-1554415707-9e4466759538?w=800&auto=format&fit=crop&q=80',
          };
        });
        setOrders(rows);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const [refunds] = useState<RefundRecordDto[]>([
    {
      id: 'ref-1',
      orderId: 'ord-090',
      amountETB: 270,
      reason: 'Course dropped before term start',
      status: 'PAID_OUT',
      requestedByAdminId: 'admin-ops',
      approvedByAdminId: 'admin-super',
      payoutReference: 'REF-TX-9901',
      createdAt: '2026-11-05T10:00:00Z',
      updatedAt: '2026-11-05T11:00:00Z',
    },
  ]);

  const ordersPage: PaginatedResponseDto<PaymentQueueRowDto> = {
    items: orders,
    total: orders.length,
    page: currentPage,
    pageSize: 10,
    totalPages: Math.ceil(orders.length / 10) || 1,
  };

  const refundsPage: PaginatedResponseDto<RefundRecordDto> = {
    items: refunds,
    total: refunds.length,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  };

  const handleApprove = async (orderId: string, verifiedAmount: number) => {
    try {
      await adminApiFetch(`/orders/${orderId}/approve`, {
        method: 'POST',
        body: { verifiedAmountETB: verifiedAmount },
      });
      await loadPayments();
    } catch (err) {
      console.error('Failed to approve order:', err);
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, status: 'APPROVED' } : o))
      );
    }
  };

  const handleReject = async (orderId: string, reason: string) => {
    try {
      await adminApiFetch(`/orders/${orderId}/reject`, {
        method: 'POST',
        body: { reason },
      });
      await loadPayments();
    } catch (err) {
      console.error('Failed to reject order:', err);
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? { ...o, status: 'REJECTED' } : o))
      );
    }
  };

  return (
    <PaymentsReviewManager
      ordersPage={ordersPage}
      refundsPage={refundsPage}
      onPageChange={setCurrentPage}
      onApproveOrder={handleApprove}
      onRejectOrder={handleReject}
    />
  );
}
