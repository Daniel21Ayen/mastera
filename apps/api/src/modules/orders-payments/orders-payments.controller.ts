import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
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

  @Get(':id/receipt')
  async getOrderReceipt(@Param('id') orderId: string, @Res() res: any) {
    const receiptsDir = path.join(process.cwd(), 'data', 'receipts');
    const filePath = path.join(receiptsDir, `${orderId}.img`);
    if (fs.existsSync(filePath)) {
      const buf = fs.readFileSync(filePath);
      let contentType = 'image/jpeg';
      if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
        contentType = 'image/png';
      } else if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) {
        contentType = 'image/webp';
      }
      res.setHeader('Content-Type', contentType);
      return res.send(buf);
    }
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <rect width="100%" height="100%" fill="#f1f5f9"/>
        <text x="50%" y="45%" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#64748b">Payment Proof Screenshot</text>
        <text x="50%" y="55%" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#94a3b8">Order ID: ${orderId}</text>
      </svg>`
    );
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
    let rawBase64 = body.receiptImageBase64 || '';
    if (rawBase64.includes(',')) {
      rawBase64 = rawBase64.split(',')[1] || '';
    }
    const receiptBuffer = Buffer.from(rawBase64, 'base64');
    const result = await this.ordersService.submitOrderWithReceipt(
      body.dto,
      receiptBuffer,
      body.authenticatedStudentId
    );

    // Save actual receipt screenshot bytes to disk for admin viewing
    try {
      const receiptsDir = path.join(process.cwd(), 'data', 'receipts');
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }
      fs.writeFileSync(path.join(receiptsDir, `${result.orderId}.img`), receiptBuffer);
    } catch (saveErr) {
      console.error('[OrdersPaymentsController] Failed to persist receipt image:', saveErr);
    }

    return result;
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
