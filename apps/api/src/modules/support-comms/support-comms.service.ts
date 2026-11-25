import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AuditService } from '../audit-reports/audit.service';
import { AuthenticatedAdminContext } from '../permissions/scope.service';

export interface SupportTicketDto {
  id: string;
  ticketId: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  universityAndProgram: string;
  phone: string;
  categoryLabel: string;
  subject: string;
  messageBody: string;
  message?: string;
  createdAgoLabel?: string;
  status: 'OPEN' | 'ANSWERED' | 'RESOLVED' | 'CLOSED';
  replyMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportCommsRepositoryPort {
  listTickets(status?: string): Promise<SupportTicketDto[]>;
  replyTicket(ticketId: string, reply: string): Promise<void>;
}

export interface CreateSupportTicketInput {
  studentId?: string;
  studentCode?: string;
  studentName?: string;
  phone?: string;
  universityAndProgram?: string;
  categoryLabel?: string;
  subject: string;
  messageBody: string;
}

@Injectable()
export class SupportCommsService {
  private readonly storagePath = path.resolve(
    process.cwd(),
    'data/support-tickets.json'
  );
  private tickets: SupportTicketDto[] = [];

  constructor(
    private readonly repo: SupportCommsRepositoryPort,
    private readonly auditService: AuditService
  ) {
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.tickets = parsed.map((t: any) => ({
          ...t,
          id: t.id || t.ticketId,
          ticketId: t.ticketId || t.id,
        }));
      } else {
        this.tickets = [
          {
            id: 't-101',
            ticketId: 't-101',
            studentId: 'stu-seed-1',
            studentCode: 'MS0001',
            studentName: 'Abebe Bikila',
            universityAndProgram: 'Addis Ababa University • Natural Science',
            phone: '+251 911 022 344',
            categoryLabel: 'Device & Login',
            subject: 'Lost phone, please unbind hardware',
            messageBody: 'Hello Mastera support, I lost my old phone on campus. I bought a new Android phone and need to access my enrolled courses for mid exams.',
            message: 'Hello Mastera support, I lost my old phone on campus. I bought a new Android phone and need to access my enrolled courses for mid exams.',
            status: 'OPEN',
            createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          },
          {
            id: 't-102',
            ticketId: 't-102',
            studentId: 'stu-seed-2',
            studentCode: 'MS0002',
            studentName: 'Dawit Bekele',
            universityAndProgram: 'Bahir Dar University • Engineering',
            phone: '+251 922 334 455',
            categoryLabel: 'Payment & Receipts',
            subject: 'Uploaded CBE receipt but still pending',
            messageBody: 'I paid 270 ETB via CBE mobile banking. Could you please verify my transaction reference FT2428909123?',
            message: 'I paid 270 ETB via CBE mobile banking. Could you please verify my transaction reference FT2428909123?',
            status: 'OPEN',
            createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          },
          {
            id: 't-103',
            ticketId: 't-103',
            studentId: 'stu-seed-3',
            studentCode: 'MS0003',
            studentName: 'Almaz Ayana',
            universityAndProgram: 'Hawassa University • Social Science',
            phone: '+251 933 445 566',
            categoryLabel: 'Material & Downloads',
            subject: 'Missing Chapter 4 offline quiz download',
            messageBody: 'When I download Chapter 4, the formulas load slowly in offline mode. Please confirm if there is an update.',
            message: 'When I download Chapter 4, the formulas load slowly in offline mode. Please confirm if there is an update.',
            status: 'RESOLVED',
            replyMessage: 'We have rebuilt and published package v2 with compressed KaTeX assets. Please tap Check for Updates on your mobile dashboard.',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000 / 2).toISOString(),
          },
        ];
        this.saveToDisk();
      }
    } catch (err) {
      console.error('Failed to load support tickets from disk:', err);
      this.tickets = [];
    }
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.storagePath,
        JSON.stringify(this.tickets, null, 2),
        'utf-8'
      );
    } catch (err) {
      console.error('Failed to save support tickets to disk:', err);
    }
  }

  async listTickets(status?: string): Promise<SupportTicketDto[]> {
    let list = [...this.tickets];
    if (status && status !== 'ALL') {
      list = list.filter((t) => t.status === status);
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getTicketById(id: string): Promise<SupportTicketDto | null> {
    return this.tickets.find((t) => t.ticketId === id) || null;
  }

  async createTicket(input: CreateSupportTicketInput): Promise<SupportTicketDto> {
    const subject = input.subject.trim();
    const messageBody = input.messageBody.trim();
    if (!subject || !messageBody) {
      throw new Error('Support ticket subject and message body are required.');
    }

    const now = new Date().toISOString();
    const id = `t-${Date.now().toString(36)}`;
    const ticket: SupportTicketDto = {
      id,
      ticketId: id,
      studentId: input.studentId || `stu-${Date.now()}`,
      studentCode: input.studentCode || 'MS0001',
      studentName: input.studentName || 'Student',
      universityAndProgram: input.universityAndProgram || 'National University',
      phone: input.phone || '+251 900 000 000',
      categoryLabel: input.categoryLabel || 'General Inquiries',
      subject,
      messageBody,
      message: messageBody,
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
    };

    this.tickets.unshift(ticket);
    this.saveToDisk();
    return ticket;
  }

  async replyTicket(
    actor: AuthenticatedAdminContext,
    ticketId: string,
    replyMessage: string
  ): Promise<SupportTicketDto> {
    const ticket = this.tickets.find((t) => t.ticketId === ticketId);
    if (!ticket) {
      throw new Error(`Ticket with id "${ticketId}" not found.`);
    }

    ticket.replyMessage = replyMessage.trim();
    ticket.status = 'ANSWERED';
    ticket.updatedAt = new Date().toISOString();
    this.saveToDisk();

    await this.auditService.record({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'TICKET_REPLIED',
      resourceType: 'TICKET',
      resourceId: ticketId,
      newValue: { replyMessage: ticket.replyMessage, status: ticket.status },
    });

    return ticket;
  }

  async updateTicketStatus(
    actor: AuthenticatedAdminContext,
    ticketId: string,
    status: 'OPEN' | 'ANSWERED' | 'RESOLVED' | 'CLOSED'
  ): Promise<SupportTicketDto> {
    const ticket = this.tickets.find((t) => t.ticketId === ticketId);
    if (!ticket) {
      throw new Error(`Ticket with id "${ticketId}" not found.`);
    }

    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    this.saveToDisk();

    await this.auditService.record({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'TICKET_STATUS_UPDATED',
      resourceType: 'TICKET',
      resourceId: ticketId,
      newValue: { status },
    });

    return ticket;
  }
}
