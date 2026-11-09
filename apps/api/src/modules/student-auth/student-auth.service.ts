import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { mastera_ERROR_CODES } from '@mastera/contracts';

export interface StudentAuthRecord {
  id: string;
  studentCode: string;
  identifier: string;
  passwordHash: string;
  salt: string;
  deviceHardwareId: string;
  isActive: boolean;
}

export interface StudentAuthRepositoryPort {
  findByIdentifier(identifier: string): Promise<StudentAuthRecord | null>;
  updateDeviceHardwareId(studentId: string, deviceHardwareId: string): Promise<void>;
  updatePassword(studentId: string, salt: string, passwordHash: string): Promise<void>;
}

@Injectable()
export class StudentAuthService {
  constructor(private readonly repo: StudentAuthRepositoryPort) {}

  /**
   * Authenticates registered student with device lock check (Section 14, DR-14, FR-A08).
   */
  async authenticate(
    identifier: string,
    passwordPlaintext: string,
    currentDeviceHardwareId: string
  ): Promise<{ success: boolean; student?: StudentAuthRecord; errorCode?: string }> {
    const student = await this.repo.findByIdentifier(identifier);
    if (!student || !student.isActive) {
      return { success: false, errorCode: mastera_ERROR_CODES.PERMISSION_DENIED };
    }

    const calculatedHash = crypto
      .pbkdf2Sync(passwordPlaintext, student.salt, 100_000, 64, 'sha512')
      .toString('hex');

    if (calculatedHash !== student.passwordHash) {
      return { success: false, errorCode: mastera_ERROR_CODES.PERMISSION_DENIED };
    }

    // Hardware device binding verification
    if (student.deviceHardwareId && student.deviceHardwareId !== currentDeviceHardwareId) {
      return {
        success: false,
        errorCode: mastera_ERROR_CODES.DEVICE_MISMATCH_LOCKED,
      };
    }

    return { success: true, student };
  }

  /**
   * Generates a 6-digit OTP code for password reset.
   */
  generateOtpCode(): { code: string; expiresAt: string } {
    const code = String(crypto.randomInt(100_000, 999_999));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
    return { code, expiresAt };
  }
}
