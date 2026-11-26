import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  SupportCommsService,
  CreateSupportTicketInput,
} from './support-comms.service';
import { AuthenticatedAdminContext } from '../permissions/scope.service';

const DEFAULT_SUPER_ADMIN: AuthenticatedAdminContext = {
  adminId: '00000000-0000-0000-0000-000000000001',
  adminRole: 'SUPER_ADMIN',
  isActive: true,
  canReviewAndPublish: true,
  scopes: [],
};

@Controller('support')
export class SupportCommsController {
  constructor(private readonly supportService: SupportCommsService) {}

  @Get('tickets')
  async listTickets(@Query('status') status?: string) {
    return this.supportService.listTickets(status);
  }

  @Post('tickets')
  @HttpCode(HttpStatus.CREATED)
  async createTicket(@Body() body: CreateSupportTicketInput) {
    return this.supportService.createTicket(body);
  }

  @Post('tickets/:id/reply')
  @HttpCode(HttpStatus.OK)
  async replyTicket(
    @Param('id') ticketId: string,
    @Body()
    body: {
      actor?: AuthenticatedAdminContext;
      replyMessage: string;
    }
  ) {
    const actor = body.actor || DEFAULT_SUPER_ADMIN;
    const ticket = await this.supportService.replyTicket(
      actor,
      ticketId,
      body.replyMessage
    );
    return { success: true, message: 'Ticket replied successfully.', ticket };
  }

  @Put('tickets/:id/status')
  async updateTicketStatus(
    @Param('id') ticketId: string,
    @Body()
    body: {
      actor?: AuthenticatedAdminContext;
      status: 'OPEN' | 'ANSWERED' | 'RESOLVED' | 'CLOSED';
    }
  ) {
    const actor = body.actor || DEFAULT_SUPER_ADMIN;
    const ticket = await this.supportService.updateTicketStatus(
      actor,
      ticketId,
      body.status
    );
    return { success: true, message: 'Status updated.', ticket };
  }
}
