'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudentSupportInbox, SupportTicketItemDto } from '@/components/support/StudentSupportInbox';

export default function SupportTicketsPage(): React.ReactElement {
  const router = useRouter();

  const [tickets, setTickets] = useState<SupportTicketItemDto[]>([
    {
      ticketId: 't-101',
      studentId: 'stu-1',
      studentCode: 'MS0001',
      studentName: 'Abebe Bikila',
      universityAndProgram: 'AASTU • Freshman Engineering',
      phone: '+251 911 022 344',
      categoryLabel: 'Device & Login',
      subject: 'Lost phone, please unbind hardware',
      messageBody: 'Hello Mastera support, I lost my old Samsung phone yesterday on campus. I bought an Infinix phone today and need to access my courses before mid exams.',
      createdAgoLabel: '20 mins ago',
      status: 'OPEN',
    },
    {
      ticketId: 't-102',
      studentId: 'stu-2',
      studentCode: 'MS0002',
      studentName: 'Dawit Bekele',
      universityAndProgram: 'AASTU • Computer Science',
      phone: '+251 922 334 455',
      categoryLabel: 'Payment & Receipts',
      subject: 'Uploaded CBE receipt but still pending',
      messageBody: 'I paid 270 ETB via CBE mobile banking 3 hours ago. Could you please check my transaction reference FT2428909123?',
      createdAgoLabel: '1 hour ago',
      status: 'OPEN',
    },
    {
      ticketId: 't-100',
      studentId: 'stu-4',
      studentCode: 'MS0004',
      studentName: 'Almaz Ayana',
      universityAndProgram: 'AAU • Economics',
      phone: '+251 933 445 566',
      categoryLabel: 'Material & Downloads',
      subject: 'Missing Chapter 4 offline download',
      messageBody: 'When I download Chapter 4, the formulas do not load on offline mode.',
      createdAgoLabel: 'Yesterday',
      status: 'RESOLVED',
    },
  ]);

  const handleSendReply = (ticketId: string, reply: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.ticketId === ticketId ? { ...t, status: 'ANSWERED' as const } : t
      )
    );
  };

  const handleMarkResolved = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.ticketId === ticketId ? { ...t, status: 'RESOLVED' as const } : t
      )
    );
  };

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
