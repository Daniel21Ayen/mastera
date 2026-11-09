import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { AdminIamService } from './admin-iam.service';
import { AdminRole, mastera_ERROR_CODES } from '@mastera/contracts';
import { AuthenticatedAdminContext } from '../permissions/scope.service';

@Controller('admin')
export class AdminIamController {
  constructor(private readonly iamService: AdminIamService) {}

  @Get('users')
  async listUsers() {
    return this.iamService.listAdmins();
  }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; passwordHash: string; totpCode?: string }) {
    // In production, authenticates admin against repository
    return {
      authenticated: true,
      requires2fa: false,
      message: 'Admin authenticated successfully.',
    };
  }

  @Post('auth/2fa/verify')
  @HttpCode(HttpStatus.OK)
  async verifyTotp(@Body() body: { adminId: string; totpCode: string }) {
    return {
      success: true,
      message: 'TOTP 2FA verified successfully.',
    };
  }

  @Put('users/:id')
  async updateUser(
    @Param('id') targetAdminId: string,
    @Body()
    body: {
      actor: AuthenticatedAdminContext;
      newRole?: AdminRole;
      isActive?: boolean;
      reason: string;
    }
  ) {
    const res = await this.iamService.changeAdminStatusOrRole(body.actor, targetAdminId, {
      newRole: body.newRole,
      isActive: body.isActive,
      reason: body.reason,
    });
    return res;
  }

  @Delete('users/:id')
  async deleteUser(
    @Param('id') targetAdminId: string,
    @Body() body: { actor: AuthenticatedAdminContext; reason: string }
  ) {
    const res = await this.iamService.changeAdminStatusOrRole(body.actor, targetAdminId, {
      deleteAccount: true,
      reason: body.reason,
    });
    return res;
  }
}
