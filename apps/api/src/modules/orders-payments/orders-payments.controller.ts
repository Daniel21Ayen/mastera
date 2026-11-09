import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { OrdersPaymentsService } from './orders-payments.service';
import { AuthenticatedAdminContext } from '../permissions/scope.service';
import { ClaimOrderDto, SubmitOrderWithLocalDto } from '@mastera/contracts';

const DEFAULT_SUPER_ADMIN: AuthenticatedAdminContext = {
  adminId: '00000000-0000-0000-0000-000000000001',
  adminRole: 'SUPER_ADMIN',
  scopes: [],
  isActive: true,
  canReviewAndPublish: true,
};

@Controller('orders')
export class OrdersPaymentsController {
  constructor(private readonly ordersService: OrdersPaymentsService) {}

  @Get('payments')
  async listOrders(@Query('status') status?: string) {
    return this.ordersService.listOrders(status);
  }

  @Get(':id')
  async getOrderById(@Param('id') orderId: string) {
    return this.ordersService.getOrderById(orderId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async submitOrder(
    @Body()
    body: {
      dto: SubmitOrderWithLocalDto;
      receiptImageBase64: string;
      authenticatedStudentId?: string;
    }
  ) {
    const receiptBuffer = Buffer.from(body.receiptImageBase64, 'base64');
    return this.ordersService.submitOrderWithReceipt(
      body.dto,
      receiptBuffer,
      body.authenticatedStudentId
    );
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approveOrder(
    @Param('id') orderId: string,
    @Body()
    body?: {
      actor?: AuthenticatedAdminContext;
      verifiedAmountETB?: number;
    }
  ) {
    const actor = body?.actor || DEFAULT_SUPER_ADMIN;
    const amount = body?.verifiedAmountETB ?? 1200;
    return this.ordersService.approveOrderReceipt(
      actor,
      orderId,
      amount
    );
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectOrder(
    @Param('id') orderId: string,
    @Body()
    body?: {
      actor?: AuthenticatedAdminContext;
      reason?: string;
    }
  ) {
    const actor = body?.actor || DEFAULT_SUPER_ADMIN;
    const reason = body?.reason || 'Invalid bank slip or unverified reference';
    return this.ordersService.rejectOrderReceipt(
      actor,
      orderId,
      reason
    );
  }

  @Post(':id/claim')
  @HttpCode(HttpStatus.OK)
  async claimOrder(
    @Param('id') orderId: string,
    @Body() claimDto: ClaimOrderDto
  ) {
    return this.ordersService.claimApprovedOrder(orderId, claimDto);
  }
}
