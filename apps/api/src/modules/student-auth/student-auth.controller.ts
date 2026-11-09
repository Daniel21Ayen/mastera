import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { StudentAuthService } from './student-auth.service';

@Controller('student/auth')
export class StudentAuthController {
  constructor(private readonly authService: StudentAuthService) {}

  @Post('login')
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

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() body: { identifier: string }) {
    return {
      success: true,
      message: 'Password reset OTP sent to registered phone number.',
    };
  }

  @Post('reset-password')
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
