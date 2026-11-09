import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CommercePricingService } from './commerce-pricing.service';
import { AuthenticatedAdminContext } from '../permissions/scope.service';
import {
  PaymentMethodEntryDto,
  PaymentSettingsDto,
  PriceQuoteRequestDto,
} from '@mastera/contracts';

const DEFAULT_ADMIN_ACTOR: AuthenticatedAdminContext = {
  adminId: 'admin-super-1',
  adminRole: 'SUPER_ADMIN',
  isActive: true,
  canReviewAndPublish: true,
  scopes: [],
};

@Controller('commerce')
export class CommercePricingController {
  constructor(private readonly pricingService: CommercePricingService) {}

  @Get('settings')
  async getSettings() {
    return this.pricingService.getPublicPaymentSettings();
  }

  @Put('settings')
  async updateSettings(
    @Body()
    body: {
      actor?: AuthenticatedAdminContext;
      settings: PaymentSettingsDto;
      reason: string;
    }
  ) {
    const actor = body.actor || DEFAULT_ADMIN_ACTOR;
    return this.pricingService.updatePaymentSettings(
      actor,
      body.settings,
      body.reason
    );
  }

  @Get('payment-methods')
  async getPaymentMethods() {
    const settings = await this.pricingService.getPublicPaymentSettings();
    return settings.paymentMethods || [];
  }

  @Post('payment-methods')
  async addPaymentMethod(
    @Body()
    body: {
      actor?: AuthenticatedAdminContext;
      method: PaymentMethodEntryDto;
      reason?: string;
    }
  ) {
    const actor = body.actor || DEFAULT_ADMIN_ACTOR;
    return this.pricingService.addPaymentMethod(
      actor,
      body.method,
      body.reason
    );
  }

  @Put('payment-methods/:id')
  async updatePaymentMethod(
    @Param('id') id: string,
    @Body()
    body: {
      actor?: AuthenticatedAdminContext;
      method: Partial<PaymentMethodEntryDto>;
      reason?: string;
    }
  ) {
    const actor = body.actor || DEFAULT_ADMIN_ACTOR;
    return this.pricingService.updatePaymentMethod(
      actor,
      id,
      body.method,
      body.reason
    );
  }

  @Delete('payment-methods/:id')
  async deletePaymentMethod(
    @Param('id') id: string,
    @Body()
    body?: {
      actor?: AuthenticatedAdminContext;
      reason?: string;
    }
  ) {
    const actor = body?.actor || DEFAULT_ADMIN_ACTOR;
    return this.pricingService.deletePaymentMethod(
      actor,
      id,
      body?.reason
    );
  }

  @Post('quote')
  async createQuote(@Body() body: PriceQuoteRequestDto) {
    return this.pricingService.createPriceQuote(body);
  }
}
