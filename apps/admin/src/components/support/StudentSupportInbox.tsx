import React, { useState } from 'react';
import {
  ACTIVE_NAVIGATION_TOKEN,
  ADMIN_THEMES,
  RADIUS,
  SPACING,
  ThemeMode,
} from '@mastera/ui-tokens';

export interface SupportTicketItemDto {
  ticketId: string;
  subject: string;
  categoryLabel: string; // e.g., "Device & Login"
  status: 'OPEN' | 'ANSWERED' | 'RESOLVED';
  studentId: string;
  studentCode: string;
  studentName: string;
  universityAndProgram: string;
  phone: string;
  messageBody: string;
  createdAgoLabel: string;
}

export interface StudentSupportInboxProps {
  tickets: SupportTicketItemDto[];
  onSendReply: (ticketId: string, replyText: string) => void;
  onMarkResolved: (ticketId: string) => void;
  onViewStudentProfile: (studentId: string) => void;
  themeMode?: ThemeMode;
}

const QUICK_REPLIES: Array<{ label: string; template: string }> = [
  {
    label: 'Device Unbound',
    template:
      'Your previous phone binding has been released. You may now sign in on your new phone.',
  },
  {
    label: 'Payment Verified',
    template:
      'Your payment receipt has been verified and your bundle access is now active.',
  },
  {
    label: 'Exam Reset',
    template:
      'Your exam session has been reset. Please pull to refresh your catalog and try again.',
  },
  {
    label: 'New Scans Uploaded',
    template:
      'Updated chapter scans have been published. Tap Update in your course list.',
  },
  {
    label: 'Investigating',
    template:
      'Thank you for reaching out. Our operations team is reviewing your request.',
  },
];

export function StudentSupportInbox({
  tickets,
  onSendReply,
  onMarkResolved,
  onViewStudentProfile,
  themeMode = 'light',
}: StudentSupportInboxProps): React.ReactElement {
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'OPEN' | 'ANSWERED' | 'RESOLVED'
  >('OPEN');
  const [selectedTicketId, setSelectedTicketId] = useState<string>(
    tickets[0]?.ticketId ?? ''
  );
  const [replyText, setReplyText] = useState<string>('');

  const tokens = ADMIN_THEMES[themeMode];
  const filteredTickets = tickets.filter((t) =>
    statusFilter === 'ALL' ? true : t.status === statusFilter
  );
  const activeTicket =
    tickets.find((t) => t.ticketId === selectedTicketId) ?? filteredTickets[0];

  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: 4, fontSize: 24 }}>
        Student Support & Inquiries
      </h1>
      <p
        style={{
          marginTop: 0,
          marginBottom: SPACING.lg,
          color: tokens.textMuted,
          fontSize: 13,
        }}
      >
        Review, triage, and reply to student tickets across courses, exams, and
        billing
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '380px 1fr',
          gap: SPACING.lg,
        }}
      >
        {/* Left Ticket List */}
        <div
          style={{
            backgroundColor: tokens.surface,
            border: `1px solid ${tokens.border}`,
            borderRadius: RADIUS.lg,
            padding: SPACING.md,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: SPACING.xs,
              marginBottom: SPACING.md,
            }}
          >
            {(['ALL', 'OPEN', 'ANSWERED', 'RESOLVED'] as const).map((tab) => {
              const isActive = statusFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  style={{
                    padding: `4px ${SPACING.sm}px`,
                    borderRadius: RADIUS.pill,
                    border: 'none',
                    backgroundColor: isActive
                      ? ACTIVE_NAVIGATION_TOKEN
                      : tokens.surfaceSubtle,
                    color: isActive ? tokens.sidebarText : tokens.textPrimary,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
            {filteredTickets.map((t) => {
              const isSelected = activeTicket?.ticketId === t.ticketId;
              return (
                <button
                  key={t.ticketId}
                  type="button"
                  onClick={() => setSelectedTicketId(t.ticketId)}
                  style={{
                    textAlign: 'left',
                    padding: SPACING.md,
                    borderRadius: RADIUS.md,
                    border: `1px solid ${
                      isSelected ? ACTIVE_NAVIGATION_TOKEN : tokens.border
                    }`,
                    backgroundColor: isSelected
                      ? tokens.surfaceSubtle
                      : tokens.surface,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      marginBottom: 4,
                    }}
                  >
                    <strong>{t.studentName}</strong>
                    <span style={{ color: tokens.textMuted }}>
                      {t.createdAgoLabel}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {t.subject}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Ticket Thread & Quick Replies */}
        {activeTicket && (
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
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18 }}>{activeTicket.subject}</h2>
              <button
                type="button"
                onClick={() => onMarkResolved(activeTicket.ticketId)}
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
                ✓ Mark as Resolved
              </button>
            </div>

            {/* Student Context Banner */}
            <div
              style={{
                padding: SPACING.md,
                borderRadius: RADIUS.md,
                backgroundColor: tokens.surfaceSubtle,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>
                  {activeTicket.studentName} ({activeTicket.studentCode})
                </div>
                <div style={{ fontSize: 12, color: tokens.textMuted }}>
                  {activeTicket.universityAndProgram} · {activeTicket.phone}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onViewStudentProfile(activeTicket.studentId)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: tokens.primary,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                View Student Profile →
              </button>
            </div>

            {/* Ticket Body */}
            <div
              style={{
                padding: SPACING.md,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
                lineHeight: 1.5,
                fontSize: 14,
              }}
            >
              {activeTicket.messageBody}
            </div>

            {/* Quick Replies Bar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: SPACING.xs,
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 12, color: tokens.textMuted }}>
                Quick Replies:
              </span>
              {QUICK_REPLIES.map((qr) => (
                <button
                  key={qr.label}
                  type="button"
                  onClick={() => setReplyText(qr.template)}
                  style={{
                    padding: `4px ${SPACING.sm}px`,
                    borderRadius: RADIUS.pill,
                    border: `1px solid ${tokens.border}`,
                    backgroundColor: tokens.surfaceSubtle,
                    color: tokens.textPrimary,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {qr.label}
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              maxLength={1000}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your response to the student here..."
              style={{
                width: '100%',
                padding: SPACING.md,
                borderRadius: RADIUS.md,
                border: `1px solid ${tokens.border}`,
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 12, color: tokens.textMuted }}>
                {replyText.length}/1000
              </span>

              <button
                type="button"
                disabled={replyText.trim().length === 0}
                onClick={() => {
                  onSendReply(activeTicket.ticketId, replyText.trim());
                  setReplyText('');
                }}
                style={{
                  padding: `${SPACING.sm}px ${SPACING.lg}px`,
                  borderRadius: RADIUS.md,
                  border: 'none',
                  backgroundColor: tokens.primary,
                  color: tokens.sidebarText,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Send Reply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}