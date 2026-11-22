'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StudentSupportInbox, SupportTicketItemDto } from '@/components/support/StudentSupportInbox';
import { adminApiFetch } from '@/lib/api-client';

export default function SupportTicketsPage(): React.ReactElement {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicketItemDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApiFetch<SupportTicketItemDto[]>('/support/tickets');
      if (Array.isArray(res)) {
        setTickets(res);
      }
    } catch (err) {
      console.error('Failed to load support tickets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleSendReply = async (ticketId: string, reply: string) => {
    try {
      await adminApiFetch(`/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        body: { replyMessage: reply },
      });
      // Optimistic update
      setTickets((prev) =>
        prev.map((t) =>
          t.ticketId === ticketId ? { ...t, status: 'ANSWERED' as const } : t
        )
      );
      await loadTickets();
    } catch (err: any) {
      console.error('Failed to send reply:', err);
      alert(`Failed to send reply: ${err?.message || 'Server error'}`);
    }
  };

  const handleMarkResolved = async (ticketId: string) => {
    try {
      await adminApiFetch(`/support/tickets/${ticketId}/status`, {
        method: 'PUT',
        body: { status: 'RESOLVED' },
      });
      // Optimistic update
      setTickets((prev) =>
        prev.map((t) =>
          t.ticketId === ticketId ? { ...t, status: 'RESOLVED' as const } : t
        )
      );
      await loadTickets();
    } catch (err: any) {
      console.error('Failed to update ticket status:', err);
      alert(`Failed to resolve ticket: ${err?.message || 'Server error'}`);
    }
  };

  if (loading && tickets.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        Loading support tickets from database...
      </div>
    );
  }

  return (
    <StudentSupportInbox
      tickets={tickets}
      onSendReply={handleSendReply}
      onMarkResolved={handleMarkResolved}
      onViewStudentProfile={(studentId) => {
        router.push(`/students/${studentId}`);
      }}
    />
  );
}
