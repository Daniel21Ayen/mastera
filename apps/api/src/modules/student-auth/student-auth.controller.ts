import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { StudentAuthService } from './student-auth.service';

@Controller('student')
export class StudentAuthController {
  constructor(private readonly authService: StudentAuthService) {}

  @Get('me/summary')
  async getStudentSummary(
    @Headers('x-local-account-id') localAccountIdHeader?: string,
    @Headers('x-student-code') studentCodeHeader?: string,
    @Query('localAccountId') localAccountIdQuery?: string,
    @Query('studentCode') studentCodeQuery?: string,
    @Query('identifier') identifierQuery?: string
  ) {
    const localAccountId = localAccountIdQuery || localAccountIdHeader;
    const studentCode = studentCodeQuery || studentCodeHeader;
    const identifier = identifierQuery;
    return this.authService.getStudentSummary({
      localAccountId,
      studentCode,
      identifier,
    });
  }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body()
    body: {
      identifier: string;
      passwordPlaintext: string;
      deviceHardwareId: string;
    }
  ) {
    return this.authService.authenticate(
      body.identifier,
      body.passwordPlaintext,
      body.deviceHardwareId
    );
  }

  @Post('auth/request-otp')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() body: { identifier: string }) {
    return {
      success: true,
      message: 'Password reset OTP sent to registered phone number.',
    };
  }

  @Post('auth/reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body()
    body: {
      identifier: string;
      otp: string;
      newPasswordPlaintext: string;
    }
  ) {
    return {
      success: true,
      message: 'Password reset successfully.',
    };
  }
}
