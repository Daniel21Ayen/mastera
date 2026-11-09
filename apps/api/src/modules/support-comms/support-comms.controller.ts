import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { SupportCommsService } from './support-comms.service';
import { AuthenticatedAdminContext } from '../permissions/scope.service';

@Controller('support')
export class SupportCommsController {
  constructor(private readonly supportService: SupportCommsService) {}

  @Post('tickets/:id/reply')
  @HttpCode(HttpStatus.OK)
  async replyTicket(
    @Param('id') ticketId: string,
    @Body()
    body: {
      actor: AuthenticatedAdminContext;
      replyMessage: string;
    }
  ) {
    await this.supportService.replyTicket(
      body.actor,
      ticketId,
      body.replyMessage
    );
    return { success: true, message: 'Ticket replied successfully.' };
  }
}
