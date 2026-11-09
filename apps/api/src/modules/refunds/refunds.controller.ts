import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { RefundsService } from './refunds.service';
import { AuthenticatedAdminContext } from '../permissions/scope.service';

@Controller('refunds')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async requestRefund(
    @Body()
    body: {
      actor: AuthenticatedAdminContext;
      orderId: string;
      reason: string;
    }
  ) {
    return this.refundsService.requestRefund(
      body.actor,
      body.orderId,
      body.reason
    );
  }

  @Post(':id/approve-payout')
  @HttpCode(HttpStatus.OK)
  async approveAndPayout(
    @Param('id') refundId: string,
    @Body()
    body: {
      actor: AuthenticatedAdminContext;
      payoutReference: string;
      reason: string;
    }
  ) {
    return this.refundsService.approveAndCompleteRefund(
      body.actor,
      refundId,
      body.payoutReference,
      body.reason
    );
  }
}
