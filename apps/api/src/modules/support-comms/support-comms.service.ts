import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit-reports/audit.service';
import { AuthenticatedAdminContext } from '../permissions/scope.service';

export interface SupportTicketDto {
  id: string;
  studentId: string;
  studentCode: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'RESOLVED' | 'CLOSED';
  replyMessage?: string | null;
  createdAt: string;
}

export interface SupportCommsRepositoryPort {
  listTickets(status?: string): Promise<SupportTicketDto[]>;
  replyTicket(ticketId: string, reply: string): Promise<void>;
}

@Injectable()
export class SupportCommsService {
  constructor(
    private readonly repo: SupportCommsRepositoryPort,
    private readonly auditService: AuditService
  ) {}

  async replyTicket(
    actor: AuthenticatedAdminContext,
    ticketId: string,
    replyMessage: string
  ): Promise<void> {
    await this.repo.replyTicket(ticketId, replyMessage);

    await this.auditService.record({
      actorId: actor.adminId,
      actorRole: actor.adminRole,
      action: 'TICKET_REPLIED',
      resourceType: 'TICKET',
      resourceId: ticketId,
      newValue: { replyMessage },
    });
  }
}
